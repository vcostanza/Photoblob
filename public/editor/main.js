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
		if(t == undefined) {
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
		if(func == undefined) {
			
			// Function isn't specified
			if(caller == undefined) {
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
		this.highlight = false;
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
			if(type == "click") return true;
			else if(type == "move") {
				if(!this.highlight) {
					this.highlight = true;
					Update();
				}
			}
		} else if(this.highlight) {
			this.highlight = false;
			Update();
		}
		return false;
	},
	draw: function(ctx) {
		
		ctx.font = "18px "+F1;
		
		if(this.highlight && this.active) ctx.fillStyle = BG6;
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
		this.img = img;
	},
	draw: function(ctx) {
		
		ctx.font = "18px "+F1;
		
		if(this.highlight && this.active) ctx.fillStyle = BG6;
		else ctx.fillStyle = BG5;
		
		ctx.lineWidth = 4;
		if(this.active) ctx.strokeStyle = BG6; else ctx.strokeStyle = BG5;
		if(this.img && this.img.complete) ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
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
		if(type == "click") this.toggle();
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
		if(type == "click") this.toggle();
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
			if(WB(x, y, this) || (type == "up" && this.held)) {
				var v = this.value;
				this.value = Clamp((x-this.x)/(this.w), 0, 1);
				if(type == "down") this.held = true;
				else if(type == "up") this.held = false;
			}
		} else if(this.held) {
			this.value = Clamp((x-this.x)/(this.w), 0, 1);
		}
		
		var changed = this.value != this.oldvalue;
		this.oldvalue = this.value;
		if(changed) Update();
		return changed;
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
		
		if(type == "click" && !WB(x, y, this)) return;
		
		switch(type) {
			
			case "move":				
				if(WB(x, y, this)) SC("text");
				break;
			
			case "click":
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
		if(type == "click")
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

/* Background drawer */
BG = {
	draw: function(ctx) {
		ctx.fillStyle = BG2;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
};

/* Frame drawer */
FrameNum = {
	draw: function(ctx) {
		ctx.font = "18px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText("F: "+Frame, canvas.width-ctx.measureText("F: "+Frame).width-10, 23);
	}
};

/* The editing area */
EditArea = {
	x: 85,
	y: 40,
	w: 0,
	h: 0,
	
	// Specific vars
	selectArea: {x: 0, y: 0, x2: 0, y2: 0},
	path: [],
	path_last: 0,
	mouseDown: false,
	selecting: false,
	
	detect: function(x, y, type) {
	
		if(!WB(x, y, this) || PBOX.open) {
			return;
		}
	
		if(ToolBox.get("Box Select") && ImageArea.open) {
			if(type == "click") return;
		
			var s = this.selectArea;
			
			if(this.selecting) {
				if(type == "up") {
					
					x = Clamp(x-ImageArea.x, 0, ImageArea.w);
					y = Clamp(y-ImageArea.y, 0, ImageArea.h);
					s.x = Clamp(s.x-ImageArea.x, 0, ImageArea.w);
					s.y = Clamp(s.y-ImageArea.y, 0, ImageArea.h);
					
					var sx = (x < s.x ? x : s.x), sy = (y < s.y ? y : s.y);
					
					IMGFX.SEL_SetBox(new Selection(sx, sy, ABS(s.x-x), ABS(s.y-y)));
					this.selecting = false;
				} else if(type == "move") {
					s.x2 = x;
					s.y2 = y;
				} else if(type == "wheelup") {
					s.x = Clamp(s.x-1, 0, EditArea.w);
					s.y = Clamp(s.y-1, 0, EditArea.h);
				} else if(type == "wheeldown") {
					s.x = Clamp(s.x+1, 0, EditArea.w);
					s.y = Clamp(s.y+1, 0, EditArea.h);
				}
				Update();
			} else if(type == "down") {
				s.x = x;
				s.y = y;
				this.selecting = true;
			}
			SC("crosshair");
		} else if(ToolBox.get("Color Pick")) {
			SC("crosshair");
			if(type == "move") {
				var ctx = GC(canvas), d = [];
				if(WB(x, y, ImageArea)) {
					x -= ImageArea.x;
					y -= ImageArea.y;
					d = IMGFX.SampleColor(x, y, 1);
				} else {
					d = ctx.getImageData(x, y, 1, 1).data;
				}
				MainColors.setFG(d);
				MainColors.drawInside(ctx);
			} else if(type == "click") {
				ToolBox.clear();
				Update();
			}
		} else if(ToolBox.get("Brush") || ToolBox.get("Erase")) {
			if(WB(x, y, ImageArea) && type == "down")
				this.mouseDown = true;
			if(this.mouseDown) {
				if(type == "move") {
					x -= ImageArea.x;
					y -= ImageArea.y;
					var bd = ToolBox.getData();
					IMGFX.ApplyBrush(x, y, MainColors.fg, bd.brush[0], ToolBox.active.name == "Erase");
					Update();
				} else if(type == "up") {
					this.mouseDown = false;
					IMGFX.AddHistory(ToolBox.active.name);
					Update();
				}
			}
		} else if(ToolBox.get("Fill")) {
			if(WB(x, y, ImageArea)) {
				SC("crosshair");
				if(type == "click") {
					x -= ImageArea.x;
					y -= ImageArea.y;
					IMGFX.Fill(x, y, MainColors.fg, 20);
					Update();
				}
			}
		} else if(ToolBox.get("Pen") && ImageArea.open) {
			var p = this.path, i = this.path_last*2, imx = ImageArea.x, imy = ImageArea.y;
			
			x -= imx;
			y -= imy;
			
			if(type == "click") {
				p[i] = x;
				p[i+1] = y;
				this.mouseDown = !this.mouseDown;
				Update();
				this.path_last++;
				
				// Double-click = path done
				if(i > 4 && p[i-2] == x && p[i-1] == y) {
					p[i] = p[0];
					p[i+1] = p[1];
					IMGFX.SEL_SetPoly(ARCPY(p));
					this.path_last = 0;
					this.path = [];
				}
			} else if(type == "move") {
				p[i] = x;
				p[i+1] = y;
				if(i > 0) Update();
			}
			SC("crosshair");
		}
	},
	
	draw: function(ctx) {
		this.w = Clamp(canvas.width-this.x-200, 0, canvas.width);
		this.h = canvas.height-this.y;
		
		ctx.fillStyle = GRY;
		ctx.fillRect(this.x, this.y, this.w, this.h);
	}
};

/* The image area */
ImageArea = {
	x: 0,
	y: 0,
	w: 0,
	h: 0,
	zoom: 1,
	open: false,
	tempimg: undefined,
	img: undefined,
	draw: function(ctx) {
		if(!this.open) return;
		
		// Wait for image load then store its data
		if(!this.img) {
		
			if(!this.tempimg.loaded) return;
			
			this.img = LoadImageData(this.tempimg);
			delete this.tempimg;
			
			IMGFX.SetTarget(this.img);
			IMGFX.AddHistory("Open");
		}
		
		//this.zoom = GetScaleToFit(this.img.width, this.img.height, EditArea.w, EditArea.h);

		this.w = Clamp(EditArea.w, 0, this.img.width);
		this.h = Clamp(EditArea.h, 0, this.img.height);
		
		this.x = Clamp(FLOOR((EditArea.w-this.w)/2+EditArea.x), EditArea.x, EditArea.w);
		this.y = Clamp(FLOOR((EditArea.h-this.h)/2+EditArea.y), EditArea.y, EditArea.h);
		
		ctx.putImageData(this.img, this.x, this.y, 0, 0, this.w, this.h);
		
		// Draw selection mask
		var sel = IMGFX.selection;
		if(sel && sel.img) {
			ctx.drawImage(sel.img, this.x+sel.x, this.y+sel.y, sel.w, sel.h);
		}
		
		ctx.lineWidth = 1;
		
		// Draw temporary selection
		if(EditArea.selecting) {
			sel = EditArea.selectArea;
			ctx.strokeStyle = WHT;
			ctx.strokeRect(sel.x, sel.y, sel.x2-sel.x, sel.y2-sel.y);
		}
		
		// Draw temp path
		var p = EditArea.path, i = 0;
		ctx.strokeStyle = BLK;
		for(; i < p.length-2; i+=2) {
			DrawLine(ctx, this.x+p[i], this.y+p[i+1], this.x+p[i+2], this.y+p[i+3]);
		}
	}
};

/* Menu bar */
MenuBar = {
	x: 0,
	y: 0,
	w: 100,
	h: 30,
	highlight: undefined,
	
	// Menu items
	items: [new MenuBarItem("File"), new MenuBarItem("Edit"), new MenuBarItem("Image"), new MenuBarItem("Layer"),
	new MenuBarItem("Select"), new MenuBarItem("Filter"), new MenuBarItem("View"), new MenuBarItem("Window"), new MenuBarItem("Help")],
	
	// HIT DETECTION
	detect: function(x, y, type) {
	
		if(!type) type = "click";
		var item = undefined;
		
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
		
			if(type == "click") {
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
				
		} else {
			this.setHighlight();
		}
		
		// Menu opened
		if(this.menu) {
			
			var menu = this.menu, opts = menu.options;
			
			if(WB(x, y, menu) || item) {
				
				var m = FLOOR((y-menu.y)/(menu.h/opts.length));
				
				if(opts[m] == undefined) {
					menu.setHighlight(-1);
					return;
				}
				
				// Run function on click
				if(type == "click") {
					
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
				if(type == "click")
					this.close();
				else if(type == "move")
					menu.setHighlight(-1);
			}
		}
		
		return false;
		
	},
	
	// Menu options
	menu: undefined,
	
	close: function() {
		if(this.menu != undefined) {
			this.menu = undefined;
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
		
		this.w = canvas.width-this.x;
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
	tools: [new Tool("Move"), new Tool("Box Select"), new Tool("Lasso"), new Tool("Color Select"),
	new Tool("Crop"), new Tool("Color Pick"), new Tool("Healing Brush"), new Tool("Brush"),
	new Tool("Stamp"), new Tool("History Brush"), new Tool("Erase"), new Tool("Fill"),
	new Tool("Sharpen"), new Tool("Burn"), new Tool("Pen"), new Tool("Text"),
	new Tool("Select"), new Tool("Line"), new Tool("Grab"), new Tool("Zoom")],
	
	// The active tool
	active: undefined,
	
	clear: function() {
		this.active = undefined;
	},
	
	// Return true if tool is active
	get: function(tname) {
		return this.active && this.active.name == tname;
	},
	
	// Hit detection
	detect: function(x, y, type) {
		if(!WB(x, y, this)) {
			this.setHighlight(undefined);
			return;
		}
	
		if(!type) type = "click";
		var tool = undefined;
		
		for(var i in this.tools) {
			if(WB(x, y, this.tools[i])) {
				tool = this.tools[i];
				break;
			}
		}
			
		// Menu items
		if(tool) {
			if(type == "click") this.setTool(tool);
			if(type == "move") this.setHighlight(tool);
		} else {
			this.setHighlight(undefined);
		}
		
		MainColors.detect(x, y, type);
		
	},
	
	// Highlight used for mouse hover
	setHighlight: function(h) {
		if(this.highlight != h) {
			this.highlight = h;
			Update();
		}
	},
	
	// Set the active tool
	setTool: function(t) {
		if(this.active != t) {
			if(t.name == "Brush" || t.name == "Erase") {
				//var erase = t.name == "Erase";
				t.data = {brush: [Brushes.get(1, 100), Brushes.get(2, 75), Brushes.get(2, 50)]};
				/*var t1 = T();
				for(var i = 0; i < 1000; i++) {
					IMGFX.ApplyBrush(FLOOR(Math.random()*ImageArea.w), FLOOR(Math.random()*ImageArea.h), t.data.brush[FLOOR(Math.random()*3)], erase);
				}
				if(erase)
					IMGFX.AddHistory("Eraser Test");
				else
					IMGFX.AddHistory("Brush Test");
				Update();
					
				CL("Test: "+(T()-t1));*/	
			}
			this.active = t;
		}
	},
	
	// Get tool data
	getData: function() {
		return this.active.data;
	},
	
	draw: function(ctx) {
		ctx.save();
		
		this.h = canvas.height-this.y;
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
function Tool(name) {
	this.name = name,
	this.w = 30,
	this.h = 30,
	this.data = [],
	this.set = function(x, y) {
		this.x = x;
		this.y = y;
	},
	this.loadIcon = function() {
		if(!Icons[this.name]) Icons[this.name] = IMG("icons/"+this.name.toLowerCase().replace(" ", "")+".svg");
		return Icons[this.name];
	},
	this.icon = this.loadIcon(),
	this.draw = function(ctx) {
		ToolBox.highlight == this ? ctx.fillStyle = BG6 : ctx.fillStyle = BG5;
		ctx.fillRect(this.x, this.y, this.w, this.h);
		if(this.icon && this.icon.loaded) {
			ctx.drawImage(this.icon, this.x+3, this.y+3, this.w-6, this.h-6);
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
		if(type != "click" || !WB(x, y, this)) return;
		
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
	
		if(!type) type = "click";
		
		var l = IMGFX.history.length,
		item = FLOOR((y-this.y-10)/this.ih)+Clamp(l-FLOOR((this.h-20)/this.ih), 0, l);
		
		if(item > -1 && item < l) {
			if(type == "click")
				IMGFX.LoadHistory(item);
			else if(type == "move")
				this.setHighlight(item);
		} else this.setHighlight(-1);
		
	},	
	
	draw: function(ctx) {
		ctx.save();
		
		this.x = EditArea.x+EditArea.w+10;
		this.w = Clamp(canvas.width-this.x, 0, 190);
		this.h = (canvas.height-this.y)/2;
		
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
		this.w = Clamp(canvas.width-this.x, 0, 190);
		this.h = canvas.height-this.y;
		
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
	
	// Returns the image data of a brush size 's'
	get: function(index, s) {
		
		var brush = this.imgs[index];
		
		if(brush && brush.loaded) {
			
			var imgcan = document.createElement("canvas");
			imgcan.width = imgcan.height = s;
			
			var c = GC(imgcan);
			c.drawImage(brush, 0, 0, s, s);
			
			return c.getImageData(0, 0, s, s);			
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
	
	var ctx = GC(canvas);
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	// This is the proper rendering order
	// Screwing with this may draw things wrong
	BG.draw(ctx);
	ToolBox.draw(ctx);
	EditArea.draw(ctx);
	ImageArea.draw(ctx);
	HistoryBox.draw(ctx);
	LayersBox.draw(ctx);
	MenuBar.draw(ctx);
	PBOX.draw(ctx);
	
	// DEBUG: draw this on top of everything
	//FrameNum.draw(ctx);
	
	/*if(ImageArea.open) {
		IMGFX.Fuzzify(FUZZAMT);
		Update();
	}*/
	
	requestAnimationFrame(DrawEditor);
	
}
