
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, deleteUser, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, runTransaction, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.__SMV_BUILD="V113";
const firebaseConfig={apiKey:"AIzaSyCKXyfZ9sjGmej7ygxHpzHNcNysMXHuvSs",authDomain:"smv-astro.firebaseapp.com",projectId:"smv-astro",storageBucket:"smv-astro.firebasestorage.app",messagingSenderId:"299081899217",appId:"1:299081899217:web:8d558df08e86037ea539f0"};
let app=null, auth=null, db=null, functions=null, httpsCallableFn=null, firebaseInitError=null;
try{
  app=initializeApp(firebaseConfig);
  auth=getAuth(app);await setPersistence(auth,browserSessionPersistence);
  db=getFirestore(app);
}catch(initError){
  firebaseInitError=initError;
  console.error("SMV ASTRO Firebase initialization failed",initError);
}
const RAZORPAY_BACKEND_URL="https://smv-astro-razorpay-webhook.onrender.com";
let firebaseFunctionsPromise=null;
async function ensureFirebaseFunctions(){
  if(functions && httpsCallableFn) return {functions,httpsCallable:httpsCallableFn};
  if(!firebaseFunctionsPromise){
    firebaseFunctionsPromise=import("https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js").then(mod=>{
      functions=mod.getFunctions(app,"asia-south1");
      httpsCallableFn=mod.httpsCallable;
      return {functions,httpsCallable:httpsCallableFn};
    });
  }
  return firebaseFunctionsPromise;
}
async function callFunction(name,data={}){
  const api=await ensureFirebaseFunctions();
  return withTimeout(api.httpsCallable(api.functions,name)(data));
}
async function renderApi(path, options={}, userOverride=null){
  const user=userOverride || auth?.currentUser;
  if(!user) throw new Error("Login session is missing. Please login again.");
  const token=await user.getIdToken(true);
  if(!token) throw new Error("Firebase login token could not be created. Please try again.");
  const headers={"Content-Type":"application/json",...(options.headers||{}),Authorization:`Bearer ${token}`};
  const response=await fetch(RAZORPAY_BACKEND_URL+path,{...options,headers});
  let data=null; try{data=await response.json();}catch(e){data={};}
  if(!response.ok) throw new Error(data?.error||`Render backend error (${response.status})`);
  return data;
}
async function renderPublicApi(path, options={}){
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  const response=await fetch(RAZORPAY_BACKEND_URL+path,{...options,headers});
  let data=null; try{data=await response.json();}catch(e){data={};}
  if(!response.ok) throw new Error(data?.error||`Render backend error (${response.status})`);
  return data;
}
const ADMIN_UID="TwjeEIFS3Zcf1SxboLZoujm91Ky2";
let currentUser=null, selectedAstro=null, pendingAfterLogin=null, questionServicePrice=5, pendingQuestionId="", pendingQuestionFingerprint="", loginMethod="email";
const $=id=>document.getElementById(id);
const show=id=>$(id)?.classList.remove("hidden"); const hide=id=>$(id)?.classList.add("hidden");
const go=id=>$(id)?.scrollIntoView({behavior:"smooth",block:"start"});
function hidePrimarySections(except=""){
  ["register-flow","astro-register-form","astro-flow","ask-flow","appointment","contact","dashboard","admin"].forEach(id=>{if(id!==except) hide(id);});
  if(except!=="dashboard") hide("dashLink");
  if(except!=="admin") hide("adminLink");
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function message(id,html){if($(id)) $(id).innerHTML=html;}
function withTimeout(promise,ms=15000){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("Firebase did not respond within 15 seconds.")),ms))]);}
window.closeModal=()=>$("modal").classList.add("hidden");
function openModal(html){$("modalContent").innerHTML=html;$("modal").classList.remove("hidden");}

// ---------- Navigation ----------
function openRegister(){hidePrimarySections("register-flow");show("register-flow");go("register-flow");}
function openAstroRegister(){hidePrimarySections("astro-register-form");show("astro-register-form");go("astro-register-form");}
function openAstroFlow(){openQuestionService();}
async function openQuestionService(){
  if(!currentUser){pendingAfterLogin="question";openAuth("login");return;}
  const questionProfile=await getUserProfile(currentUser.uid);
  const questionRole=String(questionProfile?.role||"").toLowerCase();
  if(questionRole!=="customer"||!currentUser.emailVerified){await logoutToHome();openAuth("login");return;}
  hidePrimarySections("ask-flow");
  show("ask-flow");
  selectedAstro=null;$("askTitle").textContent="Ask Your Question";
  await loadQuestionPrice();
  $("birthName").value="";$("birthDate").value="";$("birthTime").value="";$("birthPlace").value="";$("birthGender").value="";$("questionText").value="";
  message("askMsg","");go("ask-flow");
}
window.__smvOpenQuestionService=openQuestionService;

$("authBtn")?.addEventListener("click",async()=>{if(currentUser){await logoutToHome();}else{openAuth("login");}});
$("customerRegBtn")?.addEventListener("click",()=>openAuth("register"));
$("privateConsultBtn")?.addEventListener("click",()=>openQuestionService());
$("astroRegBtn")?.addEventListener("click",openAstroRegister);
$("regBackBtn")?.addEventListener("click",()=>{hide("register-flow");window.scrollTo({top:0,behavior:"smooth"});});
$("astroRegBackBtn")?.addEventListener("click",openRegister);
$("backHomeBtn")?.addEventListener("click",()=>{hide("astro-flow");hide("ask-flow");window.scrollTo({top:0,behavior:"smooth"});});
$("backAstroBtn")?.addEventListener("click",()=>{hide("ask-flow");go("ask-service");});
$("dashLink")?.addEventListener("click",e=>{e.preventDefault();loadDashboard();go("dashboard");});
$("adminLink")?.addEventListener("click",e=>{e.preventDefault();openAdminEntry();});
$("adminFeatureBtn")?.addEventListener("click",e=>{e.preventDefault();openAdminEntry();});
$("adminCloseBtn")?.addEventListener("click",e=>{e.preventDefault();hide("admin");hide("adminLink");location.hash="";window.scrollTo({top:0,behavior:"smooth"});});
$("consultationNav")?.addEventListener("click",e=>{e.preventDefault();openQuestionService();});

// ---------- Admin access + Login / customer registration ----------
async function getUserProfile(uid){
  try{const s=await withTimeout(getDoc(doc(db,"smv_users",uid)),10000);return s.exists()?s.data():{};}
  catch(e){console.warn("Profile lookup failed",e);return {};}
}
async function isCurrentAdmin(){
  if(!currentUser) return false;
  if(currentUser.uid===ADMIN_UID) return true;
  try {
    const r=await renderApi("/admin-data",{method:"GET"});
    return r?.success===true;
  } catch(e) {
    const profile=await getUserProfile(currentUser.uid);
    return String(profile.role||"").toLowerCase()==="admin";
  }
}
async function openAdminEntry(){
  if(!currentUser){pendingAfterLogin="admin";openAuth("login");return;}
  if(await isCurrentAdmin()){
    hidePrimarySections("admin");
    show("admin");show("adminLink");
    await loadAdminPanel();
    setTimeout(()=>window.__smvRefreshAdminSections?.(),0);
    go("admin");return;
  }
  openModal('<h2>Admin Access</h2><div class="error">This account is not an Admin account.</div><p class="small">Please login with the Admin account, then open Admin Dashboard again.</p><button class="btn gray" id="adminAccessClose">Close</button>');
  $("adminAccessClose").onclick=closeModal;
}


