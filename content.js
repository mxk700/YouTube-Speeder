;(function (){
  "use strict";

  const EXT_PATH = 'chrome-extension://' + chrome.runtime.id;
  const AUX_FILE = '/main.js';
  const CSS_FILE = '/style.css';
  const DEFAULT = {
    min: 0.1,
    max: 4.0,
    step: 0.1,
    default: 1.0,
    multiplier: 5,
    mouseWait: 500,
    mouseInterval: 100
  };

  var buffer = document.createElement("div");
  buffer.id = "mxk700_YT_ext_settings_buffer";
  document.body.appendChild(buffer);

  (function start(){
    chrome.storage.local.get(["youtubeSpeedSettings"], function(res){
      if(!res.youtubeSpeedSettings){
        chrome.storage.local.set({ "youtubeSpeedSettings": DEFAULT }, start );
        return;
      }

      transmitSettinsToMain();
      appendCoreScriptAndCSS();

      chrome.storage.onChanged.addListener(function(changes, areaName){
        if( areaName !== "local") return;
        if( !changes.youtubeSpeedSettings ) return;
        transmitSettinsToMain();
      });

    });
  })();

  // LIBRARY    LIBRARY    LIBRARY    LIBRARY    LIBRARY    LIBRARY
  function transmitSettinsToMain() {
    chrome.storage.local.get(["youtubeSpeedSettings"], function (res) {
      res = res.youtubeSpeedSettings;
      if(!res) return;

      var b = buffer.dataset;
      b.min = res.min;
      b.max = res.max;
      b.step = res.step;
      b.default = res.default;
      b.multiplier = res.multiplier;
      b.mouseWait = res.mouseWait;
      b.mouseInterval = res.mouseInterval;
    });
  }

  function appendCoreScriptAndCSS(){
    var jsf  = document.createElement('script');
    jsf.id   = 'mxk700_YT_ext_script';
    jsf.type = 'text/javascript';
    jsf.src  =  EXT_PATH + AUX_FILE;
    document.body && document.body.appendChild(jsf);

    var style  = document.createElement('link');
    style.id   = 'mxk700_YT_ext_style';
    style.href  =  EXT_PATH + CSS_FILE;
    style.rel = 'stylesheet';
    style.type = "text/css";
    document.body && document.body.appendChild(style);
  }

})();
