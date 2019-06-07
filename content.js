"use strict";

chrome.storage.local.get( "MXSpeederRun", function(res){
    (res.MXSpeederRun === "ON") && start();
});

function start(){
  const EXT_PATH     = 'chrome-extension://' + chrome.runtime.id;
  const IFR_CONTENT  = EXT_PATH + '/js/iframe_content.js';
  const COMMON       = EXT_PATH + '/js/common.js';
  const CASE_YOUTUBE = EXT_PATH + '/js/case_youtube.js';
  const CASE_VK      = EXT_PATH + '/js/case_vk.js';
  const CASE_OTHERS  = EXT_PATH + '/js/case_others.js';

  const DEFAULT_SETTINGS  = {
    min: 0.1,
    max: 4.0,
    step: 0.1,
    default: 1.0,
    multiplier: 5,
    mouseWait: 500,
    mouseInterval: 100
  };

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

  // options handling
  window.addEventListener("message", event => {
    if( event.data !== "send YTB Option") return;
    getAndSendOptions();
  });

  //looking for blank iframes
  const config = { childList: true, subtree: true };
  const iframeObserver = new MutationObserver( findBlankIframes );
  iframeObserver.observe(document.body, config );
  findBlankIframes();

  // LIBRARY
  function appendScript( id, path ){
    const scrpt = document.createElement('script');
    scrpt.id    = id;
    scrpt.src   =  path;
    scrpt.type  = 'text/javascript';
    document.body.appendChild(scrpt);
  }

  function getAndSendOptions(){
    chrome.storage.local.get(["MXSpeederSettings"], function(res){

      if(!res.MXSpeederSettings){
        chrome.storage.local.set({ "MXSpeederSettings": DEFAULT_SETTINGS }, getAndSendOptions );
        return;
      }

      res.MXSpeederSettings.EXT_PATH = EXT_PATH;
      sendOptionsToCommonScript( res.MXSpeederSettings );

      // to provide automatical resetting slider parameters after changing them on
      // the option page, engage this Listener and revive all the function further
      // it isn't ready yet

      // chrome.storage.onChanged.addListener(function(changes, areaName){
      //   if( areaName !== "local") return;
      //   if( !changes.MXSpeederSettings ) return;
      //
      //   chrome.storage.local.get(["MXSpeederSettings"], function (res){
      //     sendOptionsToCommonScript( res.MXSpeederSettings );
      //   });
      // });

    });

    // don't delete this function, it is nessesary because content script
    // and appended scripts work in different scopes
    function sendOptionsToCommonScript(opts){
      if(window.location.origin === "file://") return;
      setTimeout( () => window.postMessage( opts, window.location.origin ), 4);
    }
  }

  function findBlankIframes(mutation){
    const IFR_SELECTOR = "iframe[src='about:blank']:not(.mxkExtHandled)";
    const blankIframes = document.body.querySelectorAll(IFR_SELECTOR);

    if( !blankIframes.length ) return;

    if(blankIframes){
      const contConstants = {
        EXT_PATH,
        COMMON,
        CASE_YOUTUBE,
        CASE_VK,
        CASE_OTHERS,
        IFR_CONTENT
      }
      window.addEventListener("message", event => {
        if( event.data !== "send EXT blank iframe contents constants") return;

        chrome.storage.local.get(["MXSpeederSettings"], function(res){
          if(!res.MXSpeederSettings){
            chrome.storage.local.set({ "MXSpeederSettings": DEFAULT_SETTINGS }, getAndSendOptions );
            contConstants.OPTIONS = DEFAULT_SETTINGS;
          }else{
            contConstants.OPTIONS = res.MXSpeederSettings;
          }
          contConstants.OPTIONS.EXT_PATH = EXT_PATH;
          event.source.postMessage( contConstants, "*");
        });
      });
    }

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
