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

/* CLASS DEFINITIONS */

/* Generic box class */
Box = Class.extend({
	
	// Constructor: new Box(x, y, w, h)
	init: function() {
		this.x = this.y = this.w = this.h = 0;
		this.active = false;
		this.type = "Box";
	},
	
	// Set position
	set: function(x, y) {
		this.x = x, this.y = y;
	},
	
	// Set size
	size: function(w, h) {
		this.w = w, this.h = h;
	},
	
	// Toggle active state
	toggle: function(t) {
		if(t == null) {
			this.active = !this.active;
			Update();
		} else if(this.active != t) {
			this.active = t;
			Update();
		}
	},
	
	// Detection event
	devent: function(type) {
		// Override me!
	}, 
	
	// Hit detection
	detect: function(x, y, type) {
		if(WB(x, y, this)) {
			this.devent(type);
			return true;
		}
		return false;
	}
	
});

/* Menu bar item */
MenuBarItem = Box.extend({
	init: function(name) {
		this.name = name;
	},
	set: function(x, y, w, h, t_h) {
		this._super(x, y);
		this.w = w, this.h = h;
		this.t_h = t_h;
	},
	setMenu: function(menu) {
		this.menu = menu;
	},
	draw: function(ctx) {
		if(MenuBar.highlight == this)
			ctx.fillStyle = BG6;
		else
			ctx.fillStyle = BG5;
		ctx.fillRect(this.x, this.y, this.w, this.h);
		
		ctx.fillStyle = C1, ctx.font = this.t_h+"px "+F1;
		
		var t_w = ctx.measureText(this.name).width;
		
		if(t_w > this.w) t_w = this.w;
		
		ctx.fillText(this.name, this.x+(this.w-t_w)/2, this.y+((this.h-this.t_h)/2)+this.t_h, this.w);
	}
});

/* Menu */
Menu = Box.extend({
	init: function(options) {
		this.options = options;
		this.highlight == -1;
	},
	setHighlight: function(h) {
		if(this.highlight != h) {
			this.highlight = h;
			Update();
		}
	},
	draw: function(ctx) {
		ctx.save();
		
		var opt = this.options;
		
		this.w = 0;
		this.h = (opt.length*20)+6;
		
		var w = 0, i = 0;
	
		for(; i < opt.length; i++) {
			w = ctx.measureText(opt[i].name).width+10;
			if(w > this.w)
				this.w = w;
		}
		
		ctx.fillStyle = BG4;
		ctx.fillRect(this.x, this.y, this.w, this.h);

		if(this.highlight > -1 && this.highlight < opt.length) {
			ctx.fillStyle = BG5;
			ctx.fillRect(this.x, this.y+(this.highlight*20)+3, this.w, 20);
		}
		
		ctx.font = "14px "+F1;
		
		for(i = 0; i < opt.length; i++) {
			if(opt[i].empty) ctx.fillStyle = GRY; else ctx.fillStyle = C2;
			ctx.fillText(opt[i].name, this.x+5, this.y+(i*20)+20, this.w);
		}
		
		ctx.restore();
	}
});

/* Menu item */
MenuItem = Class.extend({
	init: function(name, caller, func) {
		this.name = name;
		
		// Caller isn't specified
		if(func == null) {
			
			// Function isn't specified
			if(caller == null) {
				caller = function() {
					CL("Function not specified for '"+name+"'");
				}
				this.empty = true;
			}
			
			this.func = caller;
			
		// Caller matters
		} else {
			this.caller = caller;
			this.func = func;
		}		
	}
});

/* Button */
Button = Box.extend({
	init: function(text) {
		this._super();
		this.setText(text);
		this.state = 0;
		this.active = true;
	},
	setText: function(text) {
		var c = GC(canvas);
		c.font = "18px "+F1;
		this.size(c.measureText(text).width+10, 26);
		this.text = text;
	},
	detect: function(x, y, type) {
		if(this.active && WB(x, y, this)) {
			if(type == "up") {
				this.state = 0;
				Update();
				return true;
			} else if(type == "down") {
				if(this.state != 2) {
					this.state = 2;
					Update();
				}
			} else if(type == "move") {
				if(this.state == 0) {
					this.state = 1;
					Update();
				}
			}
		} else if(this.state != 0) {
			this.state = 0;
			Update();
		}
		return false;
	},
	draw: function(ctx) {
		
		ctx.font = "18px "+F1;
		
		if(this.state == 1 && this.active) ctx.fillStyle = BG6;
		else if(this.state == 2) ctx.fillStyle = BG4;
		else ctx.fillStyle = BG5;
		
		ctx.lineWidth = 4;
		if(this.active) ctx.strokeStyle = BG6; else ctx.strokeStyle = BG5;
		RoundRect(ctx, this.x, this.y, this.w, this.h, 5, true, true);
		
		if(this.active) ctx.fillStyle = C1;
		else ctx.fillStyle = C3;
		ctx.fillText(this.text, this.x+5, this.y+20, this.w-5);
	}
});

/* Image button */
ImageButton = Button.extend({
	init: function(img, w, h) {
		this._super("");
		this.size(w, h);
		this.setIcon(img);
	},
	setIcon: function(img) {
		this.ic = Icons.getXY(img);
	},
	draw: function(ctx) {
		
		ctx.font = "18px "+F1;
		
		if(this.highlight && this.active) ctx.fillStyle = BG6;
		else ctx.fillStyle = BG5;
		
		ctx.lineWidth = 4;
		if(this.active) ctx.strokeStyle = BG6; else ctx.strokeStyle = BG5;
		if(IC_SMALL.complete) ctx.drawImage(IC_SMALL, this.ic[0], this.ic[1], 64, 64, this.x, this.y, this.w, this.h);
	}
});

/* Radio button
** NOTE: Only asthetic, functionality is implemented separately */
RadioButton = Box.extend({
	init: function(text, value) {
		this._super();
		this.size(20, 20);
		this.text = text;
		this.value = value;
	},
	devent: function(type) {
		if(type == "up") this.toggle();
	},
	draw: function(ctx) {
	
		ctx.fillStyle = BG5;
		ctx.beginPath();
		ctx.arc(this.x+10, this.y+10, 10, 0, Math.PI*2); 
		ctx.closePath();
		ctx.fill();
		
		if(this.active) {
			ctx.fillStyle = BG3;
			ctx.beginPath();
			ctx.arc(this.x+10, this.y+10, 5, 0, Math.PI*2); 
			ctx.closePath();
			ctx.fill();
		}
		
		ctx.fillStyle = C1;
		ctx.font = "14px "+F1;
		ctx.fillText(this.text, this.x+25, this.y+16);
	}
});