function openAuth(mode="login"){
  hide("dashboard"); hide("admin"); hide("dashLink"); hide("adminLink"); hide("appointment"); hide("contact"); hide("ask-flow"); hide("register-flow"); hide("astro-register-form"); hide("astro-flow");
  closeModal();
  loginMethod="email";
  openModal(`<h2>${mode==="login"?"Login":"Create Customer Account"}</h2>
  <div id="authMsg" class="small"></div>
  ${mode==="register"?`<input id="name" placeholder="Full name" autocomplete="name"><input id="phone" placeholder="Mobile number" autocomplete="tel">`:""}
  ${mode==="login"?`<div class="action-row" style="margin-bottom:8px"><button type="button" class="btn gray" id="loginEmailMode">Email Login</button><button type="button" class="btn gray" id="loginCustomerIdMode">Customer ID Login</button><button type="button" class="btn gray" id="loginAstrologerIdMode">Astrologer ID Login</button></div>`:""}
  <input id="email" type="email" placeholder="Email" autocomplete="email">
  <input id="password" type="password" placeholder="Password (minimum 6 characters)" autocomplete="${mode==="login"?"current-password":"new-password"}">
  <button class="btn" id="submitAuth">${mode==="login"?"Login":"Create Account"}</button>
  ${mode==="login"?`<button class="btn gray" id="forgotAuth">Forgot Password?</button>`:""}
  <button class="btn gray" id="switchAuth">${mode==="login"?"Create new customer account":"I already have an account"}</button>`);
  if(mode==="login"){
    const setMethod=(m)=>{loginMethod=m; const input=$("email"); if(!input)return; const idMode=m!=="email"; input.type=idMode?"text":"email"; input.placeholder=m==="customerId"?"Customer ID (e.g. SMV-CUS-20082026-01)":m==="astrologerId"?"Astrologer ID (e.g. SMV-AST-20082026-01)":"Email"; input.autocomplete=idMode?"username":"email"; $("loginEmailMode")?.classList.toggle("active",m==="email"); $("loginCustomerIdMode")?.classList.toggle("active",m==="customerId"); $("loginAstrologerIdMode")?.classList.toggle("active",m==="astrologerId");};
    $("loginEmailMode").onclick=()=>setMethod("email");
    $("loginCustomerIdMode").onclick=()=>setMethod("customerId");
    $("loginAstrologerIdMode").onclick=()=>setMethod("astrologerId");
    setMethod("email");
  }
  $("submitAuth").onclick=()=>submitAuth(mode);
  $("switchAuth").onclick=()=>openAuth(mode==="login"?"register":"login");
  if($("forgotAuth")) $("forgotAuth").onclick=async()=>{
    const email=$("email").value.trim(),m=$("authMsg");
    if(!email){m.innerHTML='<span class="error">Enter your registered email first.</span>';return;}
    try{
      const {sendPasswordResetEmail}=await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js");
      await withTimeout(sendPasswordResetEmail(auth,email));
      m.innerHTML='<span class="success">Password reset email sent. Please check Inbox and Spam.</span>';
    }catch(e){m.innerHTML='<span class="error">'+escapeHtml(e.message||String(e))+'</span>';}
  };
}
async function resendVerificationEmail(){
 const email=$("email").value.trim(),password=$("password").value;
 if(!email||!password){
   message("authMsg",'<span class="error">Please enter your email and password first.</span>');
   return;
 }
 try{
   const cred=await signInWithEmailAndPassword(auth,email,password);
   await sendEmailVerification(cred.user);
   await signOut(auth);
   currentUser=null;
   message("authMsg",'<span class="success"><b>Verification link sent successfully.</b> Please check your email.</span>');
 }catch(e){
   try{await signOut(auth);}catch(_){}
   message("authMsg",'<span class="error">Unable to send verification email. Please check your email and password.</span>');
 }
}
window.resendVerificationEmail=resendVerificationEmail;
document.addEventListener("click",e=>{
 const resendBtn=e.target.closest("[data-resend-verification]");
 if(!resendBtn)return;
 e.preventDefault();
 e.stopPropagation();
 if(resendBtn.dataset.sending==="1")return;
 resendBtn.dataset.sending="1";
 resendVerificationEmail().finally(()=>{resendBtn.dataset.sending="";});
});
async function submitAuth(mode){
 const msg=$("authMsg"),rawLogin=$("email").value.trim(),password=$("password").value;
 if(!rawLogin||!password){msg.innerHTML='<span class="error">Please enter your email or Customer ID and password.</span>';return;}
 const btn=$("submitAuth");btn.disabled=true;btn.textContent=mode==="login"?"Signing in...":"Creating...";
 try{
  if(mode==="login"){
    let email=rawLogin;
    if(loginMethod==="customerId" || loginMethod==="astrologerId"){
      const lookup=await withTimeout(renderPublicApi("/lookup-id-login",{method:"POST",body:JSON.stringify({publicId:rawLogin})}),15000);
      const expectedRole=loginMethod==="astrologerId"?"astrologer":"customer";
      if(String(lookup?.role||"").toLowerCase()!==expectedRole) throw new Error(loginMethod==="astrologerId"?"This is not a valid Astrologer ID.":"This is not a valid Customer ID.");
      email=String(lookup?.email||"").trim();
      if(!email) throw new Error("The ID is not linked to a login email.");
    }
    // Do not wait for a separate auth-state promise here. Firebase already returns
    // the signed-in user from signInWithEmailAndPassword; use that result directly.
    const loginCred=await withTimeout(signInWithEmailAndPassword(auth,email,password),20000);
    if(!loginCred?.user){throw new Error("Login did not return a Firebase user. Please try again.");}
    currentUser=loginCred.user;
    await loginCred.user.reload(); const loginProfile=await getUserProfile(loginCred.user.uid); const loginRole=String(loginProfile?.role||"customer").toLowerCase(); const loginStatus=String(loginProfile?.status||"active").toLowerCase(); if(loginRole!=="admin" && loginCred.user.uid!==ADMIN_UID){
      if(!loginCred.user.emailVerified){
        await signOut(auth);
        currentUser=null;
        pendingAfterLogin=null;
        msg.innerHTML='<span class="error"><b>Please verify your email first.</b><br>Check your email and click the verification link.<br><button type="button" class="btn" data-resend-verification="1" style="margin-top:10px">Resend Verification Email</button></span>';
        return;
      }
      // Pending astrologers can log in. Their restricted dashboard is shown
      // below; protected consultation/earnings queries are skipped until approval.
}
    const goToQuestion=pendingAfterLogin==="question";
    const goToAdmin=pendingAfterLogin==="admin";
    pendingAfterLogin=null;
    closeModal();
    if(goToQuestion){
      await openQuestionService();
      return;
    }
    hide("dashboard"); hide("admin"); hide("dashLink"); hide("adminLink");
    const profile=await getUserProfile(loginCred.user.uid);
    const adminUser=(loginCred.user.uid===ADMIN_UID || String(profile.role||"").toLowerCase()==="admin");
    if(goToAdmin || adminUser){
      pendingAfterLogin=null;
      if(adminUser){
        hidePrimarySections("admin");
        show("adminLink");
        await loadAdminPanel();
        setTimeout(()=>window.__smvRefreshAdminSections?.(),0);
        go("admin");
      }else{
        openModal('<h2>Admin Access</h2><div class="error">This account is not an Admin account.</div><p class="small">Please use your Admin login.</p>');
      }
    }else{
      show("dashLink");
      hidePrimarySections("dashboard");
      show("dashboard");
      await loadDashboard();
      go("dashboard");
    }
    return;
  }
  const name=$("name").value.trim(),phone=$("phone").value.trim();
  if(!name||password.length<6){msg.innerHTML='<span class="error">Enter name and a password of at least 6 characters.</span>';return;}
  let cred=null;
  let createdNewAuthUser=false;
  let profileResponse=null;
  try{
    try{
      cred=await withTimeout(createUserWithEmailAndPassword(auth,email,password),20000);
      createdNewAuthUser=true;
    }catch(authErr){
      // Never silently sign in or repair an existing account from the
      // registration form.  Firebase Authentication has already confirmed
      // that this email belongs to an existing account, so stop registration
      // and give the user a clear next step.
      if(authErr?.code==="auth/email-already-in-use") {
        const existingMsg = '<span class="error"><b>This email is already registered.</b><br>If you have not verified your email, please use <b>Login</b> and choose <b>Resend Verification Email</b>. If you have already verified it, please use Login normally.</span>';
        msg.innerHTML=existingMsg;
        return;
      }
      throw authErr;
    }

    currentUser=cred.user;
    msg.innerHTML='<span class="small">Account created. Setting up your Customer ID...</span>';
    btn.textContent="CREATING CUSTOMER ID...";

    // Profile/counter writes are intentionally handled by the trusted Render
    // backend. This avoids client-side Firestore Rules mismatches during the
    // first registration and prevents a COUNTER_ERROR from leaving a half
    // created Auth account behind.
    profileResponse=await renderApi("/register-customer-profile",{
      method:"POST",
      body:JSON.stringify({name,phone})
    },cred.user);
    if(!profileResponse?.ok) throw new Error(profileResponse?.error||"Customer profile setup failed.");
    try{await withTimeout(sendEmailVerification(cred.user),15000);}catch(ve){console.warn("Verification email could not be sent immediately",ve);}
  }catch(profileErr){
    console.error("Customer registration/profile save failed",profileErr);
    // Do not leave a half-created Auth account behind when this was a brand-new
    // registration. That was the reason subsequent attempts showed
    // auth/email-already-in-use after a COUNTER_ERROR.
    if(createdNewAuthUser && !profileResponse?.ok && auth?.currentUser?.uid===cred?.user?.uid){
      try{await deleteUser(auth.currentUser);}catch(cleanupErr){console.warn("Auth cleanup failed",cleanupErr);}
      currentUser=null;
    }
    throw profileErr;
  }
  const createdId = profileResponse?.publicId ? `<br><b>Your Customer ID:</b> ${escapeHtml(profileResponse.publicId)}<br><span class="small">Keep this ID safe. It can be used for future Customer ID login.</span>` : '';
  msg.innerHTML='<span class="success"><b>Registration successful ✓</b>'+createdId+'<br>Verification email sent. Please verify your account and login again.</span><button class="btn" id="registrationLoginBtn" style="margin-top:10px">Go to Login</button>';
  $("registrationLoginBtn").onclick=async()=>{await logoutToHome();openAuth("login");};
 }catch(e){
  let t=e?.message||String(e);
  if(e?.code==="auth/wrong-password"||e?.code==="auth/invalid-credential") t="Incorrect email or password.";
  if(e?.code==="auth/email-already-in-use") t="This email is already registered. Please use Login. If you have not verified your email, choose Resend Verification Email.";
  if(e?.code==="auth/network-request-failed") t="Network connection failed. Please try again.";
  if(/profile setup failed|server/i.test(t)) t="Registration could not finish the secure profile setup. Please check that the existing Render backend is online, then try again.";
  msg.innerHTML='<span class="error">'+escapeHtml(t)+'</span>';
 }finally{if($("submitAuth")){btn.disabled=false;btn.textContent=mode==="login"?"Login":"Create Account";}}
}
let authReadyResolve;
const authReady=new Promise(r=>authReadyResolve=r);
function waitForAuthReady(){return authReady;}
// ---------- Astrologer list ----------
async function loadAstrologers(){ return loadAstroCards(); }
async function loadAstroCards(){
 const box=$("astroCards");if(!box)return;
 box.innerHTML='<div class="empty">Loading astrologers...</div>';
 let items=[];
 try{
  const r=await withTimeout(fetch(RAZORPAY_BACKEND_URL+"/public/astrologers",{cache:"no-store"}),9000);
  const d=await r.json().catch(()=>({}));
  if(r.ok && Array.isArray(d.astrologers)) items=d.astrologers;
 }catch(e){ console.warn("Public astrologer API unavailable; using Firestore fallback.",e?.message||e); }
 if(!items.length){
   try{
     const snap=await withTimeout(getDocs(query(collection(db,"smv_astrologers"),where("status","==","approved"))),10000);
     items=snap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>String(a.status||"").toLowerCase()==="approved");
   }catch(e){ console.error("Approved astrologer fallback failed:",e); }
 }
 if(!items.length){
   box.innerHTML='<div class="empty">No approved astrologers available yet.</div>';return;
 }
 box.innerHTML="";
 items.forEach(a=>{
   const card=document.createElement("div");card.className="card";card.style.marginTop="12px";
   card.innerHTML=`${a.photoData?`<img src="${escapeHtml(a.photoData)}" alt="Astrologer photo" style="width:96px;height:96px;border-radius:50%;object-fit:cover">`:''}<h3>${escapeHtml(a.name||"Astrologer")}</h3><p><b>${escapeHtml(a.expertise||a.specialization||"Astrology")}</b></p><p>⭐ ${escapeHtml(a.rating||a.averageRating||"New")} · ${escapeHtml(a.experience||"Experienced")} years experience</p><p>${escapeHtml(a.bio||a.about||"Professional astrologer")}</p><div class="action-row"><button class="btn gray" data-profile>PROFILE & REVIEWS</button></div>`;
   card.querySelector("[data-profile]").onclick=()=>openPublicAstrologerProfile(a);box.appendChild(card);
 });
}
let questionPriceUnsubscribe=null;
async function loadQuestionPrice(){
  const rateBox=$("askRate");
  if(rateBox) rateBox.innerHTML='<b>Loading current question price...</b>';
  try{
    const snap=await withTimeout(getDoc(doc(db,"smv_settings","question")),10000);
    if(!snap.exists()) throw new Error("Question price document is missing: smv_settings/question");
    const v=Number(snap.data()?.price);
    if(!Number.isFinite(v)||v<1) throw new Error("Question price is invalid in smv_settings/question");
    questionServicePrice=v;
    if(rateBox) rateBox.innerHTML=`<b>₹${questionServicePrice.toFixed(2)} per Question</b>`;
    if($("publicQuestionPrice")) $("publicQuestionPrice").textContent=`₹${questionServicePrice.toFixed(2)}`;
  }catch(e){
    console.error("QUESTION PRICE LOAD ERROR:",e);
    const adminValue=Number($("questionPrice")?.value);
    if(Number.isFinite(adminValue)&&adminValue>=1){
      questionServicePrice=adminValue;
      if(rateBox) rateBox.innerHTML=`<b>₹${questionServicePrice.toFixed(2)} per Question</b><br><span class="error small">Firebase public price read failed; payment will be rechecked by the server.</span>`;
    }else{
      questionServicePrice=0;
      if(rateBox) rateBox.innerHTML='<b class="error">Question price unavailable. Firebase could not read smv_settings/question.</b>';
    }
  }
  if(!questionPriceUnsubscribe){
    questionPriceUnsubscribe=onSnapshot(doc(db,"smv_settings","question"),snap=>{
      const v=Number(snap.data()?.price);
      if(Number.isFinite(v)&&v>=1){
        questionServicePrice=v;
        if($("askRate")) $("askRate").innerHTML=`<b>₹${questionServicePrice.toFixed(2)} per Question</b>`;
        if($("publicQuestionPrice")) $("publicQuestionPrice").textContent=`₹${questionServicePrice.toFixed(2)}`;
      }
    },err=>console.warn("QUESTION PRICE LISTENER ERROR:",err));
  }
}
function showAskFlow(a){openQuestionService();}
$("submitQuestionBtn")?.addEventListener("click",async()=>{
 const name=$("birthName").value.trim();
 const text=$("questionText").value.trim();
 if(!currentUser){message("askMsg",'<span class="error">Please login before asking.</span>');return;}
 if(!name){message("askMsg",'<span class="error">Please enter the person\'s name.</span>');$("birthName").focus();return;}
 if(!$("birthDate").value||!$("birthTime").value||!$("birthPlace").value.trim()){message("askMsg",'<span class="error">Please complete all birth details.</span>');return;}
 if(!text){message("askMsg",'<span class="error">Please enter your question.</span>');return;}
 const amount=Number(questionServicePrice||0);
 if(!Number.isFinite(amount)||amount<1){message("askMsg",'<span class="error">Invalid question price.</span>');return;}
 const btn=$("submitQuestionBtn");btn.disabled=true;btn.textContent="CREATING PAYMENT...";
 try{
  // PAYMENT COMPATIBILITY FIX:
  // Create a non-empty Firestore document ID in the browser before calling Render.
  // This keeps the flow compatible with both the new Render backend and any
  // currently-running older backend that still requires questionId.
  // IMPORTANT: birth date/time are stored as the user's entered wall-clock values
  // and explicitly tagged as Asia/Kolkata; they are NOT converted through UTC.
   const makeQuestionId=()=>{try{return crypto.randomUUID().replace(/-/g,"").slice(0,20);}catch(e){return "q_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,12);}};
   const birthDate=$("birthDate").value;
   const birthTime=$("birthTime").value;
   const birthPlace=$("birthPlace").value.trim();
   const birthGender=$("birthGender").value;
   const payload={customerName:name,question:text,amount,birthDetails:{name,birthDate,birthTime,birthPlace,birthGender,timezone:"Asia/Kolkata",utcOffsetMinutes:330},serviceName:"Public Astrology Question",customerEmail:currentUser.email||""};
  const orderRes=await withTimeout(renderApi("/create-order",{method:"POST",body:JSON.stringify(payload)}),30000);
  if(orderRes?.questionId) pendingQuestionId=String(orderRes.questionId).trim();
  const {orderId,keyId,amount:paise,currency}=orderRes||{};
  if(!pendingQuestionId||!orderId||!keyId){throw new Error("Payment order was not created correctly. Please retry.");}
  btn.textContent="OPENING RAZORPAY...";
  const options={
   key:keyId,amount:paise,currency:currency||"INR",name:"SMV ASTRO SERVICES",
   description:"Public astrology question",order_id:orderId,
   prefill:{email:currentUser.email||""},
   notes:{questionId:pendingQuestionId},
   theme:{color:"#6b21a8"},
   handler:async function(response){
    try{
     message("askMsg",'<span class="small">Verifying payment securely...</span>');
     const vr=await withTimeout(renderApi("/verify-payment",{method:"POST",body:JSON.stringify({
      questionId:pendingQuestionId,razorpay_order_id:response.razorpay_order_id,
      razorpay_payment_id:response.razorpay_payment_id,razorpay_signature:response.razorpay_signature
     })}),30000);
     if(vr?.verified){
      const customerPay=vr.customerPaymentId||'Pending';
      const astroPay=null;
      message("askMsg",'<span class="success"><b>Payment verified successfully.</b></span>');
      btn.disabled=false;btn.textContent="PAID ✓";
      const successPanel=$("paymentSuccessPanel"), successDetails=$("paymentSuccessDetails");
      if(successDetails) successDetails.innerHTML='<b>Question ID:</b> '+escapeHtml(pendingQuestionId)+'<br><b>Payment ID:</b> '+escapeHtml(customerPay)+'<br><b>Status:</b> Waiting for Admin question approval';
      if(successPanel) show("paymentSuccessPanel");
      pendingQuestionId="";
      const continueBtn=$("continueAfterPayment");
      if(continueBtn) continueBtn.onclick=async()=>{ hide("paymentSuccessPanel"); hide("ask-flow"); show("dashboard"); await loadDashboard(); go("dashboard"); };
     }else{throw new Error("Payment verification failed.");}
    }catch(err){const detail=err?.message||String(err)||"Payment verification failed.";message("askMsg",'<span class="error">Payment received, but verification failed.<br><small>'+escapeHtml(detail)+'</small><br>Please retry verification.</span>');btn.disabled=false;btn.textContent="RETRY VERIFICATION";}
   },
   modal:{ondismiss:function(){message("askMsg",'<span class="small">Payment window closed. Your question is still awaiting payment. You can retry.</span>');btn.disabled=false;btn.textContent="RETRY PAYMENT";}}
  };
  const rzp=new Razorpay(options);
  rzp.on("payment.failed",function(resp){message("askMsg",'<span class="error">Payment failed: '+escapeHtml(resp.error?.description||"Please try again.")+'</span>');btn.disabled=false;btn.textContent="RETRY PAYMENT";});
  rzp.open();
 }catch(e){
   const detail=e?.message||e?.details||e?.error?.message||String(e);
   const code=e?.code?` [${escapeHtml(String(e.code))}]`:"";
   console.error("SMV ASTRO payment error",e);
   message("askMsg",'<span class="error"><b>Payment could not be started.</b>'+code+'<br>'+escapeHtml(detail)+'</span>');
   btn.disabled=false;btn.textContent="RETRY PAYMENT";
 }
});

// ---------- Astrologer registration ----------
async function compressPhoto(file){
  if(!file) throw new Error("Profile photo is required.");
  return new Promise((resolve,reject)=>{
    const img=new Image(), reader=new FileReader();
    reader.onload=()=>{img.onload=()=>{const max=320, scale=Math.min(1,max/Math.max(img.width,img.height)); const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(img.width*scale)); c.height=Math.max(1,Math.round(img.height*scale)); c.getContext('2d').drawImage(img,0,0,c.width,c.height); resolve(c.toDataURL('image/jpeg',0.78));}; img.onerror=()=>reject(new Error("Could not read profile photo.")); img.src=reader.result;};
    reader.onerror=()=>reject(new Error("Could not read profile photo.")); reader.readAsDataURL(file);
  });
}
$("astroRegistrationForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const form=e.target,btn=form.querySelector('button[type="submit"]');
 const name=$("arName").value.trim(),mobile=$("arMobile").value.trim(),email=$("arEmail").value.trim(),password=$("arPassword").value,specialization=$("arSpecialization").value.trim(),experience=Number($("arExperience").value||0),bio=$("arBio").value.trim(),bankName=$("arBankName").value.trim(),accountName=$("arAccountName").value.trim(),accountNumber=$("arAccountNumber").value.trim(),ifsc=$("arIfsc").value.trim(),upi=$("arUpi").value.trim(),photoFile=$("arPhoto").files[0];
 if(!name||!mobile||!email||password.length<6||!specialization||experience<0||!bio||!bankName||!accountName||!accountNumber||!ifsc||!photoFile){message("astroRegMsg",'<span class="error">Please complete all required fields.</span>');return;}
 btn.disabled=true;btn.textContent="CREATING ACCOUNT...";message("astroRegMsg",'<span class="small">Creating your account...</span>');
 try{
  const photoData=await compressPhoto(photoFile);
  const cred=await withTimeout(createUserWithEmailAndPassword(auth,email,password));const uid=cred.user.uid;
  const profileResponse=await renderApi("/register-astrologer-profile",{
    method:"POST",
    body:JSON.stringify({name,mobile,specialization,experience,bio,bankName,accountName,accountNumber,ifsc,upi,photoData})
  });
  if(!profileResponse?.ok) throw new Error(profileResponse?.error||"Astrologer profile setup failed.");
  try{await withTimeout(sendEmailVerification(cred.user));}catch(ve){}
  btn.textContent="SAVING PROFILE...";
  form.reset();btn.disabled=false;btn.textContent="SUBMITTED ✓";await signOut(auth);currentUser=null;selectedAstro=null;hide("astro-register-form");hide("register-flow");hide("astro-flow");window.scrollTo({top:0,behavior:"smooth"});openModal('<h2>Registration Complete ✓</h2><p class="success"><b>Your astrologer application has been submitted successfully.</b></p><p><b>Your Astrologer ID: '+escapeHtml(profileResponse.publicId||'')+'</b></p><p>Keep this ID safe for future Astrologer ID login.</p><p>Your verification email has been sent.</p><p><b>Waiting for Admin Approval.</b></p><button class="btn gray" id="astroRegistrationClose">Close</button>');$("astroRegistrationClose").onclick=closeModal;
 }catch(err){let text=err?.message||String(err);if(err?.code==="auth/email-already-in-use")text="This email is already registered. Please use Login instead.";else if(err?.code==="auth/operation-not-allowed")text="Email/Password registration is disabled in Firebase Authentication.";else if(err?.code==="auth/network-request-failed")text="Firebase network connection failed. Check your internet connection.";else if(err?.code==="permission-denied")text="Firestore permission denied. Check Firestore Rules.";message("astroRegMsg",'<span class="error"><b>Registration failed:</b> '+escapeHtml(text)+'</span>');btn.disabled=false;btn.textContent="SUBMIT REGISTRATION";}
});
// ---------- Dashboard / admin / session ----------
const SESSION_IDLE_MS = 30 * 60 * 1000;
const SESSION_TOUCH_MS = 30 * 1000;
let idleTimer=null, lastActivity=Date.now(), intentionalLogout=false, lastAuthUid=null;
function touchSession(){ if(!currentUser) return; lastActivity=Date.now(); sessionStorage.setItem('smv_last_activity',String(lastActivity)); }
function clearIdleTimer(){ if(idleTimer){clearTimeout(idleTimer);idleTimer=null;} }
function armIdleTimer(){ clearIdleTimer(); if(!currentUser) return; const tick=()=>{ if(!currentUser)return; const idle=Date.now()-lastActivity; if(idle>=SESSION_IDLE_MS){ logoutToHome('Your session expired after 30 minutes of inactivity.'); return;} idleTimer=setTimeout(tick, Math.min(SESSION_IDLE_MS-idle,60000)); }; idleTimer=setTimeout(tick,60000); }
['click','touchstart','keydown','scroll','pointerdown'].forEach(ev=>window.addEventListener(ev,()=>{ if(currentUser && Date.now()-lastActivity>SESSION_TOUCH_MS) touchSession(); },{passive:true}));
window.addEventListener('pageshow',()=>{ if(currentUser){ touchSession(); armIdleTimer(); } });
async function logoutToHome(reason=''){
  intentionalLogout=true; clearIdleTimer(); sessionStorage.removeItem('smv_last_activity');
  currentUser=null; selectedAstro=null;
  try{await signOut(auth);}catch(e){console.warn("Logout failed",e);}
  hide('dashboard'); hide('admin'); hide('dashLink'); hide('adminLink');
  hide('ask-flow'); hide('register-flow'); hide('astro-register-form'); hide('astro-flow'); hide('appointment'); hide('contact');
  $('authBtn').textContent='Login'; closeModal(); window.scrollTo({top:0,behavior:'smooth'});
  if(reason) alert(reason);
  setTimeout(()=>{intentionalLogout=false;},800);
}

