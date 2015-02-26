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

/* Objects */
FileDialog = UploadForm = undefined;

// Style
F1 = C1 = C2 = C3 = BG1 = BG2 = BG3 = BG4 = BG4C = BG5 = BG6 = BG7 = WHT = "#FFF";
BLK = "#000";
GRY = "#666";
CurrentTheme = 0;

/* Drawing update vars */
MouseX = 0;
MouseY = 0;
LastUpdate = 0;
Frame = 0;
Icons = [];
FocusObj = undefined;
ZOOM = 1;

/* Basic input */
CTRL = SHIFT = ALT = MDOWN = LCLICK = RCLICK = false;

// Fullscreen state
InFullscreen = false;

// Used for assigning hotkeys
LockKeyboard = false;

// Activate Three.JS console messages
THREE_MSG = false;

// Node server IP
// Should be left blank if node server is hosted on same server as this site
NODE_SERVER = "";

// Is this being hosted locally?
LOCAL = (window.location.host == "" || window.location.host == "localhost");

// Math function aliases
ABS = Math.abs, MAX = Math.max, MIN = Math.min, CEIL = Math.ceil, FLOOR = Math.floor, ROUND = Math.round, RND = Math.random, POW = Math.pow, SQRT = Math.sqrt;

/* Array copy I would make this an Array.prototype function but that usually breaks everything, so let's play it safe */
function ARCPY(arr) {
	var arrcpy = new Array(arr.length), i = 0;
	for(; i < arr.length; i++) {
		arrcpy[i] = arr[i];
	}
	
	return arrcpy;
}

