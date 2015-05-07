/* Photoblob Image/Texture Editor and 3D Model Viewer (http://photo.blob.software/)
 * Copyright (C) 2015 Vincent Costanza
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* Included scripts to be loaded sequentially on page load */
INCLUDES = [
	// IMGFX
	"fx.js",
	// Three.js (r71)
	"three.min.js",
	// Three.js OBJ loader
	"OBJLoader.js",
	// Three.js OBJ exporter
	"OBJExporter.js",
	// Hotkeys
	"editor/hotkeys.js",
	// Main editor/GUI script
	"editor/main.js",
	// Windows
	"editor/pbox.js"
];

/* Objects and Nodes */
FileDialog = FocusObj = ImageArea = App = Input = null;

// Style
F1 = C1 = C2 = C3 = BG1 = BG2 = BG3 = BG4 = BG4C = BG5 = BG6 = BG7 = WHT = "#FFF";
BLK = "#000";
GRY = "#666";
CurrentTheme = 0;

/* Drawing update vars */
CWIDTH = 0;
CHEIGHT = 0;
Cursor = "auto";
MouseX = MouseY = LastMouseX = LastMouseY = -1;
LastUpdate = 0;
Frame = 0;

// Image properties
ZOOM = 1;
IMG_NAME = null;
IMG_SIZE = 0;
ImageArea = null;

/* Icon sprite sheet */
ALPHA_BG = null;
ERROR_IMG = null;
IC_SMALL = null;
IC_SMALL_XML = null;

/* Basic input */
CTRL = SHIFT = ALT = MDOWN = LCLICK = RCLICK = MIDCLICK = false;

// Fullscreen state
InFullscreen = false;

// Used for assigning hotkeys
LockKeyboard = false;

// Unsaved changes
Unsaved = false;

// Activate Three.JS console messages
THREE_MSG = false;

// Node server IP
// Should be left blank if node server is hosted on same server as this site
NODE_SERVER = "";

// Is this app being hosted locally?
LOCAL = (window.location.host == "" || window.location.host.indexOf("localhost:") == 0);

// Math function aliases
ABS = Math.abs, MAX = Math.max, MIN = Math.min, CEIL = Math.ceil, FLOOR = Math.floor, ROUND = Math.round, RND = Math.random,
POW = Math.pow, SQRT = Math.sqrt, PI = Math.PI, COS = Math.cos, SIN = Math.sin, HYP = Math.hypot, TRUNC = Math.trunc;

// Compatibility
if(!HYP) HYP = function(w, h) {return SQRT(w*w+h*h);};
if(!TRUNC) TRUNC = function(num) {
	if(num < 0 && FLOOR(num) < num) return FLOOR(num)+1;
	return FLOOR(num);
};

/* Return copy of array 'arr' */
function ARCPY(arr) {
	var arrcpy = new Array(arr.length), i = 0;
	for(; i < arr.length; i++) {
		arrcpy[i] = arr[i];
	}
	
	return arrcpy;
}

/* Print variables */
function CL() {
	
	// More than 1 argument
	if(arguments.length > 1) {
		var a = new Array(arguments.length), i = 0;
		for(; i < arguments.length; i++) {
			a[i] = arguments[i];
			
			// Do not print Three.js messages if THREE_MSG is false
			if(!THREE_MSG && a[i] && a[i].indexOf && a[i].indexOf("THREE.") == 0) return;
		}
		console.log(a);
		
	// 1 argument
	} else {
		console.log(arguments[0]);
	}	
}

/* Console shims */
function WARN(str) {
	if(!THREE_MSG && str.indexOf("THREE.") == 0) return;
	console.warn(str);
}

function ERR(str) { console.error(str); }

/* Get canvas 2D context */
function GC(c) { return c.getContext("2d"); }

/* Set cursor to be used after hit detection */
function SC(cursor) {
	Cursor = (cursor == undefined ? "auto" : cursor);
}

/* Get DOM element(s) by ID or class */
function E(name) {
	if(name.charAt(0) == ".")
		return document.getElementsByClassName(name.substr(1));
	return document.getElementById(name);
}

/* Show/hide element */
function D(e, show) {
	show == true ? e.style.display = "block" : e.style.display = "none";
}

/* Return current precise time */
function T() { return window.performance.now(); }

/* Test within bounds (object based) */
function WB(x, y, obj) {
	if(!obj || obj.x == null || obj.y == null || obj.w == null || obj.h == null) return false;
	return x >= obj.x && x <= obj.x+obj.w && y >= obj.y && y <= obj.y+obj.h;
}

/* Test within bounds (number based) */
function WC(x1, y1, x2, y2, w, h) {
	return x1 >= x2 && x1 <= x2+w && y1 >= y2 && y1 <= y2+h;
}

/* Clamp number */
function Clamp(num, min, max) {
	max < min ? max = min : num;
	num < min ? num = min : num;
	num > max ? num = max : num;
	return num;
}

/* Linear interpolation between 2D points using Bresenham */
function Lerp2D(x1, y1, x2, y2) {
	
	if(x1-x2 == 0 && y1-y2 == 0) return [x1, y1];
	
	// Switch variable and original starting points
	var t = false, sx = x1, sy = y1, lineSize = (MAX(ABS(x2-x1), ABS(y2-y1))+1)*2;
	
	// Set center to (0, 0) since it makes life a lot easier
	x2 -= x1;
	y2 -= y1;
	x1 = y1 = 0;
	
	// Switch before we do anything
	if(ABS(x2-x1) < ABS(y2-x1)) {
		t = y2;
		y2 = x2;
		x2 = t;
		t = true;	// Switch x and y when plotting
	}
	
	var dx = ABS(x2-x1), dy = ABS(y2-x1), yinc = (x2 > x1 ? (y1 > y2 ? -1 : 1) : (y1 > y2 ? 1 : -1)), p = 2*dy-dx, twoDy = 2*dy, twoDyMinusDx = 2*(dy-dx), buf = new Uint16Array(lineSize), x = 0, y = 0, b = 0;

	// Decide start points
	if(x1 > x2) {
		x = x2;
		y = y2;
		x2 = x1;
	} else {
		x = x1;
		y = y1;
	}
	
	// Increment
	while(b < lineSize) {		
		// Next point
		if(t) {
			buf[b] = y+sx
			buf[b+1] = x+sy;
		} else {
			buf[b] = x+sx;
			buf[b+1] = y+sy;
		}		
		x++;		
		if(p < 0) {
			p += twoDy;
		} else {
			y += yinc;
			p += twoDyMinusDx;
		}
		b += 2;
	}
	
	return buf;
}

/* Return multiplier required to scale w, h to mw, mh */
function GetScaleToFit(w, h, mw, mh) {
	return mw/w < mh/h ? mw/w : mh/h;
}

/* Convert mime to type extension */
function MimeToExt(mime) {
	switch(mime) {
		case "image/png": return "png";
		case "image/jpg":
		case "image/jpeg": return "jpg";
		case "image/gif": return "gif";
		case "image/tiff": return "tiff";
		case "image/x-icon": return "ico";
		case "image/svg+xml": return "svg";
		case "image/webp": return "webp";
		case "image/xxx": return "xxx";
	}
	return "img";
}

/* Get mime type from base64 data */
function GetBase64Mime(data) {
	if(!data || data.indexOf("data:") != 0) return "image/png";
	return data.substring(5, data.indexOf(";base64"));
}

/* Convert bytes to KB, MB, etc. */
function ByteString(b) {
	return b >= 1000 ? (b >= 1000000 ? ROUND((b/1000000)*10)/10 + " MB" : ROUND((b/1000)*10)/10 + " KB") : b+" B"
}

/* Event prevention shim */
function StopEvent(e) {
	e.preventDefault();
	e.stopPropagation();
}

/* Go fullscreen */
function FS() {
	if(!App) return;
	if(App.requestFullScreen)
		App.requestFullScreen();
	else if(App.webkitRequestFullScreen)
		App.webkitRequestFullScreen();
	else if(App.mozRequestFullScreen)
		App.mozRequestFullScreen();
	InFullscreen = true;
}

/* Cancel fullscreen */
function CFS() {
	if(document.cancelFullScreen)
		document.cancelFullScreen();
	else if(document.webkitCancelFullScreen)
		document.webkitCancelFullScreen();
	else if(document.mozCancelFullScreen)
		document.mozCancelFullScreen();
	InFullscreen = false;
}

/* Toggle fullscreen */
function TFS() {
	InFullscreen ? CFS() : FS(); 
}

/* Call a function on every child object of an object/array recursively */
function RecurCall(obj, func) {
	
	var i = 1, arr = [];
	
	for(; i < arguments.length; i++) {
		arr.push(arguments[i]);
	}
	
	for(i in obj) {
		if(obj[i] == undefined) continue;
		if(obj[i] instanceof Array) {
			RecurCall.apply(null, [obj[i]].concat(arr));
		} else if(obj[i][func]) {
			obj[i][func].apply(obj[i], arr.slice(1));
		}
	}
}

/* Update canvas dimensions, if we need to */
function FixCanvasSize() {
	if(canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
		CWIDTH = canvas.width = canvas.clientWidth;
		CHEIGHT = canvas.height = canvas.clientHeight;
		if(ImageArea) ImageArea.update();
		Update();
	}	
}

/* Load multiple scripts asynchronously one after another */
function LoadScripts(src, cb) {
	
	// Only one script passed
	if(typeof src == "string") src = [src];
	
	var j = 0, scr = null,
	nextScript = function(i) {
		
		if(j >= src.length) return;
		
		scr = document.createElement('script');
		scr.src = src[i];
		scr.type = "text/javascript";
		scr.setAttribute("async", "true");
		
		scr.onload = function(){
			if(cb) cb(FLOOR(++j*(1/src.length)*100));
			nextScript(j);
		};
		
		document.body.appendChild(scr);	
	};
	
	nextScript(j);
}

/* Read file event */
function ReadFiles(e) {
	
	if(!e) return;
	
	var reader = new FileReader(), form = new FormData(), f = null, type = e.target.uploadType, i = 0;
	
	if(type == null) type = 0;
	
	if(e.dataTransfer) f = e.dataTransfer.files;
	else f = e.target.files;
	
	if(!f) return;
	
	// Load file
	reader.onload = function(e) {
		
		// base64 image
		if(type == 0) {
			OpenImage(e.target.result, e.target.fileName);
			IMG_SIZE = e.target.size;
			
		// JSON/OBJ model
		} else if(type == 1) {
			PBOX.View3D.setModel(e.target.result, e.target.fileName);
		}
	}
	
	// Read form data
	for(; i < f.length; i++) {
		
		// Images
		if(type == 0 && f[i].type.match(/image.*/)) {
			//form.append('uploads', f[i], f[i].name);
			reader.size = f[i].size;
			reader.fileName = f[i].name;
			reader.readAsDataURL(f[i]);
			
		// JSON or plain text only
		} else if(type == 1 && (f[i].type.match(/application.java/) || f[i].type == "")) {
			reader.fileName = f[i].name;
			reader.readAsText(f[i]);
		}
	}
	
	StopEvent(e);
}

/* Update canvas draw */
function Update() {
	LastUpdate = Frame;
}

