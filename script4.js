
(function(){
  const BACKEND="https://smv-astro-razorpay-webhook.onrender.com";
  const FBCONFIG={apiKey:"AIzaSyCKXyfZ9sjGmej7ygxHpzHNcNysMXHuvSs",authDomain:"smv-astro.firebaseapp.com",projectId:"smv-astro",storageBucket:"smv-astro.firebasestorage.app",messagingSenderId:"299081899217",appId:"1:299081899217:web:8d558df08e86037ea539f0"};
  let db=null,auth=null;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let fbApi=null;
  function withTimeout(promise,ms=15000){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Firebase did not respond within 15 seconds.')),ms))]);}
  async function fb(){
    if(db&&auth&&fbApi) return fbApi;
    const {getApps,initializeApp}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js');
    const fs=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
    const {getFirestore}=fs;
    const {getAuth,setPersistence,browserSessionPersistence}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    const app=getApps().length?getApps()[0]:initializeApp(FBCONFIG);
    db=getFirestore(app);
    auth=getAuth(app);await setPersistence(auth,browserSessionPersistence);
    fbApi={
      collection:fs.collection,getDocs:fs.getDocs,query:fs.query,where:fs.where,orderBy:fs.orderBy,limit:fs.limit,
      doc:fs.doc,getDoc:fs.getDoc,addDoc:fs.addDoc,updateDoc:fs.updateDoc,deleteDoc:fs.deleteDoc,
      setDoc:fs.setDoc,serverTimestamp:fs.serverTimestamp
    };
    return fbApi;
  }
  async function loadQuestionPrice(){try{const f=await fb();const snap=await f.getDoc(f.doc(db,'smv_settings','question'));if(!snap.exists())throw new Error('Question price is not configured.');const price=Number(snap.data()?.price);if(!Number.isFinite(price)||price<1)throw new Error('Invalid question price.');if($('publicQuestionPrice'))$('publicQuestionPrice').textContent='₹'+price.toFixed(2);}catch(e){console.warn('Public question price unavailable:',e);if($('publicQuestionPrice'))$('publicQuestionPrice').textContent='Price unavailable';}}
  async function openPublicAstrologerProfile(a){
    try{
      const f=await fb();
      const snap=await withTimeout(f.getDocs(f.query(f.collection(db,'smv_reviews'),f.where('approved','==',true),f.limit(100))),15000);
      const reviews=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.astrologerId===a.id);
      const stars=n=>'★'.repeat(Math.max(0,Math.min(5,Number(n||0))))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(n||0))));
      const photo=a.photoData||a.photoURL||a.photoUrl||'';
      modal(`<h2>${esc(a.name||'Astrologer')}</h2>${photo?`<img src="${esc(photo)}" alt="${esc(a.name||'Astrologer')}" style="width:110px;height:110px;border-radius:50%;object-fit:cover;border:3px solid var(--gold);margin-bottom:10px">`:''}<p><b>${esc(a.expertise||a.specialization||'Astrology')}</b></p><p>${esc(a.bio||a.about||'Professional astrologer')}</p><h3 style="margin-top:18px">Verified Reviews for ${esc(a.name||'this astrologer')}</h3>${reviews.length?reviews.map(r=>`<div class="card" style="margin:10px 0"><div class="stars">${stars(r.rating)}</div><p style="white-space:pre-wrap">“${esc(r.review||'')}”</p><p class="small">Verified customer</p></div>`).join(''):'<div class="empty">No approved reviews for this astrologer yet.</div>'}<button class="btn gray" id="profileCloseBtn">CLOSE</button>`);
      $('profileCloseBtn').onclick=closeModal;
    }catch(e){modal(`<h2>${esc(a.name||'Astrologer')}</h2><div class="empty error">Unable to load this astrologer profile/reviews right now.</div><button class="btn gray" id="profileCloseBtn">CLOSE</button>`);$('profileCloseBtn').onclick=closeModal;}
  }
  async function loadReviews(){
    const box=$('publicReviews');if(!box)return;
    try{
      const f=await fb();
      const snap=await f.getDocs(f.query(f.collection(db,'smv_reviews'),f.where('approved','==',true),f.limit(12)));
      if(snap.empty){box.innerHTML='<div class="empty">No public reviews yet. Be the first verified customer to share your experience.</div>';return;}
      const reviews=await Promise.all(snap.docs.map(async d=>{
        const r=d.data();
        let astro={}; let customer={};
        try{if(r.astrologerId){const a=await f.getDoc(f.doc(db,'smv_astrologers',r.astrologerId));if(a.exists())astro=a.data()||{};}}catch(e){console.warn('Astrologer profile lookup failed',e);}
        try{if(r.customerId){const c=await f.getDoc(f.doc(db,'smv_users',r.customerId));if(c.exists())customer=c.data()||{};}}catch(e){console.warn('Customer profile lookup failed',e);}
        const stars='★'.repeat(Math.max(0,Math.min(5,Number(r.rating||0))))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(r.rating||0))));
        const astroName=astro.name||r.astrologerName||'SMV ASTRO Astrologer';
        const astroPhoto=astro.photoData||astro.photoURL||astro.photoUrl||'';
        const customerName=customer.name||customer.displayName||r.customerName||'Verified Customer';
        const photo=astroPhoto?`<img src="${esc(astroPhoto)}" alt="${esc(astroName)}" style="width:58px;height:58px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);">`:`<div style="width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#f7df9b;color:#7b1e1e;font-weight:800;font-size:22px;border:2px solid var(--gold);">${esc(String(astroName).charAt(0).toUpperCase())}</div>`;
        return `<div class="card review-card"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">${photo}<div><div style="font-weight:800;font-size:18px">${esc(astroName)}</div><div class="small">Astrologer</div></div></div><div class="stars">${stars}</div><p style="white-space:pre-wrap">“${esc(r.review||'Verified customer review')}”</p><p class="small"><b>Customer: ${esc(customerName)}</b></p></div>`;
      }));
      box.innerHTML=reviews.join('');
    }catch(e){console.error('Public reviews load failed',e);box.innerHTML='<div class="empty">Reviews are temporarily unavailable.</div>';}
  }
  async function authHeaders(){await fb();const u=auth?.currentUser;if(!u)throw new Error('Please login as Admin to use this feature.');return {Authorization:'Bearer '+await u.getIdToken()};}
  let adminAppointmentsLoading=false;
  async function loadAdminAppointments(){
    const box=$('adminAppointments'); if(!box||adminAppointmentsLoading)return;
    adminAppointmentsLoading=true; box.innerHTML='<div class="empty">Loading appointment requests...</div>';
    try{
      await fb(); const u=auth?.currentUser; if(!u)throw new Error('Please login as Admin.');
      const token=await u.getIdToken(true);
      const r=await fetch(BACKEND+'/admin/appointments',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
      const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d.error||`Appointment service returned HTTP ${r.status}.`);
      const items=Array.isArray(d.appointments)?d.appointments:[];
      if(!items.length){box.innerHTML='<div class="empty">No appointment requests.</div>';return;}
      box.innerHTML=items.map(a=>{const current=String(a.status||'new').toLowerCase();return `<div style="padding:14px 0;border-bottom:1px solid #eee"><b>${esc(a.name||'Customer')}</b> · <b>${esc(a.type||'Consultation')}</b><div class="small">${esc(a.email||'')} · ${esc(a.mobile||'')}</div><div class="small">Preferred: <b>${esc(a.preferredDate||'-')}</b> ${esc(a.preferredTime||'')}</div><div class="small">${esc(a.notes||'No notes')}</div><div class="small" style="margin-top:6px">Status: <b>${esc(current.toUpperCase())}</b></div><div class="action-row">${['new','confirmed','completed','cancelled'].map(st=>`<button type="button" class="btn ${st==='cancelled'?'gray':''}" data-apstatus="${esc(a.id)}" data-status="${st}" ${st===current?'disabled style="opacity:.65;cursor:default"':''}>${st===current?'✓ ':''}${st.toUpperCase()}</button>`).join('')}</div></div>`;}).join('');
      box.querySelectorAll('[data-apstatus]').forEach(b=>b.onclick=()=>updateAppointment(b.dataset.apstatus,b.dataset.status,b));
    }catch(e){console.error('ADMIN APPOINTMENT ERROR:',e);box.innerHTML='<div class="empty error">Appointment loading failed: '+esc(e?.message||String(e))+'</div>';}finally{adminAppointmentsLoading=false;}
  }
  let appointmentUpdating=false;
  async function updateAppointment(id,status,button){
    if(appointmentUpdating)return; appointmentUpdating=true;
    const buttons=[...document.querySelectorAll('[data-apstatus]')]; buttons.forEach(x=>x.disabled=true);
    try{await fb();const u=auth?.currentUser;if(!u)throw new Error('Please login as Admin.');const token=await u.getIdToken(true);const r=await fetch(BACKEND+'/admin/appointment-status',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({id,status}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`Appointment update returned HTTP ${r.status}.`);await loadAdminAppointments();}catch(e){console.error('Appointment update error:',e);alert(e?.message||String(e));buttons.forEach(x=>x.disabled=false);}finally{appointmentUpdating=false;}
  }

  function setupLanguage(){
    const btn=$('langToggle'); if(!btn) return;
    let tamil=false;
    const T={
      "Home":"முகப்பு","Services":"சேவைகள்","Consultation":"ஆலோசனை","Contact":"தொடர்பு","Dashboard":"டாஷ்போர்டு","Admin":"நிர்வாகி","Login":"உள்நுழைவு","Logout":"வெளியேறு","Close":"மூடு","Back":"பின்","← Back":"← பின்","← Back to Home":"← முகப்பிற்குத் திரும்பு","SAVE":"சேமிக்க","CLEAR":"அழிக்க","PUBLISH":"வெளியிடுக","ADD BLOG":"வலைப்பதிவு சேர்க்க","Contact Us":"தொடர்பு கொள்ள","Email *":"மின்னஞ்சல் *","Mobile *":"மொபைல் *","Mobile Number *":"மொபைல் எண் *","Name *":"பெயர் *","Query *":"கேள்வி / செய்தி *","Place / City *":"இடம் / நகரம் *","SEND QUERY":"கேள்வியை அனுப்புக","SENDING...":"அனுப்பப்படுகிறது...","Reviews":"மதிப்புரைகள்","Customer Reviews":"வாடிக்கையாளர் மதிப்புரைகள்","Customer Account":"வாடிக்கையாளர் கணக்கு","Login & registration":"உள்நுழைவு & பதிவு","Register as Customer":"வாடிக்கையாளராக பதிவு செய்ய","Register as Astrologer":"ஜோதிடராக பதிவு செய்ய","Customer Registration":"வாடிக்கையாளர் பதிவு","Astrologer Registration":"ஜோதிடர் பதிவு","Choose Your Path":"உங்கள் பாதையைத் தேர்வு செய்யுங்கள்","Choose Your Guidance":"உங்கள் வழிகாட்டலைத் தேர்வு செய்யுங்கள்","Appointment Booking":"முன்பதிவு","REQUEST APPOINTMENT":"முன்பதிவு கோரிக்கை அனுப்புக","BOOK CHAT":"Chat முன்பதிவு","BOOK CALL":"Call முன்பதிவு","Chat Consultation":"Chat ஆலோசனை","Call Consultation":"Call ஆலோசனை","Private Chat Consultation":"தனிப்பட்ட Chat ஆலோசனை","Private Call Consultation":"தனிப்பட்ட Call ஆலோசனை","Payment Method":"கட்டண முறை","Birth Details":"பிறப்பு விவரங்கள்","Date of Birth":"பிறந்த தேதி","Time of Birth":"பிறந்த நேரம்","Place of Birth":"பிறந்த இடம்","Gender (Optional)":"பாலினம் (விருப்பம்)","Male":"ஆண்","Female":"பெண்","Other":"மற்றவை","Prefer not to say":"சொல்ல விருப்பமில்லை","Your Question":"உங்கள் கேள்வி","Ask Your Question":"உங்கள் கேள்வியைக் கேளுங்கள்","ASK A QUESTION":"கேள்வி கேட்க","ASK YOUR QUESTIONS":"உங்கள் கேள்விகளைக் கேளுங்கள்","Proceed to Secure Payment":"பாதுகாப்பான கட்டணத்திற்குத் தொடர்க","Public Question Price":"பொது கேள்வி கட்டணம்","Answer Word Limit":"பதில் சொல் வரம்பு","Answers Awaiting Approval":"அனுமதிக்காக காத்திருக்கும் பதில்கள்","Questions Awaiting Admin Approval":"நிர்வாகி அனுமதிக்காக காத்திருக்கும் கேள்விகள்","Recent Questions":"சமீபத்திய கேள்விகள்","Question price is set by SMV ASTRO administration.":"கேள்வி கட்டணத்தை SMV ASTRO நிர்வாகம் நிர்ணயிக்கிறது.","Services & Pricing":"சேவைகள் & கட்டணங்கள்","SERVICES & PRICING":"சேவைகள் & கட்டணங்கள்","Guidance & Astrology Articles":"வழிகாட்டல் & ஜோதிடக் கட்டுரைகள்","ASTROLOGY BLOG":"ஜோதிட வலைப்பதிவு","Astrology Blog":"ஜோதிட வலைப்பதிவு","Loading blogs...":"வலைப்பதிவுகள் ஏற்றப்படுகின்றன...","Loading articles...":"கட்டுரைகள் ஏற்றப்படுகின்றன...","Articles published by SMV ASTRO Admin will appear here.":"SMV ASTRO நிர்வாகி வெளியிடும் கட்டுரைகள் இங்கே தோன்றும்.","Astrology Blog Manager":"ஜோதிட வலைப்பதிவு நிர்வாகி","Customer Reviews":"வாடிக்கையாளர் மதிப்புரைகள்","What Our Customers Say":"எங்கள் வாடிக்கையாளர்கள் கூறுவது","Loading reviews...":"மதிப்புரைகள் ஏற்றப்படுகின்றன...","FAQ":"அடிக்கடி கேட்கப்படும் கேள்விகள்","FREQUENTLY ASKED QUESTIONS":"அடிக்கடி கேட்கப்படும் கேள்விகள்","Quick answers":"விரைவான பதில்கள்","How do I ask an astrology question?":"ஜோதிடக் கேள்வியை எப்படி கேட்பது?","How can I contact SMV ASTRO?":"SMV ASTRO-வை எப்படி தொடர்பு கொள்வது?","Do I need an account?":"கணக்கு அவசியமா?","Are astrologers verified?":"ஜோதிடர்கள் சரிபார்க்கப்பட்டவர்களா?","Can I book a Chat or Call consultation?":"Chat அல்லது Call ஆலோசனையை முன்பதிவு செய்ய முடியுமா?","Notifications":"அறிவிப்புகள்","Latest updates":"சமீபத்திய அறிவிப்புகள்","Admin login & management":"நிர்வாகி உள்நுழைவு & மேலாண்மை","Appointment Requests":"முன்பதிவு கோரிக்கைகள்","Manage Chat and Call consultation requests from customers.":"வாடிக்கையாளர்களின் Chat மற்றும் Call ஆலோசனை கோரிக்கைகளை நிர்வகிக்கவும்.","Commission Settings":"கமிஷன் அமைப்புகள்","Razorpay Connection":"Razorpay இணைப்பு","TEST RAZORPAY CONNECTION":"Razorpay இணைப்பை சோதிக்க","Astrologer Applications — Full Verification":"ஜோதிடர் விண்ணப்பங்கள் — முழு சரிபார்ப்பு","Astrologer Withdrawal Requests":"ஜோதிடர் பணப்பெறுதல் கோரிக்கைகள்","BEGIN YOUR JOURNEY WITH SMV ASTRO":"SMV ASTRO உடன் உங்கள் பயணத்தைத் தொடங்குங்கள்","FOR SEEKERS OF GUIDANCE":"வழிகாட்டலை நாடுபவர்களுக்கு","FOR ASTROLOGY PROFESSIONALS":"ஜோதிட நிபுணர்களுக்கு","Traditional Wisdom":"பாரம்பரிய ஞானம்","Trusted Consultation":"நம்பகமான ஆலோசனை","Verified experiences":"சரிபார்க்கப்பட்ட அனுபவங்கள்","Choose Chat or Call":"Chat அல்லது Call தேர்வு செய்யுங்கள்","Read & learn":"படித்து அறிந்து கொள்ளுங்கள்","Personal Guidance":"தனிப்பட்ட வழிகாட்டல்","SMV ASTRO SERVICES":"SMV ASTRO சேவைகள்","WELCOME TO SMV ASTRO SERVICES":"SMV ASTRO சேவைகளுக்கு வரவேற்கிறோம்","Guidance Through the Wisdom of Jyotisha":"ஜோதிட ஞானத்தின் வழியாக வழிகாட்டல்","Guidance Through the Wisdom of Jyotisha":"ஜோதிட ஞானத்தின் வழியாக வழிகாட்டல்","Services, Guidance & Resources":"சேவைகள், வழிகாட்டல் & தகவல்கள்","Explore consultations, pricing, trusted reviews, astrology articles, FAQs and more.":"ஆலோசனைகள், கட்டணங்கள், மதிப்புரைகள், ஜோதிடக் கட்டுரைகள், FAQ மற்றும் பலவற்றைப் பாருங்கள்.","Create your private customer account to access the secure consultation area and choose an approved astrologer.":"பாதுகாப்பான ஆலோசனைப் பகுதியை அணுகவும், அங்கீகரிக்கப்பட்ட ஜோதிடரைத் தேர்வு செய்யவும் தனிப்பட்ட வாடிக்கையாளர் கணக்கை உருவாக்குங்கள்.","Register according to your purpose. Customer and Astrologer accounts are kept separate, with each journey designed for its own needs.":"உங்கள் தேவைக்கேற்ப பதிவு செய்யுங்கள். வாடிக்கையாளர் மற்றும் ஜோதிடர் கணக்குகள் தனித்தனியாக பராமரிக்கப்படுகின்றன.","Apply to become an SMV ASTRO astrologer. Your professional profile will be reviewed before it becomes public.":"SMV ASTRO ஜோதிடராக விண்ணப்பிக்கவும். உங்கள் தொழில்முறை சுயவிவரம் வெளியிடப்படும் முன் மதிப்பாய்வு செய்யப்படும்.","Have a question? Send us your details and query. Our admin team will contact you soon.":"கேள்வி உள்ளதா? உங்கள் விவரங்களையும் கேள்வியையும் அனுப்புங்கள். எங்கள் நிர்வாக குழு விரைவில் உங்களைத் தொடர்புகொள்ளும்.","Use the Contact Us form to send your query directly.":"Contact Us படிவத்தைப் பயன்படுத்தி உங்கள் கேள்வியை நேரடியாக அனுப்பலாம்.","Choose Chat or Call. Submit your preferred date/time and our admin team will confirm the appointment.":"Chat அல்லது Call தேர்வு செய்து, விருப்பமான தேதி/நேரத்தை அனுப்புங்கள். எங்கள் நிர்வாக குழு முன்பதிவை உறுதிப்படுத்தும்.","A private conversation with an approved astrologer for focused guidance.":"அங்கீகரிக்கப்பட்ட ஜோதிடருடன் தனிப்பட்ட உரையாடல் மூலம் குறிப்பிட்ட வழிகாட்டலைப் பெறுங்கள்.","Choose a preferred time and receive a personal consultation by call.":"விருப்பமான நேரத்தைத் தேர்வு செய்து Call மூலம் தனிப்பட்ட ஆலோசனையைப் பெறுங்கள்.","Submit birth details and a question for an approved astrologer. Current price:":"பிறப்பு விவரங்களையும் கேள்வியையும் அனுப்புங்கள். தற்போதைய கட்டணம்:","Enter the birth details of the person for whom you are asking the question.":"கேள்வி கேட்கப்படும் நபரின் பிறப்பு விவரங்களை உள்ளிடுங்கள்.","Paid questions wait for Admin approval. Admin selects one approved astrologer and assigns the commission before the question appears in that astrologer’s dashboard.":"கட்டணம் செலுத்திய கேள்விகள் இங்கே நிர்வாகி அனுமதிக்காக காத்திருக்கும். நிர்வாகி அனுமதித்த பிறகே அவை அங்கீகரிக்கப்பட்ட ஜோதிடர்களுக்கு கிடைக்கும்.","Set the minimum answer length required from astrologers for new paid questions.":"புதிய கட்டண கேள்விகளுக்கு ஜோதிடர்கள் வழங்க வேண்டிய குறைந்தபட்ச பதில் நீளத்தை அமைக்கவும்.","Default: 20% Astrologer / 80% Admin. Changeable by Admin; total must equal 100%.":"இயல்புநிலை: 20% ஜோதிடர் / 80% நிர்வாகி. நிர்வாகி மாற்றலாம்; மொத்தம் 100% ஆக வேண்டும்.","Minimum withdrawal is ₹300. Admin arranges payment within 24–48 hours.":"குறைந்தபட்ச பணப்பெறுதல் ₹300. நிர்வாகி 24–48 மணி நேரத்தில் பணம் வழங்க ஏற்பாடு செய்வார்.","Bank/UPI details are private and visible only to Admin. They will not be shown again in full to the Astrologer.":"வங்கி/UPI விவரங்கள் தனிப்பட்டவை; நிர்வாகிக்கு மட்டும் தெரியும். ஜோதிடருக்கு முழு விவரங்கள் மீண்டும் காட்டப்படாது.","Astrologer applications are reviewed by SMV ASTRO Admin before their profiles are approved for customer consultations.":"வாடிக்கையாளர் ஆலோசனைக்கு முன் ஜோதிடர் விண்ணப்பங்களை SMV ASTRO நிர்வாகம் மதிப்பாய்வு செய்கிறது.","An account is required for secure customer consultation features. You can create one from Customer Registration or the Login button.":"பாதுகாப்பான வாடிக்கையாளர் ஆலோசனை அம்சங்களுக்கு கணக்கு தேவை. Customer Registration அல்லது Login மூலம் கணக்கை உருவாக்கலாம்.","Yes. Use the Appointment / Consultation Booking form and choose Chat Consultation or Call Consultation. Admin will confirm the appointment.":"ஆம். Appointment / Consultation Booking படிவத்தைப் பயன்படுத்தி Chat அல்லது Call ஆலோசனையைத் தேர்வு செய்யுங்கள். நிர்வாகி முன்பதிவை உறுதிப்படுத்துவார்.","Use this test to check whether the deployed Firebase Function can reach Razorpay with the configured server credentials.":"கட்டமைக்கப்பட்ட server credentials மூலம் Firebase Function Razorpay-ஐ அணுகுகிறதா என்பதைச் சோதிக்க இதைப் பயன்படுத்தவும்.","Create, edit, publish/unpublish, and delete astrology articles. Published articles appear automatically in the public Blog section.":"ஜோதிடக் கட்டுரைகளை உருவாக்க, திருத்த, வெளியிட/நிறுத்த மற்றும் நீக்கலாம். வெளியிடப்பட்ட கட்டுரைகள் Blog பகுதியில் தானாக தோன்றும்.","No matching content found.":"பொருந்தும் தகவல் எதுவும் கிடைக்கவில்லை.","Loading...":"ஏற்றப்படுகிறது...","Loading questions...":"கேள்விகள் ஏற்றப்படுகின்றன...","Loading answers...":"பதில்கள் ஏற்றப்படுகின்றன...","Loading applications...":"விண்ணப்பங்கள் ஏற்றப்படுகின்றன...","Loading appointment requests...":"முன்பதிவு கோரிக்கைகள் ஏற்றப்படுகின்றன...","Loading withdrawal requests...":"பணப்பெறுதல் கோரிக்கைகள் ஏற்றப்படுகின்றன...","Question price is set by SMV ASTRO administration.":"கேள்வி கட்டணத்தை SMV ASTRO நிர்வாகம் நிர்ணயிக்கிறது."
    };
    const attrs=['placeholder','aria-label','title'];
    const originals=new WeakMap();
    function translateNode(root, toTamil){
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      const nodes=[]; let n; while(n=walker.nextNode()) nodes.push(n);
      nodes.forEach(node=>{
        if(!node.nodeValue.trim() || node.parentElement?.closest('script,style')) return;
        if(!originals.has(node)) originals.set(node,node.nodeValue);
        const en=originals.get(node); const clean=en.trim();
        if(toTamil){ if(T[clean]) node.nodeValue=en.replace(clean,T[clean]); }
        else node.nodeValue=en;
      });
      root.querySelectorAll?.(attrs.map(a=>'['+a+']').join(',')).forEach(el=>{
        attrs.forEach(a=>{if(!el.hasAttribute(a))return; const key=a+'__smvEn'; if(!el.dataset[key])el.dataset[key]=el.getAttribute(a); const en=el.dataset[key]; if(toTamil && T[en])el.setAttribute(a,T[en]); else if(!toTamil)el.setAttribute(a,en);});
      });
    }
    const observer=new MutationObserver(muts=>{if(!tamil)return;muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)translateNode(n,true);}));});
    observer.observe(document.body,{childList:true,subtree:true});
    btn.onclick=()=>{tamil=!tamil;document.documentElement.lang=tamil?'ta':'en';document.body.classList.toggle('lang-tamil',tamil);btn.textContent=tamil?'English':'தமிழ்';translateNode(document.body,tamil);};
  }
  window.__smvNotifyQuestionUpdate=async function(questionId,event,reason){
    try{
      const u=auth?.currentUser;
      if(!u||!questionId)return;
      const token=await u.getIdToken();
      const r=await fetch(BACKEND+'/question-notify',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({questionId,event,reason:reason||''})});
      if(!r.ok){const d=await r.json().catch(()=>({}));console.warn('Question email notification failed:',d.error||r.status);}
    }catch(e){console.warn('Question email notification failed:',e);}
  }
  let bookingSubmitting=false;
  function setupBooking(){
    document.querySelectorAll('[data-open-booking]').forEach(b=>b.onclick=()=>{show("appointment");if($('apType'))$('apType').value=b.dataset.openBooking;location.hash='appointment';$('apName')?.focus();});
    const f=$('appointmentForm');if(!f)return;
    if(f.dataset.smvBookingBound==='1')return;
    f.dataset.smvBookingBound='1';
    f.addEventListener('submit',async e=>{
      e.preventDefault();
      if(bookingSubmitting)return;
      const btn=$('appointmentSubmit'),msg=$('appointmentMsg');
      bookingSubmitting=true;btn.disabled=true;btn.textContent='SENDING...';
      try{
        const u=auth?.currentUser;
        if(!u)throw new Error('Please login before booking.');
        await u.reload();
        const freshUser=auth.currentUser;
        if(!freshUser)throw new Error('Please login before booking.');
        if(!freshUser.emailVerified)throw new Error('Please verify your email before booking.');
        const payload={
          name:$('apName')?.value.trim()||'',email:$('apEmail')?.value.trim()||freshUser.email||'',mobile:$('apMobile')?.value.trim()||'',
          type:$('apType')?.value||'',preferredDate:$('apDate')?.value||'',preferredTime:$('apTime')?.value||'',notes:$('apNotes')?.value.trim()||'',
          customerId:freshUser.uid,status:'new'
        };
        if(!payload.name)throw new Error('Please enter your name.');
        if(!payload.mobile)throw new Error('Please enter your mobile number.');
        if(!payload.type)throw new Error('Please select Chat or Call.');
        if(!payload.preferredDate)throw new Error('Please select your preferred date.');
        if(!payload.preferredTime)throw new Error('Please select your preferred time.');
        const token=await freshUser.getIdToken(true);
        const r=await fetch(BACKEND+'/appointment-booking',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(payload),cache:'no-store'});
        const d=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(d.error||`Booking request returned HTTP ${r.status}.`);
        console.log('Booking created:',d.bookingId);
        msg.innerHTML='<span class="success">✓ Booking request submitted.<br><b>Booking ID:</b> '+esc(d.bookingId||'')+'<br>Admin will confirm your consultation.</span>';
        f.reset();
      }catch(err){console.error('Appointment booking error:',err);msg.innerHTML='<span class="error">'+esc(err.message||String(err))+'</span>';}
      finally{bookingSubmitting=false;btn.disabled=false;btn.textContent='REQUEST APPOINTMENT';}
    });
  }
  function setupAsk(){
  // IMPORTANT: this script is a separate ES module from the main app module.
  // openQuestionService() is therefore not in this module's lexical scope.
  // Always cross the module boundary through the explicit window bridge.
  $('quickAskBtn')?.addEventListener('click',e=>{
    e.preventDefault();
    const openQuestion=window.__smvOpenQuestionService;
    if(typeof openQuestion==='function'){
      openQuestion();
    }else{
      window.__smvPendingAskClick=true;
      console.error('SMV ASTRO: question service bridge is not ready.');
    }
  });
  document.querySelectorAll('[data-open-booking]').forEach(b=>{
    b.onclick=()=>{
      show('appointment');
      if($('apType')) $('apType').value=b.dataset.openBooking;
      $('appointment')?.scrollIntoView({behavior:'smooth',block:'start'});
      $('apName')?.focus();
    };
  });
}
  let adminRefreshRunning=false;
  async function refreshAdminSections(){
    if($('admin')?.classList.contains('hidden'))return;
    if(adminRefreshRunning)return;
    adminRefreshRunning=true;
    try{
      await loadAdminAppointments();
    }finally{adminRefreshRunning=false;}
  }
  function hookAdmin(){
    if(window.__SMV_ADMIN_HOOKED)return;
    window.__SMV_ADMIN_HOOKED=true;
    window.__smvRefreshAdminSections=refreshAdminSections;
  }
  setupLanguage();setupBooking();setupAsk();loadQuestionPrice().catch(()=>{});loadAstroCards().catch(()=>{});console.log("AUTH CHECK:", currentUser);hookAdmin();
  // Admin data loaders are triggered explicitly after Admin authentication.
})();
  document.getElementById("contactNav")?.addEventListener("click",e=>{e.preventDefault();document.getElementById("contact")?.classList.remove("hidden");document.getElementById("contact")?.scrollIntoView({behavior:"smooth",block:"start"});});
