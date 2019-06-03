"use strict";

(function getConstantsFromContentScript(){
  window.addEventListener("message", handleConstants);
  window.parent.postMessage( "send EXT blank iframe contents constants", "*");

  function handleConstants(event){
    const res = event.data;
    const isSettingsValid = res && res.EXT_PATH && res.COMMON ? true : false;

    if( isSettingsValid ){
      window.removeEventListener("message", handleConstants);
      start_content(res);
      return;
    }
  };
})();

function start_content(constants){
  if( document.body.classList.contains("mxkExtHandled") ) return;
  document.body.classList.add("mxkExtHandled");

  const {
    EXT_PATH,
    COMMON,
    CASE_YOUTUBE,
    CASE_VK,
    CASE_OTHERS,
    IFR_CONTENT,
    OPTIONS
  } = constants;

  appendScript( "mxk700_ext_common", COMMON );

  (function appendProperScript(){
    let path = null, id  = null;
    switch (window.location.host){
      case "www.youtube.com":
        path = CASE_YOUTUBE;
        id   = "mxk700_ext_YT";
        break;
      case "vk.com":
        path = CASE_VK;
        id   = "mxk700_ext_VK";
        break;
      default:
      path = CASE_OTHERS;
      id   = "mxk700_ext_others";
    }
    appendScript( id, path );
  })();

  window.MXSpeederSettings = OPTIONS;

  const config = { childList: true, subtree: true };
  const iframeObserver = new MutationObserver( findBlankIframes );
  iframeObserver.observe(document.body, config );

  // LIBRARY
  function appendScript( id, path ){
    const scrpt = document.createElement('script');
    scrpt.id    = id;
    scrpt.src   =  path;
    scrpt.type  = 'text/javascript';
    document.body.appendChild(scrpt);
  }

  function findBlankIframes(mutation){
    const IFR_SELECTOR = "iframe[src='about:blank']:not(.mxkExtHandled)";
    const blankIframes = document.body.querySelectorAll(IFR_SELECTOR);
    blankIframes.forEach(iframe => {
      if(iframe.classList.contains("mxkExtHandled")) return;

      iframe.classList.add("mxkExtHandled");

      const scrpt = iframe.contentDocument.createElement('script');
      scrpt.id    = "mxk700_ext_common";
      scrpt.src   =  IFR_CONTENT;
      scrpt.type  = 'text/javascript';
      iframe.contentDocument.body.appendChild(scrpt);
    });
  }

}
