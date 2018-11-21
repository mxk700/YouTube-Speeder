
;(function(){
	"use strict";

	var speederProto = null;
	var speeders = [];
	var options = getSettings();
	var notYoutubeVideos = [];

	if(!options) {
		console.error("No options retrived.");
		return;
	}

	const SpeederProto = getSpeederProto();
	const YT_SpeederProto = getYT_SpeederProto();
	Object.setPrototypeOf(YT_SpeederProto, SpeederProto);


	if(window.location.host === "www.youtube.com"){
			// console.log( "Youtube case");
			youtubeVideoSearchAndHandle();
			listenToYoutubeVideo();
	} else {
			// console.log( "Non-Youtube case");
			otherVideoSearchAndHandle();
			listenToOtherVideo();
	}

	(function listenToSpeederSettingChanges(){
		var scrpt = document.getElementById("mxk700_YT_ext_settings_buffer");
		if(!scrpt) return;

		var config = { attributes:true };
		const observer = new MutationObserver( ()=>{ manageSettings(speeders, false) } );
		observer.observe( scrpt, config );
	})();


	// YOUTUBE LIBRARY		YOUTUBE LIBRARY		YOUTUBE LIBRARY		YOUTUBE LIBRARY
	// YOUTUBE LIBRARY		YOUTUBE LIBRARY		YOUTUBE LIBRARY		YOUTUBE LIBRARY
	function youtubeVideoSearchAndHandle(){
		var vTags	= document.querySelectorAll('video');
		if( !vTags.length ) return;

		vTags.forEach( (vTag) => {
			var mxkSldr = vTag.parentElement.parentElement.querySelector("#mxkYtb_container");
			if(mxkSldr) return;							// if video tag has been already handled, return;

			var speeder = YT_Speeder.call( Object.create(YT_SpeederProto), vTag );
			manageSettings([speeder], true);
			speeders.push(speeder);
		});
	}

	function listenToYoutubeVideo(){
    var ytdApp = document.querySelector("ytd-app");
    if(!ytdApp) return;

    var config = { childList:true, subtree:true };
    const observer = new MutationObserver( youtubeVideoSearchAndHandle );
    observer.observe( document.querySelector("ytd-app"), config );
  };


	// NON-YOUTUBE LIBRARY		NON-YOUTUBE LIBRARY		NON-YOUTUBE LIBRARY
	// NON-YOUTUBE LIBRARY		NON-YOUTUBE LIBRARY		NON-YOUTUBE LIBRARY
	function otherVideoSearchAndHandle(){
		var vTags	= document.querySelectorAll('video');
		if( !vTags.length ) return;

		vTags.forEach( (vTag) => {
			var mxkSldr = vTag.parentElement.querySelector("#mxkYtb_container");
			if(mxkSldr) return;							// if video tag has been already handled, return;

			var speeder = NonYTB_Speeder.call( Object.create(SpeederProto), vTag );
			manageSettings([speeder], true);
			speeders.push(speeder);
		});

	}

	function listenToOtherVideo(){
		if(window.location.host === "www.youtube.com") return;

		var config = { childList:true, subtree:true };
		const observer = new MutationObserver( otherVideoSearchAndHandle );
		observer.observe( document, config );

	};

	// SETTINGS LIBRARY
	// SETTINGS LIBRARY
	function getSettings(){
		var b = document.getElementById("mxk700_YT_ext_settings_buffer");
		if(!b) return null;

		b = b.dataset;
		options = {};
		options.min = +b.min;
		options.max = +b.max;
		options.step = +b.step;
		options.default = +b.default;
		options.multiplier = +b.multiplier;
		options.mouseWait = +b.mouseWait;
		options.mouseInterval = +b.mouseInterval;
		return options;
	}

	function setSettings(speeders, options, isNewFlag){
		speeders.forEach( function(elem){
			var slider = elem.slider;
			var digits = elem.digits;

			slider.min 	= digits.min = options.min;
			slider.max 	= digits.max = options.max;
			slider.step 	= digits.step = options.step;

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

	function manageSettings(speeders, isNewFlag) {
		setSettings( speeders, getSettings(), isNewFlag);
	}


// SPEEDERS
// SPEEDERS
	function Speeder(elem) {
		this.video 			= elem;
		this.cont 			= newEl({tagName:"div", id:"mxkYtb_container"});
		this.decrement 	= newEl({tagName:"button", id:"mxkYtb_decrement"});
		this.increment  = newEl({tagName:"button", id:"mxkYtb_increment"});
		this.resetter 	= newEl({tagName:"button", id:"mxkYtb_resetter"});

		this.digits 			= newEl({tagName:"input", id:"mxkYtb_digits"});
		this.digits.type 	= "number";
		this.digits.value = "1";

		this.slider 			= newEl({tagName:"input", id:"mxkYtb_slider"});
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
		listener.apply(this.digits, ["input", this.digintsChanged.bind(this)]);
		listener.apply(this.decrement, ["click", this.decrease.bind(this)]);
		listener.apply(this.decrement, ["mousedown", this.mouseDownDown.bind(this)]);
		listener.apply(this.increment, ["click", this.increase.bind(this)]);
		listener.apply(this.increment, ["mousedown", this.mouseDownUp.bind(this)]);
		listener.apply(this.resetter, ["click", this.reset.bind(this)]);
		listener.apply(this.cont, ["wheel", this.mousewheel.bind(this)], {passive: false});
		listener.apply(this.cont, ["keydown", this.keydown.bind(this)]);

		return this;
	}

	function NonYTB_Speeder(elem){
		Speeder.call(this, elem);

		this.parEl = elem.parentElement;
		this.parEl.appendChild(this.cont);

		this.cont.classList.add("non-ytb");

		return this;
	}

	function YT_Speeder(elem){
		Speeder.call(this, elem);

		// YT_Speeder environment:
		this.parEl 			= elem.parentElement.parentElement;
		this.ytBottom 	= this.parEl.querySelector(".ytp-chrome-bottom");
		this.ytBar 			= this.ytBottom.querySelector(".ytp-chrome-controls");
		this.ytBarLeft 	= this.ytBar.querySelector(".ytp-left-controls");
		this.ytBarRight = this.ytBar.querySelector(".ytp-right-controls");

		// because someone in YT rewrite original addEventListener
		var listener = EventTarget.prototype.addEventListener;
		listener.apply(this.cont, ["mouseenter", this.mouseenter.bind(this)]);
		listener.apply(this.cont, ["mouseleave", this.mouseleave.bind(this)]);


		this.ytBar.appendChild(this.cont);

		// on screen resize event
		const observer1 = new MutationObserver( this.resize.bind(this) );
		observer1.observe(this.video, this.configVideo );

		// on bottom panel resize event.
		// Sometimes left bottom panel buttons hides or appears after resize fuction worked.
		// As a result, speeder block goes hidden.
		const observer2 = new MutationObserver( this.resize.bind(this) );
		observer2.observe(this.ytBar, this.configPanel );

		this.resize();

		return this;
	}

	function getSpeederProto(){
		return {
			digintsChanged (e) {
				this.slider.value = this.digits.value;
				this.video.playbackRate = +this.digits.value;
				this.cont.focus();
			},

			sliderChanged (e) {
				this.digits.value = this.slider.value;
			},

			sliderClick (e) {
				this.digintsChanged();
			},

			decrease (e) {
				this.handleSpeederValue.call(this, e.ctrlKey, false);
			},

			increase (e) {
				this.handleSpeederValue.call(this, e.ctrlKey, true);
			},

			reset (e) {
				this.digits.value = options.default;
				this.digits.dispatchEvent( new InputEvent("input"));
			},

			mousewheel (e) {
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
						this.digits.value = options.max;
						this.digits.dispatchEvent( new InputEvent("input"));
						break;
					case 46: //del
						this.digits.value = options.min;
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
				this.handleMouseAcc(this.increment, this.increase, this, true);
			},

			mouseDownDown(e){
				this.handleMouseAcc(this.decrement, this.decrease, this, false);
			},

			handleMouseAcc(elem, func, that, directionFlag){
				var timer = setTimeout( ()=>{
						cycle(func, that);
						elem.classList.add("arrowPressed");
					},
					options.mouseWait
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
					timer = setTimeout( cycle,	options.mouseInterval, func, that);
				};

			},

			handleSpeederValue( isCtrl, isUp){
				var val = round( this.digits.value );
				var change = +this.digits.step;

				isCtrl && ( change = round( change * options.multiplier) );

				if(isUp){
					var newVal = round( val + change );
					this.digits.value = (newVal > +this.digits.max) ? this.digits.max : newVal;
				}else{
					newVal = round( val - change );
					this.digits.value = (newVal < +this.digits.min) ? this.digits.min : newVal;
				}

				this.digits.dispatchEvent( new InputEvent("input"));
			}
		}
	}

	function getYT_SpeederProto(){
		return {
			// for MutationObserver on resize
			configVideo: {
				attributes: true,
				attributeFilter: ["style"]
			},

			configPanel: {
				subtree: true,
				attributeFilter: ["style"]
			},

			resize() {
				var barX 				= this.ytBar.clientWidth;
				var rightBX 		= this.ytBarRight.clientWidth;
				var leftBX 			= this.ytBarLeft.clientWidth;
				var spareSpace 	= barX - leftBX - rightBX;

				this.resetter.classList.add("invisible");
				this.slider.classList.add("invisible");
				this.digits.classList.add("invisible");
				this.resetter.classList.remove("hidden");
				this.slider.classList.remove("hidden");
				this.digits.classList.remove("hidden");

				var butX = this.resetter.offsetWidth + parseFloat(window.getComputedStyle(this.resetter).marginLeft) * 2;
				butX = ceil(butX);
				var sliderX = this.slider.offsetWidth + parseFloat(window.getComputedStyle(this.slider).marginLeft) * 2;
				var sliderX = ceil(sliderX);
				var digitsX = this.digits.offsetWidth;

				var speederFullX = butX * 3 + sliderX + digitsX;
				this.resetter.classList.remove("invisible");
				this.slider.classList.remove("invisible");
				this.digits.classList.remove("invisible");

				var ruleItems = [this.decrement, this.slider, this.increment, this.digits, this.resetter];
				setClassByMask = setClassByMask.bind(this, ruleItems);

				if ( spareSpace > speederFullX ){
					this.cont.classList.contains("compact") && setClassByMask( [1, 1, 1, 1, 1] );
					return;
				}

				(function recalcSpeederLength(space){
					if( butX + sliderX + digitsX  < space ){
						return setClassByMask( [0, 1, 0, 1, 1] );
					}

					if( butX + digitsX  < space ){
						return setClassByMask( [0, 0, 0, 1, 1] );
					}

					if( digitsX < space ){
						return setClassByMask( [0, 0, 0, 1, 0] );
					}

					setClassByMask( [0, 0, 0, 0, 0] );
				}).call(this, spareSpace);

				function setClassByMask( elems, mask ){
					var sum = 0;
					for(var i = 0; i < elems.length; i++){
						if( mask[i] ) {
							elems[i].classList.remove("hidden");
							sum++;
						} else {
							elems[i].classList.add("hidden");
						}
					}

					( sum < 5 ) && this.cont.classList.add("compact");

					if(!sum){
						this.cont.classList.add("hidden");
						return;
					}

					( sum === 5 ) && this.cont.classList.remove("compact");
					( sum === 5 ) && this.cont.classList.remove("hidden");
				}
			},

			mouseenter() {
				this.cont.focus();
				this.dontHideBottomPanel.call(this, true);
			},

			mouseleave() {
				this.cont.blur();
				this.dontHideBottomPanel.call(this, false);
			},

			dontHideBottomPanel(flag) {
			if(flag){
				this.timer = setInterval( ()=> this.parEl.wakeUpControls(), 3000);
				return;
			}
			clearInterval(this.timer);
		}
		}
	}

// AUXILIARY
// AUXILIARY
	function round(x){
		return Math.round( x * 10) / 10;
	}

	function ceil(x){
		return Math.ceil( x * 10) / 10;
	}

	function newEl(el){
		var res = document.createElement(el.tagName);
		el.id && ( res.id = el.id );
		el.classN && el.classN.forEach( (cl)=>res.classList.add(cl) );

		return res;
	}
})();
