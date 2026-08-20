
(function(){
  const config={apiKey:"AIzaSyCKXyfZ9sjGmej7ygxHpzHNcNysMXHuvSs",authDomain:"smv-astro.firebaseapp.com",projectId:"smv-astro",storageBucket:"smv-astro.firebasestorage.app",messagingSenderId:"299081899217",appId:"1:299081899217:web:8d558df08e86037ea539f0"};
  const $=id=>document.getElementById(id);
  const show=id=>$(id)?.classList.remove("hidden");
  const hide=id=>$(id)?.classList.add("hidden");
  const go=id=>$(id)?.scrollIntoView({behavior:"smooth",block:"start"});
  let fallbackAuth=null, fallbackUser=null, firebaseReady=null;
  async function fb(){
    if(firebaseReady) return firebaseReady;
    firebaseReady=Promise.all([
      import("https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js")
    ]).then(([appMod,authMod])=>{
      const app=appMod.initializeApp(config,"smv-fallback");
      fallbackAuth=authMod.getAuth(app);
      return authMod;
    });
    return firebaseReady;
  }
  function modal(html){
    const m=$("modal"), c=$("modalContent");
    if(!m||!c)return;
    c.innerHTML=html;m.classList.remove("hidden");
  }
  function loginUI(){
    modal(`<h2>Login</h2>
      <label>Email</label><input id="fbLoginEmail" type="email" autocomplete="email" placeholder="Email">
      <label>Password</label><input id="fbLoginPassword" type="password" autocomplete="current-password" placeholder="Password">
      <button class="btn" id="fbLoginSubmit">LOGIN</button>
      <div id="fbLoginMsg" class="small" style="margin-top:10px"></div>`);
    $("fbLoginSubmit").onclick=async()=>{
      const b=$("fbLoginSubmit"), msg=$("fbLoginMsg"); b.disabled=true;
      try{
        const a=await fb();
        const r=await a.signInWithEmailAndPassword(fallbackAuth,$("fbLoginEmail").value.trim(),$("fbLoginPassword").value);
        fallbackUser=r.user; $("authBtn").textContent="Logout"; $("modal").classList.add("hidden");
        if(window.__smvPendingAsk){window.__smvPendingAsk=false; show("ask-flow"); go("ask-flow");}
      }catch(e){msg.innerHTML='<span class="error">'+(e.message||"Login failed")+'</span>';}
      finally{b.disabled=false;}
    };
  }
  function registerUI(kind){
    const title=kind==="astro"?"Astrologer Registration":"Customer Registration";
    modal(`<h2>${title}</h2>
      <label>Name</label><input id="fbRegName" autocomplete="name" placeholder="Full name">
      <label>Email</label><input id="fbRegEmail" type="email" autocomplete="email" placeholder="Email">
      <label>Password</label><input id="fbRegPassword" type="password" autocomplete="new-password" placeholder="Minimum 6 characters">
      <button class="btn" id="fbRegSubmit">REGISTER</button>
      <div id="fbRegMsg" class="small" style="margin-top:10px"></div>`);
    $("fbRegSubmit").onclick=async()=>{
      const b=$("fbRegSubmit"), msg=$("fbRegMsg"); b.disabled=true;
      try{
        const a=await fb();
        const r=await a.createUserWithEmailAndPassword(fallbackAuth,$("fbRegEmail").value.trim(),$("fbRegPassword").value);
        fallbackUser=r.user; $("authBtn").textContent="Logout"; $("modal").classList.add("hidden");
      }catch(e){
        let text=e?.message||"Registration failed";
        if(e?.code==="auth/email-already-in-use") text="This email is already registered. Please use Login. If you have not verified your email, choose Resend Verification Email.";
        msg.innerHTML='<span class="error">'+escapeHtml(text)+'</span>';
      }
      finally{b.disabled=false;}
    };
  }
  function bindFallback(){
    if(window.__SMV_FALLBACK_BOUND)return;
    window.__SMV_FALLBACK_BOUND=true;
    $("authBtn")?.addEventListener("click",()=>fallbackUser?null:loginUI());
    $("customerRegBtn")?.addEventListener("click",()=>registerUI("customer"));
    // Astrologer registration is handled only by the main Full Registration page.
    $("privateConsultBtn")?.addEventListener("click",e=>{
  e.preventDefault();
  if(window.__smvOpenQuestionService){window.__smvOpenQuestionService();return;}
  if(fallbackUser){show("ask-flow");go("ask-flow");}else{window.__smvPendingAsk=true;loginUI();}
});
  }
  // The main module normally binds these. If it failed to load, keep the essential public buttons usable.
  setTimeout(()=>{if(!window.__SMV_APP_READY) bindFallback();},1200);
})();
