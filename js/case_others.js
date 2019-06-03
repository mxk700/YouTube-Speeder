//  case others
// here we think that there can be more than 1 video tag
// that should be handled

// Special cases:
 // - FACEBOOK

// start only when common script finished its work
window.addEventListener("message", getPermission);

function getPermission(event){
   // start only when common script finished its work
   if(event.data !== "start_the_Extension") return;
   window.removeEventListener("message", getPermission);
   startOthers();
}

function startOthers(){
  const STYLES   = "/css/styles_others.css";
  const STYLES_FB = "/css/styles_FB.css";
  const DELAY  = 3000;

  (function findAndHandle(){
    const config = { childList: true, subtree: true };
  	const observerOthers = new MutationObserver( findVideoTags );
  	observerOthers.observe(document.body, config );

    findVideoTags();

    function findVideoTags(){
      var othersVideo = document.body.querySelectorAll("video:not(.mxkExtHandled)");
      othersVideo.length && addSpeeders(othersVideo);
    }
  })();

  function addSpeeders(othersVideo){
    othersVideo.forEach( video => {
      const speeder = makeSpeederForOthers( video );
      window.speeders.push(speeder);
    });

    window.setSpeederSettings( window.speeders, true);
  }

  function makeSpeederForOthers( videoTag ){
    const speeder = Object.create(makeProtoForOthers() );
    window.makeCommonSpeeder.call(speeder, videoTag);

    const shadowHost = document.createElement("div");
    shadowHost.id = "mxk_shadow_host";
    videoTag.parentElement.appendChild(shadowHost);

    const shadowRoot = shadowHost.attachShadow({mode: 'open'});

    window.appendStyles( shadowRoot, STYLES );
    shadowRoot.appendChild(speeder.cont);

    if(window.location.host === "www.facebook.com"){
      window.appendStyles( videoTag.parentElement, STYLES_FB );
    }

    videoTag.classList.add("mxkExtHandled");
    document.querySelectorAll(`[class*="eventCatcher"]`).forEach(
      el => el.parentElement.removeChild(el)
    );

    speeder.attachListeners();
    speeder.timer = null;
  	return speeder;
  }

  function makeProtoForOthers(){
    const proto = Object.create( window.makeCommonSpeederProto() );

    proto.pausePressed = function(e){
      this.cont.classList.add("show-full");
      clearTimeout(this.timer);
    };

    proto.mouseMoved = function(e){
      if( this.video.paused ) return;

      this.cont.classList.add("show-full");
      classRemoveDelayed(this);
    };

    proto.playingResumed = function(e){
      classRemoveDelayed(this);
    };

    proto.mouseLeft = function(e){
      if( this.video.paused ) return;

      this.cont.classList.remove("show-full");
      clearTimeout(this.timer);
    };

    proto.attachListeners = function(){
      var listener = EventTarget.prototype.addEventListener;
      listener.apply( this.video, ["mouseleave", this.mouseLeft.bind(this)] );
      listener.apply( this.video, ["mousemove", this.mouseMoved.bind(this)] );
      listener.apply( this.video, ["play", this.playingResumed.bind(this)] );
      listener.apply( this.video, ["pause", this.pausePressed.bind(this)] );
    };

    return proto;

    function classRemoveDelayed(speeder){
      clearTimeout(speeder.timer);
      speeder.timer = setTimeout( () => { speeder.cont.classList.remove("show-full"); }, DELAY);
    }
  }
















}

