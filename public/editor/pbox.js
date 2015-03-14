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

/*
** POP UP DIALOG BOXES
*/

/* Base PBOX */
PBOX_Base = Class.extend({
	init: function(title, w, h, noImage) {
		
		// Prototype name
		this.type = "PBOX_Base";
		
		if(noImage == null) noImage = false;
		
		this.x = this.y = 0;
		this.w = w, this.h = h;
		this.title = title;	// Title displayed on bar
		this.noImage = noImage;	// if window can be opened when no image is loaded
		this.active = false;	// if window is opened/closed
		this.closing = false;	// Used for fading
		
		// Fade in/fade out
		this.fadeTime = -1;
		
		// Title bar dragging
		this.isDragging = false;
		this.dragx = this.dragy = 0;
		
		// Many windows have "Ok" and "Cancel" type buttons, so these are default
		this.b_apply = new Button("Apply");
		this.b_cancel = new Button("Cancel");
		
		// Children objects that are to be drawn are set here
		this.setChildren(this.b_apply, this.b_cancel);
	},
	
	// Default action which is called when the window is opened
	def: function() {
		CL("def(): Override me!");
	},
	
	// Called when the "apply" button is pressed
	apply: function() {
		CL("apply(): Override me!");
	},
	
	// Called when the "cancel" button is pressed
	cancel: function() {
		IMGFX.LoadHistory("last");
	},
	
	// Window opened
	open: function() {
		if(!this.noImage && !ImageArea.open) return;
		
		if(!this.active) {
			this.fadeTime = T();
			this.active = true;
			this.def();
			Update();
		}
	},
	
	// Window closed
	close: function(applied) {
		if(this.active) {
			if(!applied) this.cancel();
			else this.apply();
			this.fadeTime = T();
			this.closing = true;
			Update();
		}
	},
	
	// Hit detection
	detect: function(x, y, type) {
		
		// Apply/Cancel buttons
		if(this.b_apply && this.b_apply.detect(x, y, type))
			this.close(true);
		else if(this.b_cancel && this.b_cancel.detect(x, y, type))
			this.close();
	},
	
	// Children objects are defined here
	setChildren: function() {
		if(!this.children) this.children = [];
		
		for(var i = 0; i < arguments.length; i++) {
			this.children.push(arguments[i]);
		}
	},
	
	// Draw window
	draw: function(ctx) {
		
		// Background
		ctx.fillStyle = BG3;
		ctx.lineWidth = 5;
		ctx.strokeStyle = BG6;
		RoundRect(ctx, this.x, this.y, this.w, this.h, 10, true, true, true);
		
		// Apply/Cancel buttons
		if(this.b_apply) {
			this.b_apply.set(this.x+10, this.y+this.h-this.b_apply.h-10);
			if(this.b_cancel) {
				this.b_cancel.set(this.b_apply.x+this.b_apply.w+10, this.b_apply.y);
			}
		}
		
		// Draw all child objects
		RecurCall(this.children, "draw", ctx);
	}
});

/* New Image window */
PBOX_New = PBOX_Base.extend({
	init: function() {
		this._super("New Image", 200, 150, true);
		this.b_apply.setText("Create");
		
		this.txt = [new TextBox(this, 80, 24, 128, 4, true, 1, 5000), new TextBox(this, 80, 24, 128, 4, true, 1, 5000)];
		this.lbl = [new Label(80, 24, "Width:"), new Label(80, 24, "Height:")];
		
		this.setChildren(this.txt, this.lbl);
	},
	def: function() {
	},
	apply: function() {
		NewImage(this.txt[0].get(), this.txt[1].get());
	},
	detect: function(x, y, type) {
		
		this._super(x, y, type);
		
		// Text boxes
		for(var i = 0; i < this.txt.length; i++) {
			this.txt[i].detect(x, y, type);
		}
		
	},
	draw: function(ctx) {
		ctx.save();
		
		for(var i = 0; i < this.txt.length; i++) {
			this.lbl[i].set(this.x+15, this.y+15+(i*30));
			this.txt[i].set(this.x+100, this.y+15+(i*30));
		}
		
		// Drawing begins here
		this._super(ctx);
	
		ctx.restore();
	}
});

/* Open from link window */
PBOX_OpenLink = PBOX_Base.extend({
	init: function() {
		this._super("Open Link", 500, 80, true);
		this.b_apply.setText("Open");
		
		// Image link text box
		this.imgLink = new TextBox(this, 480, 20, "http://photo.blob.software/favicon.png", 48);
		
		this.setChildren(this.imgLink);
	},
	def: function() {
	},
	apply: function() {
		OpenImageLink(this.imgLink.get());
	},	
	detect: function(x, y, type) {		
		this._super(x, y, type);		
		this.imgLink.detect(x, y, type);
	},
	draw: function(ctx) {
		ctx.save();
		
		this.imgLink.set(this.x+10, this.y+10);
		
		// Drawing begins here
		this._super(ctx);
	
		ctx.restore();
	}
});

/* Open SVG image window */
PBOX_OpenSVG = PBOX_Base.extend({
	init: function() {
		this._super("Open SVG Image", 240, 150, true);
		
		this.b_apply.setText("Open");
		this.b_cancel.setText("Default");
		
		this.svg = this.svgName = null;
		
		this.per = new CheckBox("Percentage");
		this.txt = [new TextBox(this, 80, 24, 128, 4, true, 1, 5000), new TextBox(this, 80, 24, 128, 4, true, 1, 5000)];
		this.lbl = [new Label(80, 24, "Width:"), new Label(80, 24, "Height:")];
		
		// Link button
		this.link = new ImageButton("link", 30, 30);
		this.linked = true;
		
		// Image properties
		this.scale = [1.0, 1.0];
		this.size = [1, 1];
		
		// Pixels or percentage
		this.sizeType = 0;
		
		// Text change event
		this.txt[0].onchange = this.txt[1].onchange = function(o, n) {
			
			// Get other text
			var other = (this == this.parent.txt[0] ? 1 : 0);
			
			if(this.parent.linked) {
				if(this.parent.sizeType == 0) this.parent.txt[other].value = ROUND(this.parent.scale[other]*n);
				else this.parent.txt[other].value = n;
			}
		};
		
		this.setChildren(this.per, this.txt, this.lbl, this.link);
	},
	open: function(img, name) {
		if(!img || typeof(img) == "string") return;
		this.svg = img;
		this.svgName = (name ? name : "image.svg");
		this._super();
	},
	def: function() {
		if(!this.svg) return;
		
		// Set defaults to SVG properties
		var w = this.svg.width, h = this.svg.height;
		this.txt[0].value = w;
		this.txt[1].value = h;
		this.scale = [w/h, h/w];
		this.size = [w, h];
		this.sizeType = 0;
		this.per.active = false;
	},
	apply: function() {
		// Rasterize SVG with new dimensions
		var w = this.txt[0].get(), h = this.txt[1].get(), can = document.createElement("canvas");
		if(this.per.active) {
			w = CEIL((w/100)*this.size[0]);
			h = CEIL((h/100)*this.size[1]);
		}
		can.width = w;
		can.height = h;
		GC(can).drawImage(this.svg, 0, 0, w, h);
		OpenImage(can.toDataURL(), this.svgName, true);
	},
	cancel: function() {
		// Open with defaults
		OpenImage(this.svg.src, this.svgName, true);
	},
	detect: function(x, y, type) {
		
		this._super(x, y, type);
		
		var i = 0;
		
		// Pixel/percentage toggle
		if(this.per.detect(x, y, type) && type == "click") {
			
			// Change pixels to percentage and vice versa
			if(this.per.active) {
				this.sizeType = 1;
				this.txt[0].value = ROUND((this.txt[0].get()/this.size[0])*100);
				this.txt[1].value = ROUND((this.txt[1].get()/this.size[1])*100);
			} else {
				this.txt[0].value = ROUND((this.txt[0].get()/100)*this.size[0]);
				this.txt[1].value = ROUND((this.txt[1].get()/100)*this.size[1]);
				this.sizeType = 0;
			}
		}
		
		// Text boxes
		for(i = 0; i < this.txt.length; i++) {
			this.txt[i].detect(x, y, type);
		}
		
		// Link button
		if(type == "click" && this.link.detect(x, y, type)) {
			if(this.linked) this.link.setIcon("unlink");
			else this.link.setIcon("link");
			this.linked = !this.linked;
			Update();
		}
		
	},
	draw: function(ctx) {
		ctx.save();
		
		var i = 0;
		
		for(; i < this.txt.length; i++) {
			this.lbl[i].set(this.x+15, this.y+15+(i*30));
			this.txt[i].set(this.x+100, this.y+15+(i*30));
		}
		this.per.set(this.x+15, this.y+80);		
		this.link.set(this.x+210, this.y+26);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.font = "18px "+F1;
		ctx.fillStyle = C1;
		
		for(i = 0; i < 2; i++) {
			this.sizeType == 0 ? ctx.fillText("px", this.x+185, this.y+32+(i*30)) : ctx.fillText("%", this.x+185, this.y+32+(i*30))
		}
	
		ctx.restore();
	}
});