/* Start up the editor */
function StartEditor() {
	
	document.title = "Photoblob - Loading...";

	// Load icons and alpha texture
	ALPHA_BG = IMG("alpha.png");
	ERROR_IMG = IMG("icons/error.svg");
	IC_SMALL = IMG("icons/icons_small.svg");
	
	// Get important nodes
	Input = E("text-input");
	App = E("app-container");
	
	// Init canvas
	canvas = E("editor");
	if(!canvas) return;
	
	// Fix canvas size and set default theme to black
	FixCanvasSize();
	SetTheme(17);
	
	// Capture all global variables at this point - No non-capitalized globals should be declared after this
	// This can be checked later with CheckWindow()
	// This system is used to make sure common variables like 'i' or 'j' are not accidently declared globally somewhere
	CloneWindow();
	
	// Load included scripts
	LoadScripts(INCLUDES, function(progress) {
		
		// Done
		if(progress == 100) {
			
			document.title = "Photoblob - A Blobware Project";
			
			var l = E("loader");
			
			App.ondragenter = App.ondragover = StopEvent;
			
			// Canvas events
			App.addEventListener("drop", ReadFiles);
			canvas.addEventListener("click", MouseDetect);
			canvas.addEventListener("contextmenu", MouseDetect);	// Right-click
			canvas.addEventListener("mousemove", MouseDetect);
			canvas.addEventListener("mousedown", MouseDetect);
			canvas.addEventListener("mouseup", MouseDetect);
			canvas.addEventListener("mousewheel", MouseDetect);
			canvas.addEventListener("DOMMouseScroll", MouseDetect);
			
			// Input events
			addEventListener("keydown", Hotkeys);
			addEventListener("keyup", function(e) {
				// Stop Firefox menu bar from popping up
				//if(ALT && !e.altKey) StopEvent(e);
				
				CTRL = e.ctrlKey;
				SHIFT = e.shiftKey;
				ALT = e.altKey;
			});
			Input.addEventListener("paste", Paste);
			
			// Prevent unsaved changes
			addEventListener("beforeunload", ConfirmLeave);
			
			// Initialize the top menu bar
			InitMenus();
			
			// Begin drawing the GUI
			Update();
			DrawEditor();
			
			// Add-on image check
			QuickOpenCheck();
			addEventListener("focus", function(){setTimeout(QuickOpenCheck, 50);});	// Because the tab activate event fires after window.focus
			
			// Hide the loader
			l.style.pointerEvents = "none";
			l.style.opacity = 0.0;			
			setTimeout(function() {
				D(l, false);
			}, 1000);
			
		// Update loading progress
		} else {
			document.title = "Photoblob - Loading ["+progress+"%]";
		}
	});	
}

/* Detect mouse events */
function MouseDetect(e) {
	
	var t = e.target,
	
		// This is the best cross-browser method of getting canvas coordinates
		x = FLOOR(e.clientX-t.getBoundingClientRect().left),
		y = FLOOR(e.clientY-t.getBoundingClientRect().top),
		
		// Type (without "mouse" before it)
		type = (e.type.indexOf("Scroll") > -1 ? "wheel" :  e.type.replace("mouse", ""));
	
	// Used for interpolating movement
	if(type == "move") {
		LastMouseX = MouseX;
		LastMouseY = MouseY;
	}
	MouseX = x;
	MouseY = y;
	
	// Prevent right-click context menu (right-click is used for moving UVs)
	if(type == "contextmenu") {
		StopEvent(e);
		return;
		
	// Stop here if the user hits the Open Image hotkey
	} else if(type == "click") {
		if(CTRL && ALT) {
			OpenDialog();
			CTRL = ALT = false;
			return;
		}
	}
	
	// Mouse down
	if(type == "down") {
		MDOWN = true;
		switch(e.button) {
			case 0: LCLICK = true; break;
			case 1: MIDCLICK = true; break;
			case 2: RCLICK = true; break;
		}
	} else if(type == "up") MDOWN = false;
	
	// Unfocus from text box
	if(type == "down" && FocusObj) {
		FocusObj.unfocus();
		
	// Cross-platform mouse wheel event
	} else if(type == "wheel") {
		if(e.detail) type = e.detail > 0 ? "wheeldown" : "wheelup";
		else if(e.wheelDelta) type = e.wheelDelta > 0 ? "wheelup" : "wheeldown";
	}
	
	// Detect for all layers
	// Passed values are: "click", "down", "up", "wheeldown", and "wheelup"
	if(!PBOX.detect(x, y, type)) {
		if(!MenuBar.detect(x, y, type)) {
			ToolBox.detect(x, y, type);
			HistoryBox.detect(x, y, type);
			EditArea.detect(x, y, type);
			StatusBar.detect(x, y, type);
		}
	}
	
	// Prevent scroll wheel default events
	if(type.indexOf("wheel") == 0) StopEvent(e);
	
	// Mouse up
	if(type == "up") {
		switch(e.button) {
			case 0: LCLICK = false; break;
			case 1: MIDCLICK = false; break;
			case 2: RCLICK = false; break;
		}
	}
	
	// Update mouse cursor after the detection events are finished
	if(Cursor != canvas.style.cursor)
		canvas.style.cursor = Cursor;
	SC();
}

/* Detect keyboard events */
function Hotkeys(e) {
	var ct = CTRL = e.ctrlKey, k = e.key, sh = SHIFT = e.shiftKey, alt = ALT = e.altKey, hk = false;
	
	// Legacy (event.key not supported)
	if(k == null) {
		
		var kc = e.keyCode;
		
		if(kc >= 112 && kc <= 123) {
			k = "f"+(kc-111);
		}
		
		switch(e.keyCode) {
			case 8: k = "backspace"; break;
			case 9: k = "tab"; break;
			case 12: k = "unidentified"; break;
			case 16:
			case 17:
			case 18: k = ""; break;
			case 19: k = "pause"; break;
			case 20: k = "capslock"; break;
			case 27: k = "escape"; break;
			case 33: k = "pageup"; break;
			case 34: k = "pagedown"; break;
			case 35: k = "end"; break;
			case 36: k = "home"; break;
			case 37: k = "arrowleft"; break;
			case 38: k = "arrowup"; break;
			case 39: k = "arrowright"; break;
			case 40: k = "arrowdown"; break;
			case 45: k = "insert"; break;
			case 46: k = "delete"; break;
			case 92: k = "os"; break;
			case 144: k = "numlock"; break;
			case 145: k = "scrolllock"; break;
			case 187: k = "="; break;
			case 189: k = "-"; break;
			default:
				k = String.fromCharCode(e.keyCode);
				k = (sh?k.toUpperCase():k.toLowerCase());
				break;
		}
	}
	
	// Hide modifier keys
	if(k == "Control" || k == "Shift" || k == "Alt") k = "";
	
	// Set up hotkey string for reading
	var hkStr = (ct?"ctrl+":"") + (alt?"alt+":"") + (sh?"shift+":"") + k.toLowerCase();
	
	// Read hotkey input
	if(LockKeyboard) {
		
		// Only unlock keyboard when a valid key is pressed
		if(k != null && k != "") LockKeyboard = false;
		
		HK.tempKey = hkStr;
		Update();
		StopEvent(e);
		return;
	}
	
	// Special text hotkeys
	if(FocusObj) {
		var f = FocusObj;		
		// Sync input with text box
		Input.value = f.value;
		Input.setSelectionRange(MIN(f.sta, f.ind), MAX(f.sta, f.ind));
		switch(hkStr) {
			case "ctrl+a":
				f.sta = 0;
				f.ind = f.get(true).length;
				Update();
				return;
			case "ctrl+c": return;
			case "ctrl+v": return;
			case "ctrl+x":
				if(f.sta != f.ind) f.remove(0);
				return;
		}
	}
	
	// Read from Hotkeys container
	if(HK.keys[hkStr]) {
		
		// If typing within a text box, ignore non-modifier hotkeys
		if(!(FocusObj && !ct && !alt && !sh)) {
			hk = true;
			HK.keys[hkStr].func();
		}		
	}
	
	// Prevent event if a hotkey was hit
	if(hk) {		
		StopEvent(e);
		
	// Otherwise pass key to typing function
	} else {
		if(CTRL || ALT) return;
		TypeDetect(e, k);
	}
}

