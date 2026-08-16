const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_UID = "TwjeEIFS3Zcf1SxboLZoujm91Ky2";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY || "")
        .replace(/^['"]|['"]$/g, "")
        .replace(/\\n/g, "\n")
        .trim()
    })
  });
}
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const RAZORPAY_KEY_ID = String(process.env.RAZORPAY_KEY_ID || "").trim();
const RAZORPAY_KEY_SECRET = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Render.");
}
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(x => x.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Vary", "Origin");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

async function requireUser(req, res) {
  const header = String(req.get("Authorization") || "");
  if (!header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Login session is missing. Please login again." });
    return null;
  }
  try {
    return await admin.auth().verifyIdToken(header.slice(7));
  } catch (e) {
    console.error("Firebase token verification failed:", e?.message || e);
    res.status(401).json({ error: "Login session expired. Please login again." });
    return null;
  }
}

function signatureEqual(expected, actual) {
  const a = Buffer.from(String(expected || ""));
  const b = Buffer.from(String(actual || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.get("/", (req, res) => res.status(200).json({
  service: "SMV ASTRO Razorpay Backend",
  version: "2026-08-17-payment-questionid-tz-fix",
  status: "online",
  razorpay: "enabled",
  firebase: "enabled"
}));

app.get("/test-razorpay", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (user.uid !== ADMIN_UID) return res.status(403).json({ error: "Admin access required." });
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return res.status(500).json({ ok: false, error: "Razorpay credentials are missing in Render." });
    const mode = RAZORPAY_KEY_ID.startsWith("rzp_test_") ? "test" : (RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "live" : "unknown");
    await razorpay.orders.all({ count: 1 });
    return res.json({ ok: true, mode, keyPrefix: RAZORPAY_KEY_ID.slice(0, 9), message: `Razorpay ${mode} credentials accepted by Render.` });
  } catch (e) {
    console.error("Razorpay connection test failed:", e);
    return res.status(502).json({ error: e?.error?.description || e?.description || e?.message || "Razorpay connection failed." });
  }
});

app.post("/create-order", express.json(), async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    let questionId = String(req.body?.questionId || "").trim();
    let qRef;
    let q;

    // Create/read the question on the trusted server. The browser no longer calls
    // Firestore to create the question document, which eliminates the empty
    // documentPath error seen before Razorpay opened.
    if (questionId) {
      if (questionId.includes("/") || questionId === "." || questionId === "..") {
        return res.status(400).json({ error: "A valid questionId is required." });
      }
      qRef = db.collection("smv_questions").doc(questionId);
      const qSnap = await qRef.get();
      if (!qSnap.exists) {
        const settingSnap = await db.collection("smv_settings").doc("question").get();
        const configuredPrice = Number(settingSnap.data()?.price || 5);
        const birth = req.body?.birthDetails || {};
        const customerName = String(req.body?.customerName || birth.name || "").trim();
        const questionText = String(req.body?.question || "").trim();
        if (!customerName || !questionText || !birth.birthDate || !birth.birthTime || !String(birth.birthPlace || "").trim()) {
          return res.status(400).json({ error: "Complete customer birth details and question are required." });
        }
        q = {
          customerId: user.uid, customerName, birthName: customerName, question: questionText,
          amount: configuredPrice, status: "awaiting_payment", paymentStatus: "pending",
          allocationStatus: "awaiting_admin",
          birthDetails: {
            name: customerName, birthDate: String(birth.birthDate), birthTime: String(birth.birthTime),
            birthPlace: String(birth.birthPlace).trim(), birthGender: String(birth.birthGender || ""),
            timezone: "Asia/Kolkata", utcOffsetMinutes: 330
          },
          birthDate: String(birth.birthDate), birthTime: String(birth.birthTime),
          birthPlace: String(birth.birthPlace).trim(), birthGender: String(birth.birthGender || ""),
          birthTimezone: "Asia/Kolkata", birthUtcOffsetMinutes: 330,
          createdAt: FieldValue.serverTimestamp()
        };
        await qRef.set(q);
      } else {
        q = qSnap.data();
        if (q.customerId !== user.uid) return res.status(403).json({ error: "You do not own this question." });
        // Preserve India wall-clock birth time. Never reinterpret a user-entered
        // HH:mm value as UTC and shift it by 5:30 hours.
        if (!q.birthTimezone || !q.birthUtcOffsetMinutes || !q.birthDetails?.timezone) {
          await qRef.set({
            birthTimezone: q.birthTimezone || "Asia/Kolkata",
            birthUtcOffsetMinutes: Number(q.birthUtcOffsetMinutes ?? 330),
            birthDetails: {
              ...(q.birthDetails || {}),
              timezone: q.birthDetails?.timezone || "Asia/Kolkata",
              utcOffsetMinutes: Number(q.birthDetails?.utcOffsetMinutes ?? 330)
            }
          }, { merge: true });
          q = {
            ...q,
            birthTimezone: q.birthTimezone || "Asia/Kolkata",
            birthUtcOffsetMinutes: Number(q.birthUtcOffsetMinutes ?? 330),
            birthDetails: {
              ...(q.birthDetails || {}),
              timezone: q.birthDetails?.timezone || "Asia/Kolkata",
              utcOffsetMinutes: Number(q.birthDetails?.utcOffsetMinutes ?? 330)
            }
          };
        }
      }
    } else {
      qRef = db.collection("smv_questions").doc();
      questionId = qRef.id;
      if (!questionId) return res.status(500).json({ error: "Unable to create a valid question ID." });

      const settingSnap = await db.collection("smv_settings").doc("question").get();
      const configuredPrice = Number(settingSnap.data()?.price || 5);
      if (!Number.isFinite(configuredPrice) || configuredPrice < 1) {
        return res.status(409).json({ error: "Question price is not configured correctly by Admin." });
      }

      const birth = req.body?.birthDetails || {};
      const customerName = String(req.body?.customerName || birth.name || "").trim();
      const questionText = String(req.body?.question || "").trim();
      if (!customerName || !questionText || !birth.birthDate || !birth.birthTime || !String(birth.birthPlace || "").trim()) {
        return res.status(400).json({ error: "Complete customer birth details and question are required." });
      }

      q = {
        customerId: user.uid,
        customerName,
        birthName: customerName,
        question: questionText,
        amount: configuredPrice,
        status: "awaiting_payment",
        paymentStatus: "pending",
        allocationStatus: "awaiting_admin",
        birthDetails: {
          name: customerName,
          birthDate: String(birth.birthDate),
          birthTime: String(birth.birthTime),
          birthPlace: String(birth.birthPlace).trim(),
          birthGender: String(birth.birthGender || "")
        },
        birthDate: String(birth.birthDate),
        birthTime: String(birth.birthTime),
        birthPlace: String(birth.birthPlace).trim(),
        birthGender: String(birth.birthGender || ""),
        birthTimezone: "Asia/Kolkata",
        birthUtcOffsetMinutes: 330,
        createdAt: FieldValue.serverTimestamp()
      };
      await qRef.set(q);
    }

    if (!q || q.customerId !== user.uid) return res.status(403).json({ error: "You do not own this question." });
    console.log("[create-order] questionId=", questionId, "customer=", user.uid);

    if (!["awaiting_payment", "payment_failed"].includes(q.status)) {
      if (q.paymentStatus === "paid" && q.razorpayOrderId) {
        return res.status(200).json({
          success: true, alreadyPaid: true, questionId,
          orderId: q.razorpayOrderId, keyId: RAZORPAY_KEY_ID,
          amount: Math.round(Number(q.amount || 0) * 100), currency: "INR"
        });
      }
      return res.status(409).json({ error: "This question is not available for payment." });
    }

    const amount = Number(q.amount || 0);
    const questionSetting = await db.collection("smv_settings").doc("question").get();
    const configuredPrice = Number(questionSetting.data()?.price || amount || 5);
    if (!Number.isFinite(amount) || amount < 1 || !Number.isFinite(configuredPrice) || configuredPrice < 1 || Math.round(amount * 100) !== Math.round(configuredPrice * 100)) {
      return res.status(409).json({ error: "Question price is invalid or has changed. Please start the question again." });
    }

    if (q.razorpayOrderId && ["order_created", "verification_failed", "failed"].includes(q.paymentStatus)) {
      try {
        const existing = await razorpay.orders.fetch(q.razorpayOrderId);
        if (existing.status === "paid") return res.status(409).json({ error: "This payment has already been completed. Please refresh your dashboard." });
        if (Number(existing.amount) === Math.round(amount * 100) && existing.currency === "INR") {
          return res.json({ success: true, questionId, orderId: existing.id, keyId: RAZORPAY_KEY_ID, amount: existing.amount, currency: existing.currency, reused: true });
        }
      } catch (e) { console.warn("Could not reuse old order:", e?.message || e); }
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), currency: "INR",
      receipt: `SMV_${questionId.slice(0, 25)}_${Date.now()}`,
      notes: { questionId, customerId: user.uid, astrologerId: String(q.astrologerId || "") }
    });
    if (!order || !order.id || typeof order.id !== "string") {
      console.error("Razorpay returned an order without a valid order ID", order);
      return res.status(502).json({ error: "Razorpay order was created without a valid order ID." });
    }

    const answerSettings = await db.collection("smv_settings").doc("answer").get();
    const minimumWords = Math.max(1, Math.min(10000, Math.floor(Number(answerSettings.data()?.minimumWords || 150))));
    await qRef.set({ razorpayOrderId: order.id, paymentCurrency: "INR", paymentStatus: "order_created", answerMinWords: minimumWords, paymentUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await db.collection("razorpay_orders").doc(order.id).set({
      razorpayOrderId: order.id, questionId, amount: order.amount, currency: order.currency,
      firebaseUid: user.uid, customerEmail: user.email || null, astrologerId: String(q.astrologerId || ""),
      serviceName: req.body?.serviceName || "Public Astrology Question", status: "created", createdAt: FieldValue.serverTimestamp()
    });
    return res.json({ success: true, questionId, orderId: order.id, keyId: RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency });
  } catch (e) {
    console.error("Create order error:", e);
    return res.status(500).json({ error: e?.error?.description || e?.description || e?.message || "Unable to create Razorpay order" });
  }
});