/* Save image window */
PBOX_Save = PBOX_Base.extend({
	init: function() {
		this._super("Save Image", 300, 150);
		this.b_apply.setText("Save");
		this.mime = 0;
		
		// Image name text box
		this.imgTxt = new TextBox(this, 280, 20, "untitled.png", 32);
		
		// File type boxes
		this.rb = [new RadioButton("JPEG"), new RadioButton("PNG")];
		this.rb_val = 0;
		
		this.setChildren(this.imgTxt, this.rb);
	},
	def: function() {
		this.imgTxt.value = IMG_NAME;
		this.rb[this.rb_val].toggle(true);
	},
	apply: function() {
		var name = this.imgTxt.get(), ext = name.lastIndexOf('.');
		
		// Fix up file extension
		if(ext > -1) name = name.substring(0, ext);
		name = name+'.'+this.getExtension();
		
		ExportImage(name, this.getMime());
	},
	
	// Get mime type string
	getMime: function() {
		switch(this.mime) {
			case 0: return "image/jpeg";
		}
		return "image/png";
	},
	
	// Get extension suffix
	getExtension: function() {
		switch(this.mime) {
			case 0: return "jpg";
		}
		return "png";
	},
	
	detect: function(x, y, type) {		
		this._super(x, y, type);		
		this.imgTxt.detect(x, y, type);
		
		// Radio buttons
		if(type == "click") {
			for(var i = 0; i < this.rb.length; i++) {
				if(this.rb[i].detect(x, y, type)) {
					this.rb_val = this.mime = i;
				}
				this.rb[i].toggle(false);
			}
			
			this.rb[this.rb_val].toggle(true);		
		}
	},
	draw: function(ctx) {
		ctx.save();
		
		this.imgTxt.set(this.x+10, this.y+10);
		
		for(var i = 0; i < this.rb.length; i++) {
			this.rb[i].set(this.x+10, (this.y+this.imgTxt.h+20)+(i*25));
		}
		
		// Drawing begins here
		this._super(ctx);
	
		ctx.restore();
	}
});

/* Resize window */
PBOX_Resize = PBOX_Base.extend({
	init: function() {
		this._super("Resize", 240, 180);
		
		this.cb = [new CheckBox("Preview"), new CheckBox("Percentage")];
		this.txt = [new TextBox(this, 80, 24, 128, 4, true, 1, 5000), new TextBox(this, 80, 24, 128, 4, true, 1, 5000)];
		this.lbl = [new Label(80, 24, "Width:"), new Label(80, 24, "Height:")];
		
		// Link button
		this.link = new ImageButton("link", 30, 30);
		this.linked = true;
		
		// Image properties
		this.scale = [1.0, 1.0];
		this.size = [1, 1];
		
		// Pixels or percentage
		this.sizeType = 0;
		
		// Text change event
		this.txt[0].onchange = this.txt[1].onchange = function(o, n) {
			
			// Get other text
			var other = (this == this.parent.txt[0] ? 1 : 0);
			
			if(this.parent.linked) {
				if(this.parent.sizeType == 0) this.parent.txt[other].value = ROUND(this.parent.scale[other]*n);
				else this.parent.txt[other].value = n;
			}
			this.parent.resize();
		};
		
		this.setChildren(this.cb, this.txt, this.lbl, this.link);
	},
	def: function() {
		this.txt[0].value = IMGFX.tw;
		this.txt[1].value = IMGFX.th;
		this.scale = [IMGFX.tw/IMGFX.th, IMGFX.th/IMGFX.tw];
		this.size = [IMGFX.tw, IMGFX.th];
		this.sizeType = 0;
		this.cb[1].active = false;
	},
	resize: function(apply) {
		var w = this.txt[0].get(), h = this.txt[1].get();
		if(this.sizeType == 1) w = w+"%", h = h+"%";
		if(this.cb[0].active || apply) IMGFX.Resize(w, h, 1);
	},
	apply: function() {
		this.resize(true);
		IMGFX.AddHistory("Resize");
	},
	detect: function(x, y, type) {
		
		this._super(x, y, type);
		
		var i = 0;
		
		// Preview and pixel/percentage
		for(; i < this.cb.length; i++) {
			if(this.cb[i].detect(x, y, type) && type == "click") {
				
				// Change pixels to percentage and vice versa
				if(i == 1) {
					if(this.cb[1].active) {
						this.sizeType = 1;
						this.txt[0].value = ROUND((this.txt[0].get()/this.size[0])*100);
						this.txt[1].value = ROUND((this.txt[1].get()/this.size[1])*100);
					} else {
						this.txt[0].value = ROUND((this.txt[0].get()/100)*this.size[0]);
						this.txt[1].value = ROUND((this.txt[1].get()/100)*this.size[1]);
						this.sizeType = 0;
					}
				}
				this.resize();
			}
		}
		
		// Text boxes
		for(i = 0; i < this.txt.length; i++) {
			this.txt[i].detect(x, y, type);
		}
		
		// Link button
		if(type == "click" && this.link.detect(x, y, type)) {
			if(this.linked) this.link.setIcon("unlink");
			else this.link.setIcon("link");
			this.linked = !this.linked;
			Update();
		}
		
	},
	draw: function(ctx) {
		ctx.save();
		
		var i = 0;
		
		for(; i < this.txt.length; i++) {
			this.lbl[i].set(this.x+15, this.y+15+(i*30));
			this.txt[i].set(this.x+100, this.y+15+(i*30));
			this.cb[i].set(this.x+15, this.y+80+(i*25));
		}
		
		this.link.set(this.x+210, this.y+26);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.font = "18px "+F1;
		ctx.fillStyle = C1;
		
		for(i = 0; i < 2; i++) {
			this.sizeType == 0 ? ctx.fillText("px", this.x+185, this.y+32+(i*30)) : ctx.fillText("%", this.x+185, this.y+32+(i*30))
		}
	
		ctx.restore();
	}
});