/* Detect regular typing */
function TypeDetect(e, k) {
	
	if(!FocusObj) return;
	
	// Disable Firefox quick find
	if(k == "/") StopEvent(e);
	
	var f = FocusObj;
	
	switch(k.toLowerCase()) {
		
		// Delete next character
		case "del":
		case "delete":
			f.remove(f.ind);
			break;
			
		// Delete previous character
		case "backspace":
			f.remove(f.ind-1);
			break;
			
		// Move cursor left
		case "left":
		case "arrowleft":
			f.moveCursor(-1);
			break;
			
		// Move cursor right
		case "right":
		case "arrowright":
			f.moveCursor(1);
			break;
			
		// Increment
		case "up":
		case "down":
		case "arrowup":
		case "arrowdown":
			// Call the wheelup/wheeldown event instead of copying code here
			f.detect(0, 0, "wheel"+k.toLowerCase().replace("arrow", ""));
			break;
			
		// Unfocus text box
		case "enter":
			f.unfocus();
			return;
			
		// Move to next text box sibling
		case "tab":
			var c = [], next = -1, i = 0;
			
			// Get all text siblings
			if(f.parent) GetTextChildren(f.parent, c);
			for(; i < c.length; i++) {
				if(c[i] == f) next = (i+1 >= c.length ? 0 : i+1);	// Sibling found
			}
			
			// Set sibling as new focus
			if(next > -1) {
				f.unfocus();
				f = c[next];
				SetInputFocus(f);
			}
			
			// Prevent tabbing out of the canvas
			StopEvent(e);
			break;
			
		// Regular typing
		default:
			if(k.length == 1) f.addText(k);
	}
}

/* Paste event */
function Paste(e) {
	var data = e.clipboardData.getData("text/plain"), f = FocusObj;
	
	// Pass paste data to text input
	if(data.length > 0 && f)
		f.addText(data);
	StopEvent(e);
}

/* Set the input object */
function SetInputFocus(obj) {
	FocusObj = obj;
	
	if(Input == null) return;
	
	if(obj == null) {
		Input.value = "";
		Input.blur();
	} else {
		
		// Match position and size of FocusObj so mobile viewport knows where to center
		Input.style.left = (App.getBoundingClientRect().left+obj.x)+"px";
		Input.style.top = (App.getBoundingClientRect().top+obj.y)+"px";
		Input.style.width = obj.w+"px";
		Input.style.height = obj.h+"px";
		
		// Focus for catching paste events and activating mobile keyboard
		Input.focus();
	}
}

/* Quick-open add-on: check for open request */
function QuickOpenCheck() {	
	try {
		var qoi = sessionStorage.getItem("photoblob-quick-open-img");
		if(qoi) {
			sessionStorage.removeItem("photoblob-quick-open-img");
			qoi = JSON.parse(qoi);
			if(qoi.data && qoi.name && qoi.size) {
				IMG_SIZE = qoi.size;
				OpenImage(qoi.data, qoi.name);
			}
		}
	} catch(e) {}
}

/* User is about to leave the page before saving */
function ConfirmLeave(e) {
	if(Unsaved) {
		e.returnValue = "You haven't saved your image.";
		e.preventDefault();
	}
}

/* Return a 1D array of all text box children in parent */
function GetTextChildren(parent, children) {
	
	if(!children) children = [];
	
	for(var i in parent) {		
		if(parent[i]) {		
			if(parent[i] instanceof Array) {
				GetTextChildren(parent[i], children);
			} else if(parent[i].numOnly != null) {
				children.push(parent[i]);
			}
		}
	}
}

/* Similar to above, applies to radio buttons only */
function GetRadioChildren(parent, children) {
	
	if(!children) children = [];
	
	for(var i in parent) {		
		if(parent[i]) {		
			if(parent[i] instanceof Array) {
				GetRadioChildren(parent[i], children);
			} else if(parent[i].type == "RadioButton") {
				children.push(parent[i]);
			}
		}
	}
}

/* Perform a speed test for a function
 * func:	The function to test
 * arg:		Array of arguments to pass to function
 * iter:	Number of iterations
 * freq:	Delay between iterations
 * sum:		Keeps track of total time
 * cb:		Callback when finished
 */
function SpeedTest(func, arg, iter, freq, sum, cb) {		
	if(iter < 1) {
		cb(sum);
		return;
	}
	
	// Begin speed test
	if(sum == null) {
		sum = 0;
		CL("Performing speed test for "+func.name+"...");
		cb = function(s) {
			var avg = s/iter;
			CL("Average time for "+func.name+": "+(ROUND(avg*1000)/1000)+" ms");
		}
	}
	
	var t1 = T();
	
	func.apply(null, arg);
	
	sum += (T()-t1);
	
	if(freq > 0) {
		setTimeout(function() {
			SpeedTest(func, arg, iter-1, freq, sum, cb);
		}, freq);
	} else {
		SpeedTest(func, arg, iter-1, freq, sum, cb);
	}
}

