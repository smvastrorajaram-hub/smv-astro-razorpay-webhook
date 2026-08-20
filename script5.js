
document.addEventListener("click",function(e){
  const b=e.target.closest("[data-open-booking]");
  if(!b)return;
  const a=document.getElementById("appointment");
  if(!a)return;
  a.classList.remove("hidden");
  const t=document.getElementById("apType");
  if(t)t.value=b.dataset.openBooking;
  a.scrollIntoView({behavior:"smooth",block:"start"});
});
