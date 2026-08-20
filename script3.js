
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
      setTimeout(()=>{ if(msg) msg.textContent=""; },5000);
    }catch(err){
      msg.innerHTML = '<span class="error">' + esc(err?.message || "Unable to send your query. Please try again.") + '</span>';
    }finally{
      btn.disabled = false;
      btn.textContent = "SEND QUERY";
    }
  });
})();
