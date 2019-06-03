// vk.com case
// here we think that there can be more than 1 video tag
// that should be handled

// start only when common script finished its work
window.addEventListener("message", getPermission);

function getPermission(event){
   // start only when common script finished its work
   if(event.data !== "start_the_Extension") return;
   window.removeEventListener("message", getPermission);
   startVK();
}

function startVK(){
  const STYLES   = "/css/styles_VK.css";
  const CONTROLS = "div.videoplayer_ui > div.videoplayer_controls:not(.mxkExtHandled)";
  const VIDEO    = "div.videoplayer_media > video:not(.mxkExtHandled)";
  const SPEEDER  = "#mxkYtb_container";

  window.appendStyles( document.body, STYLES );

  (function findAndHandle(){
    const config = { childList: true, subtree: true };
  	const observerVK = new MutationObserver( findVideoAndControls );
  	observerVK.observe(document.body, config );

    findVideoAndControls();

    function findVideoAndControls(){
      const vkVideos = document.body.querySelectorAll(VIDEO);

      vkVideos.forEach( video => {
        const controls = video.parentElement.parentElement.querySelector(CONTROLS);
        controls && addSpeeder(controls, video);
      });
    }
  })();

  function addSpeeder(vkControls, vkVideo){
    const speeder = makeVKSpeeder( vkVideo, vkControls );
    window.setSpeederSettings( [speeder], true);
    window.speeders.push(speeder);
    vkVideo.classList.add("mxkExtHandled");
    vkControls.classList.add("mxkExtHandled");
  }

  function makeVKSpeeder( videoTag, parentEl ){
    const speeder = Object.create( window.makeCommonSpeederProto() );
    window.makeCommonSpeeder.call(speeder, videoTag);

  	// makeVKSpeeder environment:
  	speeder.parEl = parentEl;

    // const prevSpeeder = speeder.parEl.querySelector(SPEEDER);
    // prevSpeeder && speeder.parEl.removeChild(prevSpeeder);

    speeder.parEl.appendChild(speeder.cont);

    const config = { childList: true, subtree: true };
    const observer = new MutationObserver( observeVideoTagChange );
    observer.observe(document.body, config );

  	return speeder;

    function observeVideoTagChange(mutations){
      mutations.forEach(mutation => {
        if( !mutation.target.classList.contains("videoplayer_media") ) return;
        mutation.addedNodes.forEach( node => {
          if(node.tagName === "VIDEO"){
            speeder.video = node;
            speeder.digits.dispatchEvent( new InputEvent("input"));
          }
        });
      });
    }
  }

}
