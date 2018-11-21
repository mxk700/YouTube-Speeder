
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

	youtubeVideoSearcher();

  (function listenToNew_NOT_YoutubeVideo(){
		if(window.location.host === "www.youtube.com") return;

		var config = { childList:true, subtree:true };
		const observer = new MutationObserver( otherVideoSearcher );
		observer.observe( document, config );

	})();


  (function listenToNewYoutubeVideo(){
    var ytdApp = document.querySelector("ytd-app");
    if(!ytdApp) return;

    var config = { childList:true, subtree:true };
    const observer = new MutationObserver( youtubeVideoSearcher );
    observer.observe( document.querySelector("ytd-app"), config );
  })();

	(function listenToSpeederSettingChanges(){
		var scrpt = document.getElementById("mxk700_YT_ext_settings_buffer");
		if(!scrpt) return;

		var config = { attributes:true };
		const observer = new MutationObserver( ()=>{ manageSettings(speeders, false) } );
		observer.observe( scrpt, config );
	})();


	// LIBRARY		LIBRARY		LIBRARY		LIBRARY		LIBRARY		LIBRARY		LIBRARY		LIBRARY
	function youtubeVideoSearcher (){
		var vTags	= document.querySelectorAll('video');
		if( !vTags.length ) return;

		speederProto || ( speederProto = new SpeederProto() ); // make SpeederProto only if more than 0 video tags exist

		vTags.forEach( (vTag) => {
			var mxkSldr = vTag.parentElement.parentElement.querySelector("#mxkYtb_container");
			if(mxkSldr) return;							// if video tag has been already handled, return;

			var speeder = Speeder.call( Object.create(speederProto), vTag );
			manageSettings([speeder], true);
			speeders.push(speeder);
		});
	}
	function otherVideoSearcher(){
		var vTags	= document.querySelectorAll('video');
		if( !vTags.length ) return;

		for(let i = 0; i < vTags.length; i++){
			let isOld = notYoutubeVideos.some( el => el === vTags[i] );

			// console.log(isOld);
			isOld || notYoutubeVideos.push(vTags[i]);
		}

		// console.log("Not-Youtube videos found!");
		console.log(notYoutubeVideos);
	}


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
			console.dir(elem);
		});
	}

	function manageSettings(speeders, isNewFlag) {
		setSettings( speeders, getSettings(), isNewFlag);
	}

	function Speeder(elem) {
		// Speeder environment:
		this.video 			= elem;
		this.parEl 			= elem.parentElement.parentElement;
		this.ytBottom 	= this.parEl.querySelector(".ytp-chrome-bottom");
		this.ytBar 			= this.ytBottom.querySelector(".ytp-chrome-controls");
		this.ytBarLeft 	= this.ytBar.querySelector(".ytp-left-controls");
		this.ytBarRight = this.ytBar.querySelector(".ytp-right-controls");

		// Speeder content
		this.cont 			= newEl({tagName:"div", id:"mxkYtb_container"});
		this.reducer 		= newEl({tagName:"button", id:"mxkYtb_reducer"});
		this.increaser  = newEl({tagName:"button", id:"mxkYtb_increaser"});
		this.resetter 	= newEl({tagName:"button", id:"mxkYtb_resetter"});

		this.digits 			= newEl({tagName:"input", id:"mxkYtb_digits"});
		this.digits.type 	= "number";
		this.digits.value = "1";

		this.slider 			= newEl({tagName:"input", id:"mxkYtb_slider"});
		this.slider.type 	= "range";

		this.cont.appendChild(this.reducer);
		this.cont.appendChild(this.slider);
		this.cont.appendChild(this.increaser);
		this.cont.appendChild(this.digits);
		this.cont.appendChild(this.resetter);
		this.cont.tabIndex = -1;

		this.ytBar.appendChild(this.cont);

		// because someone in YT rewrite original addEventListener
		var addListener = EventTarget.prototype.addEventListener;
		addListener.apply(this.slider, ["input", this.sliderChanged.bind(this)]);
		addListener.apply(this.slider, ["click", this.sliderClick.bind(this)]);
		addListener.apply(this.digits, ["input", this.digintsChanged.bind(this)]);
		addListener.apply(this.reducer, ["click", this.reduce.bind(this)]);
		addListener.apply(this.reducer, ["mousedown", this.mouseDownDown.bind(this)]);
		addListener.apply(this.increaser, ["click", this.increase.bind(this)]);
		addListener.apply(this.increaser, ["mousedown", this.mouseDownUp.bind(this)]);
		addListener.apply(this.resetter, ["click", this.reset.bind(this)]);
		addListener.apply(this.cont, ["wheel", this.mousewheel.bind(this)], {passive: false});
		addListener.apply(this.cont, ["mouseenter", this.mouseenter.bind(this)]);
		addListener.apply(this.cont, ["mouseleave", this.mouseleave.bind(this)]);
		addListener.apply(this.cont, ["keydown", this.keydown.bind(this)]);

		// on screen resize event
		const observer1 = new MutationObserver( this.resize.bind(this) );
		observer1.observe(this.video, this.configVideo );

		// on bottom panel resize event.
		// Sometimes left bottom panel buttons hide or appear after resize fuction worked.
		// As a result, speeder block go hidden.
		const observer2 = new MutationObserver( this.resize.bind(this) );
		observer2.observe(this.ytBar, this.configPanel );

		this.resize();

		// this.digits.value = options.default;
		// this.digits.dispatchEvent( new InputEvent("input"));

		return this;
	}

	function SpeederProto(){
		// for MutationObserver on resize
		Object.defineProperty(this, "configVideo", {
			get(){
				return {
					attributes: true,
					attributeFilter: ["style"]
				};
			}
		});
		Object.defineProperty(this, "configPanel", {
			get(){
				return {
					subtree: true,
					attributeFilter: ["style"]
				};
			}
		});

		this.digintsChanged = function (e) {
			this.slider.value = this.digits.value;
			this.video.playbackRate = +this.digits.value;
			this.cont.focus();
		}

		this.sliderChanged = function (e) {
			this.digits.value = this.slider.value;
		}

		this.sliderClick = function (e) {
			this.digintsChanged();
		}

		this.reduce = function (e) {
			handleSpeederValue.call(this, e.ctrlKey, false);
		};

		this.increase = function (e) {
			handleSpeederValue.call(this, e.ctrlKey, true);
		};

		this.reset = function (e) {
			this.digits.value = options.default;
			this.digits.dispatchEvent( new InputEvent("input"));
		};

		this.mousewheel = function (e) {
			e.preventDefault();
			e.stopPropagation();
			var delta = e.deltaY || e.detail || e.wheelDelta;
	    (delta < 0) ? this.increase(e) : this.reduce(e);
		}

		this.resize = function () {
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

			var ruleItems = [this.reducer, this.slider, this.increaser, this.digits, this.resetter];
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
		}

		this.mouseenter = function () {
			this.cont.focus();
			dontHideBottomPanel.call(this, true);
		}

		this.mouseleave = function () {
			this.cont.blur();
			dontHideBottomPanel.call(this, false);
		}

		this.keydown = function (e){
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
					this.reduce(e);
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
					handleSpeederValue.call(this, true, true);
					break;
				case 34: //page down
					handleSpeederValue.call(this, true, false);
					break;
				default:
			}
		}

		this.mouseDownUp = function(e){
			handleMouseAcc(this.increaser, this.increase, this, true);
		};

		this.mouseDownDown = function(e){
			handleMouseAcc(this.reducer, this.reduce, this, false);
		};


		function handleMouseAcc(elem, func, that, directionFlag){
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

		}

		function dontHideBottomPanel(flag) {
			if(flag){
				this.timer = setInterval( ()=> this.parEl.wakeUpControls(), 3000);
				return;
			}
			clearInterval(this.timer);
		}

		function handleSpeederValue( isCtrl, isUp){
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

		function round(x){
			return Math.round( x * 10) / 10;
		}

		function ceil(x){
			return Math.ceil( x * 10) / 10;
		}
	}

	function newEl(el){
		var res = document.createElement(el.tagName);
		el.id && ( res.id = el.id );
		el.classN && el.classN.forEach( (cl)=>res.classList.add(cl) );

		return res;
	}

})();