async function markQuestionPaid(questionId, orderId, paymentId, signature, source) {
  const qRef = db.collection("smv_questions").doc(questionId);
  const result = await db.runTransaction(async tx => {
    const snap = await tx.get(qRef);
    if (!snap.exists) throw new Error("Question not found.");
    const q = snap.data();
    if (q.razorpayOrderId !== orderId) throw new Error("Order mismatch.");
    if (q.paymentStatus === "paid" && q.razorpayPaymentId === paymentId) return { already: true, customerId: q.customerId, astrologerId: q.astrologerId };
    const amount = Number(q.amount || 0);
    const commissionSnap = await db.collection("smv_settings").doc("commission").get();
    const commission = commissionSnap.exists ? commissionSnap.data() : { astroPercent: 20, adminPercent: 80 };
    const astroPercent = Number(commission.astroPercent ?? 20);
    const adminPercent = Number(commission.adminPercent ?? 80);
    if (astroPercent < 0 || adminPercent < 0 || Math.abs(astroPercent + adminPercent - 100) > 0.001) throw new Error("Commission settings are invalid.");
    const astroCommission = Math.round(amount * astroPercent) / 100;
    const adminCommission = Math.round(amount * adminPercent) / 100;
    tx.update(qRef, {
      status: "pending_admin_approval", paymentStatus: "paid", allocationStatus: "awaiting_admin", razorpayPaymentId: paymentId, razorpaySignature: signature,
      paidAt: q.paidAt || FieldValue.serverTimestamp(), paymentUpdatedAt: FieldValue.serverTimestamp(),
      paymentConfirmedBy: source, commissionPercent: astroPercent,
      astrologerCommissionAmount: astroCommission, adminCommissionAmount: adminCommission
    });
    return { already: false, customerId: q.customerId, astrologerId: q.astrologerId, astroCommission, adminCommission };
  });
  if (!result.already) {
    await db.collection("smv_notifications").add({ userId: result.customerId, type: "payment", title: "Payment successful", message: "Your payment was verified. Your question is now waiting for Admin approval.", questionId, createdAt: FieldValue.serverTimestamp(), read: false });
  }
  return result;
}