/* Quick line drawing */
function DrawLine(ctx, x1, y1, x2, y2) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	ctx.closePath();
}

/* Quick triangle */
function DrawTriangle(ctx, x1, y1, x2, y2, x3, y3, stroke, fill) {
	
	if(stroke == null) stroke = true;
	if(fill == null) fill = true;
	
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x3, y3);
	ctx.lineTo(x1, y1);
	if(stroke) ctx.stroke();
	if(fill) ctx.fill();
	ctx.closePath();
}

/* Draw rounded rectangle
 * 
 * Code modified from an answer posted on StackOverflow
 * http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 * Question by DNB5brims (http://stackoverflow.com/users/148978/dnb5brims)
 * Answer by Juan Mendes (http://stackoverflow.com/users/227299/juan-mendes)
 * 
 * Modified here to support half-rounded rectangles */
function RoundRect(ctx, x, y, w, h, r, fill, stroke, half) {
	
	// Default values
	if(typeof r == "undefined") r = 5;
	if(typeof fill == "undefined") fill = true;
	if(typeof stroke == "undefined") stroke = true;
	if(typeof half == "undefined") half = false;
	
	// Begin drawing rectangle
	ctx.beginPath();
	
	half ? ctx.moveTo(x, y) : ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	if(half) {
		ctx.lineTo(x + w, y + h);
	} else {
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	}
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	if(half) {
		ctx.lineTo(x, y);
	} else {
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
	}
	
	ctx.closePath();
	
	if(stroke) ctx.stroke();
	if(fill) ctx.fill();
	
}

SIXTH = 1/6, THIRD = 1/3, HALF = 1/2, TWOTHIRD = 2/3;

/* HSL/RGB conversion functions
 * 
 * Code modified from an answer posted on StackOverflow
 * http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 * Question by hhafez (http://stackoverflow.com/users/42303/hhafez)
 * Answer by Mohsen (http://stackoverflow.com/users/650722/mohsen)
 * Answer edited by JDB (http://stackoverflow.com/users/211627/jdb)
 * 
 * Modified to accept array input */