async function renderNotifications(targetId){
  const box=$(targetId); if(!box||!currentUser)return;
  try{
    const snap=await withTimeout(getDocs(query(collection(db,'smv_notifications'),where('userId','==',currentUser.uid))));
    const docs=snap.docs.slice().sort((a,b)=>String(b.data().createdAt?.seconds||0).localeCompare(String(a.data().createdAt?.seconds||0))).slice(0,12);
    box.innerHTML=docs.length?docs.map(d=>{const n=d.data();return `<div style="padding:9px 0;border-bottom:1px solid #eee"><b>${escapeHtml(n.title||'Notification')}</b><div class="small">${escapeHtml(n.message||'')}</div></div>`}).join(''):'<div class="empty">No notifications.</div>';
  }catch(e){box.innerHTML='<div class="empty">Notifications unavailable.</div>';}
}
async function loadDashboard(){
 const box=$('dashboardContent'); if(!currentUser){box.innerHTML='<div class="card">Please login to continue.</div>';return;}
 try{
  const u=await withTimeout(getDoc(doc(db,'smv_users',currentUser.uid))), data=u.exists()?u.data():{};
   let role=String(data.role||'').toLowerCase();
   let preloadedAstro={};
   if(role!=='astrologer'){try{const a0=await withTimeout(getDoc(doc(db,'smv_astrologers',currentUser.uid)),10000);if(a0.exists()){preloadedAstro=a0.data()||{};role='astrologer';}}catch(_e){}}
   $('dashboardTitle').textContent=role==='astrologer'?'Astrologer Dashboard':'Customer Dashboard';
   if(role==='astrologer'){
   let ad=preloadedAstro||{};
   const userStatus=String(data.status||ad.status||'pending').toLowerCase();
   if(['active','approved'].includes(userStatus) && !Object.keys(ad).length){
     try{const a=await withTimeout(getDoc(doc(db,'smv_astrologers',currentUser.uid)),10000);ad=a.exists()?a.data():{};}catch(profileErr){console.warn('Astrologer profile load skipped:',profileErr);ad={};}
   }
   const astroStatus=String(ad.status||data.status||'pending').toLowerCase();
   if(!['active','approved'].includes(astroStatus)){
    const astroId=data.publicId||ad.publicId||'';
    box.innerHTML=`<div class="card" style="max-width:900px;margin:0 auto">
      <h2>Astrologer Dashboard</h2>
      <div class="card" style="border:2px solid var(--gold);background:#fffaf0">
       <h3 style="margin-top:0">⏳ Waiting for Admin Approval</h3>
       <p>Your astrologer account and professional profile have been registered successfully.</p>
       ${astroId?`<p><b>Astrologer ID:</b> ${escapeHtml(astroId)}</p>`:''}
       <p><b>Application Status:</b> Pending Admin Approval</p>
       <p class="small">You can login and view this status now. Customer questions, answering, earnings and withdrawals will become available after Admin approval.</p>
      </div>
      <div class="action-row"><button class="btn gray" id="astroRefreshApproval">REFRESH STATUS</button><button class="btn" id="astroLogoutPending">LOGOUT</button></div>
     </div>`;
    $('astroRefreshApproval')?.addEventListener('click',()=>loadDashboard());
    $('astroLogoutPending')?.addEventListener('click',()=>logoutToHome());
    return;
   }
   let inboxSnap={docs:[]}, qs={docs:[]};
   try{
     inboxSnap=await withTimeout(getDocs(query(collection(db,'smv_questions'),where('astrologerId','==',currentUser.uid))),12000);
   }catch(e){ console.warn('Astrologer available-questions query skipped:',e); }
   const availableQuestions=inboxSnap.docs.filter(d=>{const q=d.data()||{};return q.status==='paid'&&q.astrologerId===currentUser.uid&&!!q.adminQuestionApprovedAt&&['assigned_to_astrologer','available_to_astrologers','claimed_by_astrologer'].includes(q.allocationStatus);}).map(d=>({id:d.id,...d.data()}));
   try{
     qs=await withTimeout(getDocs(query(collection(db,'smv_questions'),where('astrologerId','==',currentUser.uid))),12000);
   }catch(e){ console.warn('Astrologer own-questions query skipped:',e); }
   const active=qs.docs.filter(d=>['paid','admin_review','answer_draft','revision_required'].includes(d.data().status));
   const approved=ad.status==='approved';
  const earningsDocs = qs.docs.filter(d => {

  const q = d.data();

  return (
    q.astrologerId === currentUser.uid &&
    q.status === 'answered' &&
    q.commissionStatus === 'credited'
  );

});

let totalEarnings = 0;

const ledger = earningsDocs.map(d => {

  const q = d.data();

  const commission = Number(
    q.astrologerCommissionAmount ||
    q.commissionAmount ||
    0
  );

  totalEarnings += commission;

  return {
    id: d.id,
    question: q.question || 'Consultation',
    commission: commission,
    date: q.commissionCreditedAt ||
          q.answerApprovedAt ||
          q.adminAnswerApprovedAt ||
          null
  };

});


let withdrawalSnap={docs:[]};
try{
 withdrawalSnap = await withTimeout(
  getDocs(
    query(
      collection(db,'smv_withdrawals'),
      where('astrologerId','==',currentUser.uid)
    )
  ),
  12000
 );
}catch(e){ console.warn('Astrologer withdrawals query skipped:',e); }


let reservedWithdrawals = 0;

withdrawalSnap.docs.forEach(d => {

  const w = d.data();

  if(
    w.status === 'pending' ||
    w.status === 'processing' ||
    w.status === 'paid'
  ){

    reservedWithdrawals += Number(
      w.amount || 0
    );

  }

});


const availableToWithdraw =
  Math.max(
    0,
    totalEarnings - reservedWithdrawals
  );


const ep = {

  totalEarnings:
    totalEarnings,

  availableToWithdraw:
    availableToWithdraw,

  minimumWithdrawal:
    300,

  ledger:
    ledger

};
   box.innerHTML=`<div class="grid">
    <div class="card">${ad.photoData?`<img src="${ad.photoData}" style="width:88px;height:88px;border-radius:50%;object-fit:cover">`:''}<span class="badge">ASTROLOGER</span><h3>${escapeHtml(data.name||'')}</h3>
    <p>Status: <b>${escapeHtml(ad.status||'pending')}</b></p><p><b>${escapeHtml(ad.expertise||ad.specialization||'Astrology')}</b></p>
    <p>${escapeHtml(ad.experience||0)} years experience</p><p>${escapeHtml(ad.bio||ad.about||'')}</p>
    <p class="small">Your customer/payment contact details remain private.</p>
    <div class="action-row"><button class="btn gray" id="changePayoutBtn">Change Payment Method</button></div></div>
    <div class="card"><h3>My Questions</h3><p><b>${active.length}</b> active question(s)</p><p>Approved profile: <b>${
  ad.status === 'approved'
    ? 'Approved'
    : ad.status === 'rejected'
      ? 'Rejected'
      : 'Waiting for Admin'
}</b></p>
${ad.status === 'rejected' && ad.rejectionReason
  ? `<p class="error"><b>Rejection Reason:</b> ${escapeHtml(ad.rejectionReason)}</p>`
  : ''}</div>
    <div class="card"><h3>Total Earnings</h3><p style="font-size:28px"><b>₹${Number(ep.totalEarnings||0).toFixed(2)}</b></p><p>Available to Withdraw: <b>₹${Number(ep.availableToWithdraw||0).toFixed(2)}</b></p><p class="small">Minimum withdrawal: ₹${Number(ep.minimumWithdrawal||300).toFixed(2)}</p>${Number(ep.availableToWithdraw||0)>=Number(ep.minimumWithdrawal||300)?'<p class="success"><b>You can withdraw</b></p><button class="btn" id="withdrawBtn">WITHDRAW</button>':'<p class="small">Reach ₹300 to request a withdrawal.</p>'}</div>
   </div>
   <div class="card" style="margin-top:16px"><h3>Public Question Inbox</h3><p class="small">All paid public questions are shown here. The customer price and your current commission are shown automatically.</p>${!approved?'<div class="empty">Your astrologer profile must be approved by Admin before you can claim questions.</div>':availableQuestions.length?availableQuestions.slice(0,50).map(q=>`<div class="card" style="margin:10px 0"><b>${escapeHtml(q.question||'Question')}</b><div class="small">Birth details: ${escapeHtml(q.birthName||q.birthDetails?.name||'')} · ${escapeHtml(q.birthDate||q.birthDetails?.birthDate||'')} · ${escapeHtml(q.birthTime||q.birthDetails?.birthTime||'')} · ${escapeHtml(q.birthPlace||q.birthDetails?.birthPlace||'')} · ${escapeHtml(q.birthGender||q.birthDetails?.birthGender||'')}</div><div class="small"><b>Customer paid: ₹${Number(q.amount||0).toFixed(2)}</b> · <b>Your commission: ₹${Number(q.astrologerCommissionAmount||0).toFixed(2)}</b> (${Number(q.commissionPercent||q.commissionRate||0)}%)</div><button class="btn" data-claim-question="${q.id}">CLAIM & ANSWER</button></div>`).join(''):'<div class="empty">No paid public questions are available right now.</div>'}</div>
<div class="card" style="margin-top:16px"><h3>Questions & Answers</h3>
   ${qs.empty?'<div class="empty">No questions yet.</div>':qs.docs.slice(0,20).map(d=>{const q=d.data(); const canAnswer=
  approved &&
  (q.status==='paid' || q.status==='admin_approved') &&
  q.astrologerId===currentUser.uid; const commission=q.astrologerCommissionAmount!=null?`<div><b>Your Commission: ₹${Number(q.astrologerCommissionAmount).toFixed(2)}</b></div>`:''; const minWords=Number(q.answerMinWords||150); return `<div class="card" style="margin:10px 0"><b>${escapeHtml(q.question||'Question')}</b><div class="small">Status: ${escapeHtml(q.status||'')} · Minimum answer: ${minWords} words</div>${commission}${q.answer?`<p>${escapeHtml(q.answer)}</p>`:''}${canAnswer?`<textarea id="ans_${d.id}" placeholder="Write at least ${minWords} words...">${escapeHtml(q.answer||'')}</textarea><div class="small" id="count_${d.id}">0 / ${minWords} words</div><button class="btn" data-answer="${d.id}" disabled>Submit for Admin Approval</button>`:''}${q.status==='revision_required'?`<textarea id="ans_${d.id}" placeholder="Revise with at least ${minWords} words...">${escapeHtml(q.answer||'')}</textarea><div class="small" id="count_${d.id}">0 / ${minWords} words</div><button class="btn" data-answer="${d.id}" disabled>Resubmit for Admin Approval</button>`:''}</div>`}).join('')}</div>
   <div class="card" style="margin-top:16px">
  <h3>Earnings Ledger</h3>

  <p class="small">
    Commission is credited only after Admin approves the submitted answer.
  </p>

  ${
    ep.ledger && ep.ledger.length
      ? ep.ledger.map(x => {

          const dateText =
            x.date?.toDate
              ? x.date.toDate().toLocaleString()
              : 'Recently';

          return `
            <div style="padding:10px 0;border-bottom:1px solid #eee">

              <b>
                Consultation #${escapeHtml(x.id || '')}
              </b>

              <div class="small">
                ${escapeHtml(x.question || 'Consultation')}
              </div>

              <div class="small">
                Commission:
                <b>
                  ₹${Number(
                    x.commission || 0
                  ).toFixed(2)}
                </b>
                ·
                <span class="success">
                  Credited
                </span>
              </div>

              <div class="small">
                Credited:
                ${escapeHtml(dateText)}
              </div>

            </div>
          `;

        }).join('')

      : '<div class="empty">No credited consultations yet.</div>'
  }

</div>
   <div class="card" style="margin-top:16px"><h3>Payment Method</h3><p class="small">Your bank/UPI details are private. Full details are not displayed again.</p><button class="btn gray" id="changePayoutBtn2">Change Payment Method</button></div>`;
  document.querySelectorAll('[data-claim-question]').forEach(b=>b.onclick=async()=>{
  const questionId=b.dataset.claimQuestion;

  if(!currentUser){
    alert('Please login again.');
    return;
  }

  b.disabled=true;
  b.textContent='CLAIMING...';

  try{
    const astroSnap=await withTimeout(
      getDoc(doc(db,'smv_astrologers',currentUser.uid)),
      15000
    );

    if(!astroSnap.exists()){
      throw new Error('Astrologer profile not found.');
    }

    const astro=astroSnap.data();

    if(astro.status!=='approved'){
      throw new Error('Your astrologer profile is not approved by Admin.');
    }

    await withTimeout(
      runTransaction(db,async(transaction)=>{

        const questionRef=doc(db,'smv_questions',questionId);
        const questionSnap=await transaction.get(questionRef);

        if(!questionSnap.exists()){
          throw new Error('Question not found.');
        }

        const q=questionSnap.data();

        if(q.status!=='paid'){
          throw new Error('This question is no longer available.');
        }

        if(q.astrologerId && q.astrologerId!==currentUser.uid){
          throw new Error('This question is allocated to another astrologer.');
        }
        if(q.astrologerId!==currentUser.uid){
          throw new Error('This question is not allocated to your account.');
        }

        if(!q.adminQuestionApprovedAt){
          throw new Error('This question is still waiting for Admin approval.');
        }

        const commissionPercent=Number(
          q.commissionPercent ||
          q.commissionRate ||
          20
        );

        const commissionAmount=
          Math.round(Number(q.amount||0)*commissionPercent)/100;

        transaction.update(questionRef,{
          astrologerId:currentUser.uid,
          astrologerName:q.astrologerName||astro.name||currentUser.displayName||'Astrologer',
          status:'admin_approved',
          allocationStatus:'claimed_by_astrologer',
          claimedAt:serverTimestamp(),
          claimedBy:currentUser.uid,
          astrologerCommissionAmount:commissionAmount,
          commissionPercent:commissionPercent,
          commissionRate:commissionPercent,
          commissionStatus:'pending_admin_approval'
        });
      }),
      20000
    );

    alert('Question claimed successfully. You can now write your answer.');
    await loadDashboard();

  }catch(e){
    console.error('Question claim error:',e);
    alert(e.message||String(e));
    b.disabled=false;
    b.textContent='CLAIM & ANSWER';
  }
});
   document.querySelectorAll('[data-answer]').forEach(b => {

  const questionId = b.dataset.answer;
  const textarea = $('ans_' + questionId);

  b.onclick = async () => {

    const answer = textarea?.value.trim();

    if (!answer) {
      alert('Please write an answer.');
      return;
    }

    b.disabled = true;
    b.textContent = 'SUBMITTING...';

    try {

      const questionRef =
        doc(db, 'smv_questions', questionId);

      const snap = await withTimeout(
        getDoc(questionRef),
        15000
      );

      if (!snap.exists()) {
        throw new Error('Question not found.');
      }

      const q = snap.data();

      if (!currentUser) {
        throw new Error('Please login again.');
      }

      if (q.astrologerId !== currentUser.uid) {
        throw new Error(
          'This question is not assigned to you.'
        );
      }

      if (
        q.status !== 'admin_approved' &&
        q.status !== 'revision_required'
      ) {
        throw new Error(
          'This question is not ready for submission.'
        );
      }

      const minWords =
        Number(q.answerMinWords || 150);

      const wordCount =
        answer
          .split(/\s+/)
          .filter(Boolean)
          .length;

      if (wordCount < minWords) {
        throw new Error(
          `Please write at least ${minWords} words.`
        );
      }

      const commissionPercent =
        Number(
          q.commissionPercent ||
          q.commissionRate ||
          20
        );

      const commissionAmount =
        Math.round(
          Number(q.amount || 0) *
          commissionPercent
        ) / 100;

      await withTimeout(
        updateDoc(questionRef, {

          answer: answer,

          answerWordCount: wordCount,

          answerSubmittedAt:
            serverTimestamp(),

          astrologerAnswerStatus:
            'submitted',

          status: 'processing',

          astrologerCommissionAmount:
            commissionAmount,

          commissionPercent:
            commissionPercent,

          commissionRate:
            commissionPercent,

          commissionStatus:
            'pending_admin_approval'

        }),
        15000
      );

      alert(
        'Answer submitted successfully. Waiting for Admin approval.'
      );

      await loadDashboard();

    } catch (e) {

      console.error(
        'Answer submission error:',
        e
      );

      alert(
        e.message || String(e)
      );

      b.disabled = false;
      b.textContent =
        'Submit for Admin Approval';
    }

  };

});
   document.querySelectorAll('[id^="ans_"]').forEach(t=>{
     const id=t.id.slice(4), btn=document.querySelector(`[data-answer="${id}"]`), counter=$('count_'+id), q=qs.docs.find(x=>x.id===id)?.data()||{}, min=Number(q.answerMinWords||150);
     const updateCount=()=>{const n=t.value.trim()?t.value.trim().split(/\s+/).filter(Boolean).length:0;if(counter)counter.textContent=`${n} / ${min} words`;if(btn)btn.disabled=n<min;};
     t.addEventListener('input',updateCount);updateCount();
   });
  if($('withdrawBtn')) $('withdrawBtn').onclick = async () => {

  if(!currentUser){
    alert('Please login again.');
    return;
  }

  try {

    const questionSnap = await withTimeout(
      getDocs(
        query(
          collection(db,'smv_questions'),
          where('astrologerId','==',currentUser.uid)
        )
      ),
      15000
    );

    let totalEarnings = 0;

    questionSnap.docs.forEach(d => {

      const q = d.data();

      if(
        q.status === 'answered' &&
        q.commissionStatus === 'credited'
      ){

        totalEarnings += Number(
          q.astrologerCommissionAmount ||
          q.commissionAmount ||
          0
        );

      }

    });

    const withdrawalSnap = await withTimeout(
      getDocs(
        query(
          collection(db,'smv_withdrawals'),
          where('astrologerId','==',currentUser.uid)
        )
      ),
      15000
    );

    let reservedWithdrawals = 0;

    withdrawalSnap.docs.forEach(d => {

      const w = d.data();

      if(
        w.status === 'pending' ||
        w.status === 'processing' ||
        w.status === 'paid'
      ){

        reservedWithdrawals += Number(
          w.amount || 0
        );

      }

    });

    const available = Math.max(
      0,
      totalEarnings - reservedWithdrawals
    );

    const min = 300;

    openModal(`
      <h2>Withdraw Earnings</h2>

      <p>
        Total Earnings:
        <b>₹${totalEarnings.toFixed(2)}</b>
      </p>

      <p>
        Available:
        <b>₹${available.toFixed(2)}</b>
      </p>

      <p class="small">
        Minimum withdrawal:
        ₹${min.toFixed(2)}.
        Payment will be arranged by Admin within
        24–48 hours.
      </p>

      <div id="withdrawPaymentIds" class="small" style="margin:10px 0"><b>Astrologer Payment ID:</b> Loading...</div>

      <input
        id="withdrawAmount"
        type="number"
        min="${min}"
        max="${available}"
        step="0.01"
        value="${available.toFixed(2)}"
        placeholder="Amount"
      >

      <button
        class="btn"
        id="confirmWithdraw"
      >
        REQUEST WITHDRAWAL
      </button>

      <div
        id="withdrawMsg"
        class="small"
        style="margin-top:8px"
      ></div>
    `);

    try {
      const paymentSnap = await withTimeout(getDocs(query(collection(db,'smv_questions'),where('astrologerId','==',currentUser.uid))),15000);
      const ids = paymentSnap.docs.map(d=>d.data()?.astrologerPaymentId).filter(Boolean);
      const uniqueIds = [...new Set(ids)];
      $('withdrawPaymentIds').innerHTML = uniqueIds.length
        ? '<b>Astrologer Payment ID:</b> ' + uniqueIds.map(escapeHtml).join(', ')
        : '<b>Astrologer Payment ID:</b> Will appear after a credited consultation.';
    } catch(e) {
      $('withdrawPaymentIds').innerHTML = '<b>Astrologer Payment ID:</b> Unable to load payment ID right now.';
    }

    $('confirmWithdraw').onclick = async () => {

      const amount =
        Number($('withdrawAmount').value);

      const btn2 =
        $('confirmWithdraw');

      if(!Number.isFinite(amount)){
        alert('Enter a valid amount.');
        return;
      }

      if(amount < min){
        alert(
          `Minimum withdrawal is ₹${min}.`
        );
        return;
      }

      if(amount > available){
        alert(
          'Withdrawal amount cannot exceed available earnings.'
        );
        return;
      }

      btn2.disabled = true;
      btn2.textContent = 'REQUESTING...';

      try {

        await withTimeout(
          addDoc(
            collection(db,'smv_withdrawals'),
            {
              astrologerId:
                currentUser.uid,

              astrologerName:
                currentUser.displayName ||
                'Astrologer',

              amount:
                Math.round(amount * 100) / 100,

              status:
                'pending',

              createdAt:
                serverTimestamp(),

              requestedAt:
                serverTimestamp()
            }
          ),
          15000
        );

        $('withdrawMsg').innerHTML =
          '<span class="success"><b>Withdrawal request received.</b><br>Admin will arrange payment within 24–48 hours.</span>';

        setTimeout(() => {
          closeModal();
          loadDashboard();
        },1000);

      } catch(e) {

        console.error(
          'Withdrawal request error:',
          e
        );

        $('withdrawMsg').innerHTML =
          '<span class="error">' +
          escapeHtml(
            e.message || String(e)
          ) +
          '</span>';

        btn2.disabled = false;
        btn2.textContent =
          'REQUEST WITHDRAWAL';
      }

    };

  } catch(e) {

    console.error(
      'Earnings calculation error:',
      e
    );

    alert(
      e.message || String(e)
    );

  }

};
   const change=()=>openPayoutChange();
   if($('changePayoutBtn')) $('changePayoutBtn').onclick=change;
   if($('changePayoutBtn2')) $('changePayoutBtn2').onclick=change;
  } else {
   const qs=await withTimeout(getDocs(query(collection(db,'smv_questions'),where('customerId','==',currentUser.uid))));
   const paid=qs.docs.filter(d=>d.data().status!=='awaiting_payment').length;
   box.innerHTML=`<div class="grid"><div class="card"><span class="badge">CUSTOMER</span><h3>Welcome, ${escapeHtml(data.name||currentUser.email||'Customer')}</h3><p>Email verification: <b>${currentUser.emailVerified?'Verified':'Pending from registration'}</b></p><p>Mobile: Private</p></div><div class="card"><h3>My Questions</h3><p>Total: <b>${qs.size}</b></p><p>Paid/processed: <b>${paid}</b></p></div></div>
   <div class="card" style="margin-top:16px"><h3>My Consultations</h3>${qs.empty?'<div class="empty">No consultations yet. Start a private consultation to choose an astrologer.</div>':qs.docs.slice(0,20).map(d=>{const q=d.data(); const reviewButton=q.status==='answered'&&!q.reviewed?`<button class="btn" data-review="${d.id}" data-astro="${q.astrologerId}">Rate & Review</button>`:''; const statusMap={awaiting_payment:'Payment Pending',payment_failed:'Payment Failed',paid:'Waiting for Answers',admin_approved:'Waiting for Answers',processing:'Processing',answer_draft:'Processing',admin_review:'Processing',revision_required:'Revision Required',answered:'Answer Ready',admin_rejected:'Question Rejected'}; const astroName=q.astrologerName||'Selected Astrologer'; const statusText=q.status==='paid'||q.status==='admin_approved'?`Waiting for Answers — ${astroName}`:q.status==='processing'||q.status==='answer_draft'||q.status==='admin_review'?`Processing — ${astroName} answer received and under Admin review`:q.status==='answered'?'Answer Ready':(statusMap[q.status]||q.status||'Processing'); const steps=[['Payment Received',['paid','admin_approved','processing','answer_draft','admin_review','answered'].includes(q.status)],['Question Approved',['admin_approved','processing','answer_draft','admin_review','answered'].includes(q.status)],['Astrologer Answer Submitted',['processing','answer_draft','admin_review','answered'].includes(q.status)],['Admin Approval',['answered'].includes(q.status)],['Answer Ready',['answered'].includes(q.status)]]; const timeline=`<div class="timeline">${steps.map(x=>`<div class="timeline-step ${x[1]?'done':''}"><span>${x[1]?'✓':'○'}</span>${x[0]}</div>`).join('')}</div>`; const paymentLine=q.customerPaymentId?`<div class="small"><b>Customer Payment ID:</b> ${escapeHtml(q.customerPaymentId)}</div>`:''; return `<div style="padding:14px 0;border-bottom:1px solid #eee"><b>${escapeHtml(q.question||'Question')}</b><div class="small">Astrologer: <b>${escapeHtml(astroName)}</b> · Status: <b>${escapeHtml(statusText)}</b></div>${paymentLine}${timeline}${q.answer&&q.status==='answered'?`<div class="card" style="margin-top:10px"><b>Astrologer Answer</b><p style="white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${escapeHtml(q.answer)}</p></div>`:''}${reviewButton}</div>`}).join('')}</div>`;
   document.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>openReview(b.dataset.review,b.dataset.astro));
  }
  const note=document.createElement('div'); note.className='card'; note.style.marginTop='16px'; note.innerHTML='<h3>Notifications</h3><div id="userNotifications"><div class="small">Loading...</div></div>'; box.appendChild(note); await renderNotifications('userNotifications'); show('dashboard'); touchSession(); armIdleTimer();
 }catch(e){
   console.error('Dashboard load failed:',e);
   box.innerHTML='<div class="card error"><b>Dashboard could not be loaded.</b><p class="small">Your login session is active, but some dashboard data could not be read. The basic dashboard is being kept available.</p><button class="btn gray" id="dashboardRetry">RETRY</button></div>';
   $('dashboardRetry')?.addEventListener('click',()=>loadDashboard());
 }
}
function openPayoutChange(){
 openModal(`<h2>Change Payment Method</h2><p class="small">For security, your previous bank/UPI details are not displayed. Enter the new details.</p>
 <input id="pBank" placeholder="Bank Name"><input id="pAccountName" placeholder="Account Holder Name"><input id="pAccount" inputmode="numeric" placeholder="Account Number"><input id="pIfsc" placeholder="IFSC"><input id="pUpi" placeholder="UPI ID (optional)"><button class="btn" id="savePayout">Submit for Admin Review</button><div id="payoutMsg" class="small"></div>`);
}
function openReview(questionId, astroId) {
  openModal(`<h2>Rate your consultation</h2>
    <select id="reviewStars"><option value="5">★★★★★ — 5</option><option value="4">★★★★☆ — 4</option><option value="3">★★★☆☆ — 3</option><option value="2">★★☆☆☆ — 2</option><option value="1">★☆☆☆☆ — 1</option></select>
    <textarea id="reviewText" placeholder="Write your review"></textarea>
    <button class="btn" id="submitReview">Submit Review</button><div id="reviewMsg" class="small"></div>`);
  $('submitReview').onclick = async () => {
    const btn=$('submitReview'), msg=$('reviewMsg');
    try {
      if(!currentUser) throw new Error('Please login again.');
      if(!questionId||!astroId) throw new Error('Consultation information is missing. Please refresh and try again.');
      const rating=Number($('reviewStars').value), review=$('reviewText').value.trim();
      if(!Number.isInteger(rating)||rating<1||rating>5) throw new Error('Please select a rating from 1 to 5.');
      if(!review) throw new Error('Please write your review.');
      btn.disabled=true; btn.textContent='SUBMITTING...';
      const questionSnap=await withTimeout(getDoc(doc(db,'smv_questions',questionId)),15000);
      if(!questionSnap.exists()) throw new Error('Consultation not found.');
      const q=questionSnap.data()||{};
      if(q.customerId!==currentUser.uid) throw new Error('You are not allowed to review this consultation.');
      if(q.status!=='answered') throw new Error('You can review only after the answer has been approved.');
      if(q.astrologerId!==astroId) throw new Error('Astrologer information does not match.');
      const reviewId=`${questionId}_${currentUser.uid}`;
      await withTimeout(setDoc(doc(db,'smv_reviews',reviewId),{questionId,customerId:currentUser.uid,customerName:q.customerName||q.birthName||'Customer',astrologerId:astroId,astrologerName:q.astrologerName||'Astrologer',rating,review,verified:true,approved:false,status:'pending',createdAt:serverTimestamp()}),15000);
      try { await withTimeout(updateDoc(doc(db,'smv_questions',questionId),{reviewed:true,reviewSubmittedAt:serverTimestamp()}),15000); }
      catch(markError){ console.warn('Review saved but review flag could not be updated:',markError); }
      msg.innerHTML='<span class="success"><b>Thank you!</b> Your review was submitted and is waiting for Admin approval.</span>';
      setTimeout(()=>{closeModal();loadDashboard();},700);
    } catch(e) {
      console.error('Review submission error:',e);
      const raw=String(e?.message||e);
      const friendly=/permission|insufficient permissions/i.test(raw)?'Review permission was denied by Firebase. Please publish the latest firestore.rules to the same smv-astro Firebase project.':raw;
      msg.innerHTML='<span class="error">'+escapeHtml(friendly)+'</span>'; btn.disabled=false; btn.textContent='Submit Review';
    }
  };
}
async function loadAdminPanel(){
 if(!currentUser || !(await isCurrentAdmin())){hide('admin');hide('adminLink');return;}
 hidePrimarySections('admin');
 show('admin');
 setTimeout(()=>window.__smvRefreshAdminSections?.(),0);
 try{
  const adminData=await withTimeout(renderApi('/admin-data',{method:'GET'}),20000);
  if(!adminData?.success) throw new Error(adminData?.error||'Admin data could not be loaded.');
  const toDocs=(arr)=>({docs:(arr||[]).map(x=>({id:x.id,data:()=>x})),size:(arr||[]).length,empty:!(arr||[]).length});
  const users=toDocs(adminData.users), astros=toDocs(adminData.astrologers), questions=toDocs(adminData.questions);
  const adminReadErrors=adminData.errors||{};
  const readErrorText=Object.entries(adminReadErrors).filter(([,v])=>v).map(([k,v])=>k+': '+v).join(' | ');
  $('adminDataLoadMsg') && ($('adminDataLoadMsg').innerHTML=readErrorText?'<div class="empty error">Some Admin data could not be loaded: '+escapeHtml(readErrorText)+'</div>':'');
  const customers=(adminData.customers||[]).length, pendingDocs=astros.docs.filter(d=>d.data().status==='pending');
  const userMap=new Map(users.docs.map(d=>[d.id,d.data()]));
  $('adminSummary').innerHTML=`<div class="stat">Customers <b>${customers}</b></div><div class="stat">Astrologers <b>${astros.size}</b></div><div class="stat">Pending <b>${pendingDocs.length}</b></div><div class="stat">Questions <b>${questions.size}</b></div>`;
  let settings={astroPercent:20,adminPercent:80}; try{const ss=await getDoc(doc(db,'smv_settings','commission'));if(ss.exists())settings=ss.data();}catch(e){}
  let questionSettings={price:5}; try{const qps=await getDoc(doc(db,'smv_settings','question'));if(qps.exists())questionSettings=qps.data();}catch(e){}
  $('questionPrice').value=Number(questionSettings.price||5);
  $('saveQuestionPrice').onclick=async()=>{const price=Math.round(Number($('questionPrice').value)*100)/100;if(!Number.isFinite(price)||price<1){$('questionPriceMsg').innerHTML='<span class="error">Enter a valid price of at least ₹1.</span>';return;}const b=$('saveQuestionPrice');b.disabled=true;b.textContent='SAVING...';try{await setDoc(doc(db,'smv_settings','question'),{price,updatedAt:serverTimestamp(),updatedBy:currentUser.uid});questionServicePrice=price;if($('askRate'))$('askRate').innerHTML=`<b>₹${price.toFixed(2)} per Question</b>`;if($('publicQuestionPrice'))$('publicQuestionPrice').textContent=`₹${price.toFixed(2)}`;$('questionPriceMsg').innerHTML='<span class="success">Current public question price saved: ₹'+price.toFixed(2)+'</span>';}catch(e){$('questionPriceMsg').innerHTML='<span class="error">Unable to save price: '+escapeHtml(e.message||String(e))+'</span>';}finally{b.disabled=false;b.textContent='SAVE PRICE';}};
  $('astroCommission').value=settings.astroPercent??20;$('adminCommission').value=settings.adminPercent??80;
  $('saveCommission').onclick=async()=>{const a=Number($('astroCommission').value),ad=Number($('adminCommission').value);if(a<0||ad<0||Math.abs(a+ad-100)>0.001){$('commissionMsg').innerHTML='<span class="error">Astrologer % + Admin % must equal 100%.</span>';return;}await setDoc(doc(db,'smv_settings','commission'),{astroPercent:a,adminPercent:ad,updatedAt:serverTimestamp(),updatedBy:currentUser.uid});$('commissionMsg').innerHTML='<span class="success">Commission settings saved.</span>';};
  let answerSettings={minimumWords:150}; try{const aw=await getDoc(doc(db,'smv_settings','answer'));if(aw.exists())answerSettings=aw.data();}catch(e){}
  $('minimumAnswerWords').value=Number(answerSettings.minimumWords||150);
  $('saveAnswerWords').onclick=async()=>{const n=Math.floor(Number($('minimumAnswerWords').value));if(!Number.isFinite(n)||n<1||n>10000){$('answerWordsMsg').innerHTML='<span class="error">Enter a minimum between 1 and 10000 words.</span>';return;}await setDoc(doc(db,'smv_settings','answer'),{minimumWords:n,updatedAt:serverTimestamp(),updatedBy:currentUser.uid});$('answerWordsMsg').innerHTML='<span class="success">Minimum answer length saved: '+n+' words. It applies to new paid questions.</span>';};
  $('testRazorpayBtn').onclick=async()=>{const b=$('testRazorpayBtn');b.disabled=true;b.textContent='TESTING...';try{const r=await withTimeout(renderApi('/test-razorpay',{method:'GET'}),60000);$('razorpayTestMsg').innerHTML='<span class="success"><b>Razorpay connection OK.</b> '+escapeHtml(r?.message||'Render payment server and Razorpay API are working.')+'</span>';}catch(e){$('razorpayTestMsg').innerHTML='<span class="error"><b>Razorpay test failed:</b> '+escapeHtml(e.message||String(e))+'</span>';}b.disabled=false;b.textContent='TEST RAZORPAY CONNECTION';};

  const box=$('pendingAstros');
  box.innerHTML=pendingDocs.length?pendingDocs.map(d=>{const a=d.data();return `<div class="card" style="margin:10px 0">${a.photoData?`<img src="${a.photoData}" style="width:100px;height:100px;border-radius:50%;object-fit:cover">`:''}<h3>${escapeHtml(a.name||'Astrologer')}</h3><p><b>Email:</b> ${escapeHtml(userMap.get(d.id)?.email||'')}</p><p><b>Mobile:</b> ${escapeHtml(userMap.get(d.id)?.mobile||userMap.get(d.id)?.phone||'')}</p><p><b>Expertise:</b> ${escapeHtml(a.expertise||a.specialization||'')}</p><p><b>Experience:</b> ${escapeHtml(a.experience||0)} years</p><p><b>Bio:</b> ${escapeHtml(a.bio||a.about||'')}</p><div id="payout_${d.id}" class="small">Loading private payout details...</div><div class="action-row"><input id="price_${d.id}" type="number" min="1" placeholder="Consultation amount (Admin only)"><button class="btn" data-approve="${d.id}">APPROVE</button><button class="btn gray" data-reject="${d.id}">REJECT</button></div><input id="reject_${d.id}" placeholder="Rejection reason (required if rejecting)"></div>`}).join(''):'<div class="empty">No pending astrologer applications.</div>';
  for(const d of pendingDocs){try{const ps=await getDoc(doc(db,'smv_payouts',d.id));if(ps.exists()){const p=ps.data();$('payout_'+d.id).innerHTML=`<b>PRIVATE BANK/UPI:</b> Bank: ${escapeHtml(p.bankName||'')} · Holder: ${escapeHtml(p.accountName||'')} · Account: ${escapeHtml(p.accountNumber||'')} · IFSC: ${escapeHtml(p.ifsc||'')} · UPI: ${escapeHtml(p.upi||'')} · Status: ${escapeHtml(p.status||'')}`;}}catch(e){$('payout_'+d.id).textContent='Payout details unavailable.';}}
  box.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{const id=b.dataset.approve,price=Number($('price_'+id).value);if(!price||price<1){alert('Admin must set the consultation amount before approval. This amount is not shown publicly.');return;}await updateDoc(doc(db,'smv_astrologers',id),{status:'approved',pricePerQuestion:price,approvedAt:serverTimestamp(),approvedBy:currentUser.uid});await updateDoc(doc(db,'smv_users',id),{status:'active'});await setDoc(doc(db,'smv_notifications',id+'_approval_'+Date.now()),{userId:id,type:'approval',title:'Astrologer application approved',message:'Your profile has been approved by Admin.',createdAt:serverTimestamp(),read:false});loadAdminPanel();});
  box.querySelectorAll('[data-reject]').forEach(b=>b.onclick=async()=>{const id=b.dataset.reject,reason=$('reject_'+id).value.trim();if(!reason){alert('Enter rejection reason.');return;}await updateDoc(doc(db,'smv_astrologers',id),{status:'rejected',rejectionReason:reason,rejectedAt:serverTimestamp(),rejectedBy:currentUser.uid});await updateDoc(doc(db,'smv_users',id),{status:'rejected'});await setDoc(doc(db,'smv_notifications',id+'_reject_'+Date.now()),{userId:id,type:'rejection',title:'Astrologer application requires changes',message:reason,createdAt:serverTimestamp(),read:false});loadAdminPanel();});

  // Public Question Admin Control: keep every allocated question visible until it is answered.
  const questionApprovalBox=$('adminPendingQuestions');
  try{
    const pendingQuestions=questions.docs.filter(d=>{
      const q=d.data()||{};
      return q.status==='pending_admin_approval' || (q.status==='paid' && !q.adminQuestionApprovedAt);
    });
    const allocatedQuestions=questions.docs.filter(d=>{
      const q=d.data()||{};
      return q.adminQuestionApprovedAt && !['answered','question_rejected'].includes(q.status) &&
             (q.allocationStatus==='assigned_to_astrologer' || q.status==='paid' || q.status==='processing' || q.status==='admin_review');
    });
    const approvedAstros=astros.docs.filter(d=>d.data()?.status==='approved');

    const approvalHtml=pendingQuestions.map(d=>{
      const q=d.data()||{}, bd=(q.birthDetails&&typeof q.birthDetails==='object')?q.birthDetails:{};
      const customerName=q.customerName||q.birthName||bd.name||'Customer';
      const selected=q.astrologerId||'', pct=Number(q.commissionPercent||q.commissionRate||settings.astroPercent||20);
      const options=approvedAstros.map(a=>{const x=a.data()||{};return `<option value="${escapeHtml(a.id)}" ${selected===a.id?'selected':''}>${escapeHtml(x.name||'Astrologer')} — ${escapeHtml(x.expertise||x.specialization||'Astrology')}</option>`}).join('');
      return `<div class="card" style="margin:10px 0">
        <h3>${escapeHtml(customerName)}</h3>
        <p><b>Question ID:</b> ${escapeHtml(d.id)}</p>
        <p><b>Question:</b> ${escapeHtml(q.question||'')}</p>
        <p><b>Amount Paid:</b> ₹${Number(q.amount||0).toFixed(2)} · <b>Payment ID:</b> ${escapeHtml(q.customerPaymentId||'')}</p>
        <div class="grid" style="margin-top:10px">
          <div><label>Assign Astrologer</label><select id="assignAstro_${d.id}"><option value="">Select approved astrologer</option>${options}</select></div>
          <div><label>Astrologer Commission %</label><input id="assignCommission_${d.id}" type="number" min="0" max="100" step="0.01" value="${pct}"></div>
        </div>
        <div class="action-row" style="margin-top:10px">
          <button class="btn" data-approve-question="${d.id}">APPROVE & ALLOCATE</button>
          <button class="btn gray" data-reject-question="${d.id}">REJECT QUESTION</button>
        </div>
        <input id="questionReject_${d.id}" placeholder="Rejection reason (required if rejecting)">
      </div>`;
    }).join('');

    const allocatedHtml=allocatedQuestions.map(d=>{
      const q=d.data()||{};
      const options=approvedAstros.filter(a=>a.id!==q.astrologerId).map(a=>{const x=a.data()||{};return `<option value="${escapeHtml(a.id)}">${escapeHtml(x.name||'Astrologer')} — ${escapeHtml(x.expertise||x.specialization||'Astrology')}</option>`}).join('');
      return `<div class="card" style="margin:10px 0;border-left:4px solid var(--gold)">
        <h3>Allocated Question</h3>
        <p><b>Question ID:</b> ${escapeHtml(d.id)}</p>
        <p><b>Allocated Astrologer:</b> ${escapeHtml(q.astrologerName||q.astrologerId||'Not assigned')}</p>
        <p><b>Question:</b> ${escapeHtml(q.question||'')}</p>
        <p class="small">This question stays here until an answer is submitted and approved.</p>
        <textarea id="adminEditQuestion_${d.id}" rows="3">${escapeHtml(q.question||'')}</textarea>
        <div class="action-row">
          <button class="btn gray" data-edit-question="${d.id}">SAVE QUESTION EDIT</button>
          <select id="reallocateAstro_${d.id}"><option value="">Select another approved astrologer</option>${options}</select>
          <input id="reallocateCommission_${d.id}" type="number" min="0" max="100" step="0.01" value="${Number(q.commissionPercent||q.commissionRate||settings.astroPercent||20)}" style="max-width:130px">
          <button class="btn" data-reallocate-question="${d.id}">RE-ALLOCATE</button>
          <button class="btn" data-admin-answer="${d.id}">ADMIN ANSWER</button>
        </div>
        <div id="adminAnswerArea_${d.id}" style="display:none;margin-top:10px">
          <textarea id="adminAnswer_${d.id}" rows="6" placeholder="Admin answer"></textarea>
          <button class="btn" data-submit-admin-answer="${d.id}">SUBMIT ADMIN ANSWER</button>
          <div id="adminAnswerMsg_${d.id}" class="small"></div>
        </div>
      </div>`;
    }).join('');

    questionApprovalBox.innerHTML=(approvalHtml||'<div class="empty">No new questions awaiting approval.</div>')+
      (allocatedHtml?`<h3 style="margin-top:20px">Allocated Questions — Awaiting Answer</h3>${allocatedHtml}`:'');
  }catch(e){
    console.error('Question control panel error',e);
    questionApprovalBox.innerHTML='<div class="empty error">Unable to load question controls: '+escapeHtml(e.message||String(e))+'</div>';
  }

  questionApprovalBox.querySelectorAll('[data-approve-question]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.approveQuestion, astroId=$('assignAstro_'+id).value, pct=Number($('assignCommission_'+id).value);
    if(!astroId){alert('Select an approved astrologer before approval.');return;}
    if(!Number.isFinite(pct)||pct<0||pct>100){alert('Enter a valid astrologer commission percentage.');return;}
    const astroDoc=astros.docs.find(x=>x.id===astroId), astro=astroDoc?.data()||{};
    b.disabled=true;
    try{
      const qRef=doc(db,'smv_questions',id), qSnap=await getDoc(qRef); if(!qSnap.exists())throw new Error('Question not found.');
      const q=qSnap.data()||{}, amount=Number(q.amount||0), astroCommission=Math.round(amount*pct)/100, adminCommission=Math.round((amount-astroCommission)*100)/100;
      await updateDoc(qRef,{status:'paid',allocationStatus:'assigned_to_astrologer',astrologerId:astroId,astrologerName:astro.name||'Astrologer',commissionPercent:pct,commissionRate:pct,astrologerCommissionAmount:astroCommission,adminCommissionAmount:adminCommission,adminQuestionApprovedAt:serverTimestamp(),adminQuestionApprovedBy:currentUser.uid,commissionStatus:'allocated_pending_answer'});
      await setDoc(doc(db,'smv_notifications',astroId+'_question_assigned_'+Date.now()),{userId:astroId,type:'question_assigned',title:'New Question Assigned',message:'A paid question has been assigned to you by Admin.',questionId:id,commissionAmount:astroCommission,createdAt:serverTimestamp(),read:false});
      alert('Question approved and allocated. It will remain visible in Admin until answered.'); await loadAdminPanel();
    }catch(e){alert(e.message||String(e));b.disabled=false;}
  });

  questionApprovalBox.querySelectorAll('[data-reject-question]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.rejectQuestion, reason=$('questionReject_'+id).value.trim();
    if(!reason){alert('Enter rejection reason.');return;} b.disabled=true;
    try{await updateDoc(doc(db,'smv_questions',id),{status:'question_rejected',allocationStatus:'rejected_by_admin',adminQuestionRejectedAt:serverTimestamp(),adminQuestionRejectedBy:currentUser.uid,adminQuestionRejectionReason:reason});await loadAdminPanel();}
    catch(e){alert(e.message||String(e));b.disabled=false;}
  });

  questionApprovalBox.querySelectorAll('[data-edit-question]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.editQuestion, question=$('adminEditQuestion_'+id).value.trim(); if(!question){alert('Question text is required.');return;}
    b.disabled=true; try{const r=await renderApi('/admin/edit-question',{method:'POST',body:JSON.stringify({questionId:id,question})}); if(!r?.success)throw new Error(r?.error||'Unable to edit question.'); alert('Question updated.'); await loadAdminPanel();}catch(e){alert(e.message||String(e));b.disabled=false;}
  });

  questionApprovalBox.querySelectorAll('[data-reallocate-question]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.reallocateQuestion, newAstroId=$('reallocateAstro_'+id).value, pct=Number($('reallocateCommission_'+id).value);
    if(!newAstroId){alert('Select another approved astrologer.');return;}
    if(!Number.isFinite(pct)||pct<0||pct>100){alert('Enter a valid commission percentage.');return;}
    b.disabled=true; try{
      const r=await renderApi('/admin/reallocate-question',{method:'POST',body:JSON.stringify({questionId:id,astrologerId:newAstroId,commissionPercent:pct})});
      if(!r?.success)throw new Error(r?.error||'Unable to re-allocate question.');
      alert('Question re-allocated. The same Question ID remains unchanged.'); await loadAdminPanel();
    }catch(e){alert(e.message||String(e));b.disabled=false;}
  });

  questionApprovalBox.querySelectorAll('[data-admin-answer]').forEach(b=>b.onclick=()=>{
    const area=$('adminAnswerArea_'+b.dataset.adminAnswer); if(area) area.style.display=area.style.display==='none'?'block':'none';
  });

  questionApprovalBox.querySelectorAll('[data-submit-admin-answer]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.submitAdminAnswer, answer=$('adminAnswer_'+id).value.trim(), msg=$('adminAnswerMsg_'+id);
    if(!answer){msg.innerHTML='<span class="error">Enter Admin answer.</span>';return;}
    b.disabled=true;
    try{
      const r=await renderApi('/admin/takeover-answer',{method:'POST',body:JSON.stringify({questionId:id,answer})});
      if(!r?.success)throw new Error(r?.error||'Unable to save Admin answer.');
      alert('Admin answer submitted. Full amount is retained by Admin for this question.'); await loadAdminPanel();
    }catch(e){msg.innerHTML='<span class="error">'+escapeHtml(e.message||String(e))+'</span>';b.disabled=false;}
  });

