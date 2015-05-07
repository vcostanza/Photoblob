var tabs = require("sdk/tabs"),
cm = require("sdk/context-menu"),
Request = require("sdk/request").Request,
base64 = require("sdk/base64"),
data = require("sdk/self").data,

// Context menu icon
icon16 = data.url('icon-16.png'),

// Website URL
PB_URL = "http://photo.blob.software/";

// Context menu button
cm.Item({
  label: "Open in Photoblob",
  image: icon16,
  context: cm.SelectorContext("img"),
  // Call message event below when the button is clicked
  contentScript: 'self.on("click",function(node,data){self.postMessage(node.src);})'
  
  // Handle the image source
}).on("message", function(src) {	
	// Load image data
	if(src.indexOf("data:") != 0) {
		var imageData = Request({
			url: src,
			overrideMimeType: "text/plain; charset=x-user-defined",
			onComplete: function (response) {
				var type = response.headers['Content-Type'], size = response.headers['Content-Length'];
				if(type) OpenImage(src.substring(src.lastIndexOf("/")+1), size, "data:"+type+";base64,"+base64.encode(response.text));
			}
		});
		imageData.get();
	} else {
		OpenData("image", src.length, src);
	}
});

// Open Photoblob in a new tab and pass the image data along
function OpenImage(name, size, data) {
	
	var pTab = null, i = 0,
	
	// Store image data
	sendScript = function(tab) {
		if(tab.url == PB_URL) {
			tab.attach({
				contentScript: "sessionStorage.setItem('photoblob-quick-open-img', '"+JSON.stringify({name: name, size: size, data: data})+"');"
			});
		}
		tab.removeListener("ready", sendScript);
		tab.removeListener("activate", sendScript);
	}
	
	// Attempt to find existing Photoblob tab
	for(i = 0; i < tabs.length; i++) {
		if(tabs[i].url == PB_URL) pTab = tabs[i];
	}
	
	// Update existing tab
	if(pTab) {
		pTab.on("activate", sendScript);
		pTab.activate();
		
	// Open new tab
	} else {	
		tabs.open({
			url: PB_URL,
			onReady: sendScript
		});
	}
}