function RGB2HSL(r, g, b) {
	
	if(r instanceof Array) return RGB2HSL(r[0], r[1], r[2]);

	r /= 255, g /= 255, b /= 255;
	var max = MAX(r, g, b), min = MIN(r, g, b);
	var h, s, l = (max + min) / 2;

	if(max == min) {
		h = s = 0;
	} else {
		var d = max - min;
		s = l > HALF ? d / (2 - max - min) : d / (max + min);
		switch(max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	return [h, s, l];
}

function h2r(p, q, t) {
	if(t < 0) t += 1;
	if(t > 1) t -= 1;
	if(t < SIXTH) return p + (q - p) * 6 * t;
	if(t < HALF) return q;
	if(t < TWOTHIRD) return p + (q - p) * (TWOTHIRD - t) * 6;
	return p;
}

function HSL2RGB(h, s, l) {
	var r, g, b;

	if(s == 0) {
		r = g = b = l;
	} else {
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = h2r(p, q, h + THIRD);
		g = h2r(p, q, h);
		b = h2r(p, q, h - THIRD);
	}

	return [CEIL(r * 255), CEIL(g * 255), CEIL(b * 255)];
}

/* Shift the hue, saturation, and/or luminance of an RGB color */
function ShiftHSL(r, g, b, hf, sf, lf) {

	r /= 255, g /= 255, b /= 255;
	var max = MAX(r, g, b), min = MIN(r, g, b);
	var h, s, l = (max + min) / 2;

	// Convert RGB -> HSL
	if(max == min) {
		h = s = 0;
	} else {
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch(max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}
	
	// Apply shift
	h = h+hf - FLOOR(h+hf);
	s = Clamp(s+sf, 0, 1);
	l = Clamp(l+lf, 0, 1);
	
	// Convert HSL -> RGB
	if(s == 0) {
		r = g = b = l;
	} else {
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = h2r(p, q, h + THIRD);
		g = h2r(p, q, h);
		b = h2r(p, q, h - THIRD);
	}
	
	// Return modified RGB
	return [CEIL(r * 255), CEIL(g * 255), CEIL(b * 255)];	
}

/* Return rgba() string */
function rgba(r, g, b, a) {
	if(r instanceof Array) {
		return 'rgba('+[r[0], r[1], r[2], r[3]/255]+')';
	}
	a /= 255;
	return 'rgba('+r+','+g+','+b+','+a+')';
}

/* Base-10 to Base-16 */
function base16(num, zeroes) {
	var b16 = "";
	while(num > 0)
	{
		rem = num % 16;
		num = FLOOR(num/16);
		switch(rem) {
			case 10: rem = 'A'; break;
			case 11: rem = 'B'; break;
			case 12: rem = 'C'; break;
			case 13: rem = 'D'; break;
			case 14: rem = 'E'; break;
			case 15: rem = 'F'; break;
		}
		b16 = rem+b16;
	}
	
	// Zero padding
	var len = b16.length, i = 0;
	if(len < zeroes) {
		for(; i < zeroes-len; i++) {
			b16 = 0+b16;
		}
	}
	return b16;
}

/* Base-16 to Base-10 */
function base10(b16) {
	b16 = String(b16);
	var num = 0, len = b16.length, i = 0, dig = 0;
	for(; i < len; i++) {
		dig = b16[i];
		if(isNaN(dig)) {
			switch(dig.toUpperCase()) {
				case 'A': dig = 10; break;
				case 'B': dig = 11; break;
				case 'C': dig = 12; break;
				case 'D': dig = 13; break;
				case 'E': dig = 14; break;
				default: dig = 15;
			}
		}
		num += dig*POW(16, len-i-1);
	}
	return num;
}

/* RGB to Hex */
function RGB2HEX(r, g, b) {
	if(r instanceof Array) return RGB2HEX(r[0], r[1], r[2]);
	return base16(r, 2)+base16(g, 2)+base16(b, 2);
}

/* Hex to RGB */
function HEX2RGB(h) {
	
	// Remove hash
	if(h[0] == '#') h = h.substring(1);
	
	var r = 0, g = 0, b = 0, len = h.length;
	
	switch(len) {		
		// 'F' -> 'FFFFFF' -> [255, 255, 255]
		case 1: r = g = b = base10(h+h); break;
		// 'F80' -> 'FF8800' -> [255, 136, 0]
		case 3: r = base10(h[0]+h[0]), g = base10(h[1]+h[1]), b = base10(h[2]+h[2]); break;		
		// Default syntax
		case 6: r = base10(h[0]+h[1]), g = base10(h[2]+h[3]), b = base10(h[4]+h[5]); break;
	}
	return [r, g, b];
}

/* Image data container */
function ImageData(w, h) {
	return GC(canvas).createImageData(w, h);
}

/* Selection container */
function Selection(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}

/* Clone image data */
function CloneImg(g) {

	var w = g.width, h = g.height, dl = w*h*4, n = ImageData(w, h), d = n.data, d2 = g.data, i = 0;
	
	for(; i < dl; i += 4) {
		d[i] = d2[i];
		d[i+1] = d2[i+1];
		d[i+2] = d2[i+2];
		d[i+3] = d2[i+3];
	}
	
	return n;
	
}

/* Load image */
function IMG(src) {
	var i = new Image();
	i.src = src;
	i.loaded = false;
	i.valid = true;
	i.onload = function() {
		i.loaded = true;
		Update();
	}
	i.onerror = function() {
		i.src = "icons/error.svg";
		i.valid = false;
	}
	return i;
}

/* Set image name */
function SetImageName(name) {
	IMG_NAME = name;
	document.title = "Photoblob - ["+name+"]";
}

/* Show the open dialog */
// type	= 0 for image, 1 for JSON
function OpenDialog(type) {
	
	// Create upload dialog if it doesn't exist
	if(FileDialog == undefined) {
		FileDialog = document.createElement("input");
		FileDialog.type = "file";
		FileDialog.multiple = false;
		FileDialog.addEventListener("change", ReadFiles);
	}
	
	// Begin upload
	if(type == null) type = 0;	
	FileDialog.uploadType = type;
	FileDialog.click();
}

/* Open image in editor */
function OpenImage(src, name, skipSVG) {
	CloseImage();
	
	// Special open dialog for SVGs
	if(!skipSVG && GetBase64Mime(src) == "image/svg+xml") {
		var svg = IMG(src);
		svg.onload = function() {
			PBOX.OpenSVG.open(svg, name);
		};
		return;
	}
	
	// Ready to load
	ImageArea.loaded = true;
	
	// Image name displayed in status bar and title bar
	SetImageName(name);
	
	// Draw loading text before next update
	ImageArea.draw(GC(canvas));
	
	// Assign image to load
	var img = IMG(src);
	ImageArea.tempimg = img;
}

/* Open image from online link */
function OpenImageLink(src) {
	
	if(!src || src.length < 3) return;
	
	var xhr = new XMLHttpRequest();
	xhr.open('POST', NODE_SERVER+'/openlink', true);
	
	// Returns the base64 of the image or an array of images if an HTML page was specified
	xhr.onload = function() {
		var res = xhr.response;
		
		// Image data returned
		if(res.indexOf("data:image/") == 0) OpenImage(res, src.substring(src.lastIndexOf("/")+1));
		
		// Array returned
		else if(res.indexOf("IMAGES: ") == 0) {
			res = JSON.parse(res.substring(res.indexOf("IMAGES: ")+8));
			
			var i = 0, j = 0, add2Browser = function(e) {
				
				// Check if the image is available
				if(!(e.target.width == 0 && e.target.height == 0 || !e.target.valid)) {
					
					// Resize image to thumbnail
					var img = e.target, src = img.src, w = img.width, h = img.height, mult = GetScaleToFit(w, h, 200, 200);
					img.loaded = true;
					img.width = FLOOR(w*mult);
					img.height = FLOOR(h*mult);
					
					// Add thumbnail to image browser with image info
					PBOX.ImageBrowser.images.push({
						d: img,
						t: (src.indexOf("data:") == 0 ? MimeToExt(GetBase64Mime(src)) :
							src.substring(src.lastIndexOf(".")+1, (src.lastIndexOf("?") > src.lastIndexOf(".") ? src.lastIndexOf("?") : src.length))),
						s: img.width*img.height*4,
						w: w,
						h: h
					});
				}
				j++;
				if(j >= res.length) PBOX.ImageBrowser.open();
			}
			
			// Close and clear image browser
			PBOX.ImageBrowser.close();
			PBOX.ImageBrowser.images = [];
			
			for(; i < res.length; i++) {
				IMG(res[i]).onload = add2Browser;
			}
		}
	};
	
	// Expecting JSON from the Node server
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	
	// Send request to load image or HTML page of images
	xhr.send(JSON.stringify({link: src}));
}

/* Create new image from width and height */
function NewImage(w, h) {
	
	if(isNaN(w)) w = 128;
	if(isNaN(h)) h = 128;
	
	CloseImage();
	ImageArea.open = ImageArea.loaded = true;
	ImageArea.img = ImageData(w, h);
	IMGFX.SetTarget(ImageData(w, h));
	IMGFX.AddHistory("New");
	ZOOM = 1;
	SetImageName("NewImage.png");
}

/* Close image in editor */
function CloseImage() {
	if(ImageArea.open) {
		IMGFX.ClearHistory();
		delete ImageArea.img;
		delete IMGFX.target;
		EditArea.clear();
		ImageArea.open = ImageArea.loaded = false;
		document.title = "Photoblob - A Blobware Project";
		IMG_NAME = null;
		IMG_SIZE = 0;
		Unsaved = false;
		Update();
	}
}

/* Convert image data to base64 data url */
function DataURL(img, mimetype) {
	if(img == null || img.data == null) return;
	
	var can = document.createElement("canvas");
	can.width = img.width;
	can.height = img.height;
	GC(can).putImageData(img, 0, 0);
	return can.toDataURL(mimetype == null ? "image/png" : mimetype);
}

/* Load image data */
function LoadImageData(img) {
	
	var imgcan = document.createElement("canvas");
	imgcan.width = img.width;
	imgcan.height = img.height;
	
	var ctx = GC(imgcan);
	ctx.drawImage(img, 0, 0);
	
	return ctx.getImageData(0, 0, img.width, img.height);
}

/* Prepare image for download */
/* Must be called during a click (detect) event */
function ExportImage(name, mimetype) {
	
	var img = DataURL(IMGFX.target, mimetype), xport = E("export");
	
	xport.href = img;
	xport.download = (name == null ? IMG_NAME : name);
	xport.click();
	
	// Changes are saved
	Unsaved = false;
}

/* Initiate menus */
function InitMenus() {
	for(var m in MenuBar.items) {
		switch(MenuBar.items[m].name) {
			case "File":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("New", PBOX.New, "open"),
					new MenuItem("Open", function() {
						OpenDialog();
					}),
					new MenuItem("Open Link", PBOX.OpenLink, "open"),
					new MenuItem("Save", PBOX.Save, "open"),
					new MenuItem("Close", CloseImage)
				]));
				break;
			case "Edit":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("Undo", IMGFX.Undo),
					new MenuItem("Redo", IMGFX.Redo),
					new MenuItem("Restore", function() {IMGFX.LoadHistory(0, true);})
				]));
				break;
			case "Image":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("Rotate", IMGFX.Rotate),
					new MenuItem("Mirror", PBOX.Mirror, "open"),
					new MenuItem("Shift", PBOX.Shift, "open"),
					new MenuItem("Resize", PBOX.Resize, "open"),
					new MenuItem("Crop", function() {
						if(!IMGFX.selection) ToolBox.setTool(ToolBox.tools[1]);
						else IMGFX.Crop();
					})
				]));
				break;
			case "Layer":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("New"),
					new MenuItem("Duplicate")
				]));
				break;
			case "Select":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("All", HK_SelectAll),
					new MenuItem("None", HK_SelectNone),
					new MenuItem("Invert", HK_InvertSelect)
				]));
				break;
			case "Filter":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("Brightness", PBOX.Brightness, "open"),
					new MenuItem("Auto Contrast", function(){IMGFX.AutoContrast(); IMGFX.AddHistory("Auto Contrast");}),
					new MenuItem("Grayscale", PBOX.Grayscale, "open"),
					new MenuItem("Invert Colors", PBOX.InvertColors, "open"),
					new MenuItem("Change HSL", PBOX.ChangeHSL, "open"),
					new MenuItem("Gradient Map", PBOX.GradientMap, "open"),
					new MenuItem("Replace Color", PBOX.ReplaceColor, "open"),
					new MenuItem("Add Noise", PBOX.AddNoise, "open"),
					new MenuItem("Posterize", PBOX.Posterize, "open"),
					new MenuItem("Mix History", PBOX.MixHistory, "open"),
					new MenuItem("Custom Kernel", PBOX.Kernel, "open"),
					new MenuItem("Box Blur", PBOX.BoxBlur, "open"),
					new MenuItem("Sharpen", PBOX.Sharpen, "open")
				]));
				break;
			case "View":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("3D View", PBOX.View3D, "open"),
					new MenuItem("Zoom In", HK_ZoomIn),
					new MenuItem("Zoom Out", HK_ZoomOut),
					new MenuItem("Zoom Fit", HK_ZoomFit),
					new MenuItem("Reset Zoom", HK_ResetZoom),
					new MenuItem("Fullscreen", TFS)
				]));
				break;
			case "Settings":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("Hotkeys", PBOX.Hotkeys, "open"),
					new MenuItem("Themes", PBOX.ChooseTheme, "open")
				]));
				break;
			case "Help":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("Add-on", PBOX.AddOn, "open"),
					new MenuItem("About", PBOX.About, "open")
				]));
				break;
			default:
				MenuBar.items[m].setMenu(new Menu([]));
		}
	}
}