const answerBox = $('adminAnswers');

const pendingAnswers =
  questions.docs.filter(d => {
    const q = d.data();
    return (
      q.status === 'processing' ||
      q.status === 'admin_review'
    );
  });

answerBox.innerHTML =
  pendingAnswers.length
    ? pendingAnswers.map(d => {

        const q = d.data();

        return `
          <div class="card" style="margin:10px 0">

            <b>
              ${escapeHtml(q.question || 'Question')}
            </b>

            <p style="white-space:pre-wrap">
              ${escapeHtml(q.answer || '')}
            </p>

            <div class="small">
              Astrologer:
              <b>
                ${escapeHtml(
                  q.astrologerName ||
                  q.astrologerId ||
                  ''
                )}
              </b>
            </div>

            <div class="small">
              Word Count:
              <b>${Number(q.answerWordCount || 0)}</b>
            </div>

            <div class="small">
              Commission:
              <b>
                ₹${Number(
                  q.astrologerCommissionAmount || 0
                ).toFixed(2)}
              </b>
            </div>

            <div class="action-row">

              <button
                class="btn"
                data-approve-answer="${d.id}"
              >
                APPROVE ANSWER
              </button>

              <button
                class="btn gray"
                data-reject-answer="${d.id}"
              >
                REJECT ANSWER
              </button>

            </div>

            <input
              id="answerReject_${d.id}"
              placeholder="Rejection reason"
            >

          </div>
        `;

      }).join('')
    : '<div class="empty">No answers awaiting approval.</div>';