/* Color chooser */
PBOX_ColorBox = PBOX_Base.extend({
	init: function() {
		this._super("Select Color", 330, 240, true);
		this.b_apply.setText("OK");
		
		// HSL container used for recalc()
		this.hsla = [0, 0, 0, 255];
		this.rgba = [];
		
		// ColorBar objects - Gradients are calculated in recalc() except for the 'value' bar
		this.cb = [new ColorBar(200, 30, []), new ColorBar(200, 30, []), new ColorBar(200, 30, [[0, 0, 0, 255], [255, 255, 255, 255]]), new ColorBar(200, 30, [])];
		
		// RGB and HEX input boxes
		this.txt = [
			new TextBox(this, 50, 24, 255, 3, true, 0, 255),
			new TextBox(this, 50, 24, 255, 3, true, 0, 255),
			new TextBox(this, 50, 24, 255, 3, true, 0, 255),
			new TextBox(this, 80, 24, "FFFFFF", 6, false)
		];
		
		this.cpick = new ImageButton("colorpick", 25, 25);
		this.picking = false;
		
		this.setChildren(this.cb, this.txt, this.cpick);
		
		this.recalc();
	},
	open: function(obj, cb, defval) {
		if(defval) this.setRGBA(defval);
		this._super();
		this.callobj = obj;
		this.callback = cb;
		
		// Don't draw the call object!
		this.doNotDraw = [this.callobj];
	},
	recalc: function(noBarUpdate, noTextUpdate) {
		
		var i = 0, rgb = HSL2RGB(this.hsla[0], this.hsla[1], this.hsla[2]);
		
		this.cb[0].grad = [];
		for(; i <= 10; i++) {
			this.cb[0].grad[i] = HSL2RGB(i*0.1, 1, 0.5).concat(255);	// Calculate hue gradient
			if(!noBarUpdate && i < 3) this.cb[i].value = this.hsla[i];	// While I'm here, update color box values
		}
		
		if(!noBarUpdate) this.cb[3].value = this.hsla[3]/255;
		
		// Saturation gradient
		this.cb[1].grad = [[128, 128, 128, 255], HSL2RGB(this.hsla[0], 1, 0.5).concat(255)];
		
		// Alpha gradient
		this.cb[3].grad = [rgb.concat(0), rgb.concat(255)];
		
		this.rgba = rgb.concat(this.hsla[3]);
		
		if(!noTextUpdate) {
			for(i = 0; i < 3; i++) {
				this.txt[i].value = this.rgba[i];
			}
		}
		
	},
	setRGBA: function(rgb) {
		this.hsla = RGB2HSL(rgb[0], rgb[1], rgb[2]).concat(rgb[3]);
		this.recalc();
	},
	def: function() {
		this.recalc();
		
		// Hook change events so we can control color with text boxes
		var parent = this;
		for(var i = 0; i < 4; i++) {
			this.txt[i].onchange = function(o, n) {
				parent.hsla = RGB2HSL(parent.txt[0].get(), parent.txt[1].get(), parent.txt[2].get()).concat(parent.hsla[3]);
				parent.recalc(false, true);
			};
		}
	},
	apply: function() {
		// Callback when it's done
		if(this.callback) this.callback.call(this.callobj, HSL2RGB(this.hsla[0], this.hsla[1], this.hsla[2]).concat(this.hsla[3]));
	},
	cancel: function() {
		// Do nothing
	},
	detect: function(x, y, type) {
		
		var changed = false, c = 0, coords = [], i = 0;
		
		// Color and text boxes
		for(; i < 4; i++) {
			if(this.cb[i].detect(x, y, type)) {
				if(i == 0) {
					if(this.cb[1].value == 0.0) this.cb[1].value = 1.0;
					if(this.cb[2].value == 0.0 || this.cb[2].value == 1.0) this.cb[2].value = 0.5;
				}
				changed = true;
			}
			this.hsla[i] = this.cb[i].value;
			if(i == 3) this.hsla[i] *= 255;
			this.txt[i].detect(x, y, type);
		}
		
		// Color pick
		if(type == "click") {
			
			if(this.cpick.detect(x, y, type)) {
				this.picking = true;
			} else if(this.picking) {
				if(ImageArea.open && WB(x, y, ImageArea)) {
					coords = ImageArea.getXY(x, y);
					c = IMGFX.SampleColor(coords[0], coords[1], 1);
				} else {
					c = [102, 102, 102, 255];
				}
				this.setRGBA(c);
				Update();
				this.picking = false;
			}
		}
		
		if(this.picking) SC("crosshair");
		
		// Only recalc and update text if something changed
		if(changed) this.recalc(true);
		
		this._super(x, y, type);
	},
	draw: function(ctx) {
		ctx.save();
		
		var i = 0, sample_x = this.x+240, sample_y = this.y+20;
		
		// Position color bars
		for(; i < 4; i++) {
			this.cb[i].set(this.x+20, this.y+20+(i*(this.cb[i].h+10)));
			this.txt[i].set(sample_x, sample_y+80+(i*30));
		}
		
		// Color picker
		this.cpick.set(sample_x+55, sample_y+80);
				
		// Drawing begins here
		this._super(ctx);
		
		ctx.fillStyle = ctx.createPattern(ALPHA_BG, "repeat");
		RoundRect(ctx, sample_x, sample_y, 70, 70, 10, true, false);
		
		ctx.fillStyle = rgba(this.rgba);
		ctx.strokeStyle = BLK;
		ctx.lineWidth = 2;
		RoundRect(ctx, sample_x, sample_y, 70, 70, 10, true, true);
	
		ctx.restore();
	}
});

/* Font Dialog box */
PBOX_FontBox = PBOX_Base.extend({
	init: function() {
		this._super("Font Options", 200, 150);
		this.name = new TextBox(80, 24, "Arial", false);
		this.size = new TextBox(80, 24, 24, true);
		this.setChildren(this.name, this.size);
	},
	def: function() {
	},
	detect: function(x, y, type) {
		
		this._super(x, y, type);
		
		if(type != "click") return;
		
		// Text boxes
		for(var i = 0; i < this.txt.length; i++) {
			this.txt[i].detect(x, y, type);
		}
	},
	draw: function(ctx) {
		ctx.save();
		
		this.txt[i].set(this.x+100, this.y+15+(i*30));
		
		// Drawing begins here
		this._super(ctx);
	
		ctx.restore();
	}
});

/* Grayscale Image */
PBOX_Grayscale = PBOX_Base.extend({
	init: function() {
		this._super("Grayscale Image", 220, 310);
		this.rb = [new RadioButton("Average"), new RadioButton("Darken"), new RadioButton("Lighten"), new RadioButton("Desaturate"),
		new RadioButton("Red Channel"), new RadioButton("Green Channel"), new RadioButton("Blue Channel"),
		new RadioButton("Luma (SDTV)"), new RadioButton("Luma (HDTV)"), new RadioButton("Luma (UHDTV)")];
		
		// Radio button value
		this.rb_val = 0;
		
		this.setChildren(this.rb);
	},
	def: function() {
		for(var e in this.rb) this.rb[e].toggle(false);
		this.rb[0].toggle(true);
		IMGFX.Grayscale(0);
		this.rb_val = 0;
	},
	apply: function() {
		IMGFX.AddHistory("Grayscale");
	},
	detect: function(x, y, type) {
		
		// Radio buttons
		if(type == "click") {
			for(var i = 0; i < this.rb.length; i++) {
				if(this.rb[i].detect(x, y, type)) {
					this.rb_val = i;
					IMGFX.Grayscale(i);
				}
				this.rb[i].toggle(false);
			}
			
			this.rb[this.rb_val].toggle(true);
		}
		
		this._super(x, y, type);
	},
	draw: function(ctx) {
		ctx.save();
		
		for(var e in this.rb) {
			this.rb[e].set(this.x+10, this.y+(parseInt(e)*25)+15);
		}
		
		// Drawing begins here
		this._super(ctx);
	
		ctx.restore();
	}
});

