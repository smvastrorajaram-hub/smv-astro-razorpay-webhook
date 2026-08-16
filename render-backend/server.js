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
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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
  status: "online",
  razorpay: "enabled",
  firebase: "enabled"
}));

app.get("/test-razorpay", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (user.uid !== ADMIN_UID) return res.status(403).json({ error: "Admin access required." });
  try {
    await razorpay.orders.all({ count: 1 });
    return res.json({ ok: true, message: "Render payment server can reach Razorpay and the configured credentials were accepted." });
  } catch (e) {
    console.error("Razorpay connection test failed:", e);
    return res.status(502).json({ error: e?.error?.description || e?.description || e?.message || "Razorpay connection failed." });
  }
});

app.post("/create-order", express.json(), async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const questionId = String(req.body?.questionId || "").trim();
    if (!questionId) return res.status(400).json({ error: "questionId is required" });

    const qRef = db.collection("smv_questions").doc(questionId);
    const qSnap = await qRef.get();
    if (!qSnap.exists) return res.status(404).json({ error: "Question not found" });
    const q = qSnap.data();
    if (q.customerId !== user.uid) return res.status(403).json({ error: "You do not own this question." });
    if (!["awaiting_payment", "payment_failed"].includes(q.status)) {
      if (q.paymentStatus === "paid") return res.status(200).json({ success: true, alreadyPaid: true, orderId: q.razorpayOrderId || null, keyId: process.env.RAZORPAY_KEY_ID, amount: Math.round(Number(q.amount || 0) * 100), currency: "INR" });
      return res.status(409).json({ error: "This question is not available for payment." });
    }

    const astroSnap = await db.collection("smv_astrologers").doc(String(q.astrologerId || "")).get();
    if (!astroSnap.exists || astroSnap.data().status !== "approved") return res.status(409).json({ error: "This astrologer is not approved." });
    const amount = Number(q.amount || 0);
    const configuredPrice = Number(astroSnap.data().pricePerQuestion || 0);
    if (!Number.isFinite(amount) || amount < 1 || !Number.isFinite(configuredPrice) || configuredPrice < 1 || Math.round(amount * 100) !== Math.round(configuredPrice * 100)) {
      return res.status(409).json({ error: "Consultation amount is invalid or has changed. Please start the question again." });
    }

    if (q.razorpayOrderId && ["order_created", "verification_failed", "failed"].includes(q.paymentStatus)) {
      try {
        const existing = await razorpay.orders.fetch(q.razorpayOrderId);
        if (existing.status === "paid") return res.status(409).json({ error: "This payment has already been completed. Please refresh your dashboard." });
        if (Number(existing.amount) === Math.round(amount * 100) && existing.currency === "INR") {
          return res.json({ success: true, orderId: existing.id, keyId: process.env.RAZORPAY_KEY_ID, amount: existing.amount, currency: existing.currency, reused: true });
        }
      } catch (e) { console.warn("Could not reuse old order:", e?.message || e); }
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), currency: "INR",
      receipt: `SMV_${questionId.slice(0, 25)}_${Date.now()}`,
      notes: { questionId, customerId: user.uid, astrologerId: String(q.astrologerId || "") }
    });
    const answerSettings = await db.collection("smv_settings").doc("answer").get();
    const minimumWords = Math.max(1, Math.min(10000, Math.floor(Number(answerSettings.data()?.minimumWords || 150))));
    await qRef.set({ razorpayOrderId: order.id, paymentCurrency: "INR", paymentStatus: "order_created", answerMinWords: minimumWords, paymentUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await db.collection("razorpay_orders").doc(order.id).set({
      razorpayOrderId: order.id, questionId, amount: order.amount, currency: order.currency,
      firebaseUid: user.uid, customerEmail: user.email || null, astrologerId: String(q.astrologerId || ""),
      serviceName: req.body?.serviceName || "Astrology Consultation", status: "created", createdAt: FieldValue.serverTimestamp()
    });
    return res.json({ success: true, orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency });
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
      status: "paid", paymentStatus: "paid", razorpayPaymentId: paymentId, razorpaySignature: signature,
      paidAt: q.paidAt || FieldValue.serverTimestamp(), paymentUpdatedAt: FieldValue.serverTimestamp(),
      paymentConfirmedBy: source, commissionPercent: astroPercent,
      astrologerCommissionAmount: astroCommission, adminCommissionAmount: adminCommission
    });
    return { already: false, customerId: q.customerId, astrologerId: q.astrologerId, astroCommission, adminCommission };
  });
  if (!result.already) {
    await db.collection("smv_notifications").add({ userId: result.customerId, type: "payment", title: "Payment successful", message: "Your payment was verified. Your question is now waiting for answers.", questionId, createdAt: FieldValue.serverTimestamp(), read: false });
    if (result.astrologerId) await db.collection("smv_notifications").add({ userId: result.astrologerId, type: "new_question", title: "New paid question", message: "A new paid customer question is waiting in your dashboard.", questionId, createdAt: FieldValue.serverTimestamp(), read: false });
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
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    if (!signatureEqual(expected, signature)) return res.status(401).json({ error: "Invalid payment signature." });
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
    const eventKey = `${eventType}_${paymentId || orderId || crypto.createHash("sha256").update(req.body).digest("hex")}`;
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
        