/* Set the color theme */
function SetTheme(num) {

	// Defaults
	F1 = "Purisa", C1 = "#DD9", C2 = "#DD6", C3 = "#AA8", C4 = "#FFC",  WHT = "#FFF", BLK = "#000", GRY = "#666";

	switch(num) {
		
		// Timid blue
		case 0: BG1 = "#112", BG2 = "#223", BG3 = "#334", BG4 = "#445",
		BG4C = "#4C4C5D", BG5 = "#556", BG6 = "#667", BG7 = "#778"; break;
		
		// Timid green
		case 1: BG1 = "#121", BG2 = "#232", BG3 = "#343", BG4 = "#454",
		BG4C = "#4C5D4C", BG5 = "#565", BG6 = "#676", BG7 = "#787"; break;
		
		// Timid red
		case 2: BG1 = "#211", BG2 = "#322", BG3 = "#433", BG4 = "#544",
		BG4C = "#5D4C4C", BG5 = "#655", BG6 = "#766", BG7 = "#877"; break;
		
		// Timid yellow
		case 3: BG1 = "#221", BG2 = "#332", BG3 = "#443", BG4 = "#554",
		BG4C = "#5D5D4C", BG5 = "#665", BG6 = "#776", BG7 = "#887"; break;
		
		// Timid cyan
		case 4: BG1 = "#122", BG2 = "#233", BG3 = "#344", BG4 = "#455",
		BG4C = "#4C5D5D", BG5 = "#566", BG6 = "#677", BG7 = "#788"; break;
		
		// Timid pink
		case 5: BG1 = "#212", BG2 = "#323", BG3 = "#434", BG4 = "#545",
		BG4C = "#5D4C5D", BG5 = "#656", BG6 = "#767", BG7 = "#878"; break;
		
		// Orange
		case 6: BG1 = "#210", BG2 = "#321", BG3 = "#432", BG4 = "#543",
		BG4C = "#5D4C3B", BG5 = "#654", BG6 = "#765", BG7 = "#876"; break;
		
		// Lime green
		case 7: BG1 = "#120", BG2 = "#231", BG3 = "#342", BG4 = "#453",
		BG4C = "#4C5D3B", BG5 = "#564", BG6 = "#675", BG7 = "#786"; break;
		
		// Gray
		case 8: BG1 = "#111", BG2 = "#222", BG3 = "#333", BG4 = "#444",
		BG4C = "#4C4C4C", BG5 = "#555", BG6 = "#666", BG7 = "#777", GRY = "#6D6D6D"; break;
		
		// Deep blue
		case 9: BG1 = "#002", BG2 = "#113", BG3 = "#224", BG4 = "#335",
		BG4C = "#3B3B5D", BG5 = "#446", BG6 = "#557", BG7 = "#668"; break;
		
		// Deep green
		case 10: BG1 = "#020", BG2 = "#131", BG3 = "#242", BG4 = "#353",
		BG4C = "#3B5D3B", BG5 = "#464", BG6 = "#575", BG7 = "#686"; break;
		
		// Deep red
		case 11: BG1 = "#200", BG2 = "#311", BG3 = "#422", BG4 = "#533",
		BG4C = "#5D3B3B", BG5 = "#644", BG6 = "#755", BG7 = "#866"; break;
		
		// Deep yellow
		case 12: BG1 = "#220", BG2 = "#331", BG3 = "#442", BG4 = "#553",
		BG4C = "#5D5D3B", BG5 = "#664", BG6 = "#775", BG7 = "#886"; break;
		
		// Deep cyan
		case 13: BG1 = "#022", BG2 = "#133", BG3 = "#244", BG4 = "#355",
		BG4C = "#3B5D5D", BG5 = "#466", BG6 = "#577", BG7 = "#688"; break;
		
		// Deep pink
		case 14: BG1 = "#202", BG2 = "#313", BG3 = "#424", BG4 = "#535",
		BG4C = "#5D3B5D", BG5 = "#646", BG6 = "#757", BG7 = "#868"; break;
		
		// Delaware theme / Eye strain!
		case 15: F1 = "WhimsyTT", C1 = "#6FF", C2 = "#3DD", C3 = "#0AA", C4 = "#EFF",
		BG1 = "#440", BG2 = "#550", BG3 = "#660", BG4 = "#771", BG4C = "#727216",
		BG5 = "#882", BG6 = "#993", BG7 = "#AA4", GRY = "#388"; break;
		
		// Black and white high contrast
		case 16: C1 = "#DDD", C2 = "#BBB", C3 = "#999", C4 = "#FFF", BG1 = "#000", BG2 = "#060606",
		BG3 = "#111", BG4 = "#181818", BG4C = "#222", BG5 = "#292929", BG6 = "#333",
		BG7 = "#3A3A3A"; break;
		
		// Black and yellow
		case 17: BG1 = "#000", BG2 = "#060606", BG3 = "#111", BG4 = "#181818",
		BG4C = "#222", BG5 = "#292929", BG6 = "#333", BG7 = "#3A3A3A", GRY = "#333"; break;
		
	}
	
	// Change icon colors
	UpdateIconColors();
	
	// Generate HTML page background
	var can = document.createElement("canvas"), ctx = GC(can);
	can.width = can.height = 40;
	ctx.fillStyle = BG1;
	ctx.fillRect(0, 0, 20, 20);
	ctx.fillRect(20, 20, 40, 40);
	ctx.fillStyle = BG2;
	ctx.fillRect(20, 0, 40, 20);
	ctx.fillRect(0, 20, 20, 40);
	var img = "url("+can.toDataURL()+")";
	document.body.style.backgroundImage = img;
	document.body.style.backgroundColor = BG1;
	
	// Canvas container background
	App.style.background = BG2;
	
	// Update global var
	CurrentTheme = num;
	
	Update();
}