/* Mirror image */
PBOX_Mirror = PBOX_Base.extend({
	init: function() {
		this._super("Mirror Image", 220, 110);
		
		this.hr = new CheckBox("Horizontal", 0);
		this.vr = new CheckBox("Vertical", 1);
		
		this.setChildren(this.hr, this.vr);
	},
	def: function() {
		this.hr.toggle(false);
		this.vr.toggle(false);
	},
	apply: function() {
		IMGFX.AddHistory("Mirror");
	},
	detect: function(x, y, type) {
		
		if(type == "click") {
			this.hr.detect(x, y, type);
			this.vr.detect(x, y, type);
			IMGFX.Mirror(this.vr.active, this.hr.active);
		}
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
	
		// Horizontal mirror checkbox
		this.hr.set(this.x+10, this.y+15);
		
		// Vertical mirror checkbox
		this.vr.set(this.x+10, this.y+40);
		
		// Drawing begins here
		this._super(ctx);
	
		ctx.restore();
	}
});

/* Invert colors */
PBOX_InvertColors = PBOX_Base.extend({
	init: function() {
		this._super("Invert Colors", 220, 150);
		
		this.cb = [new CheckBox("Red Channel"), new CheckBox("Green Channel"), new CheckBox("Blue Channel")];
		this.setChildren(this.cb);
	},
	def: function() {
		this.cb[0].toggle(true);
		this.cb[1].toggle(true);
		this.cb[2].toggle(true);
		IMGFX.InvertColors();
	},
	apply: function() {
		IMGFX.AddHistory("Invert Colors");
	},
	detect: function(x, y, type) {
		
		if(type == "click") {
			
			var changed = false;
			
			// Check boxes
			for(var e in this.cb) {
				changed = (changed || this.cb[e].detect(x, y, type));
			}
			
			if(changed) IMGFX.InvertColors(this.cb[0].active, this.cb[1].active, this.cb[2].active);
		}
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
	
		for(var e in this.cb) {
			this.cb[e].set(this.x+10, this.y+(parseInt(e)*25)+15);
		}
		
		// Drawing begins here
		this._super(ctx);
			
		ctx.restore();
	}
});

/* Brightness */
PBOX_Brightness = PBOX_Base.extend({
	init: function() {
		this._super("Brightness", 480, 170);
		this.mode = 0;
		
		this.s = new Slider(400);
		this.rb = [new RadioButton("Normal"), new RadioButton("Additive"), new RadioButton("Glow")];
		
		this.setChildren(this.s, this.rb);
	},
	def: function() {
		this.s.value = 128/400;
		this.rb[this.mode].toggle(true);
	},
	apply: function() {
		IMGFX.AddHistory("Brightness");
	},
	detect: function(x, y, type) {
		
		// Radio buttons
		if(type == "click") {
			for(var i = 0; i < this.rb.length; i++) {
				this.rb[i].toggle(false);
				if(this.rb[i].detect(x, y, type)) {
					this.mode = i;
					IMGFX.Brightness(ROUND(this.s.value*400), i);
				}
			}
			this.rb[this.mode].toggle(true);
		}
		
		// Slider
		if(this.s.detect(x, y, type)) {
			IMGFX.Brightness(ROUND(this.s.value*400), this.mode);
		}
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
		
		for(var i = 0; i < this.rb.length; i++) {
			this.rb[i].set(this.x+20, this.y+10+(i*25));
		}
		
		this.s.set(this.x+20, this.y+this.h-80);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.font = "22px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText(ROUND(this.s.value*400), this.s.x+this.s.w+10, this.s.y+20, this.s.w);
	
		ctx.restore();
	}
});

/* Add noise */
PBOX_AddNoise = PBOX_Base.extend({
	init: function() {
		this._super("Add Noise", 380, 100);
		this.s = new Slider(300);
		this.setChildren(this.s);
	},
	def: function() {
		this.s.value = 0.2;
		IMGFX.AddNoise(40);
	},
	apply: function() {
		IMGFX.AddHistory("Add Noise");
	},
	detect: function(x, y, type) {
		
		// Slider
		if(this.s.detect(x, y, type)) {
			IMGFX.AddNoise(ROUND(this.s.value*200));
		}
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
		
		this.s.set(this.x+20, this.y+10);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.font = "22px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText(ROUND(this.s.value*200), this.s.x+this.s.w+10, this.s.y+20, this.s.w);
	
		ctx.restore();
	}
});

/* Posterize */
PBOX_Posterize = PBOX_Base.extend({
	init: function() {
		this._super("Posterize", 380, 100);
		this.s = new Slider(254);
		this.setChildren(this.s);
	},
	def: function() {
		this.s.value = 0.0;
		IMGFX.Posterize(2);
	},
	apply: function() {
		IMGFX.AddHistory("Posterize");
	},
	detect: function(x, y, type) {
		
		// Slider
		if(this.s.detect(x, y, type)) {
			IMGFX.Posterize(ROUND(this.s.value*254)+2);
		}
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
		
		this.s.set(this.x+20, this.y+10);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.font = "22px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText(ROUND(this.s.value*254)+2, this.s.x+this.s.w+10, this.s.y+20, this.s.w);
	
		ctx.restore();
	}
});

/* Box blur */
PBOX_BoxBlur = PBOX_Base.extend({
	init: function() {
		this._super("Box Blur", 380, 100);
		
		this.s = new Slider(300);
		this.setChildren(this.s);
	},
	def: function() {
		this.s.value = 0.0;
	},
	apply: function() {
		IMGFX.AddHistory("Box Blur");
	},
	detect: function(x, y, type) {
		
		// Slider
		if(this.s.detect(x, y, type)) {
			IMGFX.BoxBlur(ROUND(this.s.value*20));
		}
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
		
		this.s.set(this.x+20, this.y+10);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.font = "22px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText(ROUND(this.s.value*20), this.s.x+this.s.w+10, this.s.y+20, this.s.w);
	
		ctx.restore();
	}
});

/* Shift image */
PBOX_Shift = PBOX_Base.extend({
	init: function() {
		this._super("Shift Image", 400, 120);
		
		this.sw = new Slider(300);
		this.sh = new Slider(300);
		this.setChildren(this.sw, this.sh);
	},
	def: function() {
		this.sw.value = 0.5;
		this.sh.value = 0.5;
		IMGFX.Shift();
	},
	apply: function() {
		IMGFX.AddHistory("Shift");
	},
	detect: function(x, y, type) {
	
		// Slider
		if(this.sw.detect(x, y, type) || this.sh.detect(x, y, type)) {
			var img = IMGFX.GetTarget();
			IMGFX.Shift(ROUND(this.sw.value*img.w), ROUND(this.sh.value*img.h));
		}
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
	
		this.sw.set(this.x+20, this.y+10);
		this.sh.set(this.x+20, this.y+40);
		
		// Drawing begins here
		this._super(ctx);
		
		var img = IMGFX.GetTarget();
		
		ctx.font = "22px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText(ROUND(this.sw.value*img.w), this.sw.x+this.sw.w+10, this.sw.y+20, this.sw.w);
		ctx.fillText(ROUND(this.sh.value*img.h), this.sh.x+this.sh.w+10, this.sh.y+20, this.sh.w);
	
		ctx.restore();
	}
});

