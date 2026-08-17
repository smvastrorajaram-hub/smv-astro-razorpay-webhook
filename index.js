const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

function getRazorpay(keyId, secret) {
  if (!keyId || !secret) throw new Error("Razorpay server credentials are missing. Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Firebase Functions secrets, then redeploy functions.");
  return new Razorpay({ key_id: String(keyId).trim(), key_secret: String(secret).trim() });
}
function readRazorpayConfig() {
  try {
    const keyId=String(RAZORPAY_KEY_ID.value()||"").trim();
    const secret=String(RAZORPAY_KEY_SECRET.value()||"").trim();
    getRazorpay(keyId,secret);
    return {keyId,secret};
  } catch(e) {
    throw new HttpsError("failed-precondition",`Razorpay configuration error: ${e?.message||String(e)}`);
  }
}

function countWords(text) {
  return String(text || '').trim() ? String(text).trim().split(/\s+/).filter(Boolean).length : 0;
}
function assertAdmin(request) {
  if (!request.auth || request.auth.uid !== 'TwjeEIFS3Zcf1SxboLZoujm91Ky2') throw new HttpsError('permission-denied', 'Admin access required.');
}

async function findQuestionByRazorpayOrder(orderId, questionId = "") {
  if (questionId) {
    const direct = await db.collection("smv_questions").doc(questionId).get();
    if (direct.exists && direct.data().razorpayOrderId === orderId) return direct;
  }
  const snap = await db.collection("smv_questions").where("razorpayOrderId", "==", orderId).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

function safeSignatureEqual(expected, actual) {
  const a = Buffer.from(String(expected || ""), "utf8");
  const b = Buffer.from(String(actual || ""), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function reconcileCapturedPayment({ questionId, orderId, paymentId, signature = "", source = "api" }) {
  const qRef = db.collection("smv_questions").doc(questionId);
  const result = await db.runTransaction(async tx => {
    const qs = await tx.get(qRef);
    if (!qs.exists) throw new Error("Question not found.");
    const q = qs.data();
    if (q.razorpayOrderId !== orderId) throw new Error("Order mismatch.");
    if (q.paymentStatus === "paid" && q.razorpayPaymentId === paymentId) {
      return { alreadyPaid: true, customerId: q.customerId, astrologerId: q.astrologerId };
    }
    const amount = Number(q.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid consultation amount.");

    const commissionSnap = await db.collection("smv_settings").doc("commission").get();
    const commission = commissionSnap.exists ? commissionSnap.data() : { astroPercent: 20, adminPercent: 80 };
    const astroPercent = Number(commission.astroPercent ?? 20);
    const adminPercent = Number(commission.adminPercent ?? 80);
    if (astroPercent < 0 || adminPercent < 0 || Math.abs(astroPercent + adminPercent - 100) > 0.001) {
      throw new Error("Commission settings are invalid.");
    }
    const astrologerCommissionAmount = Math.round(amount * astroPercent) / 100;
    const adminCommissionAmount = Math.round(amount * adminPercent) / 100;
    tx.update(qRef, {
      status: "paid",
      paymentStatus: "paid",
      razorpayPaymentId: paymentId,
      ...(signature ? { razorpaySignature: signature } : {}),
      paidAt: q.paidAt || admin.firestore.FieldValue.serverTimestamp(),
      paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentConfirmedBy: source,
      commissionPercent: astroPercent,
      astrologerCommissionAmount,
      adminCommissionAmount
    });
    return { alreadyPaid: false, customerId: q.customerId, astrologerId: q.astrologerId, astrologerCommissionAmount, adminCommissionAmount };
  });

  if (!result.alreadyPaid) {
    await db.collection("smv_notifications").add({
      userId: result.customerId, type: "payment", title: "Payment successful",
      message: "Your payment was verified. Your question is now waiting for answers.",
      questionId, createdAt: admin.firestore.FieldValue.serverTimestamp(), read: false
    });
    if (result.astrologerId) {
      await db.collection("smv_notifications").add({
        userId: result.astrologerId, type: "new_question", title: "New paid question",
        message: "A new paid customer question is waiting in your dashboard.",
        questionId, createdAt: admin.firestore.FieldValue.serverTimestamp(), read: false
      });
    }
  }
  return result;
}

exports.createRazorpayOrder = onCall(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Please login.");
    const questionId = String(request.data?.questionId || "").trim();
    if (!questionId) throw new HttpsError("invalid-argument", "questionId is required.");

    const qRef = db.collection("smv_questions").doc(questionId);
    const snap = await qRef.get();
    if (!snap.exists) throw new HttpsError("not-found", "Question not found.");
    const q = snap.data();

    if (q.customerId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "You do not own this question.");
    }
    const astroSnap = await db.collection("smv_astrologers").doc(String(q.astrologerId || "")).get();
    if (!astroSnap.exists || astroSnap.data().status !== "approved") {
      throw new HttpsError("failed-precondition", "This astrologer is not approved.");
    }
    if (!["awaiting_payment", "payment_failed"].includes(q.status)) {
      if (q.paymentStatus === "paid") return { orderId: q.razorpayOrderId || null, keyId: readRazorpayConfig().keyId, amount: Math.round(Number(q.amount || 0) * 100), currency: "INR", alreadyPaid: true };
      throw new HttpsError("failed-precondition", "This question is not available for payment.");
    }

    const configuredPrice = Number(astroSnap.data().pricePerQuestion);
    if (!Number.isFinite(configuredPrice) || configuredPrice < 1 || configuredPrice > 100000) {
      throw new HttpsError("failed-precondition", "Astrologer consultation price is not configured correctly.");
    }
    const amountRupees = configuredPrice;

    // Idempotent order creation: reuse an existing unpaid Razorpay order for this question.
    if (q.razorpayOrderId && ["order_created", "verification_failed", "failed"].includes(q.paymentStatus)) {
      try {
        const razorpay = getRazorpay(readRazorpayConfig().keyId, readRazorpayConfig().secret);
        const existing = await razorpay.orders.fetch(q.razorpayOrderId);
        if (existing.status === "paid") {
          throw new HttpsError("failed-precondition", "This payment has already been completed. Please refresh your dashboard.");
        }
        if (Number(existing.amount) === Math.round(amountRupees * 100) && String(existing.currency) === "INR") {
          return { orderId: existing.id, keyId: readRazorpayConfig().keyId, amount: existing.amount, currency: existing.currency, reused: true };
        }
      } catch (e) {
        if (e instanceof HttpsError) throw e;
        console.warn("Existing Razorpay order could not be reused; creating a new order.", e?.message || e);
      }
    }

    const answerSettingsSnap = await db.collection("smv_settings").doc("answer").get();
    const minimumWords = Math.max(1, Math.min(10000, Math.floor(Number(answerSettingsSnap.data()?.minimumWords || 150))));
    let order;
    try {
      const razorpay = getRazorpay(readRazorpayConfig().keyId, readRazorpayConfig().secret);
      order = await razorpay.orders.create({
        amount: Math.round(amountRupees * 100),
        currency: "INR",
        receipt: `smv_${questionId.slice(0, 30)}`,
        notes: { questionId, customerId: request.auth.uid, astrologerId: String(q.astrologerId || "") }
      });
    } catch (e) {
      console.error("Razorpay order creation failed", e);
      const msg = e?.error?.description || e?.description || e?.message || "Razorpay order creation failed.";
      throw new HttpsError("failed-precondition", `Razorpay order creation failed: ${msg}`);
    }

    await qRef.set({
      amount: amountRupees,
      razorpayOrderId: order.id,
      paymentCurrency: "INR",
      paymentStatus: "order_created",
      answerMinWords: minimumWords,
      paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { orderId: order.id, keyId: readRazorpayConfig().keyId, amount: order.amount, currency: order.currency };
  }
);



exports.approveAnswerAndCreditCommission = onCall(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated","Please login.");
    const questionId=String(request.data?.questionId||"").trim();
    if(!questionId) throw new HttpsError("invalid-argument","questionId is required.");
    const qref=db.collection("smv_questions").doc(questionId);
    const result=await db.runTransaction(async tx=>{
      const qs=await tx.get(qref);
      if(!qs.exists) throw new HttpsError("not-found","Question not found.");
      const q=qs.data();
      if(q.status==="answered") return {already:true,astrologerId:q.astrologerId,commission:Number(q.commissionAmount||0)};
      if(!["processing","admin_review"].includes(q.status)) throw new HttpsError("failed-precondition","Answer is not waiting for Admin approval.");
      const gross=Number(q.amount||0);
      const commissionRate=Number(q.commissionRate ?? (await db.collection("smv_settings").doc("commission").get()).data()?.astroPercent ?? 20);
      const commission=Number(q.astrologerCommissionAmount ?? Math.max(0,Math.round(gross*commissionRate)/100));
      const earningsRef=db.collection("smv_earnings").doc();
      tx.update(qref,{
        status:"answered",
        answerApprovedAt:admin.firestore.FieldValue.serverTimestamp(),
        answerApprovedBy:request.auth.uid,
        astrologerAnswerStatus:"submitted",
        commissionAmount:commission,
        astrologerCommissionAmount:commission,
        commissionStatus:"credited",
        earningStatus:"credited"
      });
      tx.set(earningsRef,{
        astrologerId:q.astrologerId,
        questionId,
        grossAmount:gross,
        commissionRate,
        commissionAmount:commission,
        type:"consultation",
        status:"credited",
        createdAt:admin.firestore.FieldValue.serverTimestamp()
      });
      return {already:false,astrologerId:q.astrologerId,commission};
    });
    if(result.astrologerId){
      await db.collection("smv_notifications").add({
        userId:result.astrologerId,type:"answer_approved",title:"Answer Approved",message:`Your answer has been approved. Commission credited: ₹${Number(result.commission||0).toFixed(2)}.`,questionId,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false
      });
    }
    const qs=await qref.get(); const q=qs.data();
    if(q?.customerId){
      await db.collection("smv_notifications").add({
        userId:q.customerId,type:"answer_ready",title:"Your Astrology Answer is Ready",message:"Admin approved the astrologer's answer. You can now view it in your Customer Dashboard.",questionId,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false
      });
    }
    return {ok:true,already:result.already,commission:result.commission};
  }
);

exports.markPaymentFailed = onCall(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Please login.");
    const questionId=String(request.data?.questionId||"").trim();
    if(!questionId) throw new HttpsError("invalid-argument","questionId is required.");
    const ref=db.collection("smv_questions").doc(questionId);
    const snap=await ref.get();
    if(!snap.exists) throw new HttpsError("not-found","Question not found.");
    const q=snap.data();
    if(q.customerId!==request.auth.uid) throw new HttpsError("permission-denied","Not your question.");
    if(["paid","admin_approved","admin_review","answered","processing"].includes(q.status) || q.paymentStatus === "paid") return {ok:true, recovered:false};

    // Never mark a question failed solely because the browser closed. Re-check the Razorpay order first.
    if (q.razorpayOrderId) {
      try {
        const razorpay = getRazorpay(readRazorpayConfig().keyId, readRazorpayConfig().secret);
        const order = await razorpay.orders.fetch(q.razorpayOrderId);
        if (String(order.status).toLowerCase() === "paid") {
          const payments = await razorpay.orders.fetchPayments(q.razorpayOrderId);
          const captured = (payments?.items || []).find(p => String(p.status).toLowerCase() === "captured");
          if (captured) {
            await reconcileCapturedPayment({ questionId, orderId:q.razorpayOrderId, paymentId:captured.id, source:"payment_recovery" });
            return {ok:true, recovered:true};
          }
        }
      } catch (e) {
        console.warn("Payment failure check could not confirm Razorpay status.", e?.message || e);
        return {ok:true, recovered:false, retry:true};
      }
    }
    await ref.set({status:"payment_failed",paymentStatus:"failed",paymentUpdatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
    return {ok:true, recovered:false};
  }
);

exports.verifyRazorpayPayment = onCall(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Please login.");
    const questionId = String(request.data?.questionId || "").trim();
    const orderId = String(request.data?.razorpay_order_id || "").trim();
    const paymentId = String(request.data?.razorpay_payment_id || "").trim();
    const signature = String(request.data?.razorpay_signature || "").trim();
    if (!questionId || !orderId || !paymentId || !signature) throw new HttpsError("invalid-argument", "Incomplete payment response.");
    const qRef = db.collection("smv_questions").doc(questionId);
    const snap = await qRef.get();
    if (!snap.exists) throw new HttpsError("not-found", "Question not found.");
    const q = snap.data();
    if (q.customerId !== request.auth.uid) throw new HttpsError("permission-denied", "Not your question.");
    if (q.razorpayOrderId !== orderId) throw new HttpsError("failed-precondition", "Order mismatch.");

    const expected = crypto.createHmac("sha256", readRazorpayConfig().secret).update(`${orderId}|${paymentId}`).digest("hex");
    if (!safeSignatureEqual(expected, signature)) {
      await qRef.set({ paymentStatus: "verification_failed", paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      throw new HttpsError("permission-denied", "Invalid payment signature.");
    }

    const razorpay = getRazorpay(readRazorpayConfig().keyId, readRazorpayConfig().secret);
    let payment;
    try { payment = await razorpay.payments.fetch(paymentId); }
    catch (e) { throw new HttpsError("unavailable", "Payment received but Razorpay confirmation is temporarily unavailable. Your payment will be recovered automatically if captured."); }
    if (payment.order_id !== orderId) throw new HttpsError("failed-precondition", "Payment order mismatch.");
    if (String(payment.status).toLowerCase() !== "captured") throw new HttpsError("failed-precondition", "Payment is not captured yet.");
    if (Number(payment.amount) !== Math.round(Number(q.amount) * 100)) throw new HttpsError("failed-precondition", "Payment amount mismatch.");

    const result = await reconcileCapturedPayment({ questionId, orderId, paymentId, signature, source:"checkout_verification" });
    return { verified:true, questionId, alreadyProcessed:result.alreadyPaid, astrologerCommissionAmount:result.astrologerCommissionAmount || Number(q.astrologerCommissionAmount || 0), adminCommissionAmount:result.adminCommissionAmount || Number(q.adminCommissionAmount || 0) };
  }
);

// Razorpay server-to-server recovery channel. Configure this URL in the Razorpay Dashboard
// and subscribe to payment.captured and payment.failed (order.paid is also accepted).
exports.razorpayWebhook = onRequest(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
    const rawBody = req.rawBody;
    const receivedSignature = String(req.get("X-Razorpay-Signature") || "");
    if (!rawBody || !receivedSignature) return res.status(400).send("Missing webhook signature.");
    const expected = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET.value()).update(rawBody).digest("hex");
    if (!safeSignatureEqual(expected, receivedSignature)) return res.status(401).send("Invalid webhook signature.");

    let event;
    try { event = typeof req.body === "object" ? req.body : JSON.parse(rawBody.toString("utf8")); }
    catch { return res.status(400).send("Invalid JSON."); }
    const eventId = String(req.get("X-Razorpay-Event-Id") || event?.id || "").trim();
    const eventName = String(event?.event || "").trim();
    if (!eventId) return res.status(400).send("Missing event id.");

    const eventRef = db.collection("smv_razorpay_webhook_events").doc(eventId);
    const eventResult = await db.runTransaction(async tx => {
      const existing = await tx.get(eventRef);
      if (existing.exists) {
        const status = String(existing.data()?.status || "");
        if (["processed", "ignored"].includes(status)) return { duplicate:true };
        tx.set(eventRef, { eventId, event:eventName, retryAt:admin.firestore.FieldValue.serverTimestamp(), status:"processing" }, {merge:true});
        return { duplicate:false, retry:true };
      }
      tx.set(eventRef, { eventId, event:eventName, receivedAt:admin.firestore.FieldValue.serverTimestamp(), status:"processing" });
      return { duplicate:false };
    });
    if (eventResult.duplicate) return res.status(200).send("Already processed");

    try {
      const payload = event?.payload || {};
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;
      const paymentId = String(paymentEntity?.id || "").trim();
      const orderId = String(paymentEntity?.order_id || orderEntity?.id || "").trim();
      const questionId = String(paymentEntity?.notes?.questionId || orderEntity?.notes?.questionId || "").trim();

      if (["payment.captured", "order.paid"].includes(eventName)) {
        if (!orderId) throw new Error("Webhook does not contain an order id.");
        let resolvedPaymentId = paymentId;
        let resolvedAmount = Number(paymentEntity?.amount || orderEntity?.amount_paid || 0);
        if (!resolvedPaymentId) {
          const razorpay = getRazorpay(readRazorpayConfig().keyId, readRazorpayConfig().secret);
          const payments = await razorpay.orders.fetchPayments(orderId);
          const captured = (payments?.items || []).find(p => String(p.status).toLowerCase() === "captured");
          if (captured) { resolvedPaymentId = captured.id; resolvedAmount = Number(captured.amount || resolvedAmount); }
        }
        if (!resolvedPaymentId) throw new Error("Webhook does not contain a captured payment id.");
        const qSnap = await findQuestionByRazorpayOrder(orderId, questionId);
        if (!qSnap) throw new Error("Question for Razorpay order was not found.");
        const q = qSnap.data();
        if (resolvedAmount !== Math.round(Number(q.amount || 0) * 100)) throw new Error("Webhook payment amount mismatch.");
        const result = await reconcileCapturedPayment({ questionId:qSnap.id, orderId, paymentId:resolvedPaymentId, source:"razorpay_webhook" });
        await eventRef.set({ status:"processed", questionId:qSnap.id, paymentId:resolvedPaymentId, orderId, processedAt:admin.firestore.FieldValue.serverTimestamp(), alreadyPaid:result.alreadyPaid }, {merge:true});
        return res.status(200).send("OK");
      }

      if (eventName === "payment.failed") {
        if (!orderId) throw new Error("Payment failed webhook has no order id.");
        const qSnap = await findQuestionByRazorpayOrder(orderId, questionId);
        if (qSnap) {
          const q=qSnap.data();
          if (q.paymentStatus !== "paid" && q.status === "awaiting_payment") {
            await qSnap.ref.set({ paymentStatus:"failed", paymentUpdatedAt:admin.firestore.FieldValue.serverTimestamp(), lastPaymentFailureAt:admin.firestore.FieldValue.serverTimestamp() }, {merge:true});
          }
          await eventRef.set({ status:"processed", questionId:qSnap.id, paymentId, orderId, processedAt:admin.firestore.FieldValue.serverTimestamp() }, {merge:true});
        } else {
          await eventRef.set({ status:"processed", paymentId, orderId, processedAt:admin.firestore.FieldValue.serverTimestamp(), note:"No matching consultation found" }, {merge:true});
        }
        return res.status(200).send("OK");
      }

      await eventRef.set({ status:"ignored", processedAt:admin.firestore.FieldValue.serverTimestamp() }, {merge:true});
      return res.status(200).send("Ignored");
    } catch (e) {
      console.error("Razorpay webhook processing failed", e);
      await eventRef.set({ status:"failed", error:String(e?.message || e), failedAt:admin.firestore.FieldValue.serverTimestamp() }, {merge:true});
      return res.status(500).send("Webhook processing failed");
    }
  }
);

exports.testRazorpayConnection = onCall(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async (request) => {
    assertAdmin(request);
    try {
      const razorpay = getRazorpay(readRazorpayConfig().keyId, readRazorpayConfig().secret);
      await razorpay.orders.all({ count: 1 });
      return { ok: true, message: "Firebase can reach Razorpay and the configured server credentials were accepted." };
    } catch (e) {
      console.error("Razorpay connection test failed", e);
      const msg = e?.error?.description || e?.description || e?.message || "Razorpay connection failed.";
      throw new HttpsError("failed-precondition", msg);
    }
  }
);

exports.submitAstrologerAnswer = onCall({ region: "asia-south1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please login.");
  const questionId = String(request.data?.questionId || "").trim();
  const answer = String(request.data?.answer || "").trim();
  if (!questionId || !answer) throw new HttpsError("invalid-argument", "Question and answer are required.");
  const qRef = db.collection("smv_questions").doc(questionId);
  const snap = await qRef.get();
  if (!snap.exists) throw new HttpsError("not-found", "Question not found.");
  const q = snap.data();
  if (q.astrologerId !== request.auth.uid) throw new HttpsError("permission-denied", "This question is not assigned to you.");
  if (!["admin_approved", "revision_required"].includes(q.status)) throw new HttpsError("failed-precondition", "This question is not open for an answer.");
  const settingsSnap = await db.collection("smv_settings").doc("answer").get();
  const configuredMinimum = Math.max(1, Math.min(10000, Math.floor(Number(settingsSnap.data()?.minimumWords || 150))));
  const minimumWords = Math.max(1, Math.floor(Number(q.answerMinWords || configuredMinimum)));
  const words = countWords(answer);
  if (words < minimumWords) throw new HttpsError("failed-precondition", `Minimum ${minimumWords} words required. Current answer: ${words} words.`);
  const commissionSnap=await db.collection("smv_settings").doc("commission").get();
  const astroPercent=Math.max(0,Math.min(100,Number(commissionSnap.data()?.astroPercent ?? 20)));
  const commissionAmount=Math.round((Number(q.amount||0)*astroPercent/100)*100)/100;
  await qRef.set({answer,status:"processing",answerMinWords:minimumWords,answerWordCount:words,answerSubmittedAt:admin.firestore.FieldValue.serverTimestamp(),answerRevision:q.status==="revision_required",astrologerAnswerStatus:"submitted",astrologerCommissionAmount:commissionAmount,commissionRate:astroPercent,commissionStatus:"pending_admin_approval"},{merge:true});
  await db.collection("smv_notifications").add({userId:"TwjeEIFS3Zcf1SxboLZoujm91Ky2",type:"answer_review",title:"Answer awaiting approval",message:"An astrologer submitted an answer for Admin review.",questionId,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false});
  await db.collection("smv_notifications").add({userId:q.customerId,type:"answer_processing",title:"Astrologer Answer Submitted",message:`${q.astrologerName||"Your selected astrologer"} has submitted the answer. It is now Processing while Admin reviews it.`,questionId,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false});
  return {submitted:true,questionId,words,minimumWords,commissionAmount,commissionStatus:"pending_admin_approval"};
});


exports.submitVerifiedReview = onCall({ region: "asia-south1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please login.");
  const uid=request.auth.uid;
  const questionId=String(request.data?.questionId||"").trim();
  const astrologerId=String(request.data?.astrologerId||"").trim();
  const rating=Number(request.data?.rating);
  const review=String(request.data?.review||"").trim();
  if(!questionId||!astrologerId||!Number.isInteger(rating)||rating<1||rating>5) throw new HttpsError("invalid-argument","Valid review details are required.");
  if(review.length<5||review.length>1000) throw new HttpsError("invalid-argument","Review must be between 5 and 1000 characters.");
  const qRef=db.collection("smv_questions").doc(questionId);
  const result=await db.runTransaction(async tx=>{
    const qs=await tx.get(qRef);
    if(!qs.exists) throw new HttpsError("not-found","Consultation not found.");
    const q=qs.data();
    if(q.customerId!==uid||q.astrologerId!==astrologerId) throw new HttpsError("permission-denied","This consultation does not belong to you.");
    if(q.status!=="answered") throw new HttpsError("failed-precondition","A review is available only after the answer is approved.");
    if(q.reviewed===true) throw new HttpsError("already-exists","This consultation has already been reviewed.");
    const reviewRef=db.collection("smv_reviews").doc();
    tx.set(reviewRef,{customerId:uid,astrologerId,questionId,rating,review,createdAt:admin.firestore.FieldValue.serverTimestamp(),verified:true,approved:false});
    tx.update(qRef,{reviewed:true,reviewSubmittedAt:admin.firestore.FieldValue.serverTimestamp()});
    return {reviewId:reviewRef.id};
  });
  await db.collection("smv_notifications").add({userId:astrologerId,type:"review_received",title:"New customer review",message:"A verified customer review has been submitted and is awaiting Admin approval.",questionId,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false});
  return {submitted:true,reviewId:result.reviewId};
});

exports.getAstrologerEarnings = onCall({ region: "asia-south1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please login.");
  const uid=request.auth.uid, userSnap=await db.collection("smv_users").doc(uid).get();
  if (!userSnap.exists || userSnap.data().role!=="astrologer") throw new HttpsError("permission-denied","Astrologer access required.");
  const qs=await db.collection("smv_questions").where("astrologerId","==",uid).get();
  let totalEarnings=0;
  qs.docs.forEach(d=>{const q=d.data();if(q.commissionStatus==="credited" && q.status==="answered")totalEarnings+=Number(q.astrologerCommissionAmount||0);});
  const ws=await db.collection("smv_withdrawals").where("astrologerId","==",uid).get();
  let reserved=0; ws.docs.forEach(d=>{const w=d.data();if(["pending","processing","paid"].includes(w.status))reserved+=Number(w.amount||0);});
  const minimumWithdrawal=300, availableToWithdraw=Math.max(0,Math.round((totalEarnings-reserved)*100)/100);
  const ledger=qs.docs.filter(d=>d.data().commissionStatus==="credited" && d.data().status==="answered").map(d=>{const q=d.data();return {questionId:d.id,grossAmount:Number(q.amount||0),commissionAmount:Number(q.astrologerCommissionAmount||0),status:q.commissionStatus,creditedAt:q.answerApprovedAt||q.updatedAt||q.createdAt};}).sort((a,b)=>Number(b.creditedAt?.seconds||0)-Number(a.creditedAt?.seconds||0)).slice(0,50);
  const withdrawn=ws.docs.filter(d=>d.data().status==="paid").reduce((s,d)=>s+Number(d.data().amount||0),0);
  const pendingWithdrawal=ws.docs.filter(d=>["pending","processing"].includes(d.data().status)).reduce((s,d)=>s+Number(d.data().amount||0),0);
  return {totalEarnings,reserved,withdrawn,pendingWithdrawal,availableToWithdraw,minimumWithdrawal,ledger};
});