app.post("/verify-payment", express.json(), async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const questionId = String(req.body?.questionId || "").trim();
    const orderId = String(req.body?.razorpay_order_id || "").trim();
    const paymentId = String(req.body?.razorpay_payment_id || "").trim();
    const signature = String(req.body?.razorpay_signature || "").trim();
    if (!questionId || !orderId || !paymentId || !signature) return res.status(400).json({ error: "Payment verification data is incomplete." });
    const qSnap = await db.collection("smv_questions").doc(questionId).get();
    if (!qSnap.exists) return res.status(404).json({ error: "Question not found." });
    const q = qSnap.data();
    if (q.customerId !== user.uid) return res.status(403).json({ error: "You do not own this question." });
    if (q.razorpayOrderId !== orderId) return res.status(409).json({ error: "Payment order mismatch." });
    const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    if (!signatureEqual(expected, signature)) {
      const mode = RAZORPAY_KEY_ID.startsWith("rzp_test_") ? "test" : (RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "live" : "unknown");
      console.error("Payment verification signature mismatch", { questionId, orderId, paymentId, mode });
      return res.status(401).json({ error: "Invalid payment signature. Check that Render RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET belong to the same Razorpay mode (both Test or both Live)." });
    }
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== orderId) return res.status(409).json({ error: "Payment order mismatch." });
    if (String(payment.status).toLowerCase() !== "captured") return res.status(409).json({ error: "Payment is not captured yet." });
    if (Number(payment.amount) !== Math.round(Number(q.amount || 0) * 100)) return res.status(409).json({ error: "Payment amount mismatch." });
    const result = await markQuestionPaid(questionId, orderId, paymentId, signature, "render_checkout_verification");
    await db.collection("razorpay_orders").doc(orderId).set({ razorpayPaymentId: paymentId, status: "verified", questionId, verifiedAt: FieldValue.serverTimestamp() }, { merge: true });
    return res.json({ verified: true, questionId, alreadyProcessed: result.already, message: "Payment verified and consultation updated successfully." });
  } catch (e) {
    console.error("Payment verification error:", e);
    return res.status(500).json({ error: e?.error?.description || e?.description || e?.message || "Payment verification failed" });
  }
});