/* Clickable check box */
CheckBox = Box.extend({
	init: function(text, value) {
		this._super();
		this.size(20, 20);
		this.text = text;
		this.value = value;
	},
	devent: function(type) {
		if(type == "up") this.toggle();
	},
	draw: function(ctx) {
	
		ctx.fillStyle = BG5;
		//ctx.fillRect(this.x, this.y, this.w, this.h);
		RoundRect(ctx, this.x, this.y, this.w, this.h, 5, true, false);
		
		ctx.fillStyle = C1, ctx.font = "14px "+F1;
		
		if(this.active) {
			ctx.fillText("✓", this.x+2, this.y+15);
		}
		
		ctx.fillText(this.text, this.x+25, this.y+15);
		
	}
});

/* Draggable slider */
Slider = Box.extend({
	init: function(w) {
		this._super();
		this.size(w, 30);
		this.value = 0;
		this.oldvalue = 0;
		this.held = false;
	},
	detect: function(x, y, type) {
		if(type != "move") {
			if(WB(x, y, this) || (!MDOWN && this.held)) {
				var v = this.value;
				this.value = Clamp((x-this.x)/(this.w), 0, 1);
				this.held = MDOWN;
			}
		} else if(this.held) {
			this.value = Clamp((x-this.x)/(this.w), 0, 1);
		}
		
		var changed = (type == "up" || this.value != this.oldvalue);
		this.oldvalue = this.value;
		if(changed) Update();
		return changed && type != "move";
	},
	draw: function(ctx) {
	
		ctx.fillStyle = BG5;
		RoundRect(ctx, this.x, this.y+(this.h/2)-2, this.w, 4, 3, true, false, false);
		
		ctx.fillStyle = BG6;
		RoundRect(ctx, this.x+((this.w-14)*this.value)+2, this.y, 10, this.h, 4, true, false, false);
		
	}
});

/* Input box */
TextBox = Box.extend({
	init: function(parent, w, h, def, len, n, min, max) {
		if(!len) len = -1;
		if(!n) n = false;
		if(min == null) min = 0;
		if(max == null) max = 9999;
		
		this._super();
		this.size(w, h);
		this.value = def;
		this.numOnly = n;
		this.min = min, this.max = max;
		this.parent = parent;
		this.maxlen = len;
		this.ind = 0;
	},
	get: function(asString) {
		if(this.numOnly) {
			var v = this.value, num = v;
			
			if(v == "") num = 0;
			else if(v == "-") num = -1;
			else num = parseInt(num);
			
			if(num > this.max) this.value = v = num = this.max;
			else if(num < this.min) this.value = v = num = this.min;
						
			return (asString == true ? v.toString() : num);
		}
		return this.value.toString();
	},
	unfocus: function() {
		if(this == FocusObj) {
			if(this.numOnly && this.get(true) == "") this.value = 0;// Set empty number-only text fields to zero
			FocusObj = null;
			Update();
		}
	},
	onchange: function(oldval, newval) {
		// Override me!
	},
	detect: function(x, y, type) {
		
		if(type == "up" && !WB(x, y, this)) return;
		
		switch(type) {
			
			case "move":				
				if(WB(x, y, this)) SC("text");
				break;
			
			case "up":
				FocusObj = this;
				var ctx = GC(canvas);
				ctx.font = (this.h-4)+"px "+F1;
				this.ind = this.get(true).length;
				
				var o = x-this.x, v = this.get(true), squish = Clamp((this.w-8)/ctx.measureText(v).width, 0, 1), c, i = 0;
				
				for(; i < v.length; i++) {
					c += ctx.measureText(v[i]).width*squish;
					if(o <= c) {
						this.ind = i;
						break;
					}
				}
				Update();
				break;
			
			case "wheeldown":
			case "wheelup":
				if(FocusObj == this) {
					if(this.numOnly) {
						var oldval = this.get();
						this.value = Clamp(oldval + (type == "wheelup" ? 1 : -1), this.min, this.max);
						this.onchange(oldval, this.get());
						Update();
					}
				}
				break;
		}
	},
	draw: function(ctx) {
		
		var c = ctx;
		
		if(!c) return;
	
		// Text box
		c.fillStyle = BG7;
		c.fillRect(this.x, this.y, this.w, this.h);
		
		// Text
		c.fillStyle = C1, c.font = (this.h-4)+"px "+F1;
		c.fillText(this.value, this.x+4, this.y+this.h-4, this.w-8);
		
		// Selection bar thing
		if(FocusObj == this) {
			
			var v = this.get(true);
			
			var ind_x = c.measureText(v.substring(0, this.ind)).width;
			
			if(ind_x > this.w) ind_x = (ind_x/c.measureText(v).width)*this.w;
			
			c.fillStyle = BLK;
			c.fillRect(this.x+ind_x+4, this.y, 2, this.h);
		}
		
	}
});

/* Label */
Label = Box.extend({
	init: function(w, h, text) {
		this._super();
		this.size(w, h);
		this.value = text;
	},
	draw: function(ctx) {
		
		ctx.fillStyle = C1, ctx.font = (this.h-4)+"px "+F1;
		ctx.fillText(this.value, this.x+4, this.y+this.h-4, this.w-8);
		
	}
});

/* Hyperlink */
HyperLink = Label.extend({
	init: function(w, h, text, href) {
		this._super(w, h, text);
		this.href = (href == null ? text : href);
		this.active = false;
	},
	detect: function(x, y, type) {		
		this.toggle(this._super(x, y, type));
		
		if(this.active) {	
			// Open href in new tab
			if(type == "click") {
				window.open(this.href, "_blank");
				window.focus();
			} else if(type == "move") {
				Tooltip.set(this.href, x, y);
			}
			SC("pointer");
		}
	},
	draw: function(ctx) {
		
		if(this.active) {
			ctx.fillStyle = C1;
			ctx.fillRect(this.x, this.y+this.h+1, this.w, 2);
		} else {
			ctx.fillStyle = C2;
		}
		ctx.font = (this.h-4)+"px "+F1;
		ctx.fillText(this.value, this.x, this.y+this.h, this.w);
		
	}
});

/* Drop down menu */
DDMenu = Box.extend({
	init: function(title, items) {
		this._super();
		this.title = title;
		this.setItems(items);
	},
	setItems: function(items) {
		
	}
});

