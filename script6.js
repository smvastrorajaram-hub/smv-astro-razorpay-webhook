
document.addEventListener("click",function(e){
  if(e.target.closest("#quickAskBtn")){
    const openQuestion=window.__smvOpenQuestionService;
    if(typeof openQuestion==='function'){
      e.preventDefault();
      e.stopImmediatePropagation();
      openQuestion();
    }
  }
  if(e.target.closest("#contactNav") && !window.__SMV_APP_READY){
    e.preventDefault();
    const contact=document.getElementById("contact");
    if(contact){contact.classList.remove("hidden");contact.scrollIntoView({behavior:"smooth",block:"start"});}
  }
});