exports.requestAstrologerWithdrawal = onCall({ region: "asia-south1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please login.");
  const uid=request.auth.uid, amount=Number(request.data?.amount);
  if (!Number.isFinite(amount)||amount<=0) throw new HttpsError("invalid-argument","Enter a valid withdrawal amount.");
  const userSnap=await db.collection("smv_users").doc(uid).get(), astroSnap=await db.collection("smv_astrologers").doc(uid).get();
  if(!userSnap.exists||userSnap.data().role!=="astrologer"||!astroSnap.exists||astroSnap.data().status!=="approved") throw new HttpsError("permission-denied","Only an approved astrologer can withdraw.");
  const payoutSnap=await db.collection("smv_payouts").doc(uid).get();
  if(!payoutSnap.exists) throw new HttpsError("failed-precondition","Please provide your bank or UPI payment details first.");
  const payout=payoutSnap.data();
  if(!String(payout.bankName||"").trim() && !String(payout.upi||"").trim()) throw new HttpsError("failed-precondition","Your bank or UPI payment details are incomplete.");
  const qs=await db.collection("smv_questions").where("astrologerId","==",uid).get(); let totalEarnings=0;
  qs.docs.forEach(d=>{const q=d.data();if(q.commissionStatus==="credited" && q.status==="answered")totalEarnings+=Number(q.astrologerCommissionAmount||0);});
  const ws=await db.collection("smv_withdrawals").where("astrologerId","==",uid).get();let reserved=0;
  ws.docs.forEach(d=>{const w=d.data();if(["pending","processing","paid"].includes(w.status))reserved+=Number(w.amount||0);});
  const available=Math.round((totalEarnings-reserved)*100)/100;
  if(amount<300) throw new HttpsError("failed-precondition","Minimum withdrawal is ₹300.");
  if(amount>available) throw new HttpsError("failed-precondition",`Requested amount exceeds your available balance of ₹${available.toFixed(2)}.`);
  const ref=db.collection("smv_withdrawals").doc();
  await ref.set({astrologerId:uid,amount:Math.round(amount*100)/100,status:"pending",createdAt:admin.firestore.FieldValue.serverTimestamp(),requestedAt:admin.firestore.FieldValue.serverTimestamp(),payoutMethod:payout.upi?"UPI/BANK":"BANK",processingTime:"24-48 hours"});
  await db.collection("smv_notifications").add({userId:uid,type:"withdrawal",title:"Withdrawal request received",message:`Your withdrawal request for ₹${amount.toFixed(2)} was received. Admin will arrange payment within 24–48 hours.`,withdrawalId:ref.id,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false});
  await db.collection("smv_notifications").add({userId:"TwjeEIFS3Zcf1SxboLZoujm91Ky2",type:"withdrawal_request",title:"New astrologer withdrawal request",message:`An astrologer requested ₹${amount.toFixed(2)}. Please arrange payment within 24–48 hours.`,withdrawalId:ref.id,astrologerId:uid,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false});
  return {requested:true,withdrawalId:ref.id,amount};
});