/* Color bar */
ColorBar = Box.extend({
	init: function(w, h, grad) {
		this._super();
		this.size(w, h);
		this.orient = (w >= h ? 0 : 1);
		this.grad = grad;
		this.held = false;
		this.value = 0;
	},
	detect: function(x, y, type) {
		if(WB(x, y, this)) if(type == "down") this.held = true;
		
		var newvalue = Clamp(x-this.x, 0, this.w)/this.w;
		
		if(this.held && this.value != newvalue) {
			this.value = newvalue;
			Update();
			return true;
		}
		
		if(type == "up") this.held = false;
		return false;
	},
	draw: function(ctx) {
		var grad = this.grad, i = stop = 0, posX = this.x+(this.value*this.w), g1 = ctx.createLinearGradient(this.x, this.y, this.orient == 0 ? this.x+this.w : this.x, this.orient == 1 ? this.y+this.h : this.y);
		
		ctx.strokeStyle = BLK;
		ctx.lineWidth = 2;
		if(grad.length <= 1) {
			ctx.fillStyle = rgba(grad[0]);
		} else {
			for(; i < grad.length; i++) {
				stop = grad[i].stop;
				if(stop == null || stop < 0 || stop > 1) stop = i/(grad.length-1);
				g1.addColorStop(stop, rgba(grad[i]));
			}
			ctx.fillStyle = g1;
		}
		ctx.clearRect(this.x, this.y, this.w, this.h);
		ctx.strokeRect(this.x, this.y, this.w, this.h);
		ctx.fillRect(this.x, this.y, this.w, this.h);
		
		// Slider
		ctx.lineWidth = 2;
		ctx.strokeStyle = WHT;
		ctx.fillStyle = BLK;
		ctx.strokeRect(posX-1, this.y+1, 3, this.h-2);
		ctx.fillRect(posX-1, this.y, 3, this.h);
	}
});

/* Color box with picker */
ColorBox = Box.extend({
	init: function(w, h) {
		this._super();
		this.size(w, h);
		this.value = [0, 0, 0, 255];
	},
	devent: function(type) {
		if(type == "up")
			PBOX.ColorBox.open(this, this.setColor, this.getColor());
	},
	onChange: function() {
		// Override me!
	},
	setColor: function(col) {
		for(var i = 0; i < 4; i++) {
			this.value[i] = col[i];
		}
		this.onChange();
	},
	getColor: function() {
		return ARCPY(this.value);
	},
	draw: function(ctx) {
		ctx.fillStyle = ctx.createPattern(ALPHA_BG, "repeat");
		ctx.fillRect(this.x, this.y, this.w, this.h);
		ctx.fillStyle = rgba(this.value);
		ctx.strokeStyle = BLK;
		ctx.lineWidth = 2;
		ctx.fillRect(this.x, this.y, this.w, this.h);
		ctx.strokeRect(this.x, this.y, this.w, this.h);
	}
});


/* Icon offsets */
Icons = {
		
	// Return icon sprite offset
	getXY: function(name) {
		
		if(!IC_SMALL.complete) return;
		
		var x = 0, y = 1;
		
		switch(name) {
			case "brush": x = 1; break;
			case "colorpick": x = 2; break;
			case "erase": x = 3; break;
			case "boxselect": x = 4; break;
			case "fill": x = 5; break;
			case "grab": x = 6; break;
			case "pen": x = 7; break;
			case "pencil": x = 8; break;
			case "text": x = 9; break;
			case "uvedit": x = 10; break;
			case "link": y = 0; break;
			case "unlink": x = 1, y = 0; break;
		}
		
		return [x*66, y*68];
	},
};

/******** MAIN PANELS **********/

/* Background */
BG = {
	draw: function(ctx) {
		ctx.fillStyle = BG2;
		
		var e = EditArea, w = CWIDTH, h = CHEIGHT;
		
		ctx.fillRect(0, 0, w, e.y);			// Menu bar	background
		ctx.fillRect(0, e.y, e.x, h);		// Tool box background
		ctx.fillRect(e.x+e.w, e.y, w, h);	// Menu bar	background
	}
};

/* Frame drawer */
FrameNum = {
	draw: function(ctx, drawTime) {
		
		// Calculate total image byte size
		var byteSize = 0, i = 0;
		if(IMGFX.history) {
			for(; i < IMGFX.history.length; i++) {
				byteSize += IMGFX.history[i].img.data.byteLength;
			}
		}
		if(ImageArea.img) byteSize += ImageArea.img.data.byteLength;
		
		var txt = FLOOR(drawTime)+"ms | "+ByteString(byteSize)+" | "+Frame;
		ctx.font = "18px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText(txt, CWIDTH-ctx.measureText(txt).width-10, 23);
	}
};

/* Tooltip */
Tooltip = {
	set: function(text, x, y) {
		
		var t = this;	// 'this' doesn't work within the timeout
		
		t.lastCall = T();
		if(t.active) {
			t.active = false;
			Update();
		}
		
		// Reset wait
		if(t.timeout) clearTimeout(t.timeout);
			
		t.timeout = setTimeout(function() {
			if(MouseX == x && MouseY == y) {
				t.text = text;
				t.x = x;
				t.y = y+32;
				t.active = true;
				t.lastCall = T();
				t.timeout = null;
				Update();
			}
		}, 500);
	},
	draw: function(ctx) {
		
		if(T()-this.lastCall > 5000) this.active = false;
		
		if(this.active) {		
			ctx.save();
			
			var h = 26;
			
			ctx.font = (h-12)+"px "+F1;
			
			var w = ctx.measureText(this.text).width+8, x = Clamp(this.x-(w/2), 0, CWIDTH-w), y = Clamp(this.y-(h/2), 0, CHEIGHT-h);
			
			ctx.fillStyle = BG2;
			ctx.fillRect(x, y, w, h);
			
			ctx.fillStyle = C2;
			ctx.fillText(this.text, x+4, y+(h-2)-5, w);
			
			ctx.strokeStyle = BG4;
			ctx.lineWidth = 2;
			ctx.strokeRect(x, y, w, h);
			
			ctx.restore();
		}
	}
};