/* Change hue, saturation, and luminance/value/brightness */
PBOX_ChangeHSL = PBOX_Base.extend({
	init: function() {
		this._super("Change HSL", 400, 150);
		this.sh = new Slider(300);
		this.ss = new Slider(300);
		this.sl = new Slider(300);
		
		this.setChildren(this.sh, this.ss, this.sl);
	},
	def: function() {
		this.sh.value = 0.5;
		this.ss.value = 0.5;
		this.sl.value = 0.5;
	},
	apply: function() {
		IMGFX.AddHistory("Change HSL");
	},
	detect: function(x, y, type) {
		// Slider
		if(this.sh.detect(x, y, type) || this.ss.detect(x, y, type) || this.sl.detect(x, y, type)) {
			IMGFX.ChangeHSL(this.sh.value-0.5, (this.ss.value-0.5)*2, (this.sl.value-0.5)*2);
		}
		
		this._super(x, y, type);
	},
	draw: function(ctx) {
		ctx.save();
		
		this.sh.set(this.x+20, this.y+10);
		this.ss.set(this.x+20, this.y+40);
		this.sl.set(this.x+20, this.y+70);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.font = "22px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText(ROUND(this.sh.value*100)-50, this.sh.x+this.sh.w+10, this.sh.y+20, this.sh.w);
		ctx.fillText(ROUND(this.ss.value*200)-100, this.ss.x+this.ss.w+10, this.ss.y+20, this.ss.w);
		ctx.fillText(ROUND(this.sl.value*200)-100, this.sl.x+this.sl.w+10, this.sl.y+20, this.sl.w);
	
		ctx.restore();
	}
});

/* Replace color with threshold slider */
PBOX_ReplaceColor = PBOX_Base.extend({
	init: function() {
		this._super("Replace Color", 375, 180);
		this.st = new Slider(300);
		this.col_a = new ColorBox(40, 40, true);
		this.col_b = new ColorBox(40, 40, true);
		this.setChildren(this.st, this.col_a, this.col_b);
	},
	def: function() {
		this.st.value = 0.0;
		this.col_a.setColor(MainColors.bg);
		this.col_b.setColor(MainColors.fg);
		this.col_a.onChange = this.col_b.onChange = function() { PBOX.ReplaceColor.refresh(); };
	},
	apply: function() {
		IMGFX.AddHistory("Replace Color");
	},
	refresh: function() {
		IMGFX.ReplaceColor(this.col_a.getColor(), this.col_b.getColor(), ROUND(this.st.value*300));
	},
	detect: function(x, y, type) {
		
		this.col_a.detect(x, y, type);
		this.col_b.detect(x, y, type);
		
		// Slider
		if(this.st.detect(x, y, type)) {
			this.refresh();
		}
		
		this._super(x, y, type);
	},
	draw: function(ctx) {
		ctx.save();
		
		// Measure text
		ctx.font = "18px "+F1;
		
		var w1 = ctx.measureText("Replace").width, w2 = ctx.measureText("with").width;
		
		this.st.set(this.x+20, this.y+this.h-80);
		this.col_a.set(this.x+w1+30, this.y+20);
		this.col_b.set(this.x+w1+w2+90, this.y+20);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.font = "18px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText("Replace", this.x+20, this.y+46, w1);
		ctx.fillText("with", this.x+w1+this.col_a.w+40, this.y+46, w2);
		ctx.fillText(ROUND(this.st.value*300), this.st.x+this.st.w+10, this.st.y+20, this.w-this.st.w-30);
		
		ctx.font = "14px "+F1;
		ctx.fillText("Amount", this.x+20, this.st.y-10, this.w);
	
		ctx.restore();
	}
});

