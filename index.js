const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

function countWords(text) {
  return String(text || '').trim() ? String(text).trim().split(/\s+/).filter(Boolean).length : 0;
}
async function assertAdmin(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please login.');
  if (request.auth.uid === 'TwjeEIFS3Zcf1SxboLZoujm91Ky2') return;
  const adminSnap = await db.collection('smv_admins').doc(request.auth.uid).get();
  if (!adminSnap.exists || adminSnap.data()?.active === false) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
}

exports.approveAnswerAndCreditCommission = onCall(
  { region: "asia-south1" },
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


exports.approvePublicQuestion = onCall({ region: "asia-south1" }, async (request) => {
  await assertAdmin(request);
  const questionId=String(request.data?.questionId||"").trim();
  if(!questionId) throw new HttpsError("invalid-argument","questionId is required.");
  const qRef=db.collection("smv_questions").doc(questionId);
  const snap=await qRef.get();
  if(!snap.exists) throw new HttpsError("not-found","Question not found.");
  const q=snap.data();
  if(!["awaiting_admin","pending_admin_approval","paid"].includes(q.status) || (q.status==="paid" && q.adminQuestionApprovedAt)) throw new HttpsError("failed-precondition","This question is not waiting for Admin approval.");
  await qRef.set({status:"paid",allocationStatus:"available_to_astrologers",adminQuestionApprovedAt:admin.firestore.FieldValue.serverTimestamp(),adminQuestionApprovedBy:request.auth.uid,adminQuestionRejectionReason:admin.firestore.FieldValue.delete()},{merge:true});
  await db.collection("smv_notifications").add({userId:q.customerId,type:"question_approved",title:"Question Approved",message:"Your paid question has been approved by Admin and is now available to approved astrologers.",questionId,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false});
  return {approved:true,questionId};
});

exports.rejectPublicQuestion = onCall({ region: "asia-south1" }, async (request) => {
  await assertAdmin(request);
  const questionId=String(request.data?.questionId||"").trim();
  const reason=String(request.data?.reason||"").trim();
  if(!questionId||!reason) throw new HttpsError("invalid-argument","questionId and rejection reason are required.");
  const qRef=db.collection("smv_questions").doc(questionId);
  const snap=await qRef.get();
  if(!snap.exists) throw new HttpsError("not-found","Question not found.");
  const q=snap.data();
  if(!["pending_admin_approval","paid"].includes(q.status) || (q.status==="paid" && q.adminQuestionApprovedAt)) throw new HttpsError("failed-precondition","This question is not waiting for Admin approval.");
  await qRef.set({status:"question_rejected",allocationStatus:"rejected_by_admin",adminQuestionRejectedAt:admin.firestore.FieldValue.serverTimestamp(),adminQuestionRejectedBy:request.auth.uid,adminQuestionRejectionReason:reason},{merge:true});
  await db.collection("smv_notifications").add({userId:q.customerId,type:"question_rejected",title:"Question Not Approved",message:`Your paid question was not approved by Admin. Reason: ${reason}`,questionId,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false});
  return {rejected:true,questionId};
});

exports.getAstrologerQuestionInbox = onCall({ region: "asia-south1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please login.");
  const uid=request.auth.uid;
  const astroSnap=await db.collection("smv_astrologers").doc(uid).get();
  if(!astroSnap.exists || astroSnap.data().status!=="approved") throw new HttpsError("permission-denied","Astrologer approval is required.");
  const qs=await db.collection("smv_questions").where("status","==","paid").get();
  return {questions:qs.docs.filter(d=>!d.data().astrologerId && d.data().adminQuestionApprovedAt).map(d=>({id:d.id,...d.data()}))};
});

exports.claimPublicQuestion = onCall({ region: "asia-south1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please login.");
  const uid=request.auth.uid, questionId=String(request.data?.questionId||"").trim();
  if(!questionId) throw new HttpsError("invalid-argument","questionId is required.");
  const astroSnap=await db.collection("smv_astrologers").doc(uid).get();
  if(!astroSnap.exists || astroSnap.data().status!=="approved") throw new HttpsError("permission-denied","Astrologer approval is required.");
  const qRef=db.collection("smv_questions").doc(questionId); let customerId="";
  await db.runTransaction(async tx=>{const qs=await tx.get(qRef);if(!qs.exists) throw new HttpsError("not-found","Question not found.");const q=qs.data();if(q.status!=="paid"||!q.adminQuestionApprovedAt||q.astrologerId) throw new HttpsError("failed-precondition","This question is not approved by Admin or has already been claimed.");customerId=q.customerId;const a=astroSnap.data();tx.update(qRef,{astrologerId:uid,astrologerName:a.name||"Approved Astrologer",status:"admin_approved",allocationStatus:"claimed_by_astrologer",claimedAt:admin.firestore.FieldValue.serverTimestamp(),claimedBy:uid});});
  await db.collection("smv_notifications").add({userId:customerId,type:"question_claimed",title:"Your question is assigned",message:`${astroSnap.data().name||"An approved astrologer"} has claimed your paid astrology question.`,questionId,createdAt:admin.firestore.FieldValue.serverTimestamp(),read:false});
  return {claimed:true,questionId};
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
  await assertAdmin(request);
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
