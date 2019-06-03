// Youtube case:
// handle only one video tag on page
// tip: if issues with slider rendering, try attach listener to play/pause

// start only when common script finished its work
window.addEventListener("message", getPermission);

function getPermission(event){
   // start only when common script finished its work
   if(event.data !== "start_the_Extension") return;
   window.removeEventListener("message", getPermission);
   startYouTube();
}

function startYouTube(){
  const STYLES = "/css/styles_YT.css";
  const VIDEO  = "div.html5-video-container > video";

  window.appendStyles( document.body, STYLES );

  (function findAndHandle(){
    if( findVideo() ) return;

    const config = { childList: true, subtree: true };
  	const observerYT = new MutationObserver( waitForVideoTag );
  	observerYT.observe(document.body, config );

    function waitForVideoTag(mutation){
      findVideo() && observerYT.disconnect();
    }

    function findVideo(){
      var ytVideo = document.body.querySelector(VIDEO);

      if(ytVideo){
        addSpeeder( ytVideo);
        return true;
      }

      return false;
    }
  })();

  function addSpeeder(ytVideo){
    // if video tag has been already handled, return;
    const ifExists = !!ytVideo.parentElement.parentElement.querySelector("#mxkYtb_container");
    if( ifExists ) return;;

    // making youtube speeder prototype based on common speeder prototype
    const commonSpeederProto  = window.makeCommonSpeederProto();
    const youtubeSpeederProto = makeYoutubeSpeederProto( commonSpeederProto );

    // making speeder
    const speeder = makeYoutubeSpeeder( ytVideo, youtubeSpeederProto );

    window.setSpeederSettings( [speeder], true);
    window.speeders.push(speeder);
  }

  function makeYoutubeSpeeder(elem, proto){
    const ytSpeeder = Object.create(proto);
    window.makeCommonSpeeder.call(ytSpeeder, elem);

  	// makeYoutubeSpeeder environment:
  	ytSpeeder.parEl 		 = elem.parentElement.parentElement;
  	ytSpeeder.ytBottom 	 = ytSpeeder.parEl.querySelector(".ytp-chrome-bottom");
  	ytSpeeder.ytBar 		 = ytSpeeder.ytBottom.querySelector(".ytp-chrome-controls");
  	ytSpeeder.ytBarLeft  = ytSpeeder.ytBar.querySelector(".ytp-left-controls");
  	ytSpeeder.ytBarRight = ytSpeeder.ytBar.querySelector(".ytp-right-controls");

  	// because someone in YT rewrite original addEventListener
  	var listener = EventTarget.prototype.addEventListener;
  	listener.apply(ytSpeeder.cont,  ["mouseenter", ytSpeeder.mouseenter.bind(ytSpeeder)]);
  	listener.apply(ytSpeeder.cont,  ["mouseleave", ytSpeeder.mouseleave.bind(ytSpeeder)]);
  	listener.apply(ytSpeeder.ytBar, ["mouseenter", ytSpeeder.checkSliderAppearance.bind(ytSpeeder)]);

  	ytSpeeder.ytBar.appendChild(ytSpeeder.cont);

  	// on screen resize event
  	const observer1 = new MutationObserver( ytSpeeder.resize.bind(ytSpeeder) );
  	observer1.observe(ytSpeeder.video, ytSpeeder.configVideo );

  	// on bottom panel resize event.
  	// Sometimes left bottom panel buttons hides or appears after resize fuction has worked.
  	// As a result, speeder block goes hidden.
  	const observer2 = new MutationObserver( ytSpeeder.resize.bind(ytSpeeder) );
  	observer2.observe(ytSpeeder.ytBar, ytSpeeder.configPanel );

  	ytSpeeder.resize();

  	return ytSpeeder;
  }

  function makeYoutubeSpeederProto(proto){
    var ytsProto = Object.create(proto);

		// for MutationObserver on resize
		ytsProto.configVideo = {
			attributes: true,
			attributeFilter: ["style"]
		};
  	ytsProto.configPanel = {
			subtree: true,
			attributeFilter: ["style"]
		};

    ytsProto.resize = function(){
			var barX 			 = this.ytBar.clientWidth;
			var rightBX 	 = this.ytBarRight.clientWidth;
			var leftBX 		 = this.ytBarLeft.clientWidth;
			var spareSpace = barX - leftBX - rightBX;

			this.resetter.classList.add("invisible");
			this.slider.classList.add("invisible");
			this.digits.classList.add("invisible");
			this.resetter.classList.remove("hidden");
			this.slider.classList.remove("hidden");
			this.digits.classList.remove("hidden");

			var butX = this.resetter.offsetWidth + parseFloat(window.getComputedStyle(this.resetter).marginLeft) * 2;
			butX = window.mx_ceil(butX);
			var sliderX = this.slider.offsetWidth + parseFloat(window.getComputedStyle(this.slider).marginLeft) * 2;
			var sliderX = window.mx_ceil(sliderX);
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
          setClassByMask( [0, 1, 0, 1, 1] );
					return;
				}

				if( butX + digitsX  < space ){
          setClassByMask( [0, 0, 0, 1, 1] );
					return;
				}

				if( digitsX < space ){
          setClassByMask( [0, 0, 0, 1, 0] );
					return;
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
		};

  	ytsProto.mouseenter = function(){
			this.cont.focus();
			this.dontHideBottomPanel.call(this, true);
		};

  	ytsProto.mouseleave = function(){
			this.cont.blur();
			this.dontHideBottomPanel.call(this, false);
		};

  	ytsProto.dontHideBottomPanel = function(flag){
  		if(flag && this.parEl.wakeUpControls){
  			this.timer = setInterval( ()=> this.parEl.wakeUpControls(), 3000);
  			return;
  		}
  		clearInterval(this.timer);
	  };

    // sometimes after video has been changed speeder content
    // wrongly gets class hidden and compact. To fix it do resize:
    ytsProto.checkSliderAppearance = function(){
      if(this.cont.classList.contains("compact") ){
        this.resize();
      }
    };

    return ytsProto;
  }
}