/* The editing area */
EditArea = {
	x: 85,
	y: 40,
	w: 0,
	h: 0,
	
	// Specific vars
	lastX: 0,
	lastY: 0,
	selectArea: {x: 0, y: 0, x2: 0, y2: 0},
	grabX: 0,
	grabY: 0,
	path: [],
	path_last: 0,
	toggle: false,
	selecting: false,
	
	/* TOOLBOX IMPLEMENTATION */
	detect: function(x, y, type) {
	
		// Get active tool
		var tool = ToolBox.get();
	
		// Check that there is an active tool
		if(!tool || !WB(x, y, this) || PBOX.open)
			return;
			
		// Get image coordinates
		var icoords = ImageArea.getXY(x, y), ix = icoords[0], iy = icoords[1], iw = IMGFX.tw, ih = IMGFX.th, lx = this.lastX, ly = this.lastY, changed = !(lx == ix && ly == iy);
		
		if(type == "move") {
			this.lastX = ix;
			this.lastY = iy;
		}
	
		/* Box selection tool */
		if(tool == "Box Select" && ImageArea.open) {
			
			// Clear existing pen path
			if(this.path.length > 0) {
				this.path = [];
				this.path_last = 0;
				Update();
			}
		
			var s = this.selectArea;
			
			if(this.selecting) {
				
				// Selection complete
				if(type == "up") {
					
					x = Clamp(ix, 0, iw);
					y = Clamp(iy, 0, ih);
					s.x = Clamp(s.x, 0, iw);
					s.y = Clamp(s.y, 0, ih);
					
					var sx = (x < s.x ? x : s.x), sy = (y < s.y ? y : s.y);
					
					IMGFX.SEL_SetBox(new Selection(sx, sy, ABS(s.x-x), ABS(s.y-y)));
					this.selecting = false;
					Update();
					
				// Adjusting selection
				} else if(type == "move") {
					s.x2 = ix;
					s.y2 = iy;
					if(changed) Update();
				}
			} else if(type == "down") {
				s.x = s.x2 = ix;
				s.y = s.x2 = iy;
				this.selecting = true;
			}
			SC("crosshair");
			
		/* UV editing mode */
		} else if(tool == "UV Edit") {
			
			
			
		/* Color picker tool */
		} else if(tool == "Color Pick") {
			SC("crosshair");
			if(type == "move" && changed) {
				var ctx = GC(canvas), d = [];
				if(WB(x, y, ImageArea)) {
					d = IMGFX.SampleColor(ix, iy, 1);
				} else {
					d = [102, 102, 102, 255];
				}
				MainColors.setFG(d);
				MainColors.drawInside(ctx);
			} else if(type == "up") {
				ToolBox.clear();
				Update();
			}
		
		/* Brush and pencil */
		} else if(tool == "Brush" || tool == "Erase" || tool == "Pencil") {
			
			SC("crosshair");
			
			/*if(Brushes.cursor) {
				Brushes.x = x;
				Brushes.y = y;
				if(type == "move") Update();
			}*/
			
			if(!WB(x, y, ImageArea) || (type != "down" && type != "up" && type != "move")) return;
			
			if(MDOWN && (type == "down" || type == "move" && changed)) {
				
				var bd = ToolBox.getData(), toolType = (tool == "Brush" ? 1 : (tool == "Erase" ? 2 : 3)), bdata = (bd ? bd.imgdata : null),
				
					// Mouse move interpolation
					buf = (type == "move" ? Lerp2D(ix, iy, lx, ly) : [ix, iy]), i = 0, lastCoords = [0, 0], stepSize = 1;
				
				// Calculate brush step size
				if(bdata) stepSize = CEIL(HYP(bdata.width/8, bdata.height/8));
				
				for(; i < buf.length; i += 2) {
					
					// Don't apply to the same pixel more than once
					if(buf[i] >= 0 && buf[i] < iw && buf[i+1] >= 0 && buf[i+1] < ih && (i == 0 || !(lastCoords[0] == buf[i] && lastCoords[1] == buf[i+1]))) {
						
						// Apply pencil every step
						if(toolType == 3) {
							IMGFX.ApplyPencil(buf[i], buf[i+1], MainColors.fg, CTRL);
							lastCoords[0] = buf[i];
							lastCoords[1] = buf[i+1];
							
						// Only apply brush every 'stepSize' # of pixels
						} else if(ABS(buf[i]-lastCoords[0]) >= stepSize || ABS(buf[i+1]-lastCoords[1]) >= stepSize) {
							IMGFX.ApplyBrush(buf[i], buf[i+1], MainColors.fg, bdata, toolType == 2);
							lastCoords[0] = buf[i];
							lastCoords[1] = buf[i+1];
						}
					}
				}
				
				// TODO: Get rid of this image update call once a brush overlay scheme is implemented for nice performance increase
				ImageArea.update();
				// Basically: Create an overlay canvas that only handles real-time brush drawing
				// so I don't need to update the canvas and the image area every time
				
			} else {
				if(type == "up") {
					IMGFX.AddHistory(tool);
					ImageArea.update();
				}
			}
			
		/* Fill tool */
		} else if(tool == "Fill") {
			if(WB(x, y, ImageArea)) {
				SC("crosshair");
				if(type == "up") {
					IMGFX.Fill(ix, iy, MainColors.fg, 30);
					IMGFX.AddHistory(tool);
				}
			}
			
		/* Pen tool (sort of) */
		} else if(tool == "Pen" && ImageArea.open) {
			var p = this.path, i = this.path_last*2;
			
			if(type == "up") {
				p[i] = ix;
				p[i+1] = iy;
				this.toggle = !this.toggle;
				Update();
				this.path_last++;
				
				// Double-click = path done
				if(i > 4 && p[i-2] == ix && p[i-1] == iy) {
					p[i] = p[0];
					p[i+1] = p[1];
					IMGFX.SEL_SetPoly(ARCPY(p));
					this.path_last = 0;
					this.path = [];
				}
			} else if(type == "move" && changed) {
				p[i] = ix;
				p[i+1] = iy;
				if(i > 0) Update();
			}
			SC("crosshair");
			
		/* Grab tool */
		}/* else if(tool == "Grab" && ImageArea.open) {
			SC("grab");
			
			if(type == "down") {
				this.grabX = x;
				this.grabY = y;
			}
			if(MDOWN) {
				SC("grabbing");
				ImageArea.setOffset(x-this.grabX, y-this.grabY);
				Update();
			}
		}*/
	},
	
	draw: function(ctx) {
		this.w = Clamp(CWIDTH-this.x-200, 0, CWIDTH);
		this.h = CHEIGHT-this.y;
		
		ctx.fillStyle = GRY;
		ctx.fillRect(0, 0, CWIDTH, CHEIGHT);
	}
};

