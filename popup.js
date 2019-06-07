// try/catch added for smooth work with local files

(function(){
  var switcher = document.getElementById("switcher");
  var info     = document.getElementById("info");
  if(!switcher || !info) return;


  setTimeout( function(){ switcher.classList.add("animated")}, 100);

  try{
    chrome.storage.local.get(  "MXSpeederRun",   function(res){
        var action = (res.MXSpeederRun === "ON") ? "add" : "remove";
        switcher.classList[action]("active");
      }
    );
  }catch(e){}

  switcher.addEventListener("click", function(e){
    info.parentElement.classList.add("active");
    if(this.classList.contains("active")){
      setIcon("off");

      try{
        chrome.storage.local.set ( {"MXSpeederRun": "OFF"} );
      }catch(e){}

      info.innerHTML = "Reload the page to <b>stop</b> using the Extension on this page.";
      this.classList.remove("active");
      return;
    }

    try{
      setIcon("on");
      chrome.storage.local.set ( {"MXSpeederRun": "ON"} );
    }catch(e){}

    info.innerHTML = "Reload the page to <b>start</b> using the Extension on this page.";
    this.classList.add("active");

    function setIcon(state){
      var icons = {
        "16":"/img/icon16" + state + ".png",
        "24":"/img/icon24" + state + ".png",
        "32":"/img/icon32" + state + ".png"
      };
      chrome.browserAction.setIcon({path: icons});
    }
  });

  // to hide popup when mouse left uncomment this:
  // switcher.parentElement.addEventListener("mouseleave", function(e){ window.close(); });
})();