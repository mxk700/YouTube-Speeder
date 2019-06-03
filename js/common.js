"use strict";

(function getSettingsAndStart(){
  if (window.MXSpeederSettings){  // case for blank iframes, short way
    start();
    return;
  }

  window.addEventListener( "message", getOptions );
  window.postMessage( "send YTB Option",  "*" );

  function getOptions(event){
    const res = event.data;
    const isSettingsValid = res && res.mouseInterval && res.multiplier && res.mouseWait ? true : false;

    if( isSettingsValid ){
      window.removeEventListener("message", getOptions);
      window.MXSpeederSettings = { ...event.data };
      start();
    }
  }
})();


function start(){

  (function setGlobals(){
    window.speeders = [];
    window.makeCommonSpeederProto = makeCommonSpeederProto;
    window.makeCommonSpeeder      = makeCommonSpeeder;
    window.setSpeederSettings     = setSpeederSettings;
    window.appendStyles           = appendStyles;
  })();

  (function setGlobalAuxFunctions(){
    window.mx_round = x => Math.round( x * 10) / 10;
    window.mx_ceil  = x => Math.ceil( x * 10) / 10;
    window.mx_newEl = el => {
      const res = document.createElement(el.tagName);
      el.id && ( res.id = el.id );
      el.classN && el.classN.forEach( cl => res.classList.add(cl) );
      return res;
    };
  })();

  window.postMessage( "start_the_Extension", "*");

  // LIBRARY
  function makeCommonSpeederProto(){
    return {
      digitsChanged (e){
        this.slider.value = this.digits.value;
        this.video.playbackRate = +this.digits.value;
        this.cont.focus();
      },

      sliderChanged (e){
        this.digits.value = this.slider.value;
      },

      sliderClick (e){
        e.stopPropagation();
        this.digitsChanged();
      },

      decrease (e){
        e.stopPropagation();
        this.handleSpeederValue.call(this, e.ctrlKey, false);
      },

      increase (e){
        e.stopPropagation();
        this.handleSpeederValue.call(this, e.ctrlKey, true);
      },

      reset (e){
        e.stopPropagation();
        this.digits.value = window.MXSpeederSettings.default;
        this.digits.dispatchEvent( new InputEvent("input"));
      },

      mousewheel (e){
        e.preventDefault();
        e.stopPropagation();
        var delta = e.deltaY || e.detail || e.wheelDelta;
        (delta < 0) ? this.increase(e) : this.decrease(e);
      },

      keydown (e){
        e.preventDefault();
        e.stopPropagation();

        switch (e.which) {
          case 38:  //up arrow
          case 39:  //right arrow
          case 107: //+
            this.increase(e);
            break;
          case 37:  //left arrow
          case 40:  //down arrow
          case 109: //-
            this.decrease(e);
            break;
          case 32: //space
          case 27: //esc
          case 13: //enter
          case 36: //home
            this.reset();
            break;
          case 35: //end
            this.digits.value = window.MXSpeederSettings.max;
            this.digits.dispatchEvent( new InputEvent("input"));
            break;
          case 46: //del
            this.digits.value = window.MXSpeederSettings.min;
            this.digits.dispatchEvent( new InputEvent("input"));
            break;
          case 33: //page up
            this.handleSpeederValue.call(this, true, true);
            break;
          case 34: //page down
            this.handleSpeederValue.call(this, true, false);
            break;
          default:
        }
      },

      mouseDownUp(e){
        e.stopPropagation();
        this.handleMouseAcc(this.increment, this.increase, this, true);
      },

      mouseDownDown(e){
        e.stopPropagation();
        this.handleMouseAcc(this.decrement, this.decrease, this, false);
      },

      handleMouseAcc(elem, func, that, directionFlag){
        var timer = setTimeout( ()=>{
            cycle(func, that);
            elem.classList.add("arrowPressed");
          },
          window.MXSpeederSettings.mouseWait
        );

        elem.addEventListener("mouseup", ()=>{
            clearTimeout(timer);
            elem.classList.remove("arrowPressed");
          },
          {"once":true}
        );
        elem.addEventListener("mouseleave", ()=>{
            clearTimeout(timer);
            elem.classList.remove("arrowPressed");
          },
          {"once":true}
        );

        function cycle(func, that){
          func.call(that, {ctrlKey:false});
          timer = setTimeout( cycle,	window.MXSpeederSettings.mouseInterval, func, that);
        };

      },

      handleSpeederValue( isCtrl, isUp){
        var val = window.mx_round( this.digits.value );
        var change = +this.digits.step;

        isCtrl && ( change = window.mx_round( change * window.MXSpeederSettings.multiplier) );

        if(isUp){
          var newVal = window.mx_round( val + change );
          this.digits.value = (newVal > +this.digits.max) ? this.digits.max : newVal;
        }else{
          newVal = window.mx_round( val - change );
          this.digits.value = (newVal < +this.digits.min) ? this.digits.min : newVal;
        }

        this.digits.dispatchEvent( new InputEvent("input"));
      }
    }
  }

  function makeCommonSpeeder(elem) {
    this.video 			  = elem;
    this.cont 			  = window.mx_newEl({tagName:"div",    id:"mxkYtb_container"});
    this.decrement 	  = window.mx_newEl({tagName:"button", id:"mxkYtb_decrement"});
    this.increment    = window.mx_newEl({tagName:"button", id:"mxkYtb_increment"});
    this.resetter 	  = window.mx_newEl({tagName:"button", id:"mxkYtb_resetter"});

    this.digits 			= window.mx_newEl({tagName:"input", id:"mxkYtb_digits"});
    this.digits.type 	= "number";
    this.digits.value = "1";

    this.slider 			= window.mx_newEl({tagName:"input", id:"mxkYtb_slider"});
    this.slider.type 	= "range";

    this.cont.appendChild(this.decrement);
    this.cont.appendChild(this.slider);
    this.cont.appendChild(this.increment);
    this.cont.appendChild(this.digits);
    this.cont.appendChild(this.resetter);
    this.cont.tabIndex = -1;

    // because someone in YT rewrite original addEventListener
    var listener = EventTarget.prototype.addEventListener;
    listener.apply(this.slider, ["input", this.sliderChanged.bind(this)]);
    listener.apply(this.slider, ["click", this.sliderClick.bind(this)]);
    listener.apply(this.digits, ["input", this.digitsChanged.bind(this)]);
    listener.apply(this.decrement, ["click", this.decrease.bind(this)]);
    listener.apply(this.decrement, ["mousedown", this.mouseDownDown.bind(this)]);
    listener.apply(this.increment, ["click", this.increase.bind(this)]);
    listener.apply(this.increment, ["mousedown", this.mouseDownUp.bind(this)]);
    listener.apply(this.resetter, ["click", this.reset.bind(this)]);
    listener.apply(this.cont, ["wheel", this.mousewheel.bind(this)], {passive: false});
    listener.apply(this.cont, ["keydown", this.keydown.bind(this)]);

    return this;
  }

  function setSpeederSettings(speeders, isNewFlag){
    const options = window.MXSpeederSettings;

    speeders.forEach( function(elem){
      var slider = elem.slider;
      var digits = elem.digits;

      slider.min 	= digits.min = options.min;
      slider.max 	= digits.max = options.max;
      slider.step = digits.step = options.step;

      if(isNewFlag){
        digits.value = options.default;
      }else{
        if( +digits.value < +slider.min) {
          digits.value = slider.min;
        }
        if( +digits.value > +slider.max) {
          digits.value = slider.max;
        }
      }
      digits.dispatchEvent( new InputEvent("input"));
    });
  }

  function appendStyles(parentEl, relativePath){
    var style  = document.createElement('link');
    style.id   = 'mxk700_ext_style';
    style.rel  = 'stylesheet';
    style.type = "text/css";
    style.href = window.MXSpeederSettings.EXT_PATH + relativePath;
    parentEl.appendChild(style);
  }
}