/* The image area */
/* Overlays such as selections and other image helpers are drawn here */
ImageArea = {
	x: 0,
	y: 0,
	w: 0,
	h: 0,
	sx: 0,		// Image drawing offset x
	sy: 0,		// Image drawing offset y
	off_x: 0,	// Grab offset x
	off_y: 0,	// Grab offset y
	loaded: false,	// Image area loading/loaded (set to true when image is first opened)
	open: false,	// Image area open (set to true when image is opened and finished loading)
	tempimg: null,
	img: null,
	
	// Return the transformed x and y of the image area (after zoom and grab)
	getXY: function(x, y) {
		var e = EditArea, w = IMGFX.tw*ZOOM, h = IMGFX.th*ZOOM, ix = FLOOR((e.w-w)/2+e.x)+this.off_x, iy = FLOOR((e.h-h)/2+e.y)+this.off_y;
		
		return [FLOOR((x-ix)/ZOOM), FLOOR((y-iy)/ZOOM)]
	},
	
	// Set the grab offset
	setOffset: function(x, y) {
		/*var e = EditArea, w2 = CEIL((IMGFX.tw/2)*ZOOM), h2 = CEIL((IMGFX.th/2)*ZOOM);
		this.off_x = Clamp(x, e.x-w2, e.x+e.w-w2);
		this.off_y = Clamp(y, e.y-h2, e.y+e.h-h2);*/
		this.off_x = x;
		this.off_y = y;
		this.update();
	},
	
	// Set zoom value
	setZoom: function(value) {
		if(value == "in")
			value = ZOOM + (ZOOM >= 1 ? (ZOOM >= 4 ? 1 : 0.5) : 0.1);
		else if(value == "out")
			value = ZOOM - (ZOOM > 1 ? (ZOOM >= 4 ? 1 : 0.5) : 0.1);
		else if(value == "fit")
			value = GetScaleToFit(IMGFX.tw, IMGFX.th, EditArea.w, EditArea.h);
		
		value = Clamp(value, 0.05, 16);
		
		if(value != ZOOM) {
			ZOOM = value;
			this.update();
		}
	},
	
	// Update image area render
	update: function() {
		if(!this.img || IMGFX.speedTesting) return;
		
		/* This code is a mess - do something! */
		
		var x = this.off_x, y = this.off_y, e = EditArea, z = ZOOM, w = IMGFX.tw*z, h = IMGFX.th*z, w2 = CEIL(w/2), h2 = CEIL(h/2), posx = FLOOR((e.w-w)/2+e.x)+x, posy = FLOOR((e.h-h)/2+e.y)+y,
			ex = IMGFX.tw, ey = IMGFX.th,
			sx = Clamp(posx, e.x-w2, e.x+e.w-w2),
			sy = Clamp(posy, e.y-h2, e.y+e.h-h2);
		
		if(sx >= e.x) sx = 0; else sx = FLOOR(e.x-sx);
		if(sy >= e.y) sy = 0; else sy = FLOOR(e.y-sy);
		
		if(posx+w > e.x+e.w) ex -= ((e.x+e.w)-(posx+w))/z;
		if(posy+h > e.y+e.h) ey -= ((e.y+e.h)-(posy+h))/z;
		
		this.sx = sx;
		this.sy = sy;
		
		IMGFX.Zoom(ZOOM, sx, sy);
		Update();
	},
	draw: function(ctx) {
		if(!this.loaded) return;
		
		var e = EditArea;
		
		// Wait for image load then store its data
		if(!this.img) {
			
			// Draw loading text
			ctx.font = "24px "+F1;
			
			var fw = e.w/2, fh = FLOOR(24*(fw/ctx.measureText("Loading "+IMG_NAME).width));
			if(fw > 0 && fh > 0) {
				ctx.font = fh+"px "+F1;
				ctx.fillStyle = rgba(0, 0, 0, 64);
				ctx.fillText("Loading "+IMG_NAME, e.x+(e.w/4), e.y+((e.h-fh)/2)+fh, fw);
			}
		
			if(!(this.tempimg && this.tempimg.loaded)) return;
			
			this.open = true;
			this.img = LoadImageData(this.tempimg);
			delete this.tempimg;
			
			IMGFX.SetTarget(CloneImg(this.img));
			IMGFX.AddHistory("Open");
			if(this.img.width > e.w || this.img.height > e.h) {
				this.setZoom("fit");
				return;
			}
			ZOOM = 1;
		}
		
		var w = IMGFX.tw*ZOOM, h = IMGFX.th*ZOOM, iw = this.w = this.img.width, ih = this.h = this.img.height, iw2 = (iw/2), ih2 = (ih/2), x = FLOOR((e.w-w)/2+e.x)+this.off_x, y = FLOOR((e.h-h)/2+e.y)+this.off_y;
		
		this.x = Clamp(x, e.x, e.x+e.w-iw);
		this.y = Clamp(y, e.y, e.y+e.h-ih);
		
		ctx.putImageData(this.img, this.x, this.y, 0, 0, iw, ih);
		
		// Draw selection mask
		var sel = IMGFX.selection;
		if(sel && sel.img) {
			ctx.drawImage(sel.img[sel.state], x+(sel.x*ZOOM), y+(sel.y*ZOOM), sel.w*ZOOM, sel.h*ZOOM);
			sel.state = FLOOR(T()/1000) % 2;
		}
		
		ctx.lineWidth = 1;
		
		// Draw temporary selection
		if(e.selecting) {
			sel = e.selectArea;
			ctx.strokeStyle = WHT;
			ctx.strokeRect(x+(sel.x*ZOOM), y+(sel.y*ZOOM), (sel.x2-sel.x)*ZOOM, (sel.y2-sel.y)*ZOOM);
		}
		
		// Draw temp path
		var p = e.path, i = 0;
		for(; i < p.length-2; i+=2) {
			ctx.strokeStyle = BLK;
			DrawLine(ctx, x+(p[i]*ZOOM), y+(p[i+1]*ZOOM), x+(p[i+2]*ZOOM), y+(p[i+3]*ZOOM));
			ctx.strokeStyle = WHT;
			DrawLine(ctx, x+(p[i]*ZOOM)+1, y+(p[i+1]*ZOOM)+1, x+(p[i+2]*ZOOM)+1, y+(p[i+3]*ZOOM)+1);
		}
	}
};