exports.adminUpdateWithdrawalStatus = onCall({ region: "asia-south1" }, async (request) => {
  assertAdmin(request);
  const withdrawalId=String(request.data?.withdrawalId||"").trim(), status=String(request.data?.status||"").trim();
  if(!withdrawalId||!["processing","paid","rejected"].includes(status)) throw new HttpsError("invalid-argument","Invalid withdrawal update.");
  const ref=db.collection("smv_withdrawals").doc(withdrawalId), snap=await ref.get();
  if(!snap.exists) throw new HttpsError("not-found","Withdrawal request not found.");
  const w=snap.data();
  if(status==="processing"&&w.status!=="pending") throw new HttpsError("failed-precondition","Only pending requests can be marked processing.");
  if(status==="paid"&&w.status!=="processing") throw new HttpsError("failed-precondition","Only processing requests can be marked paid.");
  if(status==="rejected"&&!["pending","processing"].includes(w.status)) throw new HttpsError("failed-precondition","This request can no longer be rejected.");
  await ref.set({status,updatedAt:admin.firestore.FieldValue.serverTimestamp(),...(status==="paid"?{paidAt:admin.firestore.FieldValue.serverTimestamp(),paidBy:request.auth.uid}:{})},{merge:true});
  const title=status==="paid"?"Withdrawal paid":status==="processing"?"Withdrawal is being processed":"Withdrawal request rejected";
  const msg=status==="paid"?`Your withdrawal of ₹${Number(w.amount||0).toFixed(2)} has been marked paid by Admin.`:status==="processing"?"Your withdrawal is being processed by Admin.":"Your withdrawal request was rejected by Admin.";
  await db.collection("smv_notifications").add({userId:w.astrologerId,type:"withdrawal_status",title,message:msg,withdrawalId,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false});
  return {updated:true,status};
});