app.post("/razorpay/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.get("X-Razorpay-Signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!signature || !secret) return res.status(400).send("Invalid webhook configuration");
    const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
    if (!signatureEqual(expected, signature)) return res.status(401).send("Invalid signature");
    const event = JSON.parse(req.body.toString("utf8"));
    const eventType = event.event || "unknown";
    const paymentEntity = event?.payload?.payment?.entity || null;
    const orderEntity = event?.payload?.order?.entity || null;
    const paymentId = paymentEntity?.id || null;
    const orderId = orderEntity?.id || paymentEntity?.order_id || null;
    const eventKey = `${eventType}_${paymentId || orderId || crypto.createHash("sha256").update(req.body).digest("hex")}`.replace(/\//g, "_");
    if (!eventKey) return res.status(400).send("Invalid webhook event key");
    const eventRef = db.collection("razorpay_webhook_events").doc(eventKey);
    if ((await eventRef.get()).exists) return res.status(200).send("OK");
    await eventRef.set({ event: eventType, razorpayPaymentId: paymentId, razorpayOrderId: orderId, receivedAt: FieldValue.serverTimestamp(), processed: false });
    if (orderId) {
      const orderRef = db.collection("razorpay_orders").doc(orderId);
      const orderSnap = await orderRef.get();
      const stored = orderSnap.exists ? orderSnap.data() : {};
      const newStatus = ["payment.captured", "order.paid"].includes(eventType) ? "paid" : eventType === "payment.failed" ? "failed" : null;
      if (newStatus) await orderRef.set({ status: newStatus, razorpayPaymentId: paymentId, lastWebhookEvent: eventType, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      if (newStatus === "paid" && stored.questionId && paymentId) {
        try {
          const qSnap = await db.collection("smv_questions").doc(stored.questionId).get();
          if (qSnap.exists && qSnap.data().paymentStatus !== "paid") await markQuestionPaid(stored.questionId, orderId, paymentId, "", "razorpay_webhook");
        } catch (e) { console.error("Webhook question update failed:", e); }
      }
      if (newStatus === "failed" && stored.questionId) await db.collection("smv_questions").doc(stored.questionId).set({ status: "payment_failed", paymentStatus: "failed", paymentUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    await eventRef.set({ processed: true, processedAt: FieldValue.serverTimestamp() }, { merge: true });
    return res.status(200).send("OK");
  } catch (e) {
    console.error("Webhook processing error:", e);
    return res.status(500).send("Webhook processing failed");
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`SMV ASTRO Razorpay backend running on port ${PORT}`));