/* UV mapping overlay */
UVMap = {
	x: 0,
	y: 0,
	w: 0,
	h: 0,
	UVs: null,			// Array of all UVs
	UVxy: null,		// Array of UV coordinates
	selectedUVs: null,	// Array of selected UV indices
	//UVdots: null,		// Array of positions to draw selection squares (saves drawing time)
	
	dumpUVs: function(g) {
		if(g && g.faceVertexUvs) {
			var fvu = g.faceVertexUvs, i = 0, j = 0, k = 0;
			
			this.UVs = [];
			
			// Vertex groups
			for(; i < fvu.length; i++) {
				// Faces
				for(j = 0; j < fvu[i].length; j++) {
					// Vertices
					for(k = 0; k < 3; k++) {
						this.UVs.push(fvu[i][j][k].x, fvu[i][j][k].y);
					}
				}
			}
			
			// Setup xy coordinate and selection arrays
			this.UVxy = new Uint16Array(this.UVs.length);
			this.selectedUVs = new Uint8ClampedArray(this.UVs.length/2);
			
			Update();
		}
	},
	clearUVs: function() {
		delete this.UVs;
		delete this.UVxy;
		delete this.selectedUVs;
		//delete this.UVdots;
	},
	selectAll: function() {
		if(this.UVs) {
			this.selectedUVs.fill(1);
			//this.plotDots();
			Update();
		}
	},
	selectNone: function() {
		if(this.UVs) {
			this.selectedUVs.fill(0);
			Update();
		}
	},
	detect: function(x, y, type) {
		
		if(!this.UVs || !WB(x, y, EditArea)) return;
		
		if(type == "up") {
			
			// Only select a UV within 'min' radius
			var min = 10*ZOOM, i = 0, rad, su = this.selectedUVs, sel = [];
			
			//this.UVdots = [];
			
			if(!SHIFT) su.fill(0);
			for(; i < this.UVxy.length; i += 2) {
				
				rad = HYP(this.UVxy[i]-x, this.UVxy[i+1]-y);
				
				if(rad <= min) {
					if(rad < min) {
						sel = [];
					}
					sel.push(i/2);
					min = rad;
				}
			}
			
			// Toggle selections
			for(i = 0; i < sel.length; i++) {
				su[sel[i]] = !su[sel[i]];
			}
			Update();
		}
	},
	draw: function(ctx) {
		// Draw UV maps
		if(this.UVs) {
			
			var e = EditArea, su = this.selectedUVs, vw = FLOOR(IMGFX.tw*ZOOM), vh = FLOOR(IMGFX.th*ZOOM), vx = FLOOR((e.w-vw)/2+e.x), vy = FLOOR((e.h-vh)/2+e.y), clr = rgba(128, 128, 128, 92), sel = rgba(128, 128, 160, 128),
				i = 0, j = 0, k, k2, x = new Float32Array(3), y = new Float32Array(3), v = 0, triSelected = false, allOrNone = false, grad;
			
			ctx.lineWidth = 1;
			ctx.strokeStyle = BLK;
			ctx.fillStyle = clr;
			for(; i < this.UVs.length; i += 6) {
				this.UVxy[i] = x[0] = vx+(this.UVs[i]*vw);
				this.UVxy[i+1] = y[0] = vy+(this.UVs[i+1]*vh);
				this.UVxy[i+2] = x[1] = vx+(this.UVs[i+2]*vw);
				this.UVxy[i+3] = y[1] = vy+(this.UVs[i+3]*vh);
				this.UVxy[i+4] = x[2] = vx+(this.UVs[i+4]*vw);
				this.UVxy[i+5] = y[2] = vy+(this.UVs[i+5]*vh);
				
				// Is entire triangle selected?
				triSelected = (su[j] && su[j+1] && su[j+2]);
				
				// Are all the verts either selected or deselected?
				allOrNone = (su[j] == su[j+1] && su[j+1] == su[j+2]);
				
				// One or two verts selected
				if(!allOrNone) {					
					for(k = 0; k < 3; k++) {
						k2 = (k == 2 ? 0 : k+1);
						ctx.beginPath();
						ctx.moveTo(x[k], y[k]);
						ctx.strokeStyle = (su[j+k] || su[j+k2] ? WHT : BLK);
						ctx.lineTo(x[k2], y[k2]);
						ctx.stroke();
						ctx.closePath();
					}
				}
				
				// Draw triangle
				ctx.beginPath();
				ctx.moveTo(x[0], y[0]);
				ctx.lineTo(x[1], y[1]);
				ctx.lineTo(x[2], y[2]);
				ctx.lineTo(x[0], y[0]);
				// Only stroke triangle if all verts are selected or deselected
				if(allOrNone) {
					ctx.strokeStyle = (triSelected ? WHT : BLK);
					ctx.stroke();
				}
				ctx.fillStyle = (triSelected ? sel : clr);
				ctx.fill();				
				ctx.closePath();
				
				j += 3;			
			}
		}
	}
};

/* Menu bar */
MenuBar = {
	x: 0,
	y: 0,
	w: 100,
	h: 30,
	highlight: null,
	
	// Menu items
	items: [new MenuBarItem("File"), new MenuBarItem("Edit"), new MenuBarItem("Image"), new MenuBarItem("Layer"),
	new MenuBarItem("Select"), new MenuBarItem("Filter"), new MenuBarItem("View"), new MenuBarItem("Window"), new MenuBarItem("Help")],
	
	// HIT DETECTION
	detect: function(x, y, type) {
	
		var item = null;
		
		if(WB(x, y, this)) {
			for(var i in this.items) {
				if(WB(x, y, this.items[i])) {
					item = this.items[i];
					break;
				}
			}
		}
		
		// Menu items
		if(item) {		
			if(type == "up") {
				if(this.menu == item.menu)
					this.close(item);
				else
					this.open(item);
			}
				
			if(type == "move") {
				if(this.menu)
					this.open(item);
				this.setHighlight(item);
			}
			return false;
		} else {
			this.setHighlight();
		}
		
		// Menu opened
		if(this.menu) {
			
			var menu = this.menu, opts = menu.options;
			
			if(WB(x, y, menu) || item) {
				
				var m = FLOOR((y-menu.y)/(menu.h/opts.length));
				
				if(opts[m] == null) {
					menu.setHighlight(-1);
					return false;
				}
				
				// Run function on click
				if(type == "up") {
					
					// Regular function - caller doesn't matter
					if(!opts[m].caller) opts[m].func();
						
					// Caller or 'this' matters
					else opts[m].caller[opts[m].func]();
					
					// Close menu
					this.close();
					
				// Hover highlight
				} else if(type == "move") {
					menu.setHighlight(m);
				}
				return true;
			} else {
				if(type == "up")
					this.close();
				else if(type == "move")
					menu.setHighlight(-1);
			}
		}
		
		return false;
		
	},
	
	// Menu options
	menu: null,
	
	close: function() {
		if(this.menu != null) {
			this.menu.setHighlight(-1);
			this.menu = null;
			Update();
		}
	},
	
	open: function(item) {
		if(this.menu != item.menu) {
			this.menu = item.menu;
			this.menu.set(item.x, item.y+item.h);
			Update();
		}
	},
	
	setHighlight: function(h) {
		if(this.highlight != h) {
			this.highlight = h;
			Update();
		}
	},
	
	draw: function(ctx) {
		ctx.save();
		
		this.w = CWIDTH-this.x;
		ctx.fillStyle = BG4;
		RoundRect(ctx, this.x, this.y, this.w, this.h, 10, true, false, true);
		
		var i = 0;
		
		for(; i < this.items.length; i++) {
			this.items[i].set(this.x+(95*i)+10, this.y, 90, this.h, 18, this);
			this.items[i].draw(ctx);
		}
		
		if(this.menu)
			this.menu.draw(ctx);
		
		ctx.restore();
	}
};