/* APPROVE ANSWER */

answerBox
  .querySelectorAll('[data-approve-answer]')
  .forEach(b => {

    b.onclick = async () => {

      const id =
        b.dataset.approveAnswer;

      b.disabled = true;
      b.textContent = 'APPROVING...';

      try {

        const questionRef =
          doc(db, 'smv_questions', id);

        const snap =
          await withTimeout(
            getDoc(questionRef),
            15000
          );

        if (!snap.exists()) {
          throw new Error(
            'Question not found.'
          );
        }

        const q = snap.data();

        if (!q.astrologerId) {
          throw new Error(
            'Astrologer is not assigned.'
          );
        }

        if (!q.answer) {
          throw new Error(
            'No answer found.'
          );
        }

        const commissionAmount =
          Number(
            q.astrologerCommissionAmount || 0
          );

        const creditResponse = await renderApi('/admin/credit-commission',{method:'POST',headers:await authHeaders(),body:JSON.stringify({questionId:id})});
        if(!creditResponse?.success) throw new Error(creditResponse?.error||'Unable to credit astrologer commission.');

        await withTimeout(
          updateDoc(
            questionRef,
            {

              status: 'answered',

              astrologerAnswerStatus:
                'approved',

              commissionStatus:
                'credited',

              answerApprovedAt:
                serverTimestamp(),

              adminAnswerApprovedAt:
                serverTimestamp(),

              answerApprovedBy:
                currentUser.uid,

              commissionCreditedAt:
                serverTimestamp(),

              commissionAmount:
                commissionAmount

            }
          ),
          15000
        );

        await setDoc(
          doc(
            db,
            'smv_notifications',
            q.astrologerId +
            '_answer_approved_' +
            Date.now()
          ),
          {
            userId: q.astrologerId,
            type: 'answer_approved',
            title: 'Answer Approved',
            message:
              `Your answer has been approved. Commission credited: ₹${commissionAmount.toFixed(2)}`,
            questionId: id,
            commissionAmount:
              commissionAmount,
            createdAt:
              serverTimestamp(),
            read: false
          }
        );

        alert(
          `Answer approved successfully. ₹${commissionAmount.toFixed(2)} commission credited.`
        );

        await loadAdminPanel();

      } catch (e) {

        console.error(
          'Answer approval error:',
          e
        );

        alert(
          e.message || String(e)
        );

        b.disabled = false;
        b.textContent =
          'APPROVE ANSWER';
      }

    };

  });


