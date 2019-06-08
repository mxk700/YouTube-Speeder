;(function() {
  'use strict';

  const DEFAULT = {
    min: 0.1,
    max: 4.0,
    step: 0.1,
    default: 1.0,
    multiplier: 5,
    mouseWait: 500,
    mouseInterval: 100
  };

  var slider = document.getElementById("slider");
  var sliderMin = document.getElementById("min");
  var sliderMax = document.getElementById("max");
  var sliderDef = document.getElementById("def");
  var sliderStep = document.getElementById("step");

  var multiplier = document.getElementById("mul");
  var mouseWait = document.getElementById("mdd");
  var mouseInterval = document.getElementById("mda");

  (function initSettings(){
    chrome.storage.local.get(
      ["MXSpeederSettings"],
      function(res){
        if( res.MXSpeederSettings ){
          loadSettingsToDOM( res.MXSpeederSettings );
        }else{
          saveSettingsToStorage(DEFAULT);
          loadSettingsToDOM(DEFAULT);
        }

        initListeners();
      }
    );
  })();

  // LIBRARY    LIBRARY    LIBRARY    LIBRARY    LIBRARY    LIBRARY
  function initListeners() {
    document.body.addEventListener("input", function(e){
      var elem = e.target;

      if(elem === slider){
        sliderDef.value = slider.value;
        console.log(e);
        setSliderDef();
        return;
      }

      if(elem.type === "number"){
        if(+elem.value < +elem.min) elem.value = elem.min;
        if(+elem.value > +elem.max) elem.value = elem.max;

        var min = +sliderMin.value;
        var max = +sliderMax.value;
        var minRange = 0.2;

        switch (elem.id) {
          case "def":
            ( +elem.value < min ) && ( elem.value = min );
            ( +elem.value > max ) && ( elem.value = max );
            slider.value = elem.value;
            break;
          case "min":
            ( elem.value > max - minRange ) && ( elem.value = max - minRange );
            elem.value = round(elem.value);
            slider.min = elem.value;
            ( sliderDef.value < min ) && ( sliderDef.value = elem.value );
            break;
          case "max":
            ( elem.value < min + minRange ) && ( elem.value = min + minRange );
            elem.value = round(elem.value);
            slider.max = elem.value;
            ( sliderDef.value > max ) && ( sliderDef.value = elem.value );
            break;
        }
        setSliderDef();
        return;
      }

    });

    document.body.addEventListener("click", function(e){
      var elem = e.target;
      if(elem.tagName != "BUTTON") return;

      switch (elem.name) {
        case "reset":
          loadSettingsToDOM(DEFAULT);
          break;
        case "save":
          saveSettingsToStorage(null);   //  if null argument, load settings from DOM
          break;
        case "close":
          window.close();
          break;
        default:
      }

    });

    document.body.addEventListener("keydown", function(e){
      (e.which === 27) && window.close(); //escape
      (e.which === 13) && saveSettingsToStorage(); // enter
      if( (e.which === 83) && (e.ctrlKey === true) ) {
        e.preventDefault();
        saveSettingsToStorage();
      }
    });

    document.body.addEventListener("wheel", function(e){
      if( !e.path[0] ) return;

      var elem = e.path[0];
      if( elem.tagName !== "INPUT" ) return;
      if( (elem === document.activeElement) && (elem.id !== "slider")) return;

      e.preventDefault();
      e.stopPropagation();

      if(e.deltaY < 0){
        elem.value = round(+elem.value + +elem.step);
      }else{
        elem.value = round(+elem.value - +elem.step);
      }
      var inputEvent = new InputEvent("input", { 'bubbles': true, "cancelable": true} );
      inputEvent.madeByWheel = true;
      elem.dispatchEvent( inputEvent );

    }, {passive: false});
  }

  function saveSettingsToStorage( settings ){
    if(!settings){
      settings = {};
      settings.min           = +sliderMin.value;
      settings.max           = +sliderMax.value;
      settings.step          = +sliderStep.value;
      settings.default       = +sliderDef.value;
      settings.multiplier    = +multiplier.value;
      settings.mouseWait     = +mouseWait.value;
      settings.mouseInterval = +mouseInterval.value;
    }

    chrome.storage.local.set ( {"MXSpeederSettings": settings} );
  }

  function loadSettingsToDOM( opt ){
    sliderMin.value     = slider.min = opt.min;
    sliderMax.value     = slider.max = opt.max;
    sliderStep.value    = opt.step;
    sliderDef.value     = opt.default;
    multiplier.value    = opt.multiplier;
    mouseWait.value     = opt.mouseWait;
    mouseInterval.value = opt.mouseInterval;

    setSliderDef();
  }

  function setSliderDef() {
    const TODDLER_WIDTH = 6;

    slider.value = sliderDef.value;
    var sliderRange = sliderMax.value - sliderMin.value;
    var rel = (+slider.value - slider.min) / sliderRange;
    var width = slider.getBoundingClientRect().width;
    var pos = (width - TODDLER_WIDTH*2) * rel;
    pos = round(pos);

    var offsetLeft = sliderMin.parentElement.offsetWidth + TODDLER_WIDTH;
    offsetLeft += parseInt( window.getComputedStyle(slider).marginLeft );
    var defHalf = round(sliderDef.parentElement.offsetWidth / 2);

    sliderDef.parentElement.style.left = round(offsetLeft + pos - defHalf) + "px";
    // console.log(round(offsetLeft + pos - defHalf) + "px");
    console.log(pos);
  }

  function round(x){
    return Math.round( x*10 ) / 10;
  }

})();