/* ToolBox */
ToolBox = {
	x: 0,
	y: 40,
	w: 75,
	h: 0,
	
	// The box of tools
	tools: [new Tool("Move"), new Tool("Box Select", true), new Tool("Lasso"), new Tool("Color Select"),
	new Tool("UV Edit", true), new Tool("Color Pick", true), new Tool("Healing Brush"), new Tool("Brush", true),
	new Tool("Stamp"), new Tool("Pencil", true), new Tool("Erase", true), new Tool("Fill", true),
	new Tool("Sharpen"), new Tool("Burn"), new Tool("Pen", true), new Tool("Text"),
	new Tool("Select"), new Tool("Line"), new Tool("Grab"), new Tool("Zoom")],
	
	// The active tool
	active: null,
	
	clear: function() {
		Brushes.x = Brushes.y = 0;
		Brushes.cursor = null;
		this.active = null;
		Update();
	},
	
	// Return active tool name
	get: function() {
		return (this.active != null ? this.active.name : null);
	},
	
	// Hit detection
	detect: function(x, y, type) {
		if(!WB(x, y, this)) {
			this.setHighlight();
			return;
		}
	
		var tool = null;
		
		for(var i in this.tools) {
			if(WB(x, y, this.tools[i]) && this.tools[i].active) {
				tool = this.tools[i];
				break;
			}
		}
			
		// Menu items
		if(tool) {
			if(type == "up") this.setTool(tool);
			else if(type == "move") {
				this.setHighlight(tool);
				Tooltip.set(tool.name, x, y);
			}
		} else {
			this.setHighlight();
		}
		
		MainColors.detect(x, y, type);
		
	},
	
	// Highlight used for mouse hover
	setHighlight: function(h) {
		if(h != null && !h.active) return;
		if(this.highlight != h) {
			this.highlight = h;
			Update();
		}
	},
	
	// Set the active tool
	setTool: function(t) {
		if(this.active != t) {
			if(t.name == "Brush" || t.name == "Erase") {
				t.data = Brushes.get(1, 50);
			}
			this.active = t;
		} else {
			this.clear();
		}
	},
	
	// Get tool data
	getData: function() {
		return this.active.data;
	},
	
	draw: function(ctx) {
		ctx.save();
		
		this.h = CHEIGHT-this.y;
		ctx.fillStyle = BG4;
		RoundRect(ctx, this.x, this.y, this.w, this.h, 10, true, false, true);
		
		var e = 0;
		
		for(; e < this.tools.length; e++) {
			this.tools[e].set(this.x+(e%2)*35+5, this.y+FLOOR(e/2)*35+5);
			this.tools[e].draw(ctx);
		}
		
		MainColors.draw(ctx);
	}
};


/* Tool icon and data */
function Tool(name, active) {
	this.name = name,
	this.w = 30,
	this.h = 30,
	this.active = active,	// Active in this case means it has functionality
	this.data = null,
	this.set = function(x, y) {
		this.x = x;
		this.y = y;
	},
	this.loadIcon = function() {
		return (!this.active ? [0, 68] : Icons.getXY(this.name.toLowerCase().replace(" ", "")));
	},
	this.icon = this.loadIcon(),
	this.draw = function(ctx) {
		
		ctx.fillStyle = (this.active && ToolBox.highlight == this ? BG6 : (ToolBox.active == this ? BG7 : BG5));
		ctx.fillRect(this.x, this.y, this.w, this.h);
		if(this.icon) {
			if(IC_SMALL.complete) ctx.drawImage(IC_SMALL, this.icon[0], this.icon[1], 64, 64, this.x+3, this.y+3, this.w-6, this.h-6);
		}
	};
}

/* Color indicator */
MainColors = {
	x: 0,
	y: 0,
	w: 0,
	h: 0,
	
	// Color box size
	cs: 35,
	
	fg: [255, 255, 255, 255],
	bg: [0, 0, 0, 255],
	
	setFG: function(r, g, b, a) {
		if(r instanceof Array) this.fg = ARCPY(r);
		else this.fg[0] = r, this.fg[1] = g, this.fg[2] = b, this.fg[3] = a;
	},
	
	setBG: function(r, g, b, a) {
		if(r instanceof Array) this.bg = ARCPY(r);
		else this.bg[0] = r, this.bg[1] = g, this.bg[2] = b, this.bg[3] = a;
	},
	
	getFG: function() {
		return ARCPY(this.fg);
	},
	
	getBG: function() {
		return ARCPY(this.bg)
	},
	
	detect: function(x, y, type) {
		if(type != "up" || !WB(x, y, this)) return;
		
		// Foreground color box
		if(WC(x, y, this.x+10, this.y+10, this.cs, this.cs)) {
			
			PBOX.ColorBox.open(this, this.setFG, this.getFG());
			
		// Background color box
		} else if(WC(x, y, this.x+this.w-this.cs-10, this.y+this.h-this.cs-10, this.cs, this.cs)) {
			
			PBOX.ColorBox.open(this, this.setBG, this.getBG());
		
		// Reset color button	
		} else if(WC(x, y, this.x+10, this.y+this.h-25, 15, 15)) {
		
			this.setFG(255, 255, 255, 255);
			this.setBG(0, 0, 0, 255);
			Update();
		
		// Switch colors
		} else if(WC(x, y, this.x+this.cs+10, this.y+10, 20, 20)) {
		
			var old = ARCPY(this.fg);
			this.setFG(this.bg);
			this.setBG(old);
			Update();
		
		}
		
	},
	
	draw: function(ctx) {
	
		this.x = ToolBox.x;
		this.y = ToolBox.y + (ToolBox.tools.length/2)*35;
		this.w = ToolBox.w;
		this.h = this.w;
		
		var x = this.x, y = this.y, w = this.w, h = this.h, cs = this.cs;
		
		// Background
		ctx.lineWidth = 2;
		ctx.strokeStyle = BLK;
		ctx.fillStyle = BG3;
		RoundRect(ctx, x+5, y+5, w-10, h-10, 10, true, true, false);
		
		ctx.restore();
		this.drawInside(ctx);
	},
	
	// This gets drawn separately from Update
	drawInside: function(ctx) {
	
		var x = this.x, y = this.y, w = this.w, h = this.h, cs = this.cs, alphapat = ctx.createPattern(ALPHA_BG, "repeat");
	
		ctx.clearRect(x+7, y+7, w-14, h-14);
		
		ctx.save();
		
		ctx.strokeStyle = BLK;
		ctx.fillStyle = BG3;
		ctx.fillRect(x+7, y+7, w-14, h-14);
		
		// Background color box
		if(this.bg[3] < 255) {
			ctx.fillStyle = alphapat;
			RoundRect(ctx, x+w-cs-10, y+h-cs-10, cs, cs, 10, true, false, true);
		}
		ctx.fillStyle = rgba(this.bg);
		RoundRect(ctx, x+w-cs-10, y+h-cs-10, cs, cs, 10, true, true, true);
		
		// Foreground color box
		if(this.fg[3] < 255) {
			ctx.fillStyle = alphapat;
			RoundRect(ctx, x+10, y+10, cs, cs, 10, true, false, true);
		}
		ctx.fillStyle = rgba(this.fg);
		RoundRect(ctx, x+10, y+10, cs, cs, 10, true, true, true);
		
		// Reset button
		ctx.lineWidth = 1;
		ctx.fillStyle = BLK;
		ctx.fillRect(x+15, y+h-20, 10, 10);
		ctx.strokeRect(x+15, y+h-20, 10, 10);
		ctx.fillStyle = WHT;
		ctx.fillRect(x+10, y+h-25, 10, 10);
		ctx.strokeRect(x+10, y+h-25, 10, 10);
		
		// Switch foreground and background colors button
		ctx.fillStyle = C1;
		ctx.font = "bold 18px Arial";
		ctx.translate(x+w-28, y+18);
		ctx.rotate(45*Math.PI/180);
		ctx.fillText("⇄", 0, 0, w);
		
		ctx.restore();
	}
	
};

