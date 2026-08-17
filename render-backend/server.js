<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>SMV ASTRO SERVICES</title>
<style>
:root{
  --primary:#8f1d1d;--primary2:#b52a2a;--gold:#b8860b;--gold2:#e0b84f;
  --cream:#fffaf0;--bg:#fffdf8;--text:#3b2116;--card:#ffffff;--muted:#715f55;
  --line:#ead9b7;--soft:#fff1d2;--success:#166534;--danger:#a51d1d;
  --maroon:#6f1515;--deep:#4b0e0e;
}
*{box-sizing:border-box}
html{overflow-x:hidden;scroll-behavior:smooth}
body{
  margin:0;font-family:Inter,Arial,Helvetica,sans-serif;color:var(--text);overflow-x:hidden;
  background:
    radial-gradient(circle at 10% 8%,rgba(184,134,11,.07) 0 2px,transparent 3px),
    radial-gradient(circle at 90% 15%,rgba(143,29,29,.045) 0 2px,transparent 3px),
    linear-gradient(180deg,#fffdf8 0%,#fff8ec 52%,#fffdf9 100%);
  background-size:34px 34px,42px 42px,auto;
}
header{
  position:sticky;top:0;background:rgba(255,250,240,.97);border-bottom:3px double var(--gold);
  z-index:100;box-shadow:0 5px 20px rgba(111,21,21,.10);
}
header:after{content:"✦  ॐ  ✦";display:block;text-align:center;color:var(--gold);font-size:10px;letter-spacing:8px;height:13px;line-height:10px;background:#fffaf0}
.nav{
  max-width:1160px;margin:auto;padding:10px 16px;display:flex;align-items:center;
  justify-content:space-between;gap:14px;min-width:0;
}
.brand{display:flex;align-items:center;gap:11px;min-width:0}
.brand-logo{
  width:50px;height:50px;border-radius:50%;object-fit:cover;display:block;flex:none;
  border:2px solid var(--gold);background:#fff7df;box-shadow:0 0 0 4px rgba(184,134,11,.10),0 5px 14px rgba(111,21,21,.16)
}
.brand-text{min-width:0}
.logo{font-size:25px;line-height:1;font-weight:900;letter-spacing:1.5px;color:var(--primary);white-space:nowrap;font-family:Georgia,"Times New Roman",serif}
.brand-sub{display:block;margin-top:4px;font-size:10px;letter-spacing:1.7px;color:#8a6b43;font-weight:800;white-space:nowrap}
nav{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;min-width:0}
nav a{margin:0;padding:9px 10px;text-decoration:none;color:#5a3527;font-size:13px;font-weight:800;border-radius:8px;white-space:nowrap}
nav a:hover{background:var(--soft);color:var(--primary)}
button{cursor:pointer;font:inherit;max-width:100%}
.btn{
  border:1px solid #751515;border-radius:8px;padding:11px 16px;
  background:linear-gradient(135deg,var(--primary),var(--primary2));color:#fff;font-weight:800;
  box-shadow:0 5px 13px rgba(111,21,21,.18);transition:transform .15s,box-shadow .15s;max-width:100%;
}
.btn:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(111,21,21,.24)}
.btn.alt{background:linear-gradient(135deg,#f2d47d,var(--gold));color:#4a2b08;border-color:#a77708}
.btn.gray{background:#f5eee3;color:#5b4336;border-color:#ddcdb8;box-shadow:none}
.container{max-width:1160px;margin:auto;padding:22px 16px;min-width:0}
.hero{
  position:relative;padding:72px 22px;text-align:center;border:1px solid #dfc78e;border-radius:18px;
  background:
    linear-gradient(rgba(255,252,244,.93),rgba(255,247,226,.95)),
    radial-gradient(circle at 50% 50%,rgba(184,134,11,.15),transparent 58%);
  box-shadow:0 16px 38px rgba(111,21,21,.09),inset 0 0 0 5px rgba(184,134,11,.055);overflow:hidden;
}
.hero:before,.hero:after{content:"";position:absolute;top:18px;bottom:18px;width:22px;border-top:2px solid var(--gold);border-bottom:2px solid var(--gold);opacity:.7}
.hero:before{left:18px;border-left:2px solid var(--gold);border-radius:12px 0 0 12px}
.hero:after{right:18px;border-right:2px solid var(--gold);border-radius:0 12px 12px 0}
.hero .badge{position:relative;z-index:1}
.hero h1{position:relative;z-index:1;font-family:Georgia,"Times New Roman",serif;font-size:clamp(34px,5vw,50px);margin:13px 0;color:var(--primary);line-height:1.15;letter-spacing:.3px}
.hero p{position:relative;z-index:1;color:var(--muted);font-size:17px;line-height:1.7;max-width:700px;margin:0 auto 22px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));gap:16px;min-width:0}
.card{
  position:relative;background:var(--card);padding:20px;border-radius:13px;border:1px solid var(--line);
  box-shadow:0 8px 23px rgba(111,21,21,.065);min-width:0;max-width:100%;overflow:hidden;
}
.card:before{content:"";display:block;height:3px;width:64px;background:linear-gradient(90deg,var(--primary),var(--gold));margin-bottom:12px;border-radius:3px}
.card h2,.card h3,.card h4{overflow-wrap:anywhere;word-break:break-word;color:var(--maroon);font-family:Georgia,"Times New Roman",serif}
.card p,.card div,.card span,.card b,.card strong,.card label{max-width:100%;overflow-wrap:anywhere;word-break:break-word;white-space:normal}
input,select,textarea{width:100%;max-width:100%;min-width:0;padding:12px;margin:7px 0;border:1px solid #dccbb0;border-radius:8px;font-size:15px;background:#fffdf9;color:var(--text)}
input:focus,select:focus,textarea:focus{outline:2px solid rgba(184,134,11,.22);border-color:var(--gold)}
textarea{min-height:110px;resize:vertical;line-height:1.6;overflow-wrap:anywhere;word-break:break-word}
.hidden{display:none!important}
.badge{display:inline-block;padding:6px 11px;border-radius:99px;background:#fff0d0;color:var(--maroon);border:1px solid #e4c77e;font-size:12px;font-weight:900;letter-spacing:.3px}
.small{font-size:13px;color:var(--muted);line-height:1.55;overflow-wrap:anywhere;word-break:break-word;white-space:normal}
.error{color:var(--danger)}.success{color:var(--success)}
.modal{position:fixed;inset:0;background:rgba(61,15,15,.68);display:flex;align-items:center;justify-content:center;padding:15px;z-index:200;overflow:auto}
.modalbox{background:#fffaf0;max-width:480px;width:100%;border-radius:14px;padding:22px;max-height:90vh;overflow:auto;border:1px solid #dfc78e;min-width:0;box-shadow:0 20px 50px rgba(61,15,15,.22)}
section{scroll-margin-top:90px;min-width:0}
section>h2{color:var(--maroon);font-family:Georgia,"Times New Roman",serif}
.empty{padding:25px;text-align:center;color:var(--muted);overflow-wrap:anywhere;word-break:break-word}
.stat{background:linear-gradient(180deg,#fff,#fff8e9);border:1px solid var(--line);border-radius:13px;padding:18px;box-shadow:0 5px 18px rgba(111,21,21,.05);min-width:0;overflow:hidden}
.stat b{font-size:28px;color:var(--primary);display:block;margin-top:5px;overflow-wrap:anywhere}
.action-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;min-width:0}.action-row>*{min-width:0;max-width:100%}
#admin,#adminSummary,#pendingAstros,#adminAnswers,#adminReviews,#adminQuestions,#dashboard,#dashboardContent,#astroList,#astroCards,#ask-flow,#register-flow{min-width:0;max-width:100%;overflow-x:hidden}
#adminQuestions>div,#adminAnswers>div,#pendingAstros>div,#adminReviews>div{min-width:0!important;max-width:100%!important;overflow:hidden!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
#adminQuestions b,#adminAnswers b,#pendingAstros b,#adminReviews b,#adminQuestions p,#adminAnswers p,#pendingAstros p,#adminReviews p{white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;max-width:100%!important}
footer{text-align:center;padding:35px 16px;color:var(--muted);border-top:3px double var(--gold);margin-top:30px;background:#fffaf0}

/* V53 homepage refinement: open welcome composition + separated registration choices */
.hero{
  position:relative;
  padding:58px 16px 52px;
  text-align:center;
  border:0;
  border-radius:0;
  background:transparent;
  box-shadow:none;
  overflow:visible;
  max-width:980px;
  margin:0 auto;
}
.hero:before,.hero:after{display:none}
.hero:after{content:""}
.hero .badge{
  position:relative;
  display:inline-block;
  padding:8px 16px;
  border:0;
  border-radius:0;
  background:transparent;
  color:var(--maroon);
  font-size:12px;
  letter-spacing:1.4px;
}
.hero .badge:before,.hero .badge:after{
  content:"✦";
  color:var(--gold);
  margin:0 10px;
}
.hero h1{
  margin:18px auto 14px;
  max-width:850px;
  font-family:Georgia,"Times New Roman",serif;
  font-size:clamp(38px,6vw,62px);
  line-height:1.08;
  color:var(--primary);
  letter-spacing:.2px;
  text-shadow:0 2px 0 rgba(184,134,11,.10);
}
.hero p{
  max-width:760px;
  margin:0 auto 26px;
  color:#665247;
  font-size:17px;
  line-height:1.8;
}
.hero .btn{min-width:210px;border-radius:10px}
.hero-ornament{margin:0 auto 12px;color:var(--gold);font-size:18px;letter-spacing:8px}
.registration-panel{margin-top:12px;padding:10px 0 35px}
.registration-intro{text-align:center;max-width:720px;margin:0 auto 24px}
.registration-intro h2{margin-bottom:7px}
.registration-intro p{color:var(--muted);line-height:1.7}
.registration-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;max-width:900px;margin:0 auto}
.registration-option{
  position:relative;background:rgba(255,255,255,.82);padding:24px 22px;border:1px solid #e4cf9d;
  border-radius:12px;box-shadow:0 10px 25px rgba(111,21,21,.06);text-align:center;overflow:hidden
}
.registration-option:before{content:"";display:block;width:70px;height:2px;margin:0 auto 14px;background:linear-gradient(90deg,var(--gold),var(--primary),var(--gold))}
.registration-option h3{margin:8px 0 7px;color:var(--maroon);font-family:Georgia,"Times New Roman",serif;font-size:24px}
.registration-option p{min-height:48px;color:var(--muted);line-height:1.6;margin:0 auto 17px;max-width:340px}
.registration-option .btn{min-width:190px}
@media(max-width:760px){
  .hero{padding:42px 10px 36px}
  .hero h1{font-size:clamp(34px,10vw,48px)}
  .hero p{font-size:15px;line-height:1.7}
  .registration-options{grid-template-columns:1fr;gap:14px}
}


/* V55 homepage refinement: clean temple-inspired editorial layout */
.home-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:8px auto 22px;color:var(--gold);font-size:12px;letter-spacing:3px}
.home-rule:before,.home-rule:after{content:"";height:1px;width:min(150px,20vw);background:linear-gradient(90deg,transparent,var(--gold));opacity:.8}
.home-rule:after{background:linear-gradient(90deg,var(--gold),transparent)}
.hero{max-width:1040px;padding:44px 14px 38px}
.hero .badge{padding:0;background:transparent;border:0;color:#8a6421;font-size:11px;letter-spacing:2px}
.hero h1{max-width:900px;margin:14px auto 13px;font-size:clamp(38px,6vw,64px);line-height:1.08;color:#7e1818;text-shadow:none}
.hero p{max-width:760px;margin:0 auto 25px;color:#5f5148;font-size:17px;line-height:1.85}
.hero .btn{min-width:220px;padding:13px 22px;border-radius:9px}
.hero-subline{max-width:720px;margin:24px auto 0;display:flex;align-items:center;justify-content:center;gap:12px;color:#9a722a;font-size:11px;letter-spacing:1.8px;text-transform:uppercase}
.hero-subline:before,.hero-subline:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,transparent,#d4b15a)}
.hero-subline:after{background:linear-gradient(90deg,#d4b15a,transparent)}
.registration-panel{padding-top:8px}
.registration-intro{max-width:820px;margin:0 auto 28px}
.registration-intro h2{font-size:clamp(28px,4vw,38px);margin:12px 0 8px;color:#7e1818}
.registration-intro p{max-width:680px;margin:0 auto;color:#6a5a50;line-height:1.75}
.registration-options{max-width:960px;gap:20px}
.registration-option{min-height:320px;padding:28px 24px 26px;border-radius:14px;background:rgba(255,255,255,.9);box-shadow:0 9px 24px rgba(86,37,16,.07);border:1px solid #e1cf9f}
.registration-option:after{inset:6px;border-radius:10px}
.registration-icon{width:70px;height:70px;margin-bottom:13px}
.registration-option h3{font-size:23px;margin:6px 0 8px}
.registration-option p{min-height:74px;line-height:1.65}
.customer-option{border-top:3px solid #8f1d1d}
.astrologer-option{border-top:3px solid #b8860b}
@media(max-width:760px){
 .hero{padding:34px 8px 32px}.hero h1{font-size:clamp(34px,10vw,49px)}.hero p{font-size:15px;line-height:1.75}.home-rule:before,.home-rule:after{width:18vw}.hero-subline{font-size:9px;letter-spacing:1.2px}.registration-option{min-height:0}
}

/* V54 premium registration identity refinement */
.hero .badge{font-family:Georgia,"Times New Roman",serif;font-weight:700;letter-spacing:1.8px}
.hero h1{font-weight:700}
.registration-options{gap:24px;max-width:940px}
.registration-option{padding:30px 24px 28px;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,249,235,.96));border:1px solid #d8b866;box-shadow:0 12px 30px rgba(111,21,21,.08)}
.registration-option:before{display:none}
.registration-option:after{content:"";position:absolute;inset:8px;border:1px solid rgba(184,134,11,.18);border-radius:13px;pointer-events:none}
.registration-icon{position:relative;z-index:1;width:78px;height:78px;margin:0 auto 15px;display:grid;place-items:center;border-radius:50%;color:var(--gold);background:radial-gradient(circle,#fff7d8 0%,#f7df9b 65%,#ead083 100%);border:2px solid var(--gold);box-shadow:0 5px 15px rgba(184,134,11,.18)}
.registration-icon svg{width:54px;height:54px}
.registration-kicker{position:relative;z-index:1;color:#96702d;font-size:10px;font-weight:900;letter-spacing:1.6px;margin-bottom:7px}
.registration-option h3{position:relative;z-index:1;font-size:25px;margin:7px 0 9px}
.registration-option p{position:relative;z-index:1;min-height:72px}
.registration-option .btn{position:relative;z-index:1;min-width:210px}
.btn-icon{font-size:12px;margin-right:4px}
.customer-option{border-top:3px solid var(--primary)}
.astrologer-option{border-top:3px solid var(--gold)}
@media(max-width:760px){.registration-options{gap:16px}.registration-option{padding:26px 18px}.registration-option p{min-height:0}.registration-icon{width:70px;height:70px}.registration-icon svg{width:48px;height:48px}}

@media(max-width:760px){
  .nav{padding:9px 10px;align-items:center}.brand-logo{width:42px;height:42px}.logo{font-size:21px}.brand-sub{font-size:8px;letter-spacing:1px}
  nav{gap:3px}nav a{padding:7px 6px;font-size:11px}nav .btn{padding:8px 9px;font-size:11px}.container{padding:16px 10px}
  .hero{padding:42px 10px 36px}.hero p{font-size:15px}
}
@media(max-width:520px){
  .brand-sub{display:none}.logo{font-size:20px}.nav{flex-wrap:wrap}.brand{flex:1 1 auto}nav{width:100%;justify-content:flex-start;overflow:visible}
  nav a,nav .btn{flex:0 0 auto}.grid{grid-template-columns:1fr}.card{padding:16px}.action-row{flex-direction:column}.action-row .btn{width:100%}
}

/* V56/V57 homepage registration: keep Customer and Astrologer entry points visible and separate. */
.homepage-registration{display:block!important;margin:10px auto 38px!important;padding:8px 0 24px}
.homepage-registration .registration-intro .hidden{display:none!important}
.homepage-registration .registration-options{margin-top:18px}
.homepage-registration .registration-option{min-height:300px}
@media(max-width:760px){.homepage-registration{margin-bottom:28px!important}.homepage-registration .registration-option{min-height:0}}

/* V61 all-features expansion */
.feature-section{max-width:1160px;margin:34px auto;padding:0 16px;scroll-margin-top:90px}
.feature-shell{padding:20px}
.feature-top{display:flex;gap:18px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap}
.feature-top>div:first-child{min-width:240px;flex:1}
.search-wrap{display:flex;gap:7px;min-width:min(100%,360px);flex:0 1 430px}
.search-wrap input{margin:0}.search-wrap .btn{white-space:nowrap}
.announcement{display:flex;gap:9px;align-items:flex-start;margin:14px 0;padding:12px 14px;border:1px solid #e5cf9b;border-radius:10px;background:#fff7df;color:#5a3527;font-weight:700}
.feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}
.feature-tile{display:flex;flex-direction:column;gap:4px;padding:14px;border:1px solid var(--line);border-radius:12px;background:#fffdf9;text-decoration:none;color:var(--text);box-shadow:0 4px 12px rgba(111,21,21,.05);transition:.15s}
.feature-tile:hover{transform:translateY(-2px);border-color:#d4b36a}.feature-tile span{font-size:24px}.feature-tile b{color:var(--maroon);font-size:14px}.feature-tile small{color:var(--muted)}
.service-card{min-height:210px}.service-icon{font-size:30px}.service-card h3{margin-bottom:7px}
.faq-list{display:grid;gap:10px}.faq-list details{background:#fff;border:1px solid var(--line);border-radius:11px;padding:13px 15px;box-shadow:0 4px 12px rgba(111,21,21,.04)}.faq-list summary{cursor:pointer;font-weight:800;color:var(--maroon)}.faq-list p{color:var(--muted);line-height:1.6;margin:10px 0 2px}
.review-card{height:100%}.stars{letter-spacing:2px;color:var(--gold);font-size:18px}
.wa-float{position:fixed;right:16px;bottom:18px;z-index:150;background:#1f9d55;color:#fff;border-radius:999px;padding:12px 16px;text-decoration:none;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.2);display:flex;gap:7px;align-items:center}.wa-float:hover{transform:translateY(-2px)}
.lang-tamil{font-family:"Noto Sans Tamil",Arial,sans-serif}
@media(max-width:700px){.feature-section{padding:0 10px}.feature-shell{padding:14px}.search-wrap{min-width:100%}.search-wrap input{flex:1}.wa-float{right:10px;bottom:10px;padding:10px 13px;font-size:13px}}

/* V62 blog manager */
#blogList .blog-card{min-width:0}
.blog-content{white-space:pre-wrap;line-height:1.75}
.admin-blog-row{border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px;background:#fffdf8}
.admin-blog-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
@media(max-width:650px){.action-row[style*="grid-template-columns"]{grid-template-columns:1fr!important}}
</style>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<style>
.astro-public-profile{overflow:hidden}
.astro-public-profile .small{overflow-wrap:anywhere;word-break:break-word}
.private-field{display:none!important}
</style><style>
.astro-public-profile{overflow:hidden}
.astro-public-profile .small,.astro-public-profile p{overflow-wrap:anywhere;word-break:break-word}
.status-processing{font-weight:800}
.timeline{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px;padding:10px;border:1px solid var(--line);border-radius:12px;background:#fffdf8}
.timeline-step{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#f7f1e4}
.timeline-step.done{color:var(--success);font-weight:800;background:#edf8ef}
.timeline-step span{font-weight:900}

</style><style>#consultation-entry{display:none!important}</style></head>
<body>
<header>
<div class="nav">
<div class="brand">
<img alt="SMV Astro" class="brand-logo" src="assets/logo.png"/>
<div class="brand-text">
<div class="logo">SMV ASTRO</div>
<span class="brand-sub">ASTROLOGY CONSULTATION</span>
</div>
</div>
<nav>
<a href="#home">Home</a>
<a href="#featureHub">Services</a>
<a href="#ask-service" id="consultationNav">Consultation</a>
<a href="#contact">Contact</a>
<button class="btn gray" id="langToggle" type="button" style="padding:8px 10px">தமிழ்</button>
<a class="hidden" href="#dashboard" id="dashLink">Dashboard</a><a class="hidden" href="#admin" id="adminLink">Admin</a>
<button class="btn" id="authBtn">Login</button>
</nav>
</div>
</header>
<main class="container">
<section class="hero" id="home">
<div class="home-rule"><span>ॐ</span><span>VEDA • JYOTISHA • GUIDANCE</span><span>ॐ</span></div>
<span class="badge">WELCOME TO SMV ASTRO SERVICES</span>
<h1>Guidance Through the Wisdom of Jyotisha</h1>
<p>Rooted in the time-honoured Indian tradition of Jyotisha, we bring thoughtful astrological guidance for life, relationships, career and important decisions — with trusted astrologers and a private consultation experience.</p>
<div class="hero-subline"><span>Traditional Wisdom</span><span>•</span><span>Personal Guidance</span><span>•</span><span>Trusted Consultation</span></div>
</section>

<section id="featureHub" style="margin-top:12px">
  <div class="card feature-shell">
    <div class="feature-top">
      <div>
        <div class="home-rule"><span>✦</span><span data-i18n="services">SERVICES & PRICING</span><span>✦</span></div>
  <h2 data-i18n="servicesTitle">Choose Your Guidance</h2>
  <div class="grid site-searchable" data-search="chat consultation pricing astrology">
    <div class="card service-card"><div class="service-icon">💬</div><h3>Private Chat Consultation</h3><p class="small">A private conversation with an approved astrologer for focused guidance.</p><button class="btn" type="button" data-open-booking="Chat Consultation">BOOK CHAT</button></div>
    <div class="card service-card"><div class="service-icon">📞</div><h3>Private Call Consultation</h3><p class="small">Choose a preferred time and receive a personal consultation by call.</p><button class="btn" type="button" data-open-booking="Call Consultation">BOOK CALL</button></div>
    <div class="card service-card"><div class="service-icon">🪐</div><h3>Ask Your Astrology Question</h3><p class="small">Submit birth details and a question for an approved astrologer. Current price: <b id="publicQuestionPrice">Loading...</b></p><button class="btn alt" id="featureAskBtn" type="button">ASK A QUESTION</button></div>
  </div>
</section>

<section id="appointment" class="feature-section">
  <div class="card">
    <div class="home-rule"><span>✦</span><span>APPOINTMENT / CONSULTATION BOOKING</span><span>✦</span></div>
    <h2>Book a Private Consultation</h2>
    <p class="small">Choose Chat or Call. Submit your preferred date/time and our admin team will confirm the appointment.</p>
    <form id="appointmentForm" class="grid" style="margin-top:12px">
      <div><label>Name *</label><input id="apName" required maxlength="100" placeholder="Full name"/></div>
      <div><label>Email *</label><input id="apEmail" type="email" required maxlength="160" placeholder="Email"/></div>
      <div><label>Mobile *</label><input id="apMobile" type="tel" required maxlength="20" placeholder="Mobile number"/></div>
      <div><label>Consultation *</label><select id="apType" required><option value="Chat Consultation">Chat Consultation</option><option value="Call Consultation">Call Consultation</option></select></div>
      <div><label>Preferred Date *</label><input id="apDate" type="date" required/></div>
      <div><label>Preferred Time *</label><input id="apTime" type="time" required/></div>
      <div style="grid-column:1/-1"><label>Notes / Topic</label><textarea id="apNotes" maxlength="2000" placeholder="Tell us briefly what you would like guidance on..."></textarea></div>
      <div style="grid-column:1/-1"><button class="btn" id="appointmentSubmit" type="submit">REQUEST APPOINTMENT</button><div id="appointmentMsg" class="small" style="margin-top:10px"></div></div>
    </form>
  </div>
</section>

<section id="reviews" class="feature-section">
  <div class="home-rule"><span>✦</span><span>CUSTOMER REVIEWS</span><span>✦</span></div>
  <h2>What Our Customers Say</h2>
  <div class="grid" id="publicReviews"><div class="empty">Loading verified reviews...</div></div>
</section>

<section id="blog" class="feature-section">
  <div class="home-rule"><span>✦</span><span>ASTROLOGY BLOG</span><span>✦</span></div>
  <h2>Guidance & Astrology Articles</h2>
  <p class="small">Articles published by SMV ASTRO Admin will appear here.</p>
  <div class="grid" id="blogList">
    <div class="empty">Loading articles...</div>
  </div>
</section>

<section id="faq" class="feature-section">
  <div class="home-rule"><span>✦</span><span>FREQUENTLY ASKED QUESTIONS</span><span>✦</span></div>
  <h2>FAQ</h2>
  <div class="faq-list">
    <details class="site-searchable" data-search="faq payment razorpay question"><summary>How do I ask an astrology question?</summary><p>Login as a customer, choose Ask Your Questions, enter the birth details and question, then complete the secure payment flow.</p></details>
    <details class="site-searchable" data-search="faq consultation chat call appointment"><summary>Can I book a Chat or Call consultation?</summary><p>Yes. Use the Appointment / Consultation Booking form and choose Chat Consultation or Call Consultation. Admin will confirm the appointment.</p></details>
    <details class="site-searchable" data-search="faq astrologer approved registration"><summary>Are astrologers verified?</summary><p>Astrologer applications are reviewed by SMV ASTRO Admin before their profiles are approved for customer consultations.</p></details>
    <details class="site-searchable" data-search="faq contact query email"><summary>How can I contact SMV ASTRO?</summary><p>Use the Contact Us form or the WhatsApp enquiry button to send your query directly.</p></details>
    <details class="site-searchable" data-search="faq login account password"><summary>Do I need an account?</summary><p>An account is required for secure customer consultation features. You can create one from Customer Registration or the Login button.</p></details>
  </div>
</section>

<section class="registration-panel homepage-registration" id="register-flow" style="margin-top:8px">
<div class="container" style="padding-top:0;padding-bottom:0">
<div class="registration-intro">
<button class="btn gray hidden" id="regBackBtn">← Back to Home</button>
<div class="home-rule" style="margin-top:22px;margin-bottom:14px"><span>✦</span><span>BEGIN YOUR JOURNEY WITH SMV ASTRO</span><span>✦</span></div>
<h2>Choose Your Path</h2>
<p>Register according to your purpose. Customer and Astrologer accounts are kept separate, with each journey designed for its own needs.</p>
</div>
<div class="registration-options">
<div class="registration-option customer-option">
<div aria-hidden="true" class="registration-icon">
<svg role="img" viewbox="0 0 64 64"><circle cx="32" cy="32" fill="none" r="29" stroke="currentColor" stroke-width="2"></circle><circle cx="32" cy="24" fill="currentColor" r="8"></circle><path d="M17 48c2.8-8.2 8-12 15-12s12.2 3.8 15 12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="4"></path></svg>
</div>
<div class="registration-kicker">FOR SEEKERS OF GUIDANCE</div>
<h3>Customer Registration</h3>
<p>Create your private customer account to access the secure consultation area and choose an approved astrologer.</p>
<button class="btn" id="customerRegBtn"><span class="btn-icon">✦</span> Register as Customer</button>
</div>
<div class="registration-option astrologer-option">
<div aria-hidden="true" class="registration-icon">
<svg role="img" viewbox="0 0 64 64"><circle cx="32" cy="32" fill="none" r="29" stroke="currentColor" stroke-width="2"></circle><path d="M19 46h26M22 42V25l10-8 10 8v17M26 42V29h12v13M32 10v5M29 13h6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"></path><circle cx="50" cy="16" fill="currentColor" r="3"></circle></svg>
</div>
<div class="registration-kicker">FOR ASTROLOGY PROFESSIONALS</div>
<h3>Astrologer Registration</h3>
<p>Apply to become an SMV ASTRO astrologer. Your professional profile will be reviewed before it becomes public.</p>
<button class="btn alt" id="astroRegBtn"><span class="btn-icon">✦</span> Register as Astrologer</button>
</div>
</div>
</div>
</section>
<section id="ask-service" style="margin-top:45px;scroll-margin-top:90px"><div class="card" style="text-align:center"><div class="home-rule"><span>✦</span><span>SMV ASTRO QUESTION SERVICE</span><span>✦</span></div><h2>ASK YOUR QUESTIONS</h2><p class="small" style="max-width:680px;margin:0 auto 18px">Submit your astrology question with the birth details of the person concerned. The question is allocated by SMV ASTRO administration to a suitable approved astrologer.</p><button class="btn" id="askServiceBtn">ASK YOUR QUESTIONS</button></div></section>
<section class="hidden" id="dashboard" style="margin-top:45px">
<h2 id="dashboardTitle">My Dashboard</h2>
<div class="small" id="sessionNotice" style="margin:8px 0 14px"></div>
<div id="dashboardContent"></div>
</section>
</main>
<section class="hidden" id="astro-register-form" style="margin-top:30px">
<div class="card">
<button class="btn gray" id="astroRegBackBtn">← Back</button>
<h2 style="margin-top:18px">Astrologer Registration</h2>
<p class="small">Your profile will remain pending until SMV ASTRO approves it.</p>
<form id="astroRegistrationForm">
<input id="arName" placeholder="Full Name" required="" style="width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border:1px solid #ddd;border-radius:10px"/>
<input id="arMobile" placeholder="Mobile Number" required="" style="width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border:1px solid #ddd;border-radius:10px"/>
<input id="arEmail" placeholder="Email" required="" style="width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border:1px solid #ddd;border-radius:10px" type="email"/>
<label class="small">Profile Photo</label>
<input accept="image/*" id="arPhoto" required="" type="file"/>
<input id="arSpecialization" placeholder="Expertise / Specialization (Vedic, KP, Numerology...)" required="" style="width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border:1px solid #ddd;border-radius:10px"/>
<input id="arExperience" min="0" placeholder="Experience (years)" required="" style="width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border:1px solid #ddd;border-radius:10px" type="number"/>
<textarea id="arBio" placeholder="Professional Bio" required="" rows="5" style="width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border:1px solid #ddd;border-radius:10px"></textarea>
<h3>Payment Method</h3>
<input id="arBankName" placeholder="Bank Name" required=""/>
<input id="arAccountName" placeholder="Account Holder Name" required=""/>
<input id="arAccountNumber" inputmode="numeric" placeholder="Bank Account Number" required=""/>
<input id="arIfsc" placeholder="IFSC Code" required=""/>
<input id="arUpi" placeholder="UPI ID (optional)"/>
<p class="small">Bank/UPI details are private and visible only to Admin. They will not be shown again in full to the Astrologer.</p>
<input id="arPassword" minlength="6" placeholder="Password (min 6 characters)" required="" style="width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border:1px solid #ddd;border-radius:10px" type="password"/>
<button class="btn" style="margin-top:8px" type="submit">SUBMIT REGISTRATION</button>
<div class="small" id="astroRegMsg" style="margin-top:10px"></div>
</form>
</div>
</section>
<section class="hidden" id="astro-flow"></section>
<section class="hidden" id="ask-flow" style="margin-top:30px">
<div class="card">
<button class="btn gray" id="backAstroBtn">← Back</button>
<h2 id="askTitle" style="margin-top:18px">Ask Your Question</h2>
<p class="small" id="askRate"><b>Question price is set by SMV ASTRO administration.</b></p>
<h3>Birth Details</h3>
<p class="small">Enter the birth details of the person for whom you are asking the question.</p>
<div class="grid">
<div><label class="small"><b>Name</b></label><input autocomplete="name" id="birthName" placeholder="Full name" required="" type="text"/></div>
<div><label class="small"><b>Date of Birth</b></label><input id="birthDate" required="" type="date"/></div>
<div><label class="small"><b>Time of Birth</b></label><input id="birthTime" required="" type="time"/></div>
<div><label class="small"><b>Place of Birth</b></label><input id="birthPlace" placeholder="City, State, Country" required="" type="text"/></div>
<div><label class="small"><b>Gender (Optional)</b></label><select id="birthGender"><option value="">Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option></select></div>
</div>
<h3 style="margin-top:18px">Your Question</h3>
<textarea id="questionText" placeholder="Write your astrology question here..." rows="6" style="width:100%;max-width:100%;min-width:0;box-sizing:border-box;padding:12px;border:1px solid #d7dde7;border-radius:10px;font:inherit;overflow-wrap:anywhere;word-break:break-word"></textarea>
<button class="btn" id="submitQuestionBtn" style="margin-top:12px">Proceed to Secure Payment</button>
<div class="small" id="askMsg" style="margin-top:10px"></div>
</div>
</section>
<section class="hidden" id="admin" style="margin-top:45px">
<h2>Admin Dashboard</h2>
<div class="grid" id="adminSummary"></div>
<div class="card" style="margin-top:16px">
<h3>Public Question Price</h3>
<p class="small">Current fixed price for one public astrology question. Example: ₹5.</p>
<div class="action-row"><span style="font-weight:700">₹</span><input id="questionPrice" min="1" placeholder="Question price" step="0.01" type="number"/><button class="btn" id="saveQuestionPrice">SAVE PRICE</button></div>
<div class="small" id="questionPriceMsg"></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Commission Settings</h3>
<p class="small">Default: 20% Astrologer / 80% Admin. Changeable by Admin; total must equal 100%.</p>
<div class="action-row"><input id="astroCommission" max="100" min="0" placeholder="Astrologer %" step="0.1" type="number"/><input id="adminCommission" max="100" min="0" placeholder="Admin %" step="0.1" type="number"/><button class="btn" id="saveCommission">SAVE</button></div>
<div class="small" id="commissionMsg"></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Answer Word Limit</h3>
<p class="small">Set the minimum answer length required from astrologers for new paid questions.</p>
<div class="action-row"><input id="minimumAnswerWords" max="10000" min="1" placeholder="Minimum words" step="1" type="number"/><button class="btn" id="saveAnswerWords">SAVE</button></div>
<div class="small" id="answerWordsMsg"></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Razorpay Connection</h3>
<p class="small">Use this test to check whether the deployed Firebase Function can reach Razorpay with the configured server credentials.</p>
<button class="btn" id="testRazorpayBtn">TEST RAZORPAY CONNECTION</button>
<div class="small" id="razorpayTestMsg" style="margin-top:8px"></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Astrologer Withdrawal Requests</h3>
<p class="small">Minimum withdrawal is ₹300. Admin arranges payment within 24–48 hours.</p>
<div id="adminWithdrawals"><div class="empty">Loading withdrawal requests...</div></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Astrologer Applications — Full Verification</h3>
<div id="pendingAstros"><div class="empty">Loading applications...</div></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Questions Awaiting Admin Approval</h3>
<p class="small">Paid questions wait here for Admin approval. Only after Admin approves will the question become available to all approved astrologers. The first astrologer to claim it can answer it.</p>
<div id="adminPendingQuestions"><div class="empty">Loading questions...</div></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Answers Awaiting Approval</h3>
<div id="adminAnswers"><div class="empty">Loading answers...</div></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Reviews</h3>
<div id="adminReviews"><div class="empty">Loading reviews...</div></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Appointment Requests</h3>
<p class="small">Manage Chat and Call consultation requests from customers.</p>
<div id="adminAppointments"><div class="empty">Loading appointment requests...</div></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Public Announcement</h3>
<div class="action-row"><input id="announcementTitle" placeholder="Announcement title"/><input id="announcementMessage" placeholder="Announcement message"/><button class="btn" id="saveAnnouncement" type="button">PUBLISH</button></div>
<div id="announcementAdminMsg" class="small" style="margin-top:8px"></div>
<div id="adminAnnouncements" style="margin-top:10px"></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Email System Test</h3>
<p class="small">Send a test email to the configured Admin email. This uses Resend HTTPS and does not use Gmail SMTP.</p>
<div class="action-row"><button class="btn" id="testEmailBtn" type="button">SEND TEST EMAIL</button></div>
<div id="emailTestMsg" class="small" style="margin-top:8px"></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Astrology Blog Manager</h3>
<p class="small">Create, edit, publish/unpublish, and delete astrology articles. Published articles appear automatically in the public Blog section.</p>
<div class="action-row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
  <input id="blogId" type="hidden">
  <input id="blogTitle" placeholder="Blog title">
  <input id="blogCategory" placeholder="Category e.g. Jyotisha Basics">
</div>
<textarea id="blogExcerpt" rows="3" maxlength="500" placeholder="Short description / excerpt" style="width:100%;margin-top:10px"></textarea>
<textarea id="blogContent" rows="9" maxlength="20000" placeholder="Full blog content" style="width:100%;margin-top:10px"></textarea>
<div class="action-row">
  <button class="btn" id="saveBlogBtn" type="button">ADD BLOG</button>
  <button class="btn gray" id="clearBlogBtn" type="button">CLEAR</button>
</div>
<div id="blogAdminMsg" class="small" style="margin-top:8px"></div>
<div id="adminBlogs" style="margin-top:12px"><div class="empty">Loading blogs...</div></div>
</div>
<div class="card" style="margin-top:16px">
<h3>Recent Questions</h3>
<div id="adminQuestions"><div class="empty">Loading questions...</div></div>
</div>
</section>
<section id="contact" class="card" style="max-width:900px;margin:30px auto;padding:28px 20px;">
  <h2>Contact Us</h2>
  <p class="small">Have a question? Send us your details and query. Our admin team will contact you soon.</p>
  <form id="contactForm" style="display:grid;gap:12px;margin-top:18px;">
    <div>
      <label for="contactName">Name *</label>
      <input id="contactName" name="name" type="text" autocomplete="name" maxlength="100" required placeholder="Your name">
    </div>
    <div>
      <label for="contactEmail">Email *</label>
      <input id="contactEmail" name="email" type="email" autocomplete="email" maxlength="160" required placeholder="your@email.com">
    </div>
    <div>
      <label for="contactPlace">Place / City *</label>
      <input id="contactPlace" name="place" type="text" autocomplete="address-level2" maxlength="120" required placeholder="Your place">
    </div>
    <div>
      <label for="contactMobile">Mobile Number *</label>
      <input id="contactMobile" name="mobile" type="tel" autocomplete="tel" maxlength="20" required placeholder="Your mobile number">
    </div>
    <div>
      <label for="contactQuery">Query *</label>
      <textarea id="contactQuery" name="query" maxlength="3000" required placeholder="Write your query here..."></textarea>
    </div>
    <input id="contactWebsite" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;">
    <button class="btn" id="contactSubmit" type="submit">SEND QUERY</button>
    <div id="contactMsg" class="small" role="status" aria-live="polite"></div>
  </form>
</section>

<footer>© SMV ASTRO SERVICES</footer>
<div class="modal hidden" id="modal">
<div class="modalbox">
<button class="btn gray" onclick="closeModal()" style="float:right">Close</button>
<div id="modalContent"></div>
</div>
</div>
<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCKXyfZ9sjGmej7ygxHpzHNcNysMXHuvSs",authDomain:"smv-astro.firebaseapp.com",projectId:"smv-astro",storageBucket:"smv-astro.firebasestorage.app",messagingSenderId:"299081899217",appId:"1:299081899217:web:8d558df08e86037ea539f0"};
let app=null, auth=null, db=null, functions=null, httpsCallableFn=null, firebaseInitError=null;
try{
  app=initializeApp(firebaseConfig);
  auth=getAuth(app);
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
async function renderApi(path, options={}){
  const token=auth.currentUser ? await auth.currentUser.getIdToken() : "";
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(token) headers.Authorization=`Bearer ${token}`;
  const response=await fetch(RAZORPAY_BACKEND_URL+path,{...options,headers});
  let data=null; try{data=await response.json();}catch(e){data={};}
  if(!response.ok) throw new Error(data?.error||`Payment server error (${response.status})`);
  return data;
}
const ADMIN_UID="TwjeEIFS3Zcf1SxboLZoujm91Ky2";
let currentUser=null, selectedAstro=null, pendingAfterLogin=null, questionServicePrice=5, pendingQuestionId="", pendingQuestionFingerprint="";
const $=id=>document.getElementById(id);
const show=id=>$(id)?.classList.remove("hidden"); const hide=id=>$(id)?.classList.add("hidden");
const go=id=>$(id)?.scrollIntoView({behavior:"smooth",block:"start"});
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function message(id,html){if($(id)) $(id).innerHTML=html;}
function withTimeout(promise,ms=15000){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("Firebase did not respond within 15 seconds.")),ms))]);}
window.closeModal=()=>$("modal").classList.add("hidden");
function openModal(html){$("modalContent").innerHTML=html;$("modal").classList.remove("hidden");}

// ---------- Navigation ----------
function openRegister(){hide("astro-flow");hide("ask-flow");hide("astro-register-form");show("register-flow");go("register-flow");}
function openAstroRegister(){hide("register-flow");show("astro-register-form");go("astro-register-form");}
function openAstroFlow(){openQuestionService();}
async function openQuestionService(){if(!currentUser){pendingAfterLogin="question";openAuth("login");return;} hide("register-flow");hide("astro-register-form");hide("astro-flow");show("ask-flow"); selectedAstro=null; $("askTitle").textContent="Ask Your Question"; await loadQuestionPrice(); $("birthName").value=""; $("birthDate").value=""; $("birthTime").value=""; $("birthPlace").value=""; $("birthGender").value=""; $("questionText").value=""; message("askMsg",""); go("ask-flow");}

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
$("askServiceBtn")?.addEventListener("click",e=>{e.preventDefault();openQuestionService();});
$("consultationNav")?.addEventListener("click",e=>{e.preventDefault();openQuestionService();});

// ---------- Admin access + Login / customer registration ----------
async function getUserProfile(uid){
  try{const s=await withTimeout(getDoc(doc(db,"smv_users",uid)),10000);return s.exists()?s.data():{};}
  catch(e){console.warn("Profile lookup failed",e);return {};}
}
async function isCurrentAdmin(){
  if(!currentUser) return false;
  if(currentUser.uid===ADMIN_UID) return true;
  const profile=await getUserProfile(currentUser.uid);
  return String(profile.role||"").toLowerCase()==="admin";
}
async function openAdminEntry(){
  if(!currentUser){pendingAfterLogin="admin";openAuth("login");return;}
  if(await isCurrentAdmin()){show("adminLink");await loadAdminPanel();go("admin");return;}
  openModal('<h2>Admin Access</h2><div class="error">This account is not an Admin account.</div><p class="small">Please login with the Admin account, then open Admin Dashboard again.</p><button class="btn gray" id="adminAccessClose">Close</button>');
  $("adminAccessClose").onclick=closeModal;
}


function openAuth(mode="login"){
  hide("dashboard"); hide("admin"); hide("dashLink"); hide("adminLink");
  closeModal();
  openModal(`<h2>${mode==="login"?"Login":"Create Customer Account"}</h2>
  <div id="authMsg" class="small"></div>
  ${mode==="register"?`<input id="name" placeholder="Full name" autocomplete="name"><input id="phone" placeholder="Mobile number" autocomplete="tel">`:""}
  <input id="email" type="email" placeholder="Email" autocomplete="email">
  <input id="password" type="password" placeholder="Password (minimum 6 characters)" autocomplete="${mode==="login"?"current-password":"new-password"}">
  <button class="btn" id="submitAuth">${mode==="login"?"Login":"Create Account"}</button>
  ${mode==="login"?`<button class="btn gray" id="forgotAuth">Forgot Password?</button>`:""}
  <button class="btn gray" id="switchAuth">${mode==="login"?"Create new customer account":"I already have an account"}</button>`);
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
async function submitAuth(mode){
 const msg=$("authMsg"),email=$("email").value.trim(),password=$("password").value;
 if(!email||!password){msg.innerHTML='<span class="error">Please enter email and password.</span>';return;}
 const btn=$("submitAuth");btn.disabled=true;btn.textContent=mode==="login"?"Signing in...":"Creating...";
 try{
  if(mode==="login"){
    // Do not wait for a separate auth-state promise here. Firebase already returns
    // the signed-in user from signInWithEmailAndPassword; use that result directly.
    const loginCred=await withTimeout(signInWithEmailAndPassword(auth,email,password),20000);
    if(!loginCred?.user){throw new Error("Login did not return a Firebase user. Please try again.");}
    currentUser=loginCred.user;
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
        show("adminLink");
        await loadAdminPanel();
        go("admin");
      }else{
        openModal('<h2>Admin Access</h2><div class="error">This account is not an Admin account.</div><p class="small">Please use your Admin login.</p>');
      }
    }else{
      show("dashLink");
      await loadDashboard();
      go("dashboard");
    }
    return;
  }
  const name=$("name").value.trim(),phone=$("phone").value.trim();
  if(!name||password.length<6){msg.innerHTML='<span class="error">Enter name and a password of at least 6 characters.</span>';return;}
  const cred=await withTimeout(createUserWithEmailAndPassword(auth,email,password),20000);
  try{
    await withTimeout(setDoc(doc(db,"smv_users",cred.user.uid),{
      uid:cred.user.uid,name,phone,email,role:"customer",status:"active",emailVerificationRequired:true,createdAt:serverTimestamp()
    },{merge:true}),15000);
  }catch(profileErr){
    console.warn("Customer profile save failed after Auth registration",profileErr);
  }
  msg.innerHTML='<span class="success"><b>Registration successful ✓</b><br>Account created. A verification email has been sent. Verify it once, then use Login normally.</span><button class="btn" id="registrationLoginBtn" style="margin-top:10px">Go to Login</button>';
  $("registrationLoginBtn").onclick=async()=>{await logoutToHome();openAuth("login");};
 }catch(e){
  let t=e?.message||String(e);
  if(e?.code==="auth/wrong-password"||e?.code==="auth/invalid-credential") t="Incorrect email or password.";
  if(e?.code==="auth/network-request-failed") t="Network connection failed. Please try again.";
  msg.innerHTML='<span class="error">'+escapeHtml(t)+'</span>';
 }finally{if($("submitAuth")){btn.disabled=false;btn.textContent=mode==="login"?"Login":"Create Account";}}
}
let authReadyResolve;
const authReady=new Promise(r=>authReadyResolve=r);
function waitForAuthReady(){return authReady;}
// ---------- Astrologer list ----------
async function loadAstrologers(){ return; }
async function loadAstroCards(){
 const box=$("astroCards");box.innerHTML='<div class="empty">Loading astrologers...</div>';
 try{const snap=await withTimeout(getDocs(query(collection(db,"smv_astrologers"),where("status","==","approved"))));
  if(snap.empty){box.innerHTML='<div class="empty">No approved astrologers available yet.</div>';return;}
  box.innerHTML="";snap.forEach(d=>{const a={id:d.id,...d.data()},card=document.createElement("div");card.className="card";card.style.marginTop="12px";card.innerHTML=`${a.photoData?`<img src="${a.photoData}" alt="Astrologer photo" style="width:72px;height:72px;border-radius:50%;object-fit:cover">`:''}<h3>${escapeHtml(a.name||"Astrologer")}</h3><p><b>${escapeHtml(a.expertise||a.specialization||"Astrology")}</b></p><p>⭐ ${escapeHtml(a.rating||a.averageRating||"New")} · ${escapeHtml(a.experience||"Experienced")} years experience</p><p>${escapeHtml(a.bio||a.about||"Professional astrologer")}</p><p class="small">Secure payment amount is shown only at checkout.</p><div class="action-row"><button class="btn gray" data-profile>PROFILE & REVIEWS</button></div>`;card.querySelector("[data-profile]").onclick=()=>openPublicAstrologerProfile(a);box.appendChild(card);});
 }catch(e){box.innerHTML='<div class="empty error">Could not load astrologers. Please check Firebase/Firestore rules.</div>';}
}
async function loadQuestionPrice(){try{const snap=await getDoc(doc(db,"smv_settings","question")); const v=Number(snap.data()?.price||5); questionServicePrice=Number.isFinite(v)&&v>=1?v:5; $("askRate").innerHTML=`<b>₹${questionServicePrice} per Question</b>`;}catch(e){questionServicePrice=5; $("askRate").innerHTML="<b>Question price is set by SMV ASTRO administration.</b>";}}
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
   // Reuse the same question only for an unchanged retry; changed form gets a fresh ID.
   const fingerprint=JSON.stringify([currentUser.uid,name,text,birthDate,birthTime,birthPlace,birthGender,amount]);
   const questionId=(pendingQuestionId&&pendingQuestionFingerprint===fingerprint&&/^[A-Za-z0-9_-]{6,}$/.test(pendingQuestionId))?pendingQuestionId:makeQuestionId();
   pendingQuestionId=questionId;
   pendingQuestionFingerprint=fingerprint;
   const payload={questionId,customerName:name,question:text,amount,birthDetails:{name,birthDate,birthTime,birthPlace,birthGender,timezone:"Asia/Kolkata",utcOffsetMinutes:330},serviceName:"Public Astrology Question",customerEmail:currentUser.email||""};
  await withTimeout(setDoc(doc(db,"smv_questions",questionId),{
    customerId:currentUser.uid,
    customerName:name,
    birthName:name,
    question:text,
    amount,
    status:"awaiting_payment",
    paymentStatus:"pending",
    allocationStatus:"awaiting_admin",
    birthDetails:{name,birthDate,birthTime,birthPlace,birthGender,timezone:"Asia/Kolkata",utcOffsetMinutes:330},
    birthDate,birthTime,birthPlace,birthGender,
    createdAt:serverTimestamp()
  },{merge:true}),15000);
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
      message("askMsg",'<span class="success"><b>Payment successful ✓</b><br>Your question is now waiting for Admin approval.</span>');
      btn.disabled=false;btn.textContent="PAID ✓";
      pendingQuestionId="";
      await new Promise(r=>setTimeout(r,500));
      hide("ask-flow"); show("dashboard"); await loadDashboard(); go("dashboard");
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
  try{await withTimeout(sendEmailVerification(cred.user));}catch(ve){}
  btn.textContent="SAVING PROFILE...";
  const batch=writeBatch(db);
  batch.set(doc(db,"smv_users",uid),{uid,name,phone:mobile,mobile,email,role:"astrologer",status:"pending",emailVerificationRequired:true,createdAt:serverTimestamp()});
  batch.set(doc(db,"smv_astrologers",uid),{uid,name,specialization,expertise:specialization,experience,about:bio,bio,photoData,status:"pending",role:"astrologer",createdAt:serverTimestamp()});
  batch.set(doc(db,"smv_notifications",uid+"_"+Date.now()),{userId:uid,type:"registration",title:"Registration submitted",message:"Your astrologer application is pending Admin approval.",createdAt:serverTimestamp(),read:false});
  batch.set(doc(db,"smv_payouts",uid),{uid,bankName,accountName,accountNumber,ifsc,upi,updatedAt:serverTimestamp(),status:"pending_admin_review"});
  await withTimeout(batch.commit());
  form.reset();btn.textContent="SUBMITTED ✓";message("astroRegMsg",'<span class="success"><b>Registration submitted ✓</b><br>Your complete profile is waiting for Admin approval. Email verification is required once at registration. Your bank/UPI details are private and will not be shown back in full.</span><button class="btn" id="astroGoLogin" style="margin-top:10px">Go to Login</button>');
  $("astroGoLogin").onclick=async()=>{await logoutToHome();openAuth("login");};
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
  hide('ask-flow'); hide('register-flow'); hide('astro-flow');
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
  const role=data.role||'customer'; $('dashboardTitle').textContent=role==='astrologer'?'Astrologer Dashboard':'Customer Dashboard';
  if(role==='astrologer'){
   const a=await withTimeout(getDoc(doc(db,'smv_astrologers',currentUser.uid))), ad=a.exists()?a.data():{};
   const inbox=await withTimeout(callFunction('getAstrologerQuestionInbox',{})); const availableQuestions=inbox.data?.questions||[]; const qs=await withTimeout(getDocs(query(collection(db,'smv_questions'),where('astrologerId','==',currentUser.uid))));
   const active=qs.docs.filter(d=>['paid','admin_review','answer_draft','revision_required'].includes(d.data().status));
   const approved=ad.status==='approved';
   const earnings=await withTimeout(callFunction('getAstrologerEarnings',{}));
   const ep=earnings.data||{};
   box.innerHTML=`<div class="grid">
    <div class="card">${ad.photoData?`<img src="${ad.photoData}" style="width:88px;height:88px;border-radius:50%;object-fit:cover">`:''}<span class="badge">ASTROLOGER</span><h3>${escapeHtml(data.name||'')}</h3>
    <p>Status: <b>${escapeHtml(ad.status||'pending')}</b></p><p><b>${escapeHtml(ad.expertise||ad.specialization||'Astrology')}</b></p>
    <p>${escapeHtml(ad.experience||0)} years experience</p><p>${escapeHtml(ad.bio||ad.about||'')}</p>
    <p class="small">Your customer/payment contact details remain private.</p>
    <div class="action-row"><button class="btn gray" id="changePayoutBtn">Change Payment Method</button></div></div>
    <div class="card"><h3>My Questions</h3><p><b>${active.length}</b> active question(s)</p><p>Approved profile: <b>${approved?'Yes':'Waiting for Admin'}</b></p></div>
    <div class="card"><h3>Total Earnings</h3><p style="font-size:28px"><b>₹${Number(ep.totalEarnings||0).toFixed(2)}</b></p><p>Available to Withdraw: <b>₹${Number(ep.availableToWithdraw||0).toFixed(2)}</b></p><p class="small">Minimum withdrawal: ₹${Number(ep.minimumWithdrawal||300).toFixed(2)}</p>${Number(ep.availableToWithdraw||0)>=Number(ep.minimumWithdrawal||300)?'<p class="success"><b>You can withdraw</b></p><button class="btn" id="withdrawBtn">WITHDRAW</button>':'<p class="small">Reach ₹300 to request a withdrawal.</p>'}</div>
   </div>
   <div class="card" style="margin-top:16px"><h3>Public Question Inbox</h3><p class="small">All paid public questions are shown here. The customer price and your current commission are shown automatically.</p>${!approved?'<div class="empty">Your astrologer profile must be approved by Admin before you can claim questions.</div>':availableQuestions.length?availableQuestions.slice(0,50).map(q=>`<div class="card" style="margin:10px 0"><b>${escapeHtml(q.question||'Question')}</b><div class="small">Birth details: ${escapeHtml(q.birthName||q.birthDetails?.name||'')} · ${escapeHtml(q.birthDate||q.birthDetails?.birthDate||'')} · ${escapeHtml(q.birthTime||q.birthDetails?.birthTime||'')} · ${escapeHtml(q.birthPlace||q.birthDetails?.birthPlace||'')} · ${escapeHtml(q.birthGender||q.birthDetails?.birthGender||'')}</div><div class="small"><b>Customer paid: ₹${Number(q.amount||0).toFixed(2)}</b> · <b>Your commission: ₹${Number(q.astrologerCommissionAmount||0).toFixed(2)}</b> (${Number(q.commissionPercent||q.commissionRate||0)}%)</div><button class="btn" data-claim-question="${q.id}">CLAIM & ANSWER</button></div>`).join(''):'<div class="empty">No paid public questions are available right now.</div>'}</div>
<div class="card" style="margin-top:16px"><h3>Questions & Answers</h3>
   ${qs.empty?'<div class="empty">No questions yet.</div>':qs.docs.slice(0,20).map(d=>{const q=d.data(); const canAnswer=approved && q.status==='paid'; const commission=q.astrologerCommissionAmount!=null?`<div><b>Your Commission: ₹${Number(q.astrologerCommissionAmount).toFixed(2)}</b></div>`:''; const minWords=Number(q.answerMinWords||150); return `<div class="card" style="margin:10px 0"><b>${escapeHtml(q.question||'Question')}</b><div class="small">Status: ${escapeHtml(q.status||'')} · Minimum answer: ${minWords} words</div>${commission}${q.answer?`<p>${escapeHtml(q.answer)}</p>`:''}${canAnswer?`<textarea id="ans_${d.id}" placeholder="Write at least ${minWords} words...">${escapeHtml(q.answer||'')}</textarea><div class="small" id="count_${d.id}">0 / ${minWords} words</div><button class="btn" data-answer="${d.id}" disabled>Submit for Admin Approval</button>`:''}${q.status==='revision_required'?`<textarea id="ans_${d.id}" placeholder="Revise with at least ${minWords} words...">${escapeHtml(q.answer||'')}</textarea><div class="small" id="count_${d.id}">0 / ${minWords} words</div><button class="btn" data-answer="${d.id}" disabled>Resubmit for Admin Approval</button>`:''}</div>`}).join('')}</div>
   <div class="card" style="margin-top:16px"><h3>Earnings Ledger</h3><p class="small">Commission is credited only after Admin approves the submitted answer.</p>${ep.ledger&&ep.ledger.length?ep.ledger.map(x=>`<div style="padding:10px 0;border-bottom:1px solid #eee"><b>Consultation #${escapeHtml(x.questionId)}</b><div class="small">Gross: ₹${Number(x.grossAmount||0).toFixed(2)} · Commission: ₹${Number(x.commissionAmount||0).toFixed(2)} · <span class="success">Credited</span></div></div>`).join(''):'<div class="empty">No credited consultations yet.</div>'}</div>
   <div class="card" style="margin-top:16px"><h3>Payment Method</h3><p class="small">Your bank/UPI details are private. Full details are not displayed again.</p><button class="btn gray" id="changePayoutBtn2">Change Payment Method</button></div>`;
   document.querySelectorAll('[data-claim-question]').forEach(b=>b.onclick=async()=>{b.disabled=true;b.textContent='CLAIMING...';try{const r=await withTimeout(callFunction('claimPublicQuestion',{questionId:b.dataset.claimQuestion}));if(r.data?.claimed)loadDashboard();}catch(e){alert(e.message||String(e));b.disabled=false;b.textContent='CLAIM & ANSWER';}});
   document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=async()=>{
     const answer=$('ans_'+b.dataset.answer)?.value.trim(); if(!answer){alert('Please write an answer.');return;}
     b.disabled=true;b.textContent='Submitting...';
     try{const submit=await withTimeout(callFunction('submitAstrologerAnswer',{questionId:b.dataset.answer,answer})); if(submit.data?.submitted){await window.__smvNotifyQuestionUpdate?.(b.dataset.answer,'answer_submitted');loadDashboard();}}
     catch(e){alert(e.message||String(e));b.disabled=false;b.textContent='Submit for Admin Approval';}
   });
   document.querySelectorAll('[id^="ans_"]').forEach(t=>{
     const id=t.id.slice(4), btn=document.querySelector(`[data-answer="${id}"]`), counter=$('count_'+id), q=qs.docs.find(x=>x.id===id)?.data()||{}, min=Number(q.answerMinWords||150);
     const updateCount=()=>{const n=t.value.trim()?t.value.trim().split(/\s+/).filter(Boolean).length:0;if(counter)counter.textContent=`${n} / ${min} words`;if(btn)btn.disabled=n<min;};
     t.addEventListener('input',updateCount);updateCount();
   });
   if($('withdrawBtn')) $('withdrawBtn').onclick=async()=>{
     const ep2=await withTimeout(callFunction('getAstrologerEarnings',{})); const available=Number(ep2.data?.availableToWithdraw||0); const min=Number(ep2.data?.minimumWithdrawal||300);
     openModal(`<h2>Withdraw Earnings</h2><p>Available: <b>₹${available.toFixed(2)}</b></p><p class="small">Minimum withdrawal: ₹${min.toFixed(2)}. Payment will be arranged by Admin within 24–48 hours.</p><input id="withdrawAmount" type="number" min="${min}" max="${available}" step="0.01" value="${available.toFixed(2)}" placeholder="Amount"><button class="btn" id="confirmWithdraw">REQUEST WITHDRAWAL</button><div id="withdrawMsg" class="small" style="margin-top:8px"></div>`);
     $('confirmWithdraw').onclick=async()=>{const amount=Number($('withdrawAmount').value);const btn2=$('confirmWithdraw');btn2.disabled=true;try{await withTimeout(callFunction('requestAstrologerWithdrawal',{amount}));$('withdrawMsg').innerHTML='<span class="success"><b>Withdrawal request received.</b><br>Admin will arrange payment within 24–48 hours.</span>';setTimeout(()=>{closeModal();loadDashboard();},1000);}catch(e){$('withdrawMsg').innerHTML='<span class="error">'+escapeHtml(e.message||String(e))+'</span>';btn2.disabled=false;}};
   };
   const change=()=>openPayoutChange();
   if($('changePayoutBtn')) $('changePayoutBtn').onclick=change;
   if($('changePayoutBtn2')) $('changePayoutBtn2').onclick=change;
  } else {
   const qs=await withTimeout(getDocs(query(collection(db,'smv_questions'),where('customerId','==',currentUser.uid))));
   const paid=qs.docs.filter(d=>d.data().status!=='awaiting_payment').length;
   box.innerHTML=`<div class="grid"><div class="card"><span class="badge">CUSTOMER</span><h3>Welcome, ${escapeHtml(data.name||currentUser.email||'Customer')}</h3><p>Email verification: <b>${currentUser.emailVerified?'Verified':'Pending from registration'}</b></p><p>Mobile: Private</p></div><div class="card"><h3>My Questions</h3><p>Total: <b>${qs.size}</b></p><p>Paid/processed: <b>${paid}</b></p></div></div>
   <div class="card" style="margin-top:16px"><h3>My Consultations</h3>${qs.empty?'<div class="empty">No consultations yet. Start a private consultation to choose an astrologer.</div>':qs.docs.slice(0,20).map(d=>{const q=d.data(); const reviewButton=q.status==='answered'&&!q.reviewed?`<button class="btn" data-review="${d.id}" data-astro="${q.astrologerId}">Rate & Review</button>`:''; const statusMap={awaiting_payment:'Payment Pending',payment_failed:'Payment Failed',paid:'Waiting for Answers',admin_approved:'Waiting for Answers',processing:'Processing',answer_draft:'Processing',admin_review:'Processing',revision_required:'Revision Required',answered:'Answer Ready',admin_rejected:'Question Rejected'}; const astroName=q.astrologerName||'Selected Astrologer'; const statusText=q.status==='paid'||q.status==='admin_approved'?`Waiting for Answers — ${astroName}`:q.status==='processing'||q.status==='answer_draft'||q.status==='admin_review'?`Processing — ${astroName} answer received and under Admin review`:q.status==='answered'?'Answer Ready':(statusMap[q.status]||q.status||'Processing'); const steps=[['Payment Received',['paid','admin_approved','processing','answer_draft','admin_review','answered'].includes(q.status)],['Question Approved',['admin_approved','processing','answer_draft','admin_review','answered'].includes(q.status)],['Astrologer Answer Submitted',['processing','answer_draft','admin_review','answered'].includes(q.status)],['Admin Approval',['answered'].includes(q.status)],['Answer Ready',['answered'].includes(q.status)]]; const timeline=`<div class="timeline">${steps.map(x=>`<div class="timeline-step ${x[1]?'done':''}"><span>${x[1]?'✓':'○'}</span>${x[0]}</div>`).join('')}</div>`; return `<div style="padding:14px 0;border-bottom:1px solid #eee"><b>${escapeHtml(q.question||'Question')}</b><div class="small">Astrologer: <b>${escapeHtml(astroName)}</b> · Status: <b>${escapeHtml(statusText)}</b></div>${timeline}${q.answer&&q.status==='answered'?`<div class="card" style="margin-top:10px"><b>Astrologer Answer</b><p style="white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${escapeHtml(q.answer)}</p></div>`:''}${reviewButton}</div>`}).join('')}</div>`;
   document.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>openReview(b.dataset.review,b.dataset.astro));
  }
  const note=document.createElement('div'); note.className='card'; note.style.marginTop='16px'; note.innerHTML='<h3>Notifications</h3><div id="userNotifications"><div class="small">Loading...</div></div>'; box.appendChild(note); await renderNotifications('userNotifications'); show('dashboard'); touchSession(); armIdleTimer();
 }catch(e){box.innerHTML='<div class="card error">Could not load dashboard. Please refresh and try again.</div>';}
}
function openPayoutChange(){
 openModal(`<h2>Change Payment Method</h2><p class="small">For security, your previous bank/UPI details are not displayed. Enter the new details.</p>
 <input id="pBank" placeholder="Bank Name"><input id="pAccountName" placeholder="Account Holder Name"><input id="pAccount" inputmode="numeric" placeholder="Account Number"><input id="pIfsc" placeholder="IFSC"><input id="pUpi" placeholder="UPI ID (optional)"><button class="btn" id="savePayout">Submit for Admin Review</button><div id="payoutMsg" class="small"></div>`);
 $('savePayout').onclick=async()=>{try{await setDoc(doc(db,'smv_payouts',currentUser.uid),{uid:currentUser.uid,bankName:$('pBank').value.trim(),accountName:$('pAccountName').value.trim(),accountNumber:$('pAccount').value.trim(),ifsc:$('pIfsc').value.trim(),upi:$('pUpi').value.trim(),status:'pending_admin_review',updatedAt:serverTimestamp()},{merge:true});$('payoutMsg').innerHTML='<span class="success">Payment method submitted for Admin review.</span>';setTimeout(closeModal,600);}catch(e){$('payoutMsg').innerHTML='<span class="error">'+escapeHtml(e.message||String(e))+'</span>';}}; 
}
function openReview(questionId,astroId){
 openModal(`<h2>Rate your consultation</h2><select id="reviewStars"><option value="5">★★★★★ — 5</option><option value="4">★★★★☆ — 4</option><option value="3">★★★☆☆ — 3</option><option value="2">★★☆☆☆ — 2</option><option value="1">★☆☆☆☆ — 1</option></select><textarea id="reviewText" placeholder="Write your review"></textarea><button class="btn" id="submitReview">Submit Review</button><div id="reviewMsg" class="small"></div>`);
 $('submitReview').onclick=async()=>{try{await withTimeout(callFunction('submitVerifiedReview',{questionId,astrologerId:astroId,rating:Number($('reviewStars').value),review:$('reviewText').value.trim()}));$('reviewMsg').innerHTML='<span class="success">Thank you. Your verified review was submitted.</span>';setTimeout(()=>{closeModal();loadDashboard();},500);}catch(e){$('reviewMsg').innerHTML='<span class="error">'+escapeHtml(e.message||String(e))+'</span>';}}; 
}
async function loadBlogs(){
 const box=$("blogList"); if(!box)return;
 box.innerHTML='<div class="empty">Loading articles...</div>';
 try{
  const snap=await withTimeout(getDocs(collection(db,"smv_blogs")),12000);
  const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(b=>b.active!==false);
  rows.sort((a,b)=>String(b.updatedAtText||b.createdAtText||"").localeCompare(String(a.updatedAtText||a.createdAtText||"")));
  if(!rows.length){box.innerHTML='<div class="empty">No blog articles published yet.</div>';return;}
  box.innerHTML=rows.map(b=>`<article class="card blog-card site-searchable" data-search="${escapeHtml((b.title||"")+" "+(b.category||"")+" "+(b.excerpt||""))}">
    <span class="badge">${escapeHtml(b.category||"Astrology")}</span>
    <h3>${escapeHtml(b.title||"Untitled")}</h3>
    <p class="small">${escapeHtml(b.excerpt||"")}</p>
    <details><summary>Read article</summary><div class="blog-content" style="margin-top:10px">${escapeHtml(b.content||"")}</div></details>
  </article>`).join("");
 }catch(e){box.innerHTML='<div class="empty error">Unable to load blogs: '+escapeHtml(e.message||String(e))+'</div>';}
}
async function loadAdminBlogs(){
 const box=$("adminBlogs"); if(!box)return;
 try{
  const snap=await withTimeout(getDocs(collection(db,"smv_blogs")),12000);
  const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
  rows.sort((a,b)=>String(b.updatedAtText||b.createdAtText||"").localeCompare(String(a.updatedAtText||a.createdAtText||"")));
  if(!rows.length){box.innerHTML='<div class="empty">No blogs yet. Add your first article above.</div>';return;}
  box.innerHTML=rows.map(b=>`<div class="admin-blog-row">
    <b>${escapeHtml(b.title||"Untitled")}</b> <span class="badge">${b.active===false?"Draft":"Published"}</span>
    <div class="small">${escapeHtml(b.category||"Astrology")} · ${escapeHtml(b.updatedAtText||"")}</div>
    <div class="admin-blog-actions">
      <button class="btn gray" type="button" data-blog-edit="${escapeHtml(b.id)}">EDIT</button>
      <button class="btn gray" type="button" data-blog-toggle="${escapeHtml(b.id)}">${b.active===false?"PUBLISH":"UNPUBLISH"}</button>
      <button class="btn gray" type="button" data-blog-delete="${escapeHtml(b.id)}">DELETE</button>
    </div>
  </div>`).join("");
  box.querySelectorAll("[data-blog-edit]").forEach(btn=>btn.onclick=()=>{
    const b=rows.find(x=>x.id===btn.dataset.blogEdit); if(!b)return;
    $("blogId").value=b.id;$("blogTitle").value=b.title||"";$("blogCategory").value=b.category||"";$("blogExcerpt").value=b.excerpt||"";$("blogContent").value=b.content||"";$("saveBlogBtn").textContent="UPDATE BLOG";window.scrollTo({top:$("adminBlogs").getBoundingClientRect().top+window.scrollY-100,behavior:"smooth"});
  });
  box.querySelectorAll("[data-blog-toggle]").forEach(btn=>btn.onclick=async()=>{
    try{await updateDoc(doc(db,"smv_blogs",btn.dataset.blogToggle),{active:btn.textContent==="PUBLISH",updatedAtText:new Date().toLocaleString("en-IN")});await loadAdminBlogs();await loadBlogs();}
    catch(e){$("blogAdminMsg").innerHTML='<span class="error">'+escapeHtml(e.message||String(e))+'</span>';}
  });
  box.querySelectorAll("[data-blog-delete]").forEach(btn=>btn.onclick=async()=>{
    if(!confirm("Delete this blog?"))return;
    try{await deleteDoc(doc(db,"smv_blogs",btn.dataset.blogDelete));await loadAdminBlogs();await loadBlogs();}
    catch(e){$("blogAdminMsg").innerHTML='<span class="error">'+escapeHtml(e.message||String(e))+'</span>';}
  });
 }catch(e){box.innerHTML='<div class="empty error">Unable to load blog manager: '+escapeHtml(e.message||String(e))+'</div>';}
}
function clearBlogEditor(){
 $("blogId").value="";$("blogTitle").value="";$("blogCategory").value="";$("blogExcerpt").value="";$("blogContent").value="";$("saveBlogBtn").textContent="ADD BLOG";$("blogAdminMsg").textContent="";
}
async function saveBlog(){
 const title=$("blogTitle").value.trim(),category=$("blogCategory").value.trim()||"Astrology",excerpt=$("blogExcerpt").value.trim(),content=$("blogContent").value.trim();
 const msg=$("blogAdminMsg");
 if(!title||!content){msg.innerHTML='<span class="error">Blog title and content are required.</span>';return;}
 try{
  const id=$("blogId").value.trim(), now=new Date().toLocaleString("en-IN");
  if(id) await updateDoc(doc(db,"smv_blogs",id),{title,category,excerpt,content,updatedAtText:now});
  else await addDoc(collection(db,"smv_blogs"),{title,category,excerpt,content,active:true,createdAtText:now,updatedAtText:now,createdBy:currentUser.uid});
  msg.innerHTML='<span class="success">Blog saved successfully.</span>';clearBlogEditor();await loadAdminBlogs();await loadBlogs();
 }catch(e){msg.innerHTML='<span class="error">'+escapeHtml(e.message||String(e))+'</span>';}
}

async function loadAdminPanel(){
 if(!currentUser || !(await isCurrentAdmin())){hide('admin');hide('adminLink');return;}
 show('admin');
 try{
  const [users,astros,questions]=await Promise.all([withTimeout(getDocs(collection(db,'smv_users'))),withTimeout(getDocs(collection(db,'smv_astrologers'))),withTimeout(getDocs(collection(db,'smv_questions')))]);
  const customers=users.docs.filter(d=>d.data().role==='customer').length, pendingDocs=astros.docs.filter(d=>d.data().status==='pending'); const userMap=new Map(users.docs.map(d=>[d.id,d.data()]));
  $('adminSummary').innerHTML=`<div class="stat">Customers <b>${customers}</b></div><div class="stat">Astrologers <b>${astros.size}</b></div><div class="stat">Pending <b>${pendingDocs.length}</b></div><div class="stat">Questions <b>${questions.size}</b></div>`;
  let settings={astroPercent:20,adminPercent:80}; try{const ss=await getDoc(doc(db,'smv_settings','commission'));if(ss.exists())settings=ss.data();}catch(e){}
  let questionSettings={price:5}; try{const qps=await getDoc(doc(db,'smv_settings','question'));if(qps.exists())questionSettings=qps.data();}catch(e){}
  $('questionPrice').value=Number(questionSettings.price||5);
  $('saveQuestionPrice').onclick=async()=>{const price=Math.round(Number($('questionPrice').value)*100)/100;if(!Number.isFinite(price)||price<1){$('questionPriceMsg').innerHTML='<span class="error">Enter a valid price of at least ₹1.</span>';return;}await setDoc(doc(db,'smv_settings','question'),{price,updatedAt:serverTimestamp(),updatedBy:currentUser.uid});$('questionPriceMsg').innerHTML='<span class="success">Current public question price saved: ₹'+price.toFixed(2)+'</span>';questionServicePrice=price;};
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

  // Public Question Admin Approval: paid questions remain hidden from astrologers until Admin approves them.
  const questionApprovalBox=$('adminPendingQuestions');
  try{
    const pendingQuestions=questions.docs.filter(d=>{
      const q=d.data()||{};
      return q.status==='pending_admin_approval' || (q.status==='paid' && !q.adminQuestionApprovedAt);
    });
    questionApprovalBox.innerHTML=pendingQuestions.length ? pendingQuestions.map(d=>{
      const q=d.data()||{};
      const bd=(q.birthDetails && typeof q.birthDetails==='object')?q.birthDetails:{};
      const customerName=q.customerName||q.birthName||bd.name||'Customer';
      const birthDate=q.birthDate||bd.birthDate||'';
      const birthTime=q.birthTime||bd.birthTime||'';
      const birthPlace=q.birthPlace||bd.birthPlace||'';
      const birthGender=q.birthGender||bd.birthGender||'';
      return `<div class="card" style="margin:10px 0"><h3>${escapeHtml(customerName)}</h3><p><b>Question:</b> ${escapeHtml(q.question||'')}</p><p><b>Birth:</b> ${escapeHtml(birthDate)} · ${escapeHtml(birthTime)} · ${escapeHtml(birthPlace)} · ${escapeHtml(birthGender)}</p><p><b>Amount Paid:</b> ₹${Number(q.amount||0).toFixed(2)} · <b>Payment:</b> ${escapeHtml(q.paymentStatus||q.status||'')}</p><p class="small"><b>Status:</b> Waiting for Admin Question Approval</p><div class="action-row"><button class="btn" data-approve-question="${d.id}">APPROVE QUESTION</button><button class="btn gray" data-reject-question="${d.id}">REJECT QUESTION</button></div><input id="questionReject_${d.id}" placeholder="Rejection reason (required if rejecting)"></div>`;
    }).join('') : '<div class="empty">No questions awaiting Admin approval.</div>';
  }catch(e){
    console.error('Question approval panel error',e);
    questionApprovalBox.innerHTML='<div class="empty error">Unable to load question approvals: '+escapeHtml(e.message||String(e))+'</div>';
  }
  questionApprovalBox.querySelectorAll('[data-approve-question]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.approveQuestion;
    b.disabled=true;
    try{await withTimeout(callFunction('approvePublicQuestion',{questionId:id}),60000);await window.__smvNotifyQuestionUpdate?.(id,'question_approved');await loadAdminPanel();}
    catch(e){alert(e.message||String(e));b.disabled=false;}
  });
  questionApprovalBox.querySelectorAll('[data-reject-question]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.rejectQuestion;
    const reason=$('questionReject_'+id).value.trim();
    if(!reason){alert('Enter rejection reason.');return;}
    b.disabled=true;
    try{await withTimeout(callFunction('rejectPublicQuestion',{questionId:id,reason}),60000);await window.__smvNotifyQuestionUpdate?.(id,'question_rejected',reason);await loadAdminPanel();}
    catch(e){alert(e.message||String(e));b.disabled=false;}
  });
   
  const answerBox=$('adminAnswers');const pendingAnswers=questions.docs.filter(d=>d.data().status==='admin_review');
  answerBox.innerHTML=pendingAnswers.length?pendingAnswers.map(d=>{const q=d.data();return `<div class="card" style="margin:10px 0"><b>${escapeHtml(q.question||'Question')}</b><p>${escapeHtml(q.answer||'')}</p><div class="small">Astrologer: ${escapeHtml(q.astrologerId||'')}</div><div class="action-row"><button class="btn" data-approve-answer="${d.id}">APPROVE ANSWER</button><button class="btn gray" data-reject-answer="${d.id}">REJECT ANSWER</button></div><input id="answerReject_${d.id}" placeholder="Rejection reason"></div>`}).join(''):'<div class="empty">No answers awaiting approval.</div>';
  answerBox.querySelectorAll('[data-approve-answer]').forEach(b=>b.onclick=async()=>{const id=b.dataset.approveAnswer;b.disabled=true;try{await withTimeout(callFunction('approveAnswerAndCreditCommission',{questionId:id}));await window.__smvNotifyQuestionUpdate?.(id,'answer_approved');loadAdminPanel();}catch(e){alert(e.message||String(e));b.disabled=false;}});
  answerBox.querySelectorAll('[data-reject-answer]').forEach(b=>b.onclick=async()=>{const id=b.dataset.rejectAnswer,reason=$('answerReject_'+id).value.trim();if(!reason){alert('Enter rejection reason.');return;}await updateDoc(doc(db,'smv_questions',id),{status:'revision_required',adminRejectionReason:reason,adminRejectedAt:serverTimestamp()});const q=questions.docs.find(x=>x.id===id)?.data();if(q) await setDoc(doc(db,'smv_notifications',q.astrologerId+'_answer_reject_'+Date.now()),{userId:q.astrologerId,type:'answer_rejected',title:'Answer requires revision',message:reason,questionId:id,createdAt:serverTimestamp(),read:false});await window.__smvNotifyQuestionUpdate?.(id,'answer_rejected',reason);loadAdminPanel();});

  const withdrawalSnap=await getDocs(collection(db,'smv_withdrawals'));
  const withdrawalDocs=withdrawalSnap.docs.slice().sort((a,b)=>Number(b.data().createdAt?.seconds||0)-Number(a.data().createdAt?.seconds||0)).slice(0,50);
  $('adminWithdrawals').innerHTML=withdrawalDocs.length?withdrawalDocs.map(d=>{const w=d.data();return `<div class="card" style="margin:10px 0"><b>₹${Number(w.amount||0).toFixed(2)}</b> · ${escapeHtml(w.status||'pending')}<div class="small">Astrologer: ${escapeHtml(w.astrologerId||'')} · Requested: ${escapeHtml(w.createdAt?.toDate? w.createdAt.toDate().toLocaleString(): 'Recently')}</div><div class="action-row">${w.status==='pending'?`<button class="btn" data-wstatus="${d.id}" data-status="processing">MARK PROCESSING</button><button class="btn gray" data-wstatus="${d.id}" data-status="rejected">REJECT</button>`:''}${w.status==='processing'?`<button class="btn" data-wstatus="${d.id}" data-status="paid">MARK PAID</button>`:''}</div></div>`}).join(''):'<div class="empty">No withdrawal requests.</div>';
  $('adminWithdrawals').querySelectorAll('[data-wstatus]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await withTimeout(callFunction('adminUpdateWithdrawalStatus',{withdrawalId:b.dataset.wstatus,status:b.dataset.status}));loadAdminPanel();}catch(e){alert(e.message||String(e));b.disabled=false;}});
  const reviewsSnap=await getDocs(collection(db,'smv_reviews'));$('adminReviews').innerHTML=reviewsSnap.empty?'<div class="empty">No reviews yet.</div>':reviewsSnap.docs.slice(-50).reverse().map(d=>{const r=d.data();return `<div style="padding:10px;border-bottom:1px solid #eee">⭐ ${Number(r.rating||0)}/5 — ${escapeHtml(r.review||'')}<div class="small">Verified customer · Astrologer: ${escapeHtml(r.astrologerId||'')} · Status: <b>${r.approved===true?'Approved':'Pending'}</b></div>${r.approved===true?'':'<div class="action-row"><button class="btn" data-review-approve="'+d.id+'">APPROVE REVIEW</button><button class="btn gray" data-review-reject="'+d.id+'">REJECT REVIEW</button></div>'}</div>`}).join('');
  $('adminReviews').querySelectorAll('[data-review-approve]').forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,'smv_reviews',b.dataset.reviewApprove),{approved:true,approvedAt:serverTimestamp(),approvedBy:currentUser.uid});loadAdminPanel();});
  $('adminReviews').querySelectorAll('[data-review-reject]').forEach(b=>b.onclick=async()=>{await deleteDoc(doc(db,'smv_reviews',b.dataset.reviewReject));loadAdminPanel();});
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
     const adminUser=await isCurrentAdmin();
     if(adminUser){ hide('dashLink'); show('adminLink'); }
     else { show('dashLink'); hide('adminLink'); }
   }else{
     clearIdleTimer(); lastAuthUid=null;
     hide('dashLink');hide('adminLink');hide('dashboard');hide('admin');
   }
 }); }
if(firebaseInitError){
  console.error("SMV ASTRO Firebase is unavailable. Basic navigation is still available.",firebaseInitError);
}

window.__SMV_APP_READY=true;
</script>

<script>
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
      }catch(e){msg.innerHTML='<span class="error">'+(e.message||"Registration failed")+'</span>';}
      finally{b.disabled=false;}
    };
  }
  function bindFallback(){
    if(window.__SMV_FALLBACK_BOUND)return;
    window.__SMV_FALLBACK_BOUND=true;
    $("authBtn")?.addEventListener("click",()=>fallbackUser?null:loginUI());
    $("customerRegBtn")?.addEventListener("click",()=>registerUI("customer"));
    $("astroRegBtn")?.addEventListener("click",()=>registerUI("astro"));
    $("askServiceBtn")?.addEventListener("click",e=>{e.preventDefault(); if(fallbackUser||window.__SMV_APP_READY){if(window.__SMV_APP_READY&&typeof window.openQuestionService==="function")window.openQuestionService();else{show("ask-flow");go("ask-flow");}}else{window.__smvPendingAsk=true;loginUI();}});
    $("privateConsultBtn")?.addEventListener("click",e=>{e.preventDefault(); if(fallbackUser){show("ask-flow");go("ask-flow");}else{window.__smvPendingAsk=true;loginUI();}});
  }
  // The main module normally binds these. If it failed to load, keep the essential public buttons usable.
  setTimeout(()=>{if(!window.__SMV_APP_READY) bindFallback();},1200);
})();
</script>
<script>
(function(){
  const BACKEND_URL = "https://smv-astro-razorpay-webhook.onrender.com";
  const form = document.getElementById("contactForm");
  if(!form) return;
  const btn = document.getElementById("contactSubmit");
  const msg = document.getElementById("contactMsg");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  form.addEventListener("submit", async function(e){
    e.preventDefault();
    if(document.getElementById("contactWebsite")?.value) return;
    btn.disabled = true;
    btn.textContent = "SENDING...";
    msg.textContent = "";
    const payload = {
      name: document.getElementById("contactName").value.trim(),
      email: document.getElementById("contactEmail").value.trim(),
      place: document.getElementById("contactPlace").value.trim(),
      mobile: document.getElementById("contactMobile").value.trim(),
      query: document.getElementById("contactQuery").value.trim()
    };
    try{
      const r = await fetch(BACKEND_URL + "/contact-query", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      const data = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error || "Unable to send your query. Please check the admin email settings in Render.");
      msg.innerHTML = '<span class="success">✓ Your query has been submitted successfully. Our team will contact you soon.</span>';
      form.reset();
    }catch(err){
      msg.innerHTML = '<span class="error">' + esc(err?.message || "Unable to send your query. Please try again.") + '</span>';
    }finally{
      btn.disabled = false;
      btn.textContent = "SEND QUERY";
    }
  });
})();
</script>

<a class="wa-float" href="https://wa.me/918072973399?text=Hello%20SMV%20ASTRO%2C%20I%20would%20like%20to%20make%20an%20enquiry." target="_blank" rel="noopener" aria-label="WhatsApp enquiry">💬 WhatsApp</a>

<script type="module">
(function(){
  const BACKEND="https://smv-astro-razorpay-webhook.onrender.com";
  const FBCONFIG={apiKey:"AIzaSyCKXyfZ9sjGmej7ygxHpzHNcNysMXHuvSs",authDomain:"smv-astro.firebaseapp.com",projectId:"smv-astro",storageBucket:"smv-astro.firebasestorage.app",messagingSenderId:"299081899217",appId:"1:299081899217:web:8d558df08e86037ea539f0"};
  let db=null,auth=null;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function fb(){
    if(db&&auth)return;
    const {getApps,initializeApp}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js');
    const {getFirestore,collection,getDocs,query,where,orderBy,limit,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
    const {getAuth}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    const app=getApps().length?getApps()[0]:initializeApp(FBCONFIG); db=getFirestore(app); auth=getAuth(app); return {collection,getDocs,query,where,orderBy,limit,doc,getDoc};
  }
  async function loadQuestionPrice(){try{const f=await fb();const snap=await f.getDoc(f.doc(db,'smv_settings','question'));const price=Number(snap.data()?.price||5);if($('publicQuestionPrice'))$('publicQuestionPrice').textContent='₹'+price;}catch(e){if($('publicQuestionPrice'))$('publicQuestionPrice').textContent='See checkout';}}
  async function loadReviews(){
    const box=$('publicReviews');if(!box)return;
    try{const f=await fb();const snap=await f.getDocs(f.query(f.collection(db,'smv_reviews'),f.where('approved','==',true),f.limit(12)));if(snap.empty){box.innerHTML='<div class="empty">No public reviews yet. Be the first verified customer to share your experience.</div>';return;}
      box.innerHTML=snap.docs.map(d=>{const r=d.data();const stars='★'.repeat(Math.max(0,Math.min(5,Number(r.rating||0))))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(r.rating||0))));return `<div class="card review-card site-searchable" data-search="reviews testimonials customer rating"><div class="stars">${stars}</div><p style="white-space:pre-wrap">“${esc(r.review||'Verified customer review')}”</p><p class="small"><b>Verified Customer</b></p></div>`}).join('');
    }catch(e){box.innerHTML='<div class="empty">Reviews are temporarily unavailable.</div>';}
  }
  async function loadAnnouncements(){
    try{const r=await fetch(BACKEND+'/public-announcements');const d=await r.json();const items=d.announcements||[];if($('announcementText'))$('announcementText').textContent=items.length?(items[0].message||items[0].title):'Welcome to SMV ASTRO — trusted astrology guidance and private consultations.';const adminBox=$('adminAnnouncements');if(adminBox)adminBox.innerHTML=items.length?items.map(x=>`<div style="padding:8px 0;border-bottom:1px solid #eee"><b>${esc(x.title||'Announcement')}</b><div class="small">${esc(x.message||'')}</div><button class="btn gray" style="margin-top:6px" data-delete-announcement="${esc(x.id)}">DELETE</button></div>`).join(''):'<div class="small">No announcements.</div>';adminBox?.querySelectorAll('[data-delete-announcement]').forEach(b=>b.onclick=()=>deleteAnnouncement(b.dataset.deleteAnnouncement));}
    catch(e){if($('announcementText'))$('announcementText').textContent='Welcome to SMV ASTRO — astrology guidance and consultation.';}
  }
  async function authHeaders(){await fb();const u=auth?.currentUser;if(!u)throw new Error('Please login as Admin to use this feature.');return {Authorization:'Bearer '+await u.getIdToken()};}
  async function deleteAnnouncement(id){try{const h=await authHeaders();const r=await fetch(BACKEND+'/admin/announcement/'+encodeURIComponent(id),{method:'DELETE',headers:h});if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'Unable to delete announcement.');}loadAnnouncements();}catch(e){alert(e.message||String(e));}}
  async function loadAdminAppointments(){
    const box=$('adminAppointments');if(!box)return;try{const h=await authHeaders();const r=await fetch(BACKEND+'/admin/appointments',{headers:h});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load appointments.');const items=d.appointments||[];box.innerHTML=items.length?items.map(a=>`<div style="padding:11px 0;border-bottom:1px solid #eee"><b>${esc(a.name)}</b> · ${esc(a.type)}<div class="small">${esc(a.email)} · ${esc(a.mobile)} · ${esc(a.preferredDate)} ${esc(a.preferredTime)}<br/>${esc(a.notes||'No notes')}<br/>Status: <b>${esc(a.status||'new')}</b></div><div class="action-row">${['new','confirmed','completed','cancelled'].map(st=>`<button class="btn ${st==='cancelled'?'gray':''}" data-apstatus="${esc(a.id)}" data-status="${st}">${st.toUpperCase()}</button>`).join('')}</div></div>`).join(''):'<div class="empty">No appointment requests.</div>';box.querySelectorAll('[data-apstatus]').forEach(b=>b.onclick=()=>updateAppointment(b.dataset.apstatus,b.dataset.status));}catch(e){box.innerHTML='<div class="empty error">'+esc(e.message||String(e))+'</div>';}
  }
  async function updateAppointment(id,status){try{const h=await authHeaders();h['Content-Type']='application/json';const r=await fetch(BACKEND+'/admin/appointment-status',{method:'POST',headers:h,body:JSON.stringify({id,status})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to update appointment.');loadAdminAppointments();}catch(e){alert(e.message||String(e));}}
  async function publishAnnouncement(){const title=$('announcementTitle')?.value.trim(),message=$('announcementMessage')?.value.trim(),msg=$('announcementAdminMsg');if(!title||!message){if(msg)msg.innerHTML='<span class="error">Enter title and message.</span>';return;}try{const h=await authHeaders();h['Content-Type']='application/json';const r=await fetch(BACKEND+'/admin/announcement',{method:'POST',headers:h,body:JSON.stringify({title,message})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to publish announcement.');if(msg)msg.innerHTML='<span class="success">Announcement published.</span>';$('announcementTitle').value='';$('announcementMessage').value='';loadAnnouncements();}catch(e){if(msg)msg.innerHTML='<span class="error">'+esc(e.message||String(e))+'</span>';}}
  async function testAdminEmail(){
    const msg=$('emailTestMsg'),btn=$('testEmailBtn'); if(!btn)return; btn.disabled=true; btn.textContent='SENDING...';
    try{const h=await authHeaders();h['Content-Type']='application/json';const r=await fetch(BACKEND+'/admin/test-email',{method:'POST',headers:h,body:'{}'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Email test failed.');if(msg)msg.innerHTML='<span class="success">✓ Test email sent successfully. Check the Admin inbox.</span>';}catch(e){if(msg)msg.innerHTML='<span class="error">'+esc(e.message||String(e))+'</span>';}finally{btn.disabled=false;btn.textContent='SEND TEST EMAIL';}
  }

  function setupSearch(){const input=$('siteSearch'),btn=$('searchBtn'),empty=$('searchEmpty');if(!input)return;const run=()=>{const q=input.value.trim().toLowerCase();let shown=0;document.querySelectorAll('.site-searchable').forEach(el=>{const hay=(el.textContent+' '+(el.dataset.search||'')).toLowerCase();const ok=!q||hay.includes(q);el.classList.toggle('hidden',!ok);if(ok)shown++;});if(empty)empty.classList.toggle('hidden',shown>0||!q);};input.addEventListener('input',run);btn?.addEventListener('click',run);}
  function setupLanguage(){
    const btn=$('langToggle'); if(!btn) return;
    let tamil=false;
    const T={
      "Home":"முகப்பு","Services":"சேவைகள்","Consultation":"ஆலோசனை","Contact":"தொடர்பு","Dashboard":"டாஷ்போர்டு","Admin":"நிர்வாகி","Login":"உள்நுழைவு","Logout":"வெளியேறு","Close":"மூடு","Back":"பின்","← Back":"← பின்","← Back to Home":"← முகப்பிற்குத் திரும்பு","SEARCH":"தேடுக","SAVE":"சேமிக்க","CLEAR":"அழிக்க","PUBLISH":"வெளியிடுக","ADD BLOG":"வலைப்பதிவு சேர்க்க","Contact Us":"தொடர்பு கொள்ள","Email *":"மின்னஞ்சல் *","Mobile *":"மொபைல் *","Mobile Number *":"மொபைல் எண் *","Name *":"பெயர் *","Query *":"கேள்வி / செய்தி *","Place / City *":"இடம் / நகரம் *","SEND QUERY":"கேள்வியை அனுப்புக","SENDING...":"அனுப்பப்படுகிறது...","Reviews":"மதிப்புரைகள்","Customer Reviews":"வாடிக்கையாளர் மதிப்புரைகள்","Customer Account":"வாடிக்கையாளர் கணக்கு","Login & registration":"உள்நுழைவு & பதிவு","Register as Customer":"வாடிக்கையாளராக பதிவு செய்ய","Register as Astrologer":"ஜோதிடராக பதிவு செய்ய","Customer Registration":"வாடிக்கையாளர் பதிவு","Astrologer Registration":"ஜோதிடர் பதிவு","Choose Your Path":"உங்கள் பாதையைத் தேர்வு செய்யுங்கள்","Choose Your Guidance":"உங்கள் வழிகாட்டலைத் தேர்வு செய்யுங்கள்","Appointment Booking":"முன்பதிவு","REQUEST APPOINTMENT":"முன்பதிவு கோரிக்கை அனுப்புக","BOOK CHAT":"Chat முன்பதிவு","BOOK CALL":"Call முன்பதிவு","Chat Consultation":"Chat ஆலோசனை","Call Consultation":"Call ஆலோசனை","Private Chat Consultation":"தனிப்பட்ட Chat ஆலோசனை","Private Call Consultation":"தனிப்பட்ட Call ஆலோசனை","Payment Method":"கட்டண முறை","Birth Details":"பிறப்பு விவரங்கள்","Date of Birth":"பிறந்த தேதி","Time of Birth":"பிறந்த நேரம்","Place of Birth":"பிறந்த இடம்","Gender (Optional)":"பாலினம் (விருப்பம்)","Male":"ஆண்","Female":"பெண்","Other":"மற்றவை","Prefer not to say":"சொல்ல விருப்பமில்லை","Your Question":"உங்கள் கேள்வி","Ask Your Question":"உங்கள் கேள்வியைக் கேளுங்கள்","ASK A QUESTION":"கேள்வி கேட்க","ASK YOUR QUESTIONS":"உங்கள் கேள்விகளைக் கேளுங்கள்","Proceed to Secure Payment":"பாதுகாப்பான கட்டணத்திற்குத் தொடர்க","Public Question Price":"பொது கேள்வி கட்டணம்","Answer Word Limit":"பதில் சொல் வரம்பு","Answers Awaiting Approval":"அனுமதிக்காக காத்திருக்கும் பதில்கள்","Questions Awaiting Admin Approval":"நிர்வாகி அனுமதிக்காக காத்திருக்கும் கேள்விகள்","Recent Questions":"சமீபத்திய கேள்விகள்","Question price is set by SMV ASTRO administration.":"கேள்வி கட்டணத்தை SMV ASTRO நிர்வாகம் நிர்ணயிக்கிறது.","Services & Pricing":"சேவைகள் & கட்டணங்கள்","SERVICES & PRICING":"சேவைகள் & கட்டணங்கள்","Guidance & Astrology Articles":"வழிகாட்டல் & ஜோதிடக் கட்டுரைகள்","ASTROLOGY BLOG":"ஜோதிட வலைப்பதிவு","Astrology Blog":"ஜோதிட வலைப்பதிவு","Loading blogs...":"வலைப்பதிவுகள் ஏற்றப்படுகின்றன...","Loading articles...":"கட்டுரைகள் ஏற்றப்படுகின்றன...","Articles published by SMV ASTRO Admin will appear here.":"SMV ASTRO நிர்வாகி வெளியிடும் கட்டுரைகள் இங்கே தோன்றும்.","Astrology Blog Manager":"ஜோதிட வலைப்பதிவு நிர்வாகி","Customer Reviews":"வாடிக்கையாளர் மதிப்புரைகள்","What Our Customers Say":"எங்கள் வாடிக்கையாளர்கள் கூறுவது","Loading reviews...":"மதிப்புரைகள் ஏற்றப்படுகின்றன...","FAQ":"அடிக்கடி கேட்கப்படும் கேள்விகள்","FREQUENTLY ASKED QUESTIONS":"அடிக்கடி கேட்கப்படும் கேள்விகள்","Quick answers":"விரைவான பதில்கள்","How do I ask an astrology question?":"ஜோதிடக் கேள்வியை எப்படி கேட்பது?","How can I contact SMV ASTRO?":"SMV ASTRO-வை எப்படி தொடர்பு கொள்வது?","Do I need an account?":"கணக்கு அவசியமா?","Are astrologers verified?":"ஜோதிடர்கள் சரிபார்க்கப்பட்டவர்களா?","Can I book a Chat or Call consultation?":"Chat அல்லது Call ஆலோசனையை முன்பதிவு செய்ய முடியுமா?","Notifications":"அறிவிப்புகள்","Latest updates":"சமீபத்திய அறிவிப்புகள்","Public Announcement":"பொது அறிவிப்பு","Admin Dashboard":"நிர்வாகி டாஷ்போர்டு","Admin login & management":"நிர்வாகி உள்நுழைவு & மேலாண்மை","Appointment Requests":"முன்பதிவு கோரிக்கைகள்","Manage Chat and Call consultation requests from customers.":"வாடிக்கையாளர்களின் Chat மற்றும் Call ஆலோசனை கோரிக்கைகளை நிர்வகிக்கவும்.","Commission Settings":"கமிஷன் அமைப்புகள்","Razorpay Connection":"Razorpay இணைப்பு","TEST RAZORPAY CONNECTION":"Razorpay இணைப்பை சோதிக்க","Astrologer Applications — Full Verification":"ஜோதிடர் விண்ணப்பங்கள் — முழு சரிபார்ப்பு","Astrologer Withdrawal Requests":"ஜோதிடர் பணப்பெறுதல் கோரிக்கைகள்","BEGIN YOUR JOURNEY WITH SMV ASTRO":"SMV ASTRO உடன் உங்கள் பயணத்தைத் தொடங்குங்கள்","FOR SEEKERS OF GUIDANCE":"வழிகாட்டலை நாடுபவர்களுக்கு","FOR ASTROLOGY PROFESSIONALS":"ஜோதிட நிபுணர்களுக்கு","Traditional Wisdom":"பாரம்பரிய ஞானம்","Trusted Consultation":"நம்பகமான ஆலோசனை","Verified experiences":"சரிபார்க்கப்பட்ட அனுபவங்கள்","Choose Chat or Call":"Chat அல்லது Call தேர்வு செய்யுங்கள்","Read & learn":"படித்து அறிந்து கொள்ளுங்கள்","Personal Guidance":"தனிப்பட்ட வழிகாட்டல்","SMV ASTRO SERVICES":"SMV ASTRO சேவைகள்","WELCOME TO SMV ASTRO SERVICES":"SMV ASTRO சேவைகளுக்கு வரவேற்கிறோம்","Guidance Through the Wisdom of Jyotisha":"ஜோதிட ஞானத்தின் வழியாக வழிகாட்டல்","Guidance Through the Wisdom of Jyotisha":"ஜோதிட ஞானத்தின் வழியாக வழிகாட்டல்","Services, Guidance & Resources":"சேவைகள், வழிகாட்டல் & தகவல்கள்","Explore consultations, pricing, trusted reviews, astrology articles, FAQs and more.":"ஆலோசனைகள், கட்டணங்கள், மதிப்புரைகள், ஜோதிடக் கட்டுரைகள், FAQ மற்றும் பலவற்றைப் பாருங்கள்.","Create your private customer account to access the secure consultation area and choose an approved astrologer.":"பாதுகாப்பான ஆலோசனைப் பகுதியை அணுகவும், அங்கீகரிக்கப்பட்ட ஜோதிடரைத் தேர்வு செய்யவும் தனிப்பட்ட வாடிக்கையாளர் கணக்கை உருவாக்குங்கள்.","Register according to your purpose. Customer and Astrologer accounts are kept separate, with each journey designed for its own needs.":"உங்கள் தேவைக்கேற்ப பதிவு செய்யுங்கள். வாடிக்கையாளர் மற்றும் ஜோதிடர் கணக்குகள் தனித்தனியாக பராமரிக்கப்படுகின்றன.","Apply to become an SMV ASTRO astrologer. Your professional profile will be reviewed before it becomes public.":"SMV ASTRO ஜோதிடராக விண்ணப்பிக்கவும். உங்கள் தொழில்முறை சுயவிவரம் வெளியிடப்படும் முன் மதிப்பாய்வு செய்யப்படும்.","Have a question? Send us your details and query. Our admin team will contact you soon.":"கேள்வி உள்ளதா? உங்கள் விவரங்களையும் கேள்வியையும் அனுப்புங்கள். எங்கள் நிர்வாக குழு விரைவில் உங்களைத் தொடர்புகொள்ளும்.","Use the Contact Us form or the WhatsApp enquiry button to send your query directly.":"Contact Us படிவம் அல்லது WhatsApp பொத்தானைப் பயன்படுத்தி உங்கள் கேள்வியை நேரடியாக அனுப்பலாம்.","Choose Chat or Call. Submit your preferred date/time and our admin team will confirm the appointment.":"Chat அல்லது Call தேர்வு செய்து, விருப்பமான தேதி/நேரத்தை அனுப்புங்கள். எங்கள் நிர்வாக குழு முன்பதிவை உறுதிப்படுத்தும்.","A private conversation with an approved astrologer for focused guidance.":"அங்கீகரிக்கப்பட்ட ஜோதிடருடன் தனிப்பட்ட உரையாடல் மூலம் குறிப்பிட்ட வழிகாட்டலைப் பெறுங்கள்.","Choose a preferred time and receive a personal consultation by call.":"விருப்பமான நேரத்தைத் தேர்வு செய்து Call மூலம் தனிப்பட்ட ஆலோசனையைப் பெறுங்கள்.","Submit birth details and a question for an approved astrologer. Current price:":"பிறப்பு விவரங்களையும் கேள்வியையும் அனுப்புங்கள். தற்போதைய கட்டணம்:","Enter the birth details of the person for whom you are asking the question.":"கேள்வி கேட்கப்படும் நபரின் பிறப்பு விவரங்களை உள்ளிடுங்கள்.","Paid questions wait here for Admin approval. Only after Admin approves will the question become available to all approved astrologers. The first astrologer to claim it can answer it.":"கட்டணம் செலுத்திய கேள்விகள் இங்கே நிர்வாகி அனுமதிக்காக காத்திருக்கும். நிர்வாகி அனுமதித்த பிறகே அவை அங்கீகரிக்கப்பட்ட ஜோதிடர்களுக்கு கிடைக்கும்.","Set the minimum answer length required from astrologers for new paid questions.":"புதிய கட்டண கேள்விகளுக்கு ஜோதிடர்கள் வழங்க வேண்டிய குறைந்தபட்ச பதில் நீளத்தை அமைக்கவும்.","Default: 20% Astrologer / 80% Admin. Changeable by Admin; total must equal 100%.":"இயல்புநிலை: 20% ஜோதிடர் / 80% நிர்வாகி. நிர்வாகி மாற்றலாம்; மொத்தம் 100% ஆக வேண்டும்.","Minimum withdrawal is ₹300. Admin arranges payment within 24–48 hours.":"குறைந்தபட்ச பணப்பெறுதல் ₹300. நிர்வாகி 24–48 மணி நேரத்தில் பணம் வழங்க ஏற்பாடு செய்வார்.","Bank/UPI details are private and visible only to Admin. They will not be shown again in full to the Astrologer.":"வங்கி/UPI விவரங்கள் தனிப்பட்டவை; நிர்வாகிக்கு மட்டும் தெரியும். ஜோதிடருக்கு முழு விவரங்கள் மீண்டும் காட்டப்படாது.","Astrologer applications are reviewed by SMV ASTRO Admin before their profiles are approved for customer consultations.":"வாடிக்கையாளர் ஆலோசனைக்கு முன் ஜோதிடர் விண்ணப்பங்களை SMV ASTRO நிர்வாகம் மதிப்பாய்வு செய்கிறது.","An account is required for secure customer consultation features. You can create one from Customer Registration or the Login button.":"பாதுகாப்பான வாடிக்கையாளர் ஆலோசனை அம்சங்களுக்கு கணக்கு தேவை. Customer Registration அல்லது Login மூலம் கணக்கை உருவாக்கலாம்.","Yes. Use the Appointment / Consultation Booking form and choose Chat Consultation or Call Consultation. Admin will confirm the appointment.":"ஆம். Appointment / Consultation Booking படிவத்தைப் பயன்படுத்தி Chat அல்லது Call ஆலோசனையைத் தேர்வு செய்யுங்கள். நிர்வாகி முன்பதிவை உறுதிப்படுத்துவார்.","Use this test to check whether the deployed Firebase Function can reach Razorpay with the configured server credentials.":"கட்டமைக்கப்பட்ட server credentials மூலம் Firebase Function Razorpay-ஐ அணுகுகிறதா என்பதைச் சோதிக்க இதைப் பயன்படுத்தவும்.","Create, edit, publish/unpublish, and delete astrology articles. Published articles appear automatically in the public Blog section.":"ஜோதிடக் கட்டுரைகளை உருவாக்க, திருத்த, வெளியிட/நிறுத்த மற்றும் நீக்கலாம். வெளியிடப்பட்ட கட்டுரைகள் Blog பகுதியில் தானாக தோன்றும்.","No matching content found.":"பொருந்தும் தகவல் எதுவும் கிடைக்கவில்லை.","Loading...":"ஏற்றப்படுகிறது...","Loading questions...":"கேள்விகள் ஏற்றப்படுகின்றன...","Loading answers...":"பதில்கள் ஏற்றப்படுகின்றன...","Loading applications...":"விண்ணப்பங்கள் ஏற்றப்படுகின்றன...","Loading appointment requests...":"முன்பதிவு கோரிக்கைகள் ஏற்றப்படுகின்றன...","Loading withdrawal requests...":"பணப்பெறுதல் கோரிக்கைகள் ஏற்றப்படுகின்றன...","Loading latest announcement...":"சமீபத்திய அறிவிப்பு ஏற்றப்படுகிறது...","Question price is set by SMV ASTRO administration.":"கேள்வி கட்டணத்தை SMV ASTRO நிர்வாகம் நிர்ணயிக்கிறது."
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
  function setupBooking(){document.querySelectorAll('[data-open-booking]').forEach(b=>b.onclick=()=>{if($('apType'))$('apType').value=b.dataset.openBooking;location.hash='appointment';$('apName')?.focus();});const f=$('appointmentForm');if(!f)return;f.addEventListener('submit',async e=>{e.preventDefault();const btn=$('appointmentSubmit'),msg=$('appointmentMsg');btn.disabled=true;btn.textContent='SENDING...';try{const payload={name:$('apName').value.trim(),email:$('apEmail').value.trim(),mobile:$('apMobile').value.trim(),type:$('apType').value,preferredDate:$('apDate').value,preferredTime:$('apTime').value,notes:$('apNotes').value.trim()};const r=await fetch(BACKEND+'/appointment-booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Unable to submit appointment request.');msg.innerHTML='<span class="success">✓ Appointment request submitted. Admin will contact you for confirmation.</span>';f.reset();}catch(err){msg.innerHTML='<span class="error">'+esc(err.message||String(err))+'</span>';}finally{btn.disabled=false;btn.textContent='REQUEST APPOINTMENT';}});}
  function setupAsk(){ $('featureAskBtn')?.addEventListener('click',()=>{document.getElementById('askServiceBtn')?.click();}); }
  function hookAdmin(){const old=window.loadAdminPanel; // existing function is module-scoped, so poll DOM after admin becomes visible.
    $('saveAnnouncement')?.addEventListener('click',publishAnnouncement);
    $('testEmailBtn')?.addEventListener('click',testAdminEmail);
    const obs=new MutationObserver(()=>{if(!$('admin')?.classList.contains('hidden')){loadAdminAppointments();loadAnnouncements();}});const a=$('admin');if(a)obs.observe(a,{attributes:true,attributeFilter:['class']});
  }
  setupSearch();setupLanguage();setupBooking();setupAsk();loadQuestionPrice();loadReviews();loadAnnouncements();loadBlogs();hookAdmin();
  $("saveBlogBtn")?.addEventListener("click",saveBlog);
  $("clearBlogBtn")?.addEventListener("click",clearBlogEditor);
  const blogAdminObs=new MutationObserver(()=>{if(!$("admin")?.classList.contains("hidden"))loadAdminBlogs();});
  if($("admin")) blogAdminObs.observe($("admin"),{attributes:true,attributeFilter:["class"]});
})();
</script>
</body>
</html>
    