/* REJECT ANSWER */

answerBox
  .querySelectorAll('[data-reject-answer]')
  .forEach(b => {

    b.onclick = async () => {

      const id =
        b.dataset.rejectAnswer;

      const reason =
        $('answerReject_' + id)
          ?.value
          .trim();

      if (!reason) {
        alert(
          'Enter rejection reason.'
        );
        return;
      }

      b.disabled = true;
      b.textContent = 'REJECTING...';

      try {

        const questionRef =
          doc(db, 'smv_questions', id);

        const snap =
          await getDoc(questionRef);

        if (!snap.exists()) {
          throw new Error(
            'Question not found.'
          );
        }

        const q = snap.data();

        await updateDoc(
          questionRef,
          {
            status:
              'revision_required',

            astrologerAnswerStatus:
              'revision_required',

            adminRejectionReason:
              reason,

            adminRejectedAt:
              serverTimestamp(),

            adminRejectedBy:
              currentUser.uid,

            commissionStatus:
              'pending_admin_approval'
          }
        );

        if (q.astrologerId) {

          await setDoc(
            doc(
              db,
              'smv_notifications',
              q.astrologerId +
              '_answer_reject_' +
              Date.now()
            ),
            {
              userId:
                q.astrologerId,

              type:
                'answer_rejected',

              title:
                'Answer requires revision',

              message:
                reason,

              questionId:
                id,

              createdAt:
                serverTimestamp(),

              read: false
            }
          );

        }

        alert(
          'Answer rejected. Astrologer can revise the answer.'
        );

        await loadAdminPanel();

      } catch (e) {

        console.error(
          'Answer rejection error:',
          e
        );

        alert(
          e.message || String(e)
        );

        b.disabled = false;
        b.textContent =
          'REJECT ANSWER';
      }

    };

  });

  const withdrawalSnap=await getDocs(collection(db,'smv_withdrawals'));
  const withdrawalDocs=withdrawalSnap.docs.slice().sort((a,b)=>Number(b.data().createdAt?.seconds||0)-Number(a.data().createdAt?.seconds||0)).slice(0,50);
  $('adminWithdrawals').innerHTML=withdrawalDocs.length?withdrawalDocs.map(d=>{const w=d.data();return `<div class="card" style="margin:10px 0"><b>₹${Number(w.amount||0).toFixed(2)}</b> · ${escapeHtml(w.status||'pending')}<div class="small">Astrologer: ${escapeHtml(w.astrologerId||'')} · Requested: ${escapeHtml(w.createdAt?.toDate? w.createdAt.toDate().toLocaleString(): 'Recently')}</div><div class="action-row">${w.status==='pending'?`<button class="btn" data-wstatus="${d.id}" data-status="processing">MARK PROCESSING</button><button class="btn gray" data-wstatus="${d.id}" data-status="rejected">REJECT</button>`:''}${w.status==='processing'?`<button class="btn" data-wstatus="${d.id}" data-status="paid">MARK PAID</button>`:''}</div></div>`}).join(''):'<div class="empty">No withdrawal requests.</div>';
 $('adminWithdrawals')
  .querySelectorAll('[data-wstatus]')
  .forEach(b => {

    b.onclick = async () => {

      const withdrawalId =
        b.dataset.wstatus;

      const newStatus =
        b.dataset.status;

      b.disabled = true;
      b.textContent = 'UPDATING...';

      try {

        const withdrawalRef =
          doc(
            db,
            'smv_withdrawals',
            withdrawalId
          );

        const snap =
          await withTimeout(
            getDoc(withdrawalRef),
            15000
          );

        if(!snap.exists()){
          throw new Error(
            'Withdrawal request not found.'
          );
        }

        const w = snap.data();

        const updateData = {
          status: newStatus,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        };

        if(newStatus === 'processing'){
          updateData.processingAt =
            serverTimestamp();
        }

        if(newStatus === 'paid'){
          updateData.paidAt =
            serverTimestamp();
        }

        if(newStatus === 'rejected'){
          updateData.rejectedAt =
            serverTimestamp();
        }

        await withTimeout(
          updateDoc(
            withdrawalRef,
            updateData
          ),
          15000
        );

        if(w.astrologerId){

          let title = '';
          let message = '';

          if(newStatus === 'processing'){
            title =
              'Withdrawal is processing';
            message =
              `Your withdrawal request of ₹${Number(w.amount || 0).toFixed(2)} is being processed by Admin.`;
          }

          if(newStatus === 'paid'){
            title =
              'Withdrawal paid';
            message =
              `Your withdrawal of ₹${Number(w.amount || 0).toFixed(2)} has been marked as paid.`;
          }

          if(newStatus === 'rejected'){
            title =
              'Withdrawal rejected';
            message =
              `Your withdrawal request of ₹${Number(w.amount || 0).toFixed(2)} was rejected by Admin.`;
          }

          if(message){

            await setDoc(
              doc(
                db,
                'smv_notifications',
                w.astrologerId +
                '_withdrawal_' +
                Date.now()
              ),
              {
                userId:
                  w.astrologerId,

                type:
                  'withdrawal_' + newStatus,

                title:
                  title,

                message:
                  message,

                withdrawalId:
                  withdrawalId,

                amount:
                  Number(w.amount || 0),

                createdAt:
                  serverTimestamp(),

                read:
                  false
              }
            );

          }

        }

        alert(
          `Withdrawal status updated to ${newStatus}.`
        );

        await loadAdminPanel();

      } catch(e) {

        console.error(
          'Withdrawal status error:',
          e
        );

        alert(
          e.message || String(e)
        );

        b.disabled = false;

        b.textContent =
          newStatus === 'processing'
            ? 'MARK PROCESSING'
            : newStatus === 'paid'
              ? 'MARK PAID'
              : 'REJECT';

      }

    };

  });
  const reviewsSnap = await getDocs(
  collection(db, 'smv_reviews')
);