/* Three.JS 3D Texture Preview */
PBOX_View3D = PBOX_Base.extend({
	init: function() {
		this._super("Three.js 3D Texture Preview", 370, 450);
		
		// Moving the model with the mouse
		this.down = false;	// Mouse down
		this.held = [0, 0];	// Position where clicked
		this.meshrot = [0, 0];	// Mesh rotation before clicking down
		this.jsonTxt = null;
		
		// Remove default buttons
		delete this.b_apply;
		delete this.b_cancel;
		
		// Buttons
		this.b_dump = new Button("Dump UVs");
		this.b_clear = new Button("Clear UVs");
		this.b_import = new Button("Import");
		this.b_export = new Button("Export");
		this.b_export.active = false;
		
		// Error label
		this.error = new Label(180, 18, "");
		
		// Draw children
		this.children = [this.b_dump, this.b_clear, this.b_import, this.b_export, this.error];
		
		// Generic scene
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(75, 1, 1, 10000);
		this.camera.position.z = 330;

		var r = this.renderer = new THREE.WebGLRenderer(canvas), rd = r.domElement;
		r.setSize(0, 0);
		rd.className = "gl";
		document.getElementById("transparency").appendChild(rd);
		D(rd, false);
	},
	def: function() {		
		var r = this.renderer, rd = r.domElement;
			
		// Update mesh and materials
		this.update();
		
		// Set up/expand renderer
		r.setSize(350, 350);
		r.setClearColor(BG2);
		rd.style.left = (this.x+20)+"px";
		rd.style.top = (this.y+20)+"px";
		D(rd, true);
	},
	update: function() {
		if(!this.active) return;
		
		this.error.value = "";
		
		// I can't (as far as I know) send raw image data directly to a texture
		// So I have to convert it to a data url first
		var texture = new THREE.ImageUtils.loadTexture(DataURL(IMGFX.target));
		
		// Create mesh if it doesn't exist, otherwise just update the map
		if(!this.mesh) {
			this.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
			this.mesh = new THREE.Mesh(new THREE.SphereGeometry(200, 16, 12), this.material);
			this.mesh.rotation.y = -1.5;	// Face toward camera
			this.scene.add(this.mesh);
		} else {
			this.material.map = texture;
		}
		this.material.needsUpdate = true;
		
		// The texture doesn't get updated automatically unless I wait a bit
		var t = this;
		setTimeout(function() {
			t.renderer.render(t.scene, t.camera);
		}, 100);
	},
	
	// Set the geometry based on JSON
	setModel: function(jsontxt) {
		if(!jsontxt || typeof(jsontxt) != "string") return;
		var js = new THREE.JSONLoader(), result;
		
		// Attempt to parse JSON text
		try {
			result = js.parse(JSON.parse(jsontxt));
		} catch(e) {
			result = null;
		}
		
		// Valid model
		if(result) {
			UVMap.clearUVs();
			this.mesh.geometry = result.geometry;
			this.renderer.render(this.scene, this.camera);
			this.jsonTxt = jsontxt;
			//this.b_export.active = true;
			this.error.value = "";
		
		// Let the user know there was a problem
		} else {
			this.error.value = "Failed to import model";
		}
		Update();
	},	
	close: function(applied) {
		D(this.renderer.domElement, false);
		this.active = false;
		Update();
	},
	detect: function(x, y, type) {
		
		var t = this, r = this.renderer, m = this.mesh, sensitivity = 0.005, hover = WC(x, y, this.x+10, this.y+56, 350, 350);
		
		// Dump UVs button
		if(this.b_dump.detect(x, y, type)) {
			UVMap.dumpUVs(this.mesh.geometry);
			
		// Clear UVs button
		} else if(this.b_clear.detect(x, y, type)) {
			UVMap.clearUVs();
			Update();
		
		// Import JSON model to viewer
		} else if(this.b_import.detect(x, y, type)) {
			OpenDialog(1);
		
		// Export JSON model
		} else if(this.b_export.detect(x, y, type)) {
			if(!this.jsonTxt) return;
			
			// TODO: Fix UV export
			
			/*var buf = new THREE.BufferGeometry(), xport = E("export"), data = JSON.parse(this.jsonTxt), file;
			
			// Convert geometry to buffer
			buf.fromGeometry(this.mesh.geometry);
			
			// Get UV float array and pass it to an empty array
			var attrUV = buf.getAttribute('uv').array, uvs = [], i = 0;			
			for(; i < attrUV.length; i++) {
				uvs.push(attrUV[i]);
			}
			
			data.uvs = uvs;
			
			file = new Blob([JSON.stringify(data)], {type: "application/javascript"});
			
			// Revoke export URL if there is one
			if(xport.href.indexOf("blob:") == 0) URL.revokeObjectURL(xport.href);
			
			// Download on click
			xport.href = URL.createObjectURL(file);
			xport.download = "model.js";
			xport.click();*/
		}
		
		// Grab model
		if(type == "down" && hover) {
			this.meshrot = [m.rotation.y, m.rotation.x];
			this.held = [x, y];
			this.down = true;
		
		// Release model
		} else if(type == "up") {
			this.down = false;
		
		// Drag to rotate
		} else if(type == "move" && this.down) {
			m.rotation.y = this.meshrot[0]-(this.held[0]-x)*sensitivity;
			m.rotation.x = this.meshrot[1]-(this.held[1]-y)*sensitivity;
			r.render(this.scene, this.camera);
			
		// Mouse wheel zoom
		} else if(type == "wheelup" && hover) {
			this.camera.position.z -= 10;
			r.render(this.scene, this.camera);
		} else if(type == "wheeldown" && hover) {
			this.camera.position.z += 10;
			r.render(this.scene, this.camera);
		}
	},
	draw: function(ctx) {
		ctx.save();
		
		var r = this.renderer, rd = r.domElement, rx = this.x+16, ry = this.y+56, rw = 350, rh = 350;
		
		// Clamp render size
		if(rx-6 < 0) {
			rw += rx-6;
			rx = 6;
		} else if(rx+rw-6 > CWIDTH) {
			rw += CWIDTH-(rx+rw-6);
		}
		
		if(ry-6 < 0) {
			rh += ry-6;
			ry = 6;
		} else if(ry+rh-6 > CHEIGHT) {
			rh += CHEIGHT-(ry+rh-6);
		}
		
		r.setSize(rw, rh);
		r.setViewport(0, 0, rw, rh);
		
		rd.style.left = rx+"px";
		rd.style.top = ry+"px";
		
		// Buttons
		this.b_dump.set(this.x+16, this.y+16);
		this.b_clear.set(this.b_dump.x+this.b_dump.w+10, this.y+16);
		this.b_import.set(this.x+10, this.y+this.h-this.b_import.h-10);
		this.b_export.set(this.b_import.x+this.b_import.w+10, this.b_import.y);
		
		// Error label
		this.error.set(this.x+this.w-this.error.w-6, this.y+this.h-24);
		
		// Drawing begins here
		this._super(ctx);
		
		r.render(this.scene, this.camera);
		
		ctx.restore();
	}
});

/* Theme chooser */
PBOX_ChooseTheme = PBOX_Base.extend({
	init: function() {
		this._super("Choose Theme", 250, 280, true);
		
		this.rb = [new RadioButton("Blue"), new RadioButton("Green"), new RadioButton("Red"), new RadioButton("Yellow"), new RadioButton("Cyan"),
		new RadioButton("Pink"), new RadioButton("Orange"), new RadioButton("Lime"), new RadioButton("Gray"), new RadioButton("Deep Blue"),
		new RadioButton("Deep Green"), new RadioButton("Deep Red"), new RadioButton("Deep Yellow"), new RadioButton("Deep Cyan"),
		new RadioButton("Deep Pink"), new RadioButton("Dela"), new RadioButton("High Contrast"), new RadioButton("Black")];
		
		// Radio button value
		this.rb_val = 0;
		
		this.setChildren(this.rb);
	},
	last: 0,
	def: function() {
		this.last = CurrentTheme;
		this.rb_val = CurrentTheme;
		this.rb[this.rb_val].toggle(true);
	},
	apply: function() {
		this.last = CurrentTheme;
	},
	cancel: function() {
		SetTheme(this.last);
	},
	detect: function(x, y, type) {
		
		if(type == "click") {
			// Radio buttons
			for(var i = 0; i < this.rb.length; i++) {
				if(this.rb[i].detect(x, y, type)) {
					this.rb_val = i;
					SetTheme(i);
				}
				this.rb[i].toggle(false);
			}
			
			this.rb[this.rb_val].toggle(true);
		}
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
		
		var off = i = 0;
		
		for(; i < this.rb.length; i++) {
			if(i > 0 && i % 9 == 0) off += 100;
			this.rb[i].set(this.x+off+10, this.y+((i%9)*25)+15);
		}
		
		// Drawing begins here
		this._super(ctx);
	
		ctx.restore();
	}
});

