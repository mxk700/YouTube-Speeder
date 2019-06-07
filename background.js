chrome.storage.local.get(  "MXSpeederRun",   function (res){
  var state = ( res.MXSpeederRun === "ON" ) ? 'on' : 'off';
  var icons = {
    "16":"/img/icon16" + state + ".png",
    "24":"/img/icon24" + state + ".png",
    "32":"/img/icon32" + state + ".png"
  };
  chrome.browserAction.setIcon({path: icons});
});