$('adminReviews').innerHTML =
  reviewsSnap.empty
    ? '<div class="empty">No reviews yet.</div>'
    : reviewsSnap.docs
        .slice(-50)
        .reverse()
        .map(d => {

          const r = d.data();

          return `
            <div style="padding:10px;border-bottom:1px solid #eee">

              <div>
                ⭐ <b>${Number(r.rating || 0)}/5</b>
              </div>

              <div style="margin-top:5px">
                ${escapeHtml(r.review || '')}
              </div>

              <div class="small" style="margin-top:5px">
                Verified customer ·
                Astrologer:
                ${escapeHtml(r.astrologerId || '')}
                · Status:
                <b>
                  ${r.approved === true
                    ? 'Approved'
                    : 'Pending'}
                </b>
              </div>

              <div class="action-row">

                <button
                  class="btn"
                  data-review-edit="${d.id}">
                  EDIT REVIEW
                </button>

                ${
                  r.approved === true
                    ? ''
                    : `
                      <button
                        class="btn"
                        data-review-approve="${d.id}">
                        APPROVE REVIEW
                      </button>

                      <button
                        class="btn gray"
                        data-review-reject="${d.id}">
                        REJECT REVIEW
                      </button>
                    `
                }

              </div>

            </div>
          `;

        })
        .join('');


/* EDIT REVIEW + RATING */

$('adminReviews')
  .querySelectorAll('[data-review-edit]')
  .forEach(b => {

    b.onclick = async () => {

      const reviewId =
        b.dataset.reviewEdit;

      try {

        const reviewRef =
          doc(
            db,
            'smv_reviews',
            reviewId
          );

        const snap =
          await withTimeout(
            getDoc(reviewRef),
            15000
          );

        if (!snap.exists()) {
          throw new Error(
            'Review not found.'
          );
        }

        const r =
          snap.data();

        openModal(`
          <h2>Edit Customer Review</h2>

          <label>Rating</label>

          <select id="editReviewRating">
            <option value="5"
              ${Number(r.rating) === 5 ? 'selected' : ''}>
              ★★★★★ — 5
            </option>

            <option value="4"
              ${Number(r.rating) === 4 ? 'selected' : ''}>
              ★★★★☆ — 4
            </option>

            <option value="3"
              ${Number(r.rating) === 3 ? 'selected' : ''}>
              ★★★☆☆ — 3
            </option>

            <option value="2"
              ${Number(r.rating) === 2 ? 'selected' : ''}>
              ★★☆☆☆ — 2
            </option>

            <option value="1"
              ${Number(r.rating) === 1 ? 'selected' : ''}>
              ★☆☆☆☆ — 1
            </option>
          </select>

          <label style="display:block;margin-top:10px">
            Review
          </label>

          <textarea
            id="editReviewText"
            placeholder="Customer review"
            style="width:100%;min-height:120px"
          >${escapeHtml(r.review || '')}</textarea>

          <button
            class="btn"
            id="saveEditedReview"
            style="margin-top:10px">
            SAVE CHANGES
          </button>

          <div
            id="editReviewMsg"
            class="small"
            style="margin-top:8px">
          </div>
        `);

        $('saveEditedReview').onclick =
          async () => {

            const saveBtn =
              $('saveEditedReview');

            const msg =
              $('editReviewMsg');

            const rating =
              Number(
                $('editReviewRating').value
              );

            const review =
              $('editReviewText')
                .value
                .trim();

            if (
              rating < 1 ||
              rating > 5
            ) {
              msg.innerHTML =
                '<span class="error">Please select a valid rating.</span>';
              return;
            }

            if (!review) {
              msg.innerHTML =
                '<span class="error">Review cannot be empty.</span>';
              return;
            }

            saveBtn.disabled = true;
            saveBtn.textContent =
              'SAVING...';

            try {

              await withTimeout(
                updateDoc(
                  reviewRef,
                  {
                    rating:
                      rating,

                    review:
                      review,

                    updatedAt:
                      serverTimestamp(),

                    updatedBy:
                      currentUser.uid
                  }
                ),
                15000
              );

              msg.innerHTML =
                '<span class="success">Review updated successfully.</span>';

              setTimeout(() => {
                closeModal();
                loadAdminPanel();
              }, 500);

            } catch (e) {

              msg.innerHTML =
                '<span class="error">' +
                escapeHtml(
                  e.message || String(e)
                ) +
                '</span>';

              saveBtn.disabled = false;
              saveBtn.textContent =
                'SAVE CHANGES';
            }

          };

      } catch (e) {

        alert(
          e.message || String(e)
        );

      }

    };

  });


/* APPROVE REVIEW */

$('adminReviews')
  .querySelectorAll('[data-review-approve]')
  .forEach(b => {

    b.onclick = async () => {

      b.disabled = true;

      try {

        await withTimeout(
          updateDoc(
            doc(
              db,
              'smv_reviews',
              b.dataset.reviewApprove
            ),
            {
              approved:
                true,

              status:
                'approved',

              approvedAt:
                serverTimestamp(),

              approvedBy:
                currentUser.uid
            }
          ),
          15000
        );

        await loadAdminPanel();

      } catch (e) {

        alert(
          e.message || String(e)
        );

        b.disabled = false;
      }

    };

  });


/* REJECT REVIEW */

$('adminReviews')
  .querySelectorAll('[data-review-reject]')
  .forEach(b => {

    b.onclick = async () => {

      const choice = confirm(
        'Reject this customer review?\n\n' +
        'OK = Reject & Delete\n' +
        'Cancel = Keep Review'
      );

      if (!choice) {
        return;
      }

      b.disabled = true;
      b.textContent = 'REJECTING...';

      try {

        await withTimeout(
          deleteDoc(
            doc(
              db,
              'smv_reviews',
              b.dataset.reviewReject
            )
          ),
          15000
        );

        alert('Review rejected and deleted successfully.');

        await loadAdminPanel();

      } catch (e) {

        alert(
          'Unable to reject review: ' +
          (e.message || String(e))
        );

        b.disabled = false;
        b.textContent = 'REJECT REVIEW';
      }

    };

  });
  $('adminQuestions').innerHTML=questions.empty?'<div class="empty">No questions yet.</div>':questions.docs.slice(-50).reverse().map(d=>{const q=d.data();return `<div style="padding:10px;border-bottom:1px solid #eee"><b>${escapeHtml(q.question||'Question')}</b><div class="small">Status: ${escapeHtml(q.status||'')} · Customer: ${escapeHtml(q.customerId||'')} · Price paid: ₹${Number(q.amount||0).toFixed(2)} · Astrologer share: ₹${Number(q.astrologerCommissionAmount||0).toFixed(2)} · Admin share: ₹${Number(q.adminCommissionAmount||0).toFixed(2)} · ${escapeHtml(q.astrologerName||'Unclaimed')}</div></div>`}).join('');
 }catch(e){$('adminSummary').innerHTML='';$('pendingAstros').innerHTML='<div class="empty error">Unable to load admin data: '+escapeHtml(e.message||String(e))+'</div>';}
}
// Final auth state listener: one source of truth.
if(auth){ onAuthStateChanged(auth,async user=>{
   const previousUid=lastAuthUid;
   currentUser=user;
   if(authReadyResolve){authReadyResolve();authReadyResolve=null;}
   if(previousUid && (!user || previousUid!==user.uid)){
     hide('dashboard'); hide('admin'); hide('dashLink'); hide('adminLink');
   }
   if(intentionalLogout) return;
   $('authBtn').textContent=user?'Logout':'Login';
   if(user){
     lastAuthUid=user.uid; touchSession(); armIdleTimer();
     if(user.uid!==ADMIN_UID && !user.emailVerified){ await signOut(auth); currentUser=null; clearIdleTimer(); lastAuthUid=null; hide("dashboard"); hide("admin"); hide("dashLink"); hide("adminLink"); $("authBtn").textContent="Login"; return; }
     const adminUser=await isCurrentAdmin();
     if(adminUser){ hide('dashLink'); show('adminLink'); }
     else {
       show('dashLink'); hide('adminLink');
       // Restore the dashboard after a browser refresh/session restoration.
       hidePrimarySections('dashboard');
       show('dashboard');
       await loadDashboard();
       go('dashboard');
     }
   }else{
     clearIdleTimer(); lastAuthUid=null;
     hide('dashLink');hide('adminLink');hide('dashboard');hide('admin');
   }
 }); }
if(firebaseInitError){
  console.error("SMV ASTRO Firebase is unavailable. Basic navigation is still available.",firebaseInitError);
}

window.__SMV_APP_READY=true;