/* Image browser */
PBOX_ImageBrowser = PBOX_Base.extend({
	init: function() {
		this._super("Images", 870, 530, true);
		this.b_cancel = this.b_apply = null;
		this.b_next = new Button("Next");
		this.b_prev = new Button("Previous");
		this.rb = [new RadioButton("Difference", 1), new RadioButton("Size", 2), new RadioButton("", 3)];
		
		this.children = [this.b_next, this.b_prev];
		
		this.images = [];	// Images array
		this.hover = -1;	// Hovered image
		this.page = 0;		// Current page #
		this.pages = 0;		// Total pages
	},
	open: function() {
		if(this.images.length == 0) return;
		this.super();
	},
	def: function() {
		this.page = 0;
		this.pages = CEIL(this.images.length/8);
		this.hover = -1;
	},
	apply: function() {
		
	},
	pos: function(i) {
		i -= this.page*8;
		return [20+((i%4)*210)+this.x, 60+(FLOOR(i/4)*210)+this.y];
	},
	detect: function(x, y, type) {
		
		// Image results		
		var p8 = this.page*8, i = p8, img = x2 = y2 = 0;
		
		for(; i < MIN(this.images.length, p8+8); i++) {
						
			img = this.images[i].d;
			if(img.loaded) {
				var x2 = this.pos(i), y2 = x2[1], x2 = x2[0];
				if(x >= x2 && x < x2+200 && y >= y2 && y < y2+200) {
					SC("pointer");
					if(type == "move") {
						if(this.hover != i) {
							this.hover = i;
							Update();
						}
					} else if(type == "click") {
						//CL("OPEN "+i);
						
						// Base 64 image
						if(img.src.indexOf("data:") == 0) {
							OpenImage(img.src, "image."+MimeToExt(img.src.substring(5, img.src.indexOf(";base64"))));
							
						// We have to load it externally otherwise
						} else {
							OpenImageLink(img.src);
						}
						
						this.close();
					}
				}
			}
		}
		
		if(this.b_next.detect(x, y, type) && this.page < this.pages-1) {
			this.page++;
			Update();
		} else if(this.b_prev.detect(x, y, type) && this.page > 0) {
			this.page--;
			Update();
		}
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
		
		// Next and previous buttons
		var bn = this.b_next, bp = this.b_prev;
		
		bn.active = this.page < this.pages-1;
		bp.active = this.page > 0;
		bn.set(this.x+this.w-bn.w-10, this.y+this.h-bn.h-10);
		bp.set(bn.x-bp.w-10, bn.y);
		
		// Drawing begins here
		this._super(ctx);
		
		// Image background
		ctx.fillStyle = BG4;
		ctx.fillRect(this.x+10, this.y+10, this.w-20, this.h-60);
		
		var il = this.images.length, p8 = this.page*8, i = p8, img, x, y, l = 0;
		
		ctx.font = "18px "+F1;
		
		// Draw thumbnails
		for(; i < MIN(il, p8+8); i++) {
			
			img = this.images[i];
				
			x = this.pos(i);
			y = x[1];
			x = x[0];
			ctx.fillStyle = BG3, ctx.fillRect(x, y, 200, 200);
			
			// Draw image when it's loaded
			if(img.d.loaded)
				ctx.drawImage(img.d, x+((200-img.d.width)/2), y+((200-img.d.height)/2), img.d.width, img.d.height);
			
			// Display relevant info on hover
			if(this.hover == i) {
				ctx.fillStyle = "rgba(0, 0, 0, 0.5)", ctx.fillRect(x, y, 200, 200);
				ctx.fillStyle = BLK, ctx.fillRect(x, y+150, 200, 50);
				ctx.fillStyle = C2;
				ctx.fillText(img.w+" x "+img.h, x+10, y+172, 190);
				ctx.fillStyle = C1;
				l = ctx.measureText(img.t.toUpperCase()).width;
				ctx.fillText(img.t.toUpperCase(), x+190-l, y+190, 100);
				ctx.fillText(ByteString(img.s), x+10, y+190, 190);
			}
			ctx.fillStyle = BG7, ctx.lineWidth = 2, ctx.strokeRect(x, y, 200, 200);
		}
		
		// # of matches found + # of pages
		ctx.font = "20px "+F1;
		ctx.fillStyle = C2;
		if(this.pages > 0)
			ctx.fillText(il+" results (page "+(this.page+1)+"/"+this.pages+")", this.x+20, this.y+40, this.w);
		
		ctx.restore();
	}
});

/* View/change hotkeys */
PBOX_Hotkeys = PBOX_Base.extend({
	init: function() {
		
		this._super("Hotkeys", 240, 70, true);
		
		this.children = [];
		
		this.b_apply.setText("Done");
		this.b_def = new Button("Defaults");
		
		delete this.b_cancel;
		
		// Keep track of input
		this.input = null;
		
		this.btn = new Array();
		this.lbl = new Array();
		
		this.setChildren(this.b_apply, this.b_def, this.lbl, this.btn);
	},
	sync: function() {
		// Sync hotkey data
		var i, j, c = 0, found;
		for(i in HK.funcs) {
			
			if(!this.lbl[c]) this.lbl[c] = new Label(200, 20, HK.funcs[i].name);
			if(!this.btn[c]) this.btn[c] = new Button("none", 20);
			
			// Save this so we can easily get hotkey data
			this.lbl[c].func = i;
			
			// Set to empty if not found
			found = false;
			for(j in HK.keys) {
				if(HK.funcs[i].func == HK.keys[j].func) {
					this.btn[c].setText(j);
					found = true;
					break;
				}
			}
			if(!found) this.btn[c].setText("none");
			c++;
		}
		this.h = 70+(c*26);
		this.fixWidth();
	},
	fixWidth: function() {
		// Fix window size when button length changes
		var i = 0, max_w = 0;
		for(var i = 0; i < this.btn.length; i++) {
			if(this.btn[i].w > max_w) max_w = this.btn[i].w;
		}
		this.w = 240+max_w;
	},
	def: function() {
		this.sync();
	},
	apply: function() {
	},
	detect: function(x, y, type) {
		
		// Detect hotkey input
		for(var i = 0; i < this.btn.length; i++) {
			if(this.btn[i].detect(x, y, type) && this.input == null) {
				this.input = i;
				this.btn[i].setText("Enter hotkey");
				this.btn[i].toggle(false);
				this.fixWidth();
				LockKeyboard = true;	// Prevents all keyboard input
			}
			
			// Tooltip for labels
			if(type == "move" && this.lbl[i].detect(x, y, type)) {
				Tooltip.set(HK.funcs[this.lbl[i].func].desc, x, y);
			}
		}
		
		// Restore default hotkeys
		if(this.b_def.detect(x, y, type)) {
			DefaultHotkeys();
			this.sync();
		}
		
		this._super(x, y, type);
	},
	draw: function(ctx) {
		ctx.save();
		
		var i = 0;
		
		for(; i < this.lbl.length; i++) {
			this.lbl[i].set(this.x+15, this.y+15+(i*26));
			this.btn[i].set(this.x+220, this.y+15+(i*26));
		}
		
		this.b_def.set(this.x+this.w-this.b_def.w-10, this.y+this.h-this.b_def.h-10);
		
		// Update hotkey input
		if(this.input != null && HK.tempKey != "") {
			this.btn[this.input].setText(HK.tempKey);	// Input is stored in HK temp buffer
			this.fixWidth();
			
			// Input done
			if(!LockKeyboard) {
				
				var func = this.lbl[this.input].func;
					
				if(func) SetHotkey(HK.tempKey, this.lbl[this.input].func);
				this.btn[this.input].toggle(true);
				HK.tempKey = "";	// Always clear the temp buffer when done!
				this.input = null;
				this.sync();
			}
		}
		
		// Drawing begins here
		this._super(ctx);
	
		ctx.restore();
	}
});

/* Add-on info */
PBOX_AddOn = PBOX_Base.extend({
	init: function() {
		this._super("Quick-Open Add-on", 400, 160, true);
		
		// Remove all children elements
		delete this.b_apply;
		delete this.b_cancel;
		
		this.desc = "Right-click any image to open in Photoblob";
		this.compat = "Only works in Firefox 36+";
		this.addonURL = "http://blob.software/photoblob_quick-open.xpi";
		
		// Link to install
		this.install = new Button("Install Add-on");
		
		// Source code link
		this.source = new Button("Download Source");
		
		this.children = [this.install, this.source];
	},
	def: function() {
	},
	apply: function() {
	},
	detect: function(x, y, type) {
		
		var xport = E("export");
		
		// Install add-on
		if(this.install.detect(x, y, type)) {
			InstallTrigger.install({"Photoblob Quick-Open":{
				URL: this.addonURL,
				IconURL: "http://photo.blob.software/favicon.png",
				Hash: "sha1:532c094b04ca79bb97686628380dfe819c3ec4eb",
				toString: function() { return this.URL; }
			}});				
		}
		
		// Download add-on source code zip
		if(this.source.detect(x, y, type)) {
			xport.href = "http://photo.blob.software/photoblob-addon.zip";
			xport.click();
		}
		
		this._super(x, y, type);
	},
	draw: function(ctx) {
		ctx.save();
		
		// Adjust buttons
		this.install.set(this.x+((this.w-this.install.w)/2), this.y+80);
		this.source.set(this.x+((this.w-this.source.w)/2), this.y+120);
		
		// Drawing begins here
		this._super(ctx);
		
		// Description
		ctx.font = "16px "+F1;
		ctx.fillStyle = C1;
		var w = ctx.measureText(this.desc).width;
		ctx.fillText(this.desc, this.x+(this.w-w)/2, this.y+30, this.w);
		
		// Compatibility
		ctx.font = "20px "+F1;
		ctx.fillStyle = C2;
		w = ctx.measureText(this.compat).width;
		ctx.fillText(this.compat, this.x+(this.w-w)/2, this.y+60, this.w);
	
		ctx.restore();
	}
});