/* Debug variable values */
function CL() {
	if(arguments.length > 1) {
		var a = new Array(arguments.length), i = 0;
		for(; i < arguments.length; i++) {
			a[i] = arguments[i];
			if(!THREE_MSG && a[i].indexOf && a[i].indexOf("THREE.") == 0) return;
		}
		console.log(a);
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

/* Set cursor */
function SC(cursor) {
	canvas.style.cursor = cursor == undefined ? "auto" : cursor;
}

/* Get element alias */
function E(name) {
	if(name.charAt(0) == ".")
		return document.getElementsByClassName(name.substr(1));
	return document.getElementById(name);
}

/* Show/hide element */
function D(e, show) {
	show == true ? e.style.display = "block" : e.style.display = "none";
}

/* Timing alias */
function T() { return window.performance.now(); }

/* Test within bounds (object based) */
function WB(x, y, obj) {
	if(!obj || obj.x == undefined || obj.y == undefined || obj.w == undefined || obj.h == undefined) return false;
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

/* Go fullscreen */
function FS() {
	if(!canvas) return;
	if(canvas.requestFullScreen)
		canvas.requestFullScreen();
	else if(canvas.webkitRequestFullScreen)
		canvas.webkitRequestFullScreen();
	else if(canvas.mozRequestFullScreen)
		canvas.mozRequestFullScreen();
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

/* Adjust canvas size to style size */
function FixCanvasSize() {

	if(canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
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
	
	var reader = new FileReader(), form = new FormData(), f = null, i = 0;
	
	if(e.dataTransfer) f = e.dataTransfer.files;
	else f = e.target.files;
	
	if(!f) return;
	
	// Load base64 image
	reader.onload = function(e) {
		OpenImage(e.target.result, e.target.fileName);
	}
	
	// Read form data
	for(; i < f.length; i++) {
		if(f[i].type.match(/image.*/)) {
			//form.append('uploads', f[i], f[i].name);
			reader.fileName = f[i].name;
			reader.readAsDataURL(f[i]);
		}
	}
	
	/* Automatic reverse image search */
	
	/*var xhr = new XMLHttpRequest();
	xhr.open('POST', NODE_SERVER+'/upload', true);
	
	xhr.onload = function() {			
		var xh2 = new XMLHttpRequest();
		xh2.open('POST', NODE_SERVER+'/search', true);
		xh2.onload = function() {
			
			if(xh2.status == 200) {
				
				// Check that cookies are enabled
				if(xh2.response.indexOf("Cookies disabled") == 0) {
					CL("You have cookies disabled for this site. Please allow cookies from "+(NODE_SERVER == "" ? window.location.hostname : NODE_SERVER.substring(0, NODE_SERVER.indexOf(':'))));
				} else if(xh2.response.indexOf("Error") == 0) {
					// Do nothing
				} else {
					
					// Parse matches response
					var thumbs = JSON.parse(xh2.response);
					PBOX.ImageBrowser.images = [];
					
					// Open the image browser if we have matches
					if(thumbs.length > 0) {
						
						thumbs.sort(function(a, b) { return a.a[0]-b.a[0] });
						
						for(i = 0; i < thumbs.length; i++) {
							thumbs[i].d = IMG(thumbs[i].d);
							PBOX.ImageBrowser.images[i] = thumbs[i];
						}
						PBOX.ImageBrowser.open();
					}
				}
			}
		}
		xh2.send(null);
		
		//CL(xhr.status +"\t"+xhr.responseText);
	};
	
	xhr.send(form);*/
	
	e.preventDefault();
	e.stopPropagation();
}

/* Start up the editor */
function StartEditor() {
	
	document.title = "Photoblob - Loading...";

	ALPHA_BG = IMG("alpha.png");
	ERROR_IMG = IMG("icons/error.svg");
	canvas = E("editor");
	if(!canvas) return;
	
	FixCanvasSize();
	SetTheme(17);
	
	CloneWindow();
	
	//var t = T();
	
	// Load editor scripts
	LoadScripts(["fx.js", "three.min.js", "editor/hotkeys.js", "editor/main.js", "editor/pbox.js"], function(progress) {
		
		// Done
		if(progress == 100) {		
			//CL("Loaded scripts in "+(T()-t)/1000+" seconds.");
			
			document.title = "Photoblob - A Blobware Project";
			
			var d = E("app-container"), l = E("loader");
			
			d.ondragenter = d.ondragover = function(e) {
				e.preventDefault();
				e.stopPropagation();
			}
			
			d.addEventListener("drop", ReadFiles);
			canvas.addEventListener("click", MouseDetect);
			canvas.addEventListener("contextmenu", MouseDetect);	// Right-click
			canvas.addEventListener("mousemove", MouseDetect);
			canvas.addEventListener("mousedown", MouseDetect);
			canvas.addEventListener("mouseup", MouseDetect);
			canvas.addEventListener("mousewheel", MouseDetect);
			canvas.addEventListener("DOMMouseScroll", MouseDetect);
			
			addEventListener("keydown", Hotkeys);
			addEventListener("keyup", function(e) {
				CTRL = e.ctrlKey;
				SHIFT = e.shiftKey;
				ALT = e.altKey;
			});
			
			InitMenus();
			
			Update();
			DrawEditor();
			
			// Hide the loader
			l.style.pointerEvents = "none";
			l.style.opacity = 0.0;
			
			setTimeout(function() {
				D(l, false);
			}, 1000);
		} else {
			document.title = "Photoblob - Loading ["+progress+"%]";
		}
	});	
}

/* Update canvas draw */
function Update() {
	LastUpdate = Frame;
}

/* Detect mouse events */
function MouseDetect(event) {
	
	var t = event.target, type = (event.type.indexOf("Scroll") > -1 ? "wheel" : (event.type == "contextmenu" ? "rclick" : event.type.replace("mouse", "")));
	
	// Stop click events here, passing them to the detections is redudant
	if(type == "rclick") {
		event.preventDefault();
		event.stopPropagation();
		RCLICK = true;
		return;
	} else if(type == "click") {
		LCLICK = true;
		return;
	}
	
	// This is the best cross-browser way of getting accurate canvas click coords
	var x = FLOOR(event.clientX-t.getBoundingClientRect().left);
	var y = FLOOR(event.clientY-t.getBoundingClientRect().top);
	
	MouseX = x;
	MouseY = y;
	
	// Clear cursor - I should never need to call this anywhere else
	SC();
	
	// Mouse down toggle
	if(type == "down") MDOWN = true;
	else if(type == "up") MDOWN = RCLICK = LCLICK = false;
	
	// Unfocus from text box
	if(MDOWN && FocusObj) {
		FocusObj.unfocus();
		
	// Cross-platform mouse wheel event
	} else if(type == "wheel") {
		if(event.detail) type = event.detail > 0 ? "wheeldown" : "wheelup";
		else if(event.wheelDelta) type = event.wheelDelta > 0 ? "wheelup" : "wheeldown";
	}
	
	// Zoom with ctrl + scroll wheel
	if(CTRL && type.indexOf("wheel") == 0) {
		if(type == "wheelup") ImageArea.setZoom("in");
		else if(type == "wheeldown") ImageArea.setZoom("out");
		event.preventDefault();
		event.stopPropagation();
		return;
	}
	
	// Detect for all layers
	// Passed values are: "down", "up", "wheeldown", and "wheelup"
	if(!PBOX.detect(x, y, type)) {
		if(!MenuBar.detect(x, y, type)) {
			ToolBox.detect(x, y, type);
			HistoryBox.detect(x, y, type);
			EditArea.detect(x, y, type);
			UVMap.detect(x, y, type);
		}
	}	
}

/* Detect keyboard events */
function Hotkeys(event) {
	var ct = CTRL = event.ctrlKey, k = event.key ? event.key.toLowerCase() : String.fromCharCode(event.charCode+(ct?96:0)).toLowerCase(), sh = SHIFT = event.shiftKey, alt = ALT = event.altKey, hk = false;
	
	// Non-alphanumeric keys (legacy only)
	if(event.key == null && event.charCode == 0) {
		
		var kc = event.keyCode;
	
		k = null;
		
		if(kc >= 112 && kc <= 123) {
			k = "f"+(kc-111);
		}
		
		switch(event.keyCode) {
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
		}
		//if(k != null) CL(k); else CL(event.keyCode);
	}
	
	// Hide modifier keys
	if(k == "control" || k == "shift" || k == "alt") k = "";
	
	// Set up hotkey string for reading
	var hkStr = (ct?"ctrl+":"") + (alt?"alt+":"") + (sh?"shift+":"") + k;
	
	// Read hotkey input
	if(LockKeyboard) {
		
		// Only unlock keyboard when a valid key is pressed
		if(k != null && k != "") LockKeyboard = false;
		
		HK.tempKey = hkStr;
		Update();
		event.preventDefault();
		event.stopPropagation();
		return;
	}
	
	// Read from Hotkeys container
	if(HK.keys[hkStr]) {
		
		// If typing within a text box, ignore non-modifier hotkeys
		if(!(FocusObj && !ct && !alt && !sh)) {
			hk = true;
			HK.keys[hkStr].func();
		}		
	}
	
	if(hk) {
		event.preventDefault();
		event.stopPropagation();
	} else {
		TypeDetect(event, k);
	}
}

/* Detect regular typing */
function TypeDetect(event, k) {
	
	if(!FocusObj) return;
	
	var f = FocusObj, v = f.get(true), oldval = v;
	
	switch(k) {
		
		// Delete next char
		case "del":
		case "delete":
			v = v.substring(0, f.ind)+v.substring(f.ind+1);
			break;
			
		// Delete previous char
		case "backspace":
			v = v.substring(0, f.ind-1)+v.substring(f.ind);
			f.ind = Clamp(f.ind-1, 0, v.length)
			break;
			
		// Move cursor left
		case "left":
		case "arrowleft":
			f.ind = Clamp(f.ind-1, 0, v.length)
			break;
			
		// Move cursor right
		case "right":
		case "arrowright":
			f.ind = Clamp(f.ind+1, 0, v.length)
			break;
			
		// Increment
		case "up":
		case "down":
		case "arrowup":
		case "arrowdown":
			if(f.numOnly) {
				var oldval_num = f.get();
				f.value = Clamp(oldval_num + (k.toLowerCase().indexOf("up") > -1 ? 1 : -1), f.min, f.max);
				v = f.get(true);
			}
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
				f = FocusObj = c[next];
				oldval = v = f.get(true);
			}
			
			// Prevent tabbing out of the canvas
			event.stopPropagation();
			event.preventDefault();
			break;
			
		// Regular typing
		default:
			if(k.length == 1) {
				if(f.numOnly && isNaN(k)) break;
				v = v.substring(0, f.ind)+k+v.substring(f.ind);
				f.ind = Clamp(f.ind+1, 0, v.length)
			}
	}
	
	// Clamp string length to maxlen
	if(f.maxlen > -1 && v.length > f.maxlen) v = v.substring(0, f.maxlen);
	
	f.value = v;
	
	// Fire change event
	if(oldval != v) f.onchange(oldval, v);
	
	Update();
	
}

/* Return a 1D array of all text object children in a parent object */
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

/* Quick line */
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

/* Rounded rectangle Written by Juan Mendes Modified by Blobware */
function RoundRect(ctx, x, y, w, h, r, fill, stroke, half) {
	
	if(typeof r == "undefined") r = 5;
	if(typeof fill == "undefined") fill = true;
	if(typeof stroke == "undefined") stroke = true;
	if(typeof half == "undefined") half = false;
	
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

function SpeedTest(func, arg, iter, freq, sum, cb) {		
	if(iter < 1) {
		cb(sum);
		return;
	}
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

/* RGB to HSL Written by Mohsen */
function RGB2HSL(r, g, b) {
	
	if(r instanceof Array) return RGB2HSL(r[0], r[1], r[2]);

	r /= 255, g /= 255, b /= 255;
	var max = MAX(r, g, b), min = MIN(r, g, b);
	var h, s, l = (max + min) / 2;

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

	return [h, s, l];
}


/* HSL to RGB Written by Mohsen */

function h2r(p, q, t) {
	if(t < 0) t += 1;
	if(t > 1) t -= 1;
	if(t < 1/6) return p + (q - p) * 6 * t;
	if(t < 1/2) return q;
	if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
	return p;
}

function HSL2RGB(h, s, l) {
	var r, g, b;

	if(s == 0) {
		r = g = b = l;
	} else {
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = h2r(p, q, h + 1/3);
		g = h2r(p, q, h);
		b = h2r(p, q, h - 1/3);
	}

	return [CEIL(r * 255), CEIL(g * 255), CEIL(b * 255)];
}

/* Return rgba() string */
function rgba(r, g, b, a) {
	if(r instanceof Array) {
		var cpy = [r[0], r[1], r[2], r[3]/255];
		return 'rgba('+cpy+')';
	}
	a /= 255;
	return 'rgba('+r+','+g+','+b+','+a+')';
}

// Get byte length of a string
// Written by 200_success @ StackOverflow
function getByteLen(normal_val) {
    // Force string type
    normal_val = String(normal_val);

    var byteLen = 0;
    for (var i = 0; i < normal_val.length; i++) {
        var c = normal_val.charCodeAt(i);
        byteLen += c < (1 <<  7) ? 1 :
                   c < (1 << 11) ? 2 :
                   c < (1 << 16) ? 3 :
                   c < (1 << 21) ? 4 :
                   c < (1 << 26) ? 5 :
                   c < (1 << 31) ? 6 : Number.NaN;
    }
    return byteLen;
}

/* Change color HSL directly */
function ShiftHSL(r, g, b, hf, sf, lf) {

	r /= 255, g /= 255, b /= 255;
	var max = MAX(r, g, b), min = MIN(r, g, b);
	var h, s, l = (max + min) / 2;

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
	
	h = h+hf - FLOOR(h+hf);
	s = Clamp(s+sf, 0, 1);
	l = Clamp(l+lf, 0, 1);
	
	if(s == 0) {
		r = g = b = l;
	} else {
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = h2r(p, q, h + 1/3);
		g = h2r(p, q, h);
		b = h2r(p, q, h - 1/3);
	}
	
	return [CEIL(r * 255), CEIL(g * 255), CEIL(b * 255)];
	
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

/* Return multiplier required to scale w, h to mw, mh */
function GetScaleToFit(w, h, mw, mh) {
	return mw/w < mh/h ? mw/w : mh/h;
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

/* Show the open dialog */
function OpenDialog() {
	if(FileDialog == undefined) {
		FileDialog = document.createElement("input");
		FileDialog.type = "file";
		FileDialog.multiple = false;
		FileDialog.addEventListener("change", ReadFiles);
	}
	FileDialog.click();
}

/* Open image in editor */
function OpenImage(src, name) {
	CloseImage();
	var img = IMG(src);
	ImageArea.open = true;
	ImageArea.tempimg = img;
	ImageArea.setZoom(1);
	
	document.title = "Photoblob - ["+name+"]";
}

/* Create new image */
function NewImage(w, h) {
	
	if(isNaN(w)) w = 128;
	if(isNaN(h)) h = 128;
	
	CloseImage();
	ImageArea.open = true;
	ImageArea.img = ImageData(w, h);
	IMGFX.SetTarget(ImageData(w, h));
	IMGFX.AddHistory("New");
	ImageArea.setZoom(1);
	document.title = "Photoblob - [newimage.png]";
}

/* Close image in editor */
function CloseImage() {
	if(ImageArea.open) {
		IMGFX.ClearHistory();
		delete ImageArea.img;
		delete IMGFX.target;
		ImageArea.open = false;
		document.title = "Photoblob - A Blobware Project";
		Update();
	}
}

/* Convert image data to base64 data url */
function DataURL(img, mimetype) {
	if(img == null || img.data == null) return;
	
	var can = document.createElement("canvas");
	can.width = img.width;;
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

/* Save image data */
function ExportImage() {

	var img = IMGFX.target, eimg = E("e-img"), econt = E("export-img"), emsg = E("e-msg"), eload = E("e-load"), elink = E("e-link");
	if(!img || !eimg || !econt) return;
	
	var w = img.width, h = img.height, cW = window.innerWidth, cH = window.innerHeight,
	imgcan = document.createElement("canvas"), eper = GetScaleToFit(w, h, cW/2, cH/2), iX, iY;
	
	CFS();
	
	// Show everything so we can measure them
	D(econt, true);
	D(emsg, true);
	D(eload, true);

	// Expand container to whole screen
	econt.style.width = cW+"px";
	econt.style.height = cH+"px";
	
	// Convert canvas to image
	imgcan.width = w;
	imgcan.height = h;
	GC(imgcan).putImageData(img, 0, 0);
	
	// Preview image
	eimg.src = imgcan.toDataURL(document.title.indexOf(".jpg]") > -1 || document.title.indexOf(".jpeg]") > -1 ? "image/jpeg" : "image/png", 1.0);
	eimg.width = eper*w;
	eimg.height = eper*h;
	
	// Download link
	elink.href = eimg.src;
	elink.setAttribute("download", eimg.src);
	
	// Center image	
	iX = (cW/2)-(eimg.width/2), iY = (cH/2)-(eimg.height/2);
	eimg.style.left = iX+"px";
	eimg.style.top = iY+"px";
	
	// Center text messages
	emsg.style.left = (cW/2)-(emsg.clientWidth/2)+"px";
	emsg.style.top = iY+eimg.height+10+"px";
	eload.style.left = (cW/2)-(eload.clientWidth/2)+"px";
	eload.style.top = emsg.style.top;
	
	// Hide message and wait for load
	D(emsg, false);
	
	eimg.onload = function() {		
		D(emsg, true);

		D(eload, false);
	}
	
	eimg.onerror = function() {
		eload.innerHTML = "Failed to load!";
	}
	
}

/* Close the image export thing */
function CloseImageExport() {
	D(E("export-img"), false);
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
					new MenuItem("Save", ExportImage),
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
					new MenuItem("Brightness", PBOX.Brightness, "open"),
					new MenuItem("Auto Contrast", function(){IMGFX.AutoContrast(); IMGFX.AddHistory("Auto Contrast");}),
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
					new MenuItem("Grayscale", PBOX.Grayscale, "open"),
					new MenuItem("Invert Colors", PBOX.InvertColors, "open"),
					new MenuItem("Change HSL", PBOX.ChangeHSL, "open"),
					new MenuItem("Gradient Map"/*, IMGFX.GradientMap*/),
					new MenuItem("Replace Color", PBOX.ReplaceColor, "open"),
					new MenuItem("Add Noise", PBOX.AddNoise, "open"),
					new MenuItem("Box Blur", PBOX.BoxBlur, "open"),
					new MenuItem("Motion Blur")
				]));
				break;
			case "View":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("3D View", PBOX.View3D, "open"),
					new MenuItem("Zoom In", HK_ZoomIn),
					new MenuItem("Zoom Out", HK_ZoomOut),
					new MenuItem("Reset Zoom", HK_ResetZoom),
					new MenuItem("Fullscreen", TFS)
				]));
				break;
			case "Window":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("Hotkeys", PBOX.Hotkeys, "open"),
					new MenuItem("Themes", PBOX.ChooseTheme, "open")
				]));
				break;
			case "Help":
				MenuBar.items[m].setMenu(new Menu([
					new MenuItem("Tutorial"),
					new MenuItem("Manual"),
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

	// Most used
	F1 = "Purisa", C1 = "#DD9", C2 = "#DD6", C3 = "#AA8", WHT = "#FFF", BLK = "#000", GRY = "#666";

	switch(num) {
		
		// Default timid blue
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
		case 15: F1 = "WhimsyTT", C1 = "#6FF", C2 = "#3DD", C3 = "#0AA",
		BG1 = "#440", BG2 = "#550", BG3 = "#660", BG4 = "#771", BG4C = "#727216",
		BG5 = "#882", BG6 = "#993", BG7 = "#AA4", GRY = "#388"; break;
		
		// Black and white high contrast
		case 16: C1 = "#FFF", C2 = "#DDD", C3 = "#AAA", BG1 = "#000", BG2 = "#060606",
		BG3 = "#111", BG4 = "#181818", BG4C = "#222", BG5 = "#292929", BG6 = "#333",
		BG7 = "#3A3A3A"; break;
		
		// Black and yellow
		case 17: BG1 = "#000", BG2 = "#060606", BG3 = "#111", BG4 = "#181818",
		BG4C = "#222", BG5 = "#292929", BG6 = "#333", BG7 = "#3A3A3A", GRY = "#333"; break;
		
	}
	
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
	
	// Don't forget the canvas container and background
	E("app-container").style.background = BG2;
	
	
	// Update global var
	CurrentTheme = num;
	
	Update();
}

document.addEventListener("DOMContentLoaded", StartEditor, false);

function CloneWindow() {	
	WinClone = [];
	for(var i in window) {
		WinClone.push(i);
	}
}

function CheckWindow() {
	var hit, diff = [];
	for(var i in window) {
		hit = false;
		for(var j = 0; j < WinClone.length; j++) {
			if(WinClone[j] == i) hit = true;
		}
		if(!hit && i.charAt(0) != i.charAt(0).toUpperCase()) diff.push(i);
	}
	console.dir(diff);
}