/* Modify icon colors so they match the current theme */
function UpdateIconColors() {
	
	// Load icon XML data if we don't already have it
	if(IC_SMALL_XML == null) {	
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "icons/icons_small.svg", true);
		xhr.onload = function() {
			if(xhr.status == 200) {
				IC_SMALL_XML = xhr.response;
				UpdateIconColors();
			}
		};
		xhr.send(null);
		return;
	}
	
	var xml = IC_SMALL_XML, col, col_bg = RGB2HSL(HEX2RGB(BG7)), i = 0;
	
	// Change hue of every color in SVG to theme hue
	do {
		i = xml.indexOf("#", i)+1;
		
		// Found hex color
		if(xml.indexOf(";", i)-i == 6) {
			
			// Get HSL of hex color
			col = RGB2HSL(HEX2RGB(xml.substring(i, xml.indexOf(";", i))));
			
			// Only modify grays
			if(col[0] == 0 && col[1] == 0) {
						
				// Combine hue and saturation of theme background color 7 and value of hex color, then put it back in SVG
				xml = xml.substring(0, i)+RGB2HEX(HSL2RGB(col_bg[0], col_bg[1], col[2]))+xml.substring(xml.indexOf(";", i));
			}
		}
	}
	while(i > 0);
	
	// Reload SVG
	IC_SMALL = IMG("data:image/svg+xml;base64,"+btoa(xml));	
}

/* Request list of textures from Node server database (Not implemented yet) */
function TextureList() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', NODE_SERVER+'/textures', true);
	
	// A list of texture thumbnails and info
	xhr.onload = function() {
		CL(xhr.response);
	};
	
	xhr.send(null);
}

/* Get window variable snapshot */
function CloneWindow() {	
	WinClone = [];
	for(var i in window) {
		WinClone.push(i);
	}
}

/* Check window snapshot for changes (should be none) */
function CheckWindow() {
	var hit, diff = [];
	for(var i in window) {
		hit = false;
		for(var j = 0; j < WinClone.length; j++) {
			if(WinClone[j] == i) hit = true;
		}
		if(!hit && i.charAt(0) != i.charAt(0).toUpperCase()) diff.push(i);
	}
	CL(diff);
}

// Start here
document.addEventListener("DOMContentLoaded", StartEditor, false);