/* History */
HistoryBox = {
	x: 0,
	y: 40,
	w: 0,
	h: 0,
	ih: 30,
	highlight: -1,
	
	setHighlight: function(item) {
		if(this.highlight != item) {
			this.highlight = item;
			Update();
		}
	},
	
	detect: function(x, y, type) {
	
		if(!WB(x, y, this)) {
			this.setHighlight(-1);
			return;
		}
		
		var l = IMGFX.history.length,
		item = FLOOR((y-this.y-10)/this.ih)+Clamp(l-FLOOR((this.h-20)/this.ih), 0, l);
		
		if(item > -1 && item < l) {
			if(type == "up")
				IMGFX.LoadHistory(item);
			else if(type == "move")
				this.setHighlight(item);
		} else this.setHighlight(-1);
		
	},	
	
	draw: function(ctx) {
		ctx.save();
		
		this.x = EditArea.x+EditArea.w+10;
		this.w = Clamp(CWIDTH-this.x, 0, 190);
		this.h = (CHEIGHT-this.y)/2;
		
		ctx.fillStyle = BG4;
		RoundRect(ctx, this.x, this.y, this.w, this.h, 10, true, false, true);
		
		var	ih = this.ih,
		fit = FLOOR((this.h-20)/ih),
		l = IMGFX.history.length,
		i = Clamp(l-fit, 0, l),
		j = 0;
		
		ctx.font = "18px "+F1;
		
		for(; i < l; i++) {
			if(this.highlight == i) ctx.fillStyle = BG6;
			else j % 2 == 0 ? ctx.fillStyle = BG5 : ctx.fillStyle = BG4C;
			ctx.fillRect(this.x, this.y+10+j*ih, this.w, ih);
			i <= IMGFX.current ? ctx.fillStyle = C1 : ctx.fillStyle = C3;
			ctx.fillText(IMGFX.history[i].name, this.x+5, this.y+10+(ih/2+6)+j*ih, this.w);
			j++;
		}
		
		ctx.restore();
	}
};

/* Layers */
LayersBox = {
	x: 0,
	y: 0,
	w: 0,
	h: 0,
	draw: function(ctx) {
		ctx.save();
		
		this.x = EditArea.x+EditArea.w+10;
		this.y = HistoryBox.y+HistoryBox.h+5;
		this.w = Clamp(CWIDTH-this.x, 0, 190);
		this.h = CHEIGHT-this.y;
		
		ctx.fillStyle = BG4;
		RoundRect(ctx, this.x, this.y, this.w, this.h, 10, true, false, true);
		
		/*var itm;
		
		for(var e in this.elements) {
			e = parseInt(e);
			itm = new MenuBarItem(this.elements[e], this.x+(95*e)+10, this.y, 90, this.h, 18);
			itm.draw(ctx);
		}*/
		
		ctx.restore();
	}
};

/* Brushes */
Brushes = {
	
	// The base brush images
	imgs: [IMG("brushes/1.svg"), IMG("brushes/2.svg"), IMG("brushes/delaware.svg")],
	
	// Cursor container
	x: 0,
	y: 0,
	s: 0,
	cursor: null,
	
	// Returns the image data of a brush size 's'
	get: function(index, s) {
		
		var brush = this.imgs[index];
		
		if(brush && brush.loaded) {
			
			// Get brush image data at size 's'
			var imgcan = document.createElement("canvas"), c = GC(imgcan);
			imgcan.width = imgcan.height = s;
			c.drawImage(brush, 0, 0, s, s);
			
			return {imgdata: c.getImageData(0, 0, s, s), index: index};
		}
	},
	
	draw: function(ctx) {
		if(this.cursor) {
			var size = this.s*ZOOM
			ctx.drawImage(this.cursor, CEIL(this.x-(size/2)), CEIL(this.y-(size/2)), size, size);
		}
	}
}

/* Draw the editor loop */
function DrawEditor() {

	if(!canvas) return;
	
	// Responsive design
	FixCanvasSize();
	
	// Only redraw canvas when necessary
	if(LastUpdate < Frame) {
		requestAnimationFrame(DrawEditor);
		return;
	}
	Frame++;
	
	var ctx = GC(canvas), t = T();
	
	ctx.clearRect(0, 0, CWIDTH, CHEIGHT);
	
	// This is the proper rendering order
	// Screwing with this may draw things wrong
	EditArea.draw(ctx);
	ImageArea.draw(ctx);
	Brushes.draw(ctx);
	UVMap.draw(ctx);
	BG.draw(ctx);
	ToolBox.draw(ctx);
	HistoryBox.draw(ctx);
	LayersBox.draw(ctx);
	MenuBar.draw(ctx);
	PBOX.draw(ctx);
	Tooltip.draw(ctx);
	
	// DEBUG: draw this on top of everything
	if(LOCAL) FrameNum.draw(ctx, T()-t);
	
	requestAnimationFrame(DrawEditor);
	
}
