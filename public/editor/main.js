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
		ctx.save();
		
		ctx.fillStyle = (MenuBar.highlight == this ? BG6 : BG5);
		ctx.fillRect(this.x, this.y, this.w, this.h);
		
		ctx.fillStyle = C1, ctx.font = this.t_h+"px "+F1;
		
		ctx.textAlign = "center";
		ctx.fillText(this.name, this.x+(this.w/2), this.y+(this.t_h/2)+(this.h/2), this.w);
		ctx.restore();
	}
});

/* Top menu bar */
MenuBar = {
	x: 0,
	y: 0,
	w: 100,
	h: 30,
	highlight: null,
	
	// Menu items
	items: [new MenuBarItem("File"), new MenuBarItem("Edit"), new MenuBarItem("Image"), new MenuBarItem("Layer"),
	new MenuBarItem("Select"), new MenuBarItem("Filter"), new MenuBarItem("View"), new MenuBarItem("Settings"), new MenuBarItem("Help")],
	
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
	
		ctx.font = "14px "+F1;
	
		for(; i < opt.length; i++) {
			w = ctx.measureText(opt[i].name).width+30;
			if(w > this.w)
				this.w = w;
		}
		
		ctx.fillStyle = BG4;
		ctx.fillRect(this.x, this.y, this.w, this.h);

		if(this.highlight > -1 && this.highlight < opt.length) {
			ctx.fillStyle = BG5;
			ctx.fillRect(this.x, this.y+(this.highlight*20)+3, this.w, 20);
		}
		
		for(i = 0; i < opt.length; i++) {
			ctx.fillStyle = (opt[i].empty ? GRY : (this.highlight == i ? C1 : C2));
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
	init: function(text, h) {
		this._super();
		
		if(!h) h = 26;
		
		this.h = h;
		this.setText(text);
		this.state = 0;
		this.active = true;
	},
	setText: function(text) {
		var c = GC(canvas);
		c.font = (this.h-8)+"px "+F1;
		this.size(c.measureText(text).width+10, this.h);
		this.text = text;
	},
	detect: function(x, y, type) {
		if(this.active && WB(x, y, this)) {
			if(type == "click") {
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
		
		ctx.font = (this.h-8)+"px "+F1;
		
		if(this.state == 1 && this.active) ctx.fillStyle = BG6;
		else if(this.state == 2) ctx.fillStyle = BG4;
		else ctx.fillStyle = BG5;
		
		ctx.lineWidth = 4;
		if(this.active) ctx.strokeStyle = BG6; else ctx.strokeStyle = BG5;
		RoundRect(ctx, this.x, this.y, this.w, this.h, 5, true, true);
		
		if(this.active) ctx.fillStyle = C1;
		else ctx.fillStyle = C3;
		ctx.fillText(this.text, this.x+5, this.y+(this.h-4), this.w-5);
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
		
		var step = 1/this.w, hover = WB(x, y, this);
		
		if(type == "wheelup" && hover) this.value = Clamp(this.value+step, 0, 1);
		
		else if(type == "wheeldown" && hover) this.value = Clamp(this.value-step, 0, 1);
		
		else if(type != "move") {
			if(hover || (!MDOWN && this.held)) {
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
		this.min = min, this.max = max;	// Numeric min and max
		this.parent = parent;	// Parent object (used for tabbing)
		this.maxlen = len;	// Maximum amount of characters allowed
		this.ind = 0;	// End of selection and cursor location
		this.sta = 0;	// Start of selection
		this.sub = 0;	// Visual substring where the text starts being drawn
	},
	addText: function(str) {
		
		str = str.toString();		
		var max = MAX(this.sta, this.ind), min = MIN(this.sta, this.ind), v = this.get(true), oldval = v, i = min, ml = this.maxlen;
		if(min != max)
			v = v.substring(0, min)+v.substring(max);
		
		// Set cursor pos
		this.sta = this.ind = Clamp(min+str.length, 0, (ml ? ml : v.length+str.length));
		
		// Append new text
		if(!(this.numOnly && isNaN(str))) {
			v = v.substring(0, i)+str+v.substring(i);
			v = v.substring(0, (ml?ml:v.length));
		}
		
		this.update(v, oldval);
	},
	remove: function(ind) {
		var v = this.get(true), oldval = v;
		
		// Only delete highlighted text
		if(this.ind != this.sta) {
			this.addText("");
			
		// Remove specific index
		} else if(ind >= 0 && ind < v.length) {			
			v = v.substring(0, ind)+v.substring(ind+1);
			this.moveCursor(ind-this.ind);
			this.update(v, oldval);
		}		
	},
	get: function(asString) {
		if(this.numOnly) {
			var v = this.value, num = v;
			
			if(v == "") num = this.min;
			else if(v == "-") num = -1;
			else num = parseInt(num);
			
			if(num > this.max) this.value = v = num = this.max;
			else if(num < this.min) this.value = v = num = this.min;
						
			return (asString == true ? v.toString() : num);
		}
		return this.value.toString();
	},
	update: function(v, oldval) {
		this.value = v;
		
		if(oldval != v) {
			this.onchange(oldval, this.get(true));
			Update();
		}
	},
	unfocus: function() {
		if(this == FocusObj) {
			if(this.numOnly && this.get(true) == "") this.value = this.min;	// Set empty number-only text fields to minimum
			SetInputFocus();
			Update();
		}
	},
	onchange: function(oldval, newval) {
		// Override me!
	},
	moveCursor: function(pos) {
		var ind = this.ind;
		this.sta = this.ind = Clamp(this.ind+pos, 0, this.get(true).length);
		if(ind != this.ind) Update();
	},
	getCursorPos: function(x) {
		var o = x-this.x, v = this.get(true), ind = v.length, squish, ctx = GC(canvas), c = 0, i = 0;
		
		// Setup font and determine 'squish' value
		ctx.font = (this.h-6)+"px "+F1;
		squish = Clamp((this.w-8)/ctx.measureText(v).width, 0, 1);
		
		// Find closest character
		for(; i < v.length; i++) {
			c += ctx.measureText(v[i]).width*squish;
			if(o <= c) {
				ind = i;
				break;
			}
		}
		
		return ind;
	},
	detect: function(x, y, type) {
		
		if(type == "down" && !WB(x, y, this)) return;
		
		if(WB(x, y, this)) SC("text");
		
		switch(type) {
		
			// Select text box
			case "down":
				SetInputFocus(this);
				this.sta = this.ind = this.getCursorPos(x);
				Update();
				break;
			
			// Move selection cursor
			case "move":
				if(MDOWN && WB(x, y, this) && FocusObj == this) {
					var ind = this.getCursorPos(x);
					if(ind != this.ind) {
						this.ind = ind;
						Update();
					}
				}
				break;
			
			// For 'Input' to capture the focus event
			case "click":
				if(FocusObj == this)
					SetInputFocus(this);
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
		
		// Set font
		c.font = (this.h-6)+"px "+F1;
		
		var v = this.get(true);
		
		if(FocusObj == this) {		
			// Clamp index positions
			this.ind = Clamp(this.ind, 0, v.length);
			this.sta = Clamp(this.sta, 0, v.length);
			
			var ind_x = c.measureText(v.substring(0, this.ind)).width, sta_x = c.measureText(v.substring(0, this.sta)).width;
			
			// Draw selection mask
			c.fillStyle = C3;
			c.fillRect(this.x+(sta_x < ind_x ? sta_x : ind_x)+4, this.y, ABS(ind_x-sta_x), this.h);
			
			// Text
			c.fillStyle = C4;
			c.fillText(v, this.x+4, this.y+this.h-4, this.w-8);
			
			// Selection cursor
			c.fillStyle = BLK;
			c.fillRect(this.x+ind_x+4, this.y, 2, this.h);
		} else {
			c.fillStyle = C1;
			c.fillText(v, this.x+4, this.y+this.h-4, this.w-8);
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
				window.open(this.href);
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
		this.held = false;	// Slider held
		this.slider = true;	// Slider enabled		
		this.value = 0;		// Slider value
		
		this.setGradient(grad);
	},
	// Safest way to set the gradient
	setGradient: function(grad) {
		this.grad = [];
		
		// Default to black if null gradient passed
		if(!grad) grad = [[0, 0, 0, 255, 0], [0, 0, 0, 255, 1]];
		
		// Copy color to second color
		else if(grad.length == 1) grad.push(ARCPY(grad[0]));
		
		for(var i = 0; i < grad.length; i++) {
			// Make sure gradient offsets always go from 0 to 1
			grad[i][4] = (i == 0 ? 0 : (i == grad.length-1 ? 1 : grad[i][4]));		
			// Offset unspecified? approximate it
			if(grad[i][4] == null) grad[i][4] = i/(grad.length-1);
			this.grad.push(grad[i]);
		}
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
		
		// Fill alpha background
		ctx.fillStyle = ctx.createPattern(ALPHA_BG, "repeat");
		ctx.fillRect(this.x, this.y, this.w, this.h);
		
		// Construct gradient
		for(; i < grad.length; i++) {
			stop = grad[i][4];
			if(stop == null || stop < 0 || stop > 1) stop = i/(grad.length-1);
			g1.addColorStop(stop, rgba(grad[i]));
		}
		ctx.fillStyle = g1;
		
		// Fill color
		ctx.strokeStyle = BLK;
		ctx.lineWidth = 2;
		ctx.strokeRect(this.x, this.y, this.w, this.h);
		ctx.fillRect(this.x, this.y, this.w, this.h);
		
		// Slider
		if(this.slider) {
			ctx.lineWidth = 2;
			ctx.strokeStyle = WHT;
			ctx.fillStyle = BLK;
			ctx.strokeRect(posX-1, this.y+1, 3, this.h-2);
			ctx.fillRect(posX-1, this.y, 3, this.h);
		}
	}
});

/* Editable gradient bar */
GradientBar = ColorBar.extend({
	init: function(w, h, grad) {
		this._super(w, h, grad);
		this.slider = false;
		this.ticks = [];
		this.update();
	},
	
	// Update gradient ticks
	update: function(grad) {
		
		var gl = this.grad.length, tl = this.ticks.length, offset, i = 0;
		
		// If a gradient is passed, use that as the reference
		if(grad) {
			this.setGradient(grad);
			gl = this.grad.length;
			
		// Otherwise use the tick colors as reference
		} else {
			this.grad = [];
			// Sort ticks by offset
			this.ticks.sort(function(a, b) {
				return a.value[4]-b.value[4];
			});
			for(i = 0; i < tl; i++) {
				this.grad.push(this.ticks[i].value);
			}
			gl = tl;
		}
		
		// Pop off excess ticks
		if(tl > gl) {
			for(i = gl; i < tl; i++) {
				this.ticks.pop();
			}
			tl = gl;
		}
		
		// Change existing ticks or add new
		for(i = 0; i < gl; i++) {
			if(i >= tl) {
				this.newTick(this.grad[i]);
			} else {
				this.ticks[i].value = this.grad[i];
			}
		}
		
		// Fire changes
		this.onChange(this.grad);
		Update();
	},
	
	// Add new tick
	newTick: function(col) {
		var t = this, tick = new GradientTick(t);
		tick.setColor(col);
		tick.onChange = function() {
			t.update();
		};
		t.ticks.push(tick);
		return tick;
	},
	
	// Remove tick
	removeTick: function(tick) {
		var rm = false, i = 1;
		if(this.ticks.length > 2) {
			for(; i < this.ticks.length; i++) {			
				if(this.ticks[i-1] == tick) rm = true;
				if(rm) this.ticks[i-1] = this.ticks[i];
			}
			if(rm) {
				this.ticks.pop();
				this.update();
			}
		}
	},
	
	onChange: function(grad) {
		// Override me!
	},
	detect: function(x, y, type) {
		var hit, i = 0;
		
		// Hit detection on ticks
		for(; i < this.ticks.length; i++) {
			if(!hit && !((i == 0 || i == this.ticks.length-1) && type != "up")) {
				hit = this.ticks[i].detect(x, y, type);
			}
		}
		
		if(!hit && type == "click") {
			if(!WB(x, y, this)) return;
			
			// Add new tick				
			var g = ARCPY(this.grad), off = (x-this.x)/this.w, last = ARCPY(g[g.length-1]), c = 1;
			
			// Find right neighbor color
			for(; c < g.length; c++) {
				if(off <= g[c][4]) break;
			}
			
			// Get position between neighbor colors
			var k = (off-g[c-1][4])/(g[c][4]-g[c-1][4]);
			
			// Push new gradient on stack
			g.push(last);
			
			// Move other gradients over
			for(i = g.length-1; i > c; i--) {
				g[i] = ARCPY(g[i-1]);
			}
			
			// Set new gradient color based on interpolation
			for(i = 0; i < 4; i++) {
				g[c][i] = FLOOR((g[c-1][i]*(1-k))+(g[c][i]*k));
			}
			g[c][4] = off;
			
			this.update(g);
		}
	},
	draw: function(ctx) {
		this._super(ctx);
		
		for(var i = 0; i < this.ticks.length; i++) {
			this.ticks[i].draw(ctx);
		}
	}
});

/* Clickable/changeable color box */
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

GradientTick = ColorBox.extend({
	init: function(parent) {
		this._super(10, 20);
		this.parent = parent;
		this.held = false;
		this.lastPos = 0;	// Used to differentiate between clicks and drags
	},
	setColor: function(col) {
		if(col[4] == null) col[4] = this.value[4];
		for(var i = 0; i < 5; i++) {
			this.value[i] = col[i];
		}
		this.lastPos = this.value[4];
		this.onChange();
	},
	remove: function() {
		if(this.parent)	this.parent.removeTick(this);
	},
	detect: function(x, y, type) {		
		if(!this.parent) return;
		
		var hit = WB(x, y, this), o = this.value[4];
		
		// Tick is held
		if(hit && type == "down") {
			
			// Remove on right-click
			if(RCLICK) {
				this.remove();
			} else {
				this.lastPos = o;
				this.held = true;
			}
			
		// Tick is released
		} else if(LCLICK && type == "up") {
			if(this.lastPos != o)
				this.parent.update();
			else if(hit)
				this.devent("click");
			this.lastPos = o;
			this.held = false;
			
		// Tick is being moved
		} else if(type == "move" && this.held) {
			this.value[4] = Clamp((x-this.parent.x)/this.parent.w, 0, 1);
			if(o != this.value[4]) Update();
		}
			
		return hit;
	},
	draw: function(ctx) {
		var p = this.parent;
		if(p) {
			var x = p.x, y = p.y, w = p.w, h = p.h, o = this.value[4], w2 = this.w/2;
			this.set(x+w*o-w2, y+h);
			
			ctx.fillStyle = rgba(this.value);
			ctx.strokeStyle = BLK;
			ctx.lineWidth = 1;
			DrawTriangle(ctx, this.x, this.y, this.x+w2, this.y-w2, this.x+this.w, this.y, true, true);
			ctx.fillRect(this.x, this.y, this.w, this.h);
			ctx.strokeRect(this.x, this.y, this.w, this.h);
		}
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
			case "zoom": x = 11; break;
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
		ctx.fillRect(e.x, e.y+e.h, w, 32);
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
		
		if(T()-this.lastCall > 1000) this.active = false;
		
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

/* The status bar at the bottom of the screen */
StatusBar = {
	x: 0,
	y: 0,
	w: 0,
	h: 30,
	zoomBox: new TextBox(null, 60, 22, 100, 4, true, 0, 1600),
	
	detect: function(x, y, type) {
		this.zoomBox.detect(x, y, type);
		this.zoomBox.onchange = function(o, n) {
			ImageArea.setZoom(n/100);
		};
	},
	
	draw: function(ctx) {
		this.w = EditArea.w;
		this.x = EditArea.x;
		this.y = EditArea.y+EditArea.h+2;
		
		ctx.save();
		
		ctx.fillStyle = BG4;
		ctx.fillRect(this.x, this.y, this.w, this.h);
		
		// Show zoom
		var z = this.zoomBox;
		z.value = ROUND(ZOOM*100);
		z.set(this.x+this.w-z.w-4, this.y+4);
		z.draw(ctx);
		
		// Show active tool
		if(ToolBox.get() != null) {
			ctx.font = "18px "+F1;
			ctx.fillStyle = C1;
			ctx.fillText(ToolBox.get(), this.x+4, this.y+22, this.w/8);
		}
		
		// Show image properties
		if(IMG_NAME) {
			ctx.font = "14px "+F1;
			var imgStr = IMG_NAME+" ["+IMGFX.tw+"x"+IMGFX.th+"]"+(IMG_SIZE > 0 ? " "+ByteString(IMG_SIZE) : ""),
				fw = this.w-(this.w/8)-z.w-32,
				tx = this.x+(this.w/8)+16;
			ctx.fillStyle = BG4C;
			ctx.fillRect(tx, this.y, fw, this.h);
			ctx.fillStyle = C1;
			ctx.textAlign = "center";
			ctx.fillText(imgStr, tx+(fw/2), this.y+22, fw);
		}
		ctx.restore();
	}
};

/* The editing area */
EditArea = {
	x: 80,
	y: 35,
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
	
	clear: function() {
		this.selecting = false;
		this.path_last = 0;
		this.path = [];
	},
	
	/* TOOLBOX IMPLEMENTATION */
	detect: function(x, y, type) {
	
		if(!WB(x, y, this) || PBOX.open)
			return;
			
		// Get active tool
		var tool = ToolBox.get(), ia = ImageArea;
			
		/* Scroll wheel stuff */
		
		// Move Up/Down: scroll wheel
		// Move Left/Right: shift + scroll wheel
		// Zoom: ctrl + scroll wheel
		if(type.indexOf("wheel") == 0) {
			if(type == "wheelup") {
				if(CTRL) ia.setZoom("in", x, y);
				else if(SHIFT) ia.setOffset(ia.off_x-(16/ZOOM), ia.off_y);
				else ia.setOffset(ia.off_x, ia.off_y-(16/ZOOM));				
			} else if(type == "wheeldown") {
				if(CTRL) ia.setZoom("out", x, y);
				else if(SHIFT) ia.setOffset(ia.off_x+(16/ZOOM), ia.off_y);
				else ia.setOffset(ia.off_x, ia.off_y+(16/ZOOM));
			}
		}
		
		
		
		// Nothing left to do if there's no tool active
		if(!tool) return;
		
		// Get image coordinates
		var icoords = ia.getXY(x, y), ix = icoords[0], iy = icoords[1], iw = IMGFX.tw, ih = IMGFX.th, lx = this.lastX, ly = this.lastY, changed = !(lx == ix && ly == iy), sx, sy;
		
		if(type == "move") {
			this.lastX = ix;
			this.lastY = iy;
		}
	
		/* Box selection tool */
		if(tool == "Box Select" && ia.open) {
			
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
					
					sx = (x < s.x ? x : s.x);
					sy = (y < s.y ? y : s.y);
					
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
				s.y = s.y2 = iy;
				this.selecting = true;
			}
			SC("crosshair");
			
		/* UV editing mode */
		} else if(tool == "UV Edit") {
			
			UVMap.detect(x, y, type);
			
		/* Color picker tool */
		} else if(tool == "Color Pick") {
			SC("crosshair");
			if(type == "move" && changed) {
				var ctx = GC(canvas), d = [];
				if(WC(ix, iy, 0, 0, iw, ih)) {
					d = IMGFX.SampleColor(ix, iy, 1);
				} else {
					d = [102, 102, 102, 255];
				}
				MainColors.setFG(d);
				MainColors.drawInside(ctx);
			} else if(type == "click") {
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
			
			if(!WC(ix, iy, 0, 0, iw, ih) || (type != "down" && type != "up" && type != "move")) return;
			
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
				ia.update();				
			} else {
				if(type == "up") {
					IMGFX.AddHistory(tool);
					ia.update();
				}
			}
			
		/* Fill tool */
		} else if(tool == "Fill") {
			if(WC(ix, iy, 0, 0, iw, ih)) {
				SC("crosshair");
				if(type == "click") {
					IMGFX.Fill(ix, iy, MainColors.fg, 100);
					IMGFX.AddHistory(tool);
				}
			}
			
		/* Pen tool (sort of) */
		} else if(tool == "Pen" && ia.open) {
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
		} else if(tool == "Grab" && ia.open) {
			SC("grab");
			
			if(type == "down") {
				if(RCLICK) ia.setOffset(0, 0);
				this.grabX = x+ia.off_x;
				this.grabY = y+ia.off_y;
			}
			if(LCLICK && MDOWN) {
				SC("grabbing");
				ia.setOffset(this.grabX-x, this.grabY-y);
			}
			
		/* Zoom tool */
		} else if(tool == "Zoom" && ia.open) {
			
			if(RCLICK) SC("zoom-out");
			else SC("zoom-in");
			
			var s = this.selectArea;
			
			// Zoom to specific area
			if(this.selecting) {				
				if(type == "up") {
					sx = MIN(s.x, ix), ix = MAX(s.x, ix);
					sy = MIN(s.y, iy), iy = MAX(s.y, iy);
					
					// No movement, just zoom in/out
					if(ix-sx < 10 && iy-sy < 10) {
						if(RCLICK) ia.setZoom("out");
						else ia.setZoom("in");
						this.selecting = false;
						return;
					}
					
					ia.off_x = FLOOR(sx+((ix-sx)/2)-(iw/2));
					ia.off_y = FLOOR(sy+((iy-sy)/2)-(ih/2));
					
					// Clamp based on aspect ratio
					if((ix-sx)/(iy-sy) > this.w/this.h)
						ia.setZoom(ROUND(this.w/(ix-sx)*100)/100);
					else
						ia.setZoom(ROUND(this.h/(iy-sy)*100)/100);
					
					this.selecting = false;
					Update();
				} else if(type == "move") {
					s.x2 = ix;
					s.y2 = iy;
					if(changed) Update();
				}
				SC("crosshair");
			} else if(type == "down") {
				s.x = s.x2 = ix;
				s.y = s.x2 = iy;
				this.selecting = true;
			}
			
			// Scroll wheel zoom (without holding down CTRL)
			if(type.indexOf("wheel") == 0) {
				ia.setZoom(type == "wheelup" ? "in" : "out");
				return;
			}
		}
	},
	
	draw: function(ctx) {
		this.w = Clamp(CWIDTH-this.x-200, 0, CWIDTH);
		this.h = CHEIGHT-this.y-32;
		
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
	off_x: 0,	// Grab offset x
	off_y: 0,	// Grab offset y
	lastZoom: "",	// String array of last IMGFX.Zoom parameters (so we don't call it when we don't need to)
	loaded: false,	// Image area loading/loaded (set to true when image is first opened)
	open: false,	// Image area open (set to true when image is opened and finished loading)
	tempimg: null,
	img: null,
	
	// Zoom viewport
	viewport: {
		x: 0,
		y: 0,
		w: 0,
		h: 0
	},
	
	// Mouse coords -> Image pixel coords
	getXY: function(x, y) {
		var z = ZOOM, e = EditArea, view = this.viewport;
		return [FLOOR(((x-e.x)/z)+view.x-this.x), FLOOR(((y-e.y)/z)+view.y-this.y)];
	},
	
	// Image pixel coords -> Mouse coords
	pixToMouseX: function(x) {
		return FLOOR(EditArea.x+(x-this.viewport.x+this.x)*ZOOM);
	},	
	pixToMouseY: function(y) {
		return FLOOR(EditArea.y+(y-this.viewport.y+this.y)*ZOOM);
	},
	
	// Set the grab offset
	setOffset: function(x, y) {
		this.off_x = FLOOR(x);
		this.off_y = FLOOR(y);
		this.update(true);
	},
	
	// Set zoom value
	setZoom: function(value, x, y) {
		if(value == "in")
			value = ZOOM + (ZOOM >= 1 ? (ZOOM >= 4 ? 1 : 0.5) : 0.1);
		else if(value == "out")
			value = ZOOM - (ZOOM > 1 ? (ZOOM >= 4 ? 1 : 0.5) : 0.1);
		else if(value == "fit") {
			value = GetScaleToFit(IMGFX.tw, IMGFX.th, EditArea.w, EditArea.h);
			this.off_x = this.off_y = 0;
		}
		
		value = Clamp(value, 0.05, 16);
		
		if(value != ZOOM) {			
			ZOOM = value;
			this.update();
		}
	},
	
	// Update image area render
	update: function(checkLastZoom) {
		if(!this.img || IMGFX.speedTesting) return;
		
		var e = EditArea, z = ZOOM, ox = this.off_x, oy = this.off_y, view = this.viewport, w = IMGFX.tw, h = IMGFX.th, x = FLOOR((e.w-w)/2), y = FLOOR((e.h-h)/2);
		
		this.x = e.x+x;
		this.y = e.y+y;
		
		view.w = FLOOR(e.w/z);
		view.h = FLOOR(e.h/z);
		view.x = FLOOR(e.x+ox+(e.w-view.w)/2);
		view.y = FLOOR(e.y+oy+(e.h-view.h)/2);
		
		var sx = Clamp(view.x-this.x, 0, w), sy = Clamp(view.y-this.y, 0, h), ex = Clamp(view.x+view.w-this.x, 0, w-1)+1, ey = Clamp(view.y+view.h-this.y, 0, h-1)+1, arr = [z, sx, sy, ex, ey].toString();
		
		// Reset grab if the image is off screen
		if(ex-sx <= 0 || ey-sy <= 0) {
			this.setOffset(0, 0);
			return;
		}
		
		// Check our last zoom to reduce redudancy
		if(!(checkLastZoom && this.lastZoom == arr)) {
			this.lastZoom = arr;
			IMGFX.Zoom(z, sx, sy, ex, ey);
		}
		Update();
	},
	draw: function(ctx) {
		if(!this.loaded) return;
		
		var e = EditArea, view = this.viewport, z = ZOOM, ox = this.off_x, oy = this.off_y;
		
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
			this.off_x = this.off_y = 0;
			ZOOM = 0;	// So setZoom calls update
			if(this.img.width > e.w || this.img.height > e.h)
				this.setZoom("fit");
			else
				this.setZoom(1);
			return;
		}
		
		var w = IMGFX.tw, h = IMGFX.th, iw = this.w = this.img.width, ih = this.h = this.img.height,
			ix = e.x+Clamp((-ox*z)+FLOOR((e.w-iw)/2), 0, e.w-iw), iy = e.y+Clamp((-oy*z)+FLOOR((e.h-ih)/2), 0, e.h-ih);
		
		ctx.putImageData(this.img, ix, iy, 0, 0, iw, ih);
		
		// Draw selection mask
		var sel = IMGFX.selection;
		if(sel && sel.img) {
			ctx.drawImage(sel.img[sel.state], this.pixToMouseX(sel.x), this.pixToMouseY(sel.y), sel.w*z, sel.h*z);
			sel.state = FLOOR(T()/1000) % 2;
		}
		
		ctx.lineWidth = 1;
		
		// Draw temporary selection
		if(e.selecting) {
			sel = e.selectArea;
			ctx.strokeStyle = WHT;
			ctx.strokeRect(this.pixToMouseX(sel.x), this.pixToMouseY(sel.y), (sel.x2-sel.x)*z, (sel.y2-sel.y)*z);
			ctx.strokeStyle = BLK;
			ctx.strokeRect(this.pixToMouseX(sel.x)+1, this.pixToMouseY(sel.y)+1, (sel.x2-sel.x)*z-2, (sel.y2-sel.y)*z-2);
		}
		
		// Draw temp path
		var p = e.path, i = 0;
		for(; i < p.length-2; i+=2) {
			ctx.strokeStyle = BLK;
			DrawLine(ctx, this.pixToMouseX(p[i]), this.pixToMouseY(p[i+1]), this.pixToMouseX(p[i+2]), this.pixToMouseY(p[i+3]));
			ctx.strokeStyle = WHT;
			DrawLine(ctx, this.pixToMouseX(p[i])+1, this.pixToMouseY(p[i+1])+1, this.pixToMouseX(p[i+2])+1, this.pixToMouseY(p[i+3])+1);
		}
		
		// DEBUG: Draw viewport
		//ctx.strokeStyle = WHT;
		//ctx.strokeRect(view.x, view.y, view.w, view.h);
	}
};

/* UV mapping overlay */
UVMap = {
	x: 0,
	y: 0,
	w: 0,
	h: 0,
	geo: null,		// Reference geometry
	UVs: null,		// Array of all UVs
	UVxy: null,		// Array of UV coordinates
	selectedUVs: null,	// Array of selected UV indices
	
	dumpUVs: function(g) {
		if(g && g.faceVertexUvs) {
			var fvu = g.faceVertexUvs, i = 0, j = 0, k = 0;
			
			this.UVs = [], this.geo = g;
			
			// Vertex groups
			for(; i < fvu.length; i++) {
				// Faces
				for(j = 0; j < fvu[i].length; j++) {
					// Vertices
					for(k = 0; k < 3; k++) {
						this.UVs.push(fvu[i][j][k].x, 1-fvu[i][j][k].y);
					}
				}
			}
			// Setup xy coordinate and selection arrays
			this.UVxy = new Uint16Array(this.UVs.length);
			this.lastUVs = new Float32Array(this.UVs.length);
			this.selectedUVs = new Uint8ClampedArray(this.UVs.length/2);
			
			// Save UVs for real-time editing
			this.saveLast();
			
			// Set UV editing on
			ToolBox.setTool("UV Edit", true);
			
			Update();
		}
	},
	clearUVs: function() {
		delete this.UVs;
		delete this.UVxy;
		delete this.lastUVs;
		delete this.selectedUVs;
		if(ToolBox.get() == "UV Edit") ToolBox.clear();
	},
	updateUVs: function() {
		if(this.geo) {
			var fvu = this.geo.faceVertexUvs, i = 0, j = 0, k = 0, v = 0;
			
			// Sync model UV data with UVMap data
			for(i = 0; i < fvu.length; i++) {
				for(j = 0; j < fvu[i].length; j++) {
					for(k = 0; k < 3; k++) {
						fvu[i][j][k].x = this.UVs[v];
						fvu[i][j][k].y = 1-this.UVs[v+1];
						v += 2;
					}
				}
			}			
			this.geo.uvsNeedUpdate = true;
			Update();
		}
	},
	
	// Select all (1), none(0), or inverse(-1)
	select: function(type) {
		if(this.UVs) {
			type = (type > 0 ? type = 1 : type);
			var i = 0, su = this.selectedUVs;
			for(; i < su.length; i++) {
				su[i] = (type < 0 ? 1-su[i] : type);
			}
			Update();
		}
	},
	
	// Get centroid of selected UVs
	centroid: function() {
		var uv = this.lastUVs, su = this.selectedUVs, minX = Infinity, maxX = -Infinity, minY = minX, maxY = maxX, i = 0, j = 0;
		
		for(; i < su.length; i++) {
			if(su[i]) {
				minX = (uv[j] < minX ? uv[j] : minX);
				minY = (uv[j+1] < minY ? uv[j+1] : minY);
				maxX = (uv[j] > maxX ? uv[j] : maxX);
				maxY = (uv[j+1] > maxY ? uv[j+1] : maxY);
			}
			j += 2;
		}
		return [(minX+maxX)/2, (minY+maxY)/2];
	},
	
	// Rotate UV selection
	rotate: function(rad) {
		if(this.UVs) {
			var uv = this.lastUVs, su = this.selectedUVs, c = COS(rad), s = SIN(rad), cen = this.centroid(), x, y, i = 0, j = 0;
						
			// Apply rotation based on centroid
			for(; i < su.length; i++) {
				if(su[i]) {
					x = (uv[j]-cen[0]), y = (uv[j+1]-cen[1]);
					this.UVs[j] = cen[0]+((x*c)-(y*s));
					this.UVs[j+1] = cen[1]+((y*c)+(x*s));
				}
				j += 2;
			}			
			Update();
		}
	},
	
	// Scale UV selection
	scale: function(w, h) {		
		if(this.UVs) {
			var uv = this.lastUVs, su = this.selectedUVs, cen = this.centroid(), x, y, i = 0, j = 0;
						
			// Apply scale based on centroid
			for(; i < su.length; i++) {
				if(su[i]) {
					x = (uv[j]-cen[0]), y = (uv[j+1]-cen[1]);
					this.UVs[j] = cen[0]+(w*x);
					this.UVs[j+1] = cen[1]+(h*y);
				}
				j += 2;
			}			
			Update();
		}
	},
	
	// Detect specific vars
	downX: 0,
	downY: 0,
	rotating: false,
	scaling: false,
	selecting: false,
	startDist: 0,
	lastUVs: null,
	
	// Save UV positions to buffer so we have a basis for transforms
	saveLast: function() {
		for(var i = 0; i < this.UVs.length; i++) {
			this.lastUVs[i] = this.UVs[i];
		}
	},
	
	// Begin/end rotating (called by Rotate hotkey)
	toggleRotation: function() {
		if(this.scaling || this.selecting) return;
		
		if(this.rotating) {
			this.updateUVs();
		} else {
			this.saveLast();
			
			var cen = this.centroid(), ic = [FLOOR(cen[0]*IMGFX.tw), FLOOR(cen[1]*IMGFX.th)],
				diffX = MouseX-ImageArea.pixToMouseX(ic[0]), diffY = MouseY-ImageArea.pixToMouseY(ic[1]);
			
			this.downX = ic[0];
			this.downY = ic[1];			
			this.startDist = -Math.atan(diffX/diffY)-(diffY>0?PI:0);
		}
		this.rotating = !this.rotating;
	},
	
	// Begin/end scaling
	toggleScale: function() {
		if(this.rotating || this.selecting) return;
		
		if(this.scaling) {
			this.updateUVs();
		} else {
			this.saveLast();
			
			var cen = this.centroid(), ic = [FLOOR(cen[0]*IMGFX.tw), FLOOR(cen[1]*IMGFX.th)],
				diffX = MouseX-ImageArea.pixToMouseX(ic[0]),
				diffY = MouseY-ImageArea.pixToMouseY(ic[1]);
			
			this.downX = ic[0];
			this.downY = ic[1];
			this.startDist = [diffX, diffY];
		}
		this.scaling = !this.scaling;
	},
	
	// Begin box select
	boxSelect: function() {
		if(this.rotating || this.scaling) return;
		
		var ic = ImageArea.getXY(MouseX, MouseY);
		
		// End selection
		if(this.selecting && this.UVs) {
			var uv = this.UVs, w = IMGFX.tw, h = IMGFX.th, minX = MIN(ic[0], this.downX)/w, maxX = MAX(ic[0], this.downX)/w-minX,
				minY = MIN(ic[1], this.downY)/h, maxY = MAX(ic[1], this.downY)/h-minY, i = 0, j = 0;
			
			for(; i < uv.length; i+=2) {
				if(WC(uv[i], uv[i+1], minX, minY, maxX, maxY))
					this.selectedUVs[j] = 1;
				j++;
			}
			Update();
			
		// Begin selection
		} else {
			this.downX = ic[0];
			this.downY = ic[1];
		}
		this.selecting = !this.selecting;
	},
	
	detect: function(x, y, type) {
		
		if(!this.UVs || !WB(x, y, EditArea)) return;
		
		SC("crosshair");
		
		// Apply rotation
		if(this.rotating) {
			if(type == "move") {
				var diffX = x-ImageArea.pixToMouseX(this.downX), diffY = y-ImageArea.pixToMouseY(this.downY), rad = -Math.atan(diffX/diffY)-(diffY>0?PI:0)-this.startDist;
				
				// Snap to 45 degree increments when shift is pressed
				if(SHIFT) rad = ROUND(rad*(4/PI))*(PI/4);
				
				this.rotate(rad);
			} else if(type == "up")
				this.toggleRotation();
			return;
		}
		
		// Apply scale
		if(this.scaling) {
			if(type == "move") {
				var diffX = x-ImageArea.pixToMouseX(this.downX), diffY = y-ImageArea.pixToMouseY(this.downY),
					scaleW = diffX/this.startDist[0], scaleH = diffY/this.startDist[1];
				
				// Preserve proportions when shift is pressed
				if(SHIFT) scaleW = scaleH = HYP(diffX, diffY)/HYP(this.startDist[0], this.startDist[1]);
				
				this.scale(scaleW, scaleH);
			} else if(type == "up")
				this.toggleScale();
			return;
		}
		
		// Manage box selection
		if(this.selecting) {
			if(type == "move") Update();
			else if(type == "up") this.boxSelect();
			return;
		}
		
		var i = 0;
		
		// Move UVs
		if(RCLICK) {
			
			// Save original mouse and UV positions
			if(type == "down") {
				this.downX = x;
				this.downY = y;
				
				// Save UVs to lastUVs buffer
				this.saveLast();
				
			// Apply UV movement
			} else {
			
				var e = EditArea, su = this.selectedUVs, vw = FLOOR(IMGFX.tw*ZOOM), vh = FLOOR(IMGFX.th*ZOOM), j = 0, s = false;
				
				for(i = 0; i < su.length; i++) {
					if(su[i] == 1) {
						this.UVs[j] = this.lastUVs[j]+((x-this.downX)/vw);
						this.UVs[j+1] = this.lastUVs[j+1]+((y-this.downY)/vh);
						s = true;
					}
					j += 2;
				}
				
				// Update model UVs
				if(type == "up") {
					this.updateUVs();
				}
				
				if(s) Update();
			}
		
		// Single UV select
		} else if(LCLICK && type == "up") {
			
			// Only select a UV within 'min' radius
			var min = 10*ZOOM, rad, su = this.selectedUVs, sel = [];
			
			//this.UVdots = [];
			
			if(!SHIFT) this.select(0);
			for(i = 0; i < this.UVxy.length; i += 2) {
				
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
			
			var e = EditArea, ia = ImageArea, w = IMGFX.tw, h = IMGFX.th, su = this.selectedUVs, clr = rgba(128, 128, 128, 92), sel = rgba(128, 128, 160, 128),
				i = 0, j = 0, k, k2, x = new Float32Array(3), y = new Float32Array(3), v = 0, triSelected = false, allOrNone = false, grad;
			
			ctx.save();
			
			ctx.lineWidth = 1;
			ctx.strokeStyle = BLK;
			ctx.fillStyle = clr;
			for(; i < this.UVs.length; i += 6) {
				this.UVxy[i] = x[0] = ia.pixToMouseX(this.UVs[i]*w);
				this.UVxy[i+1] = y[0] = ia.pixToMouseY(this.UVs[i+1]*h);
				this.UVxy[i+2] = x[1] = ia.pixToMouseX(this.UVs[i+2]*w);
				this.UVxy[i+3] = y[1] = ia.pixToMouseY(this.UVs[i+3]*h);
				this.UVxy[i+4] = x[2] = ia.pixToMouseX(this.UVs[i+4]*w);
				this.UVxy[i+5] = y[2] = ia.pixToMouseY(this.UVs[i+5]*h);
				
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
			
			// Draw transform line
			if(this.rotating || this.scaling) {
				ctx.strokeStyle = BLK;
				DrawLine(ctx, MouseX, MouseY, ia.pixToMouseX(this.downX), ia.pixToMouseY(this.downY));
				ctx.strokeStyle = WHT;
				DrawLine(ctx, MouseX+1, MouseY+1, ia.pixToMouseX(this.downX)+1, ia.pixToMouseY(this.downY)+1);
				
			// Draw selection box
			} else if(this.selecting) {
				ctx.strokeStyle = BLK;
				ctx.strokeRect(MouseX, MouseY, ia.pixToMouseX(this.downX)-MouseX, ia.pixToMouseY(this.downY)-MouseY);
				ctx.strokeStyle = WHT;
				ctx.strokeRect(MouseX+1, MouseY+1, ia.pixToMouseX(this.downX)-MouseX-2, ia.pixToMouseY(this.downY)-MouseY-2);
			}
			
			ctx.restore();
		}
	}
};

/* ToolBox */
ToolBox = {
	x: 0,
	y: 35,
	w: 75,
	h: 0,
	
	// The box of tools
	tools: [new Tool("Move"), new Tool("Box Select", true), new Tool("Lasso"), new Tool("Color Select"),
	new Tool("UV Edit", true), new Tool("Color Pick", true), new Tool("Healing Brush"), new Tool("Brush", true),
	new Tool("Stamp"), new Tool("Pencil", true), new Tool("Erase", true), new Tool("Fill", true),
	new Tool("Sharpen"), new Tool("Burn"), new Tool("Pen", true), new Tool("Text"),
	new Tool("Grab", true), new Tool("Zoom", true)],
	
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
	
	// Highlight used for mouse hover
	setHighlight: function(h) {
		if(h != null && !h.active) return;
		if(this.highlight != h) {
			this.highlight = h;
			Update();
		}
	},
	
	// Set the active tool
	setTool: function(t, noToggle) {
		
		// Convert tool name to object
		if(typeof(t) == "string") {
			for(var i in this.tools) {
				if(this.tools[i].name == t) {
					t = this.tools[i];
					break;
				}
			}
			if(typeof(t) == "string") t = null;
		}
		
		if(t && (noToggle || this.active != t)) {
			if(t.name == "Brush" || t.name == "Erase") {
				t.data = Brushes.get(1, 50);
			}
			this.active = t;
			Update();
		} else {
			this.clear();
		}
	},
	
	// Get tool data
	getData: function() {
		return this.active.data;
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
		
		ctx.fillStyle = (ToolBox.active == this ? BG2 : (this.active && ToolBox.highlight == this ? BG6 : BG5));
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
	y: 35,
	w: 0,
	h: 0,
	ih: 30,
	start: 0,
	length: 0,
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
		
		var w = this.w, h = this.h, ih = this.ih, l = IMGFX.history.length, fit = FLOOR((h-20)/ih), item = FLOOR((y-this.y-10)/ih)+this.start;
		
		// Scroll up button
		if(this.start > 0 && (WC(x, y, this.x+w-ih, this.y+10, ih, ih) || type == "wheelup")) {
			if(type == "click" || type == "wheelup") {
				this.start = Clamp(this.start-1, 0, l);				
				Update();
			}
			this.setHighlight(-1);
			return;
		}
		
		// Scroll down button
		if(this.start < l-fit && (WC(x, y, this.x+w-ih, this.y+h-10-this.ih, ih, ih) || type == "wheeldown")) {
			if(type == "click" || type == "wheeldown") {
				this.start = Clamp(this.start+1, 0, l-1);
				Update();
			}			
			this.setHighlight(-1);
			return;
		}
		
		if(item > -1 && item < l) {
			if(type == "click")
				IMGFX.LoadHistory(item);
			else if(type == "move")
				this.setHighlight(item);
		} else this.setHighlight(-1);
		
	},	
	
	draw: function(ctx) {
		ctx.save();
		
		this.x = EditArea.x+EditArea.w+5;
		this.w = Clamp(CWIDTH-this.x, 0, 195);
		this.h = (CHEIGHT-this.y)/2;
		
		var x = this.x, y = this.y, w = this.w, h = this.h, ih = this.ih,
			fit = FLOOR((h-20)/ih), l = IMGFX.history.length, i, j = 0;
			
		if(this.length != l) this.start = Clamp(l-fit, 0, l);
		this.length = l;
		
		ctx.fillStyle = BG4;
		RoundRect(ctx, x, y, w, h, 10, true, false, true);	
		
		ctx.font = "18px "+F1;
		
		// Draw history items
		for(i = this.start; i < Clamp(this.start+fit, 0, l); i++) {
			if(this.highlight == i) ctx.fillStyle = BG6;
			else ctx.fillStyle = (j % 2 == 0 ? BG5 : BG4C);
			ctx.fillRect(x, y+10+j*ih, w, ih);
			ctx.fillStyle = (i <= IMGFX.current ? C1 : C3);
			ctx.fillText(IMGFX.history[i].name, x+5, y+10+(ih/2+6)+j*ih, w);
			j++
		}
		
		// Draw scroll arrows
		ctx.fillStyle = BG7;
		if(this.start > 0) {
			var up_x = x+w-20, up_y = y+10+(ih/2);
			DrawTriangle(ctx, up_x-10, up_y+5, up_x+10, up_y+5, up_x, up_y-5, false, true);
		}
		if(this.start < l-fit) {
			var down_x = x+w-20, down_y = y+h-10-(ih/2);			
			DrawTriangle(ctx, down_x-10, down_y-5, down_x+10, down_y-5, down_x, down_y+5, false, true);
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
		
		this.x = EditArea.x+EditArea.w+5;
		this.y = HistoryBox.y+HistoryBox.h+5;
		this.w = Clamp(CWIDTH-this.x, 0, 195);
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
	UVMap.draw(ctx);
	BG.draw(ctx);
	StatusBar.draw(ctx);
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