/* About info */
PBOX_About = PBOX_Base.extend({
	init: function() {
		this._super("About Photoblob", 420, 245, true);
		
		// Remove all children elements
		delete this.b_apply;
		delete this.b_cancel;
		
		// Logo
		this.logo = IMG("favicon.png");
		
		// Text
		this.name = "Photoblob";
		this.desc = "Image/Texture Editor and 3D Model Viewer";
		this.version = "0.1.9";
		this.update = "Updated 03/13/2015";
		this.site = "http://photo.blob.software/";
		this.copy = "© 2015 Vincent Costanza";
		
		// Site link
		this.link = new HyperLink(400, 22, this.site);
		
		// License link
		this.license = new HyperLink(100, 20, "Licensed under GPLv3", this.site+"LICENSE");
		
		this.children = [this.link, this.license];
	},
	def: function() {
	},
	apply: function() {
	},
	detect: function(x, y, type) {
		
		this.link.detect(x, y, type);
		this.license.detect(x, y, type);
		
		this._super(x, y, type);
	},
	draw: function(ctx) {
		ctx.save();
		
		// Adjust hyperlinks
		ctx.font = "18px "+F1;
		var w = ctx.measureText(this.site).width;
		this.link.w = w;
		this.link.set(this.x+((this.w-w)/2), this.y+157);
		
		ctx.font = "16px "+F1;
		w = ctx.measureText(this.license.value).width;
		this.license.w = w;
		this.license.set(this.x+((this.w-w)/2), this.y+210);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.translate(this.x, this.y);
		
		// Logo
		ctx.drawImage(this.logo, (this.w-64)/2, 10, 64, 52);
		
		// Name and version
		ctx.fillStyle = C1;
		ctx.font = "24px "+F1;
		w = ctx.measureText(this.name+" "+this.version).width;
		ctx.fillText(this.name+" "+this.version, (this.w-w)/2, 90, this.w);
		
		// Update
		w = ctx.measureText(this.update).width;
		ctx.fillText(this.update, (this.w-w)/2, 152, this.w);
		
		// Description
		ctx.fillStyle = C3;
		ctx.font = "16px "+F1;
		w = ctx.measureText(this.desc).width;
		ctx.fillText(this.desc, (this.w-w)/2, 115, this.w);
		
		// Copyright
		w = ctx.measureText(this.copy).width;
		ctx.fillText(this.copy, (this.w-w)/2, 210, this.w);
		
		// Separators
		ctx.fillStyle = BG4;
		ctx.fillRect(10, 122, this.w-20, 3);
		ctx.fillRect(50, 188, this.w-100, 3);
	
		ctx.restore();
	}
});

// PBOX container
PBOX = {
		
	New: new PBOX_New(),
	OpenLink: new PBOX_OpenLink(),
	OpenSVG: new PBOX_OpenSVG(),
	Save: new PBOX_Save(),
	Resize: new PBOX_Resize(),
	ColorBox: new PBOX_ColorBox(),
	FontBox: new PBOX_FontBox(),
	Grayscale: new PBOX_Grayscale(),
	Mirror: new PBOX_Mirror(),
	InvertColors: new PBOX_InvertColors(),
	Brightness: new PBOX_Brightness(),
	AddNoise: new PBOX_AddNoise(),
	Posterize: new PBOX_Posterize(),
	BoxBlur: new PBOX_BoxBlur(),
	Shift: new PBOX_Shift(),
	ChangeHSL: new PBOX_ChangeHSL(),
	ReplaceColor: new PBOX_ReplaceColor(),
	View3D: new PBOX_View3D(),
	ChooseTheme: new PBOX_ChooseTheme(),
	ImageBrowser: new PBOX_ImageBrowser(),
	Hotkeys: new PBOX_Hotkeys(),
	AddOn: new PBOX_AddOn(),
	About: new PBOX_About(),
	
	detect: function(x, y, type) {
		
		var t = undefined, opened = false;
		for(var i in this) {
			t = this[i];
			if(typeof(t) == "object" && t.draw != undefined && t.active == true && t.closing == false) {
			
				// Exceptions to PBOX opened rule				
				// Otherwise ignore all non-PBOX detects when opened
				if(i != "View3D") opened = true;
					
				// Detect mouse on title bar
				if(x-t.x >= 0 && x-t.x < t.w && t.y-y >= 0 && t.y-y <= 30) {
				
					// Start window dragging
					if(!t.isDragging && type == "down") {
						t.isDragging = true;
						t.dragx = t.x-x;
						t.dragy = t.y-y;
					}
				
					// X button
					if(((t.x+t.w)-x) >= 0 && ((t.x+t.w)-x) <= 30) {
						SC("pointer");
						if(type == "click") t.close();
					}					
				}
				
				// Currently dragging window
				if(t.isDragging) {
				
					// Move window with mouse
					if(type == "move") {
						t.x = t.dragx+x;
						t.y = t.dragy+y;
						Update();
						
					// End window dragging
					} else if(type == "up") {
						t.isDragging = false;
						Update();
					}
				} else {				
					// Detect within window
					t.detect(x, y, type);
					
					if(i == "View3D" && WB(x, y, t)) {
						opened = true;
					}
				}
			}
		}
		return opened;
	},
	
	draw: function(ctx) {
		
		// Draw all children objects
		var t = undefined;
		for(var i in this) {
			t = this[i];
			if(typeof(t) == "object" && t.draw != undefined && t.active == true) {
			
				// Reset window position when off screen
				if(!t.isDragging && (t.x <= 0 || t.x >= CWIDTH || t.y <= 0 || t.y >= CHEIGHT))
				{
					t.x = (CWIDTH-t.w)/2;
					t.y = (CHEIGHT-t.h)/3;
				}
				
				// Fading effects
				if(t.fadeTime != -1) {
					var time = T()-t.fadeTime;
					if(time > 200) {
						t.fadeTime = -1;
						if(t.closing) {
							t.closing = false;
							t.active = false;
							continue;
						}
					} else {
						var o = SIN((time/200)*(PI/2));	// Sine fading always looks nicer than lerp
						ctx.globalAlpha = t.closing ? 1-o : o;
						Update();
					}
				}
				
				t.draw(ctx);
				
				
				ctx.save();
				
				// Title bar
				ctx.fillStyle = BG2;
				ctx.strokeStyle = BG5;
				ctx.lineWidth = 5;
				RoundRect(ctx, t.x, t.y-30, t.w, 30, 10, true, true, true);
				ctx.font = "20px "+F1;
				ctx.fillStyle = C1;
				ctx.fillText(t.title, t.x+5, t.y-7, t.w-10);
				
				// Close button
				ctx.fillStyle = "#F96";
				ctx.fillText("X", t.x+t.w-25, t.y-7, 25);
				
				ctx.restore();
				
				ctx.globalAlpha = 1;
			}
		}
	}
};
