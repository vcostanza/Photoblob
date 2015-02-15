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
		this.title = title;		// Title displayed on bar
		this.noImage = noImage;	// if window can be opened when no image is loaded
		this.active = false;	// if window is opened/closed
		
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
			this.active = false;
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

/* Resize window */
PBOX_Resize = PBOX_Base.extend({
	init: function() {
		this._super("Resize", 220, 150);
		
		this.txt = [new TextBox(this, 80, 24, 128, 4, true, 1, 5000), new TextBox(this, 80, 24, 128, 4, true, 1, 5000)];
		this.lbl = [new Label(80, 24, "Width:"), new Label(80, 24, "Height:")];
		
		// Images for button
		this.img_link = IMG("icons/link.svg");
		this.img_unlink = IMG("icons/unlink.svg");
		
		this.link = new ImageButton(this.img_link, 30, 30);
		this.linked = true;
		
		this.txt[0].onchange = function(o, n) {
			if(this.parent.linked) this.parent.txt[1].value = ROUND((this.parent.txt[1].value/o)*n);
			this.parent.resize();
		};
		
		this.txt[1].onchange = function(o, n) {
			if(this.parent.linked) this.parent.txt[0].value = ROUND((this.parent.txt[0].value/o)*n);
			this.parent.resize();
		};
		
		this.setChildren(this.txt, this.lbl, this.link);
	},
	def: function() {
		this.txt[0].value = IMGFX.tw;
		this.txt[1].value = IMGFX.th;
	},
	resize: function() {
		IMGFX.Resize(this.txt[0].get(), this.txt[1].get());
	},
	apply: function() {
		IMGFX.AddHistory("Resize");
	},
	detect: function(x, y, type) {
		
		this._super(x, y, type);
		
		// Text boxes
		for(var i = 0; i < this.txt.length; i++) {
			this.txt[i].detect(x, y, type);
		}
		
		// Link button
		if(type == "click" && this.link.detect(x, y, type)) {
			if(this.linked) this.link.img = this.img_unlink;
			else this.link.img = this.img_link;
			this.linked = !this.linked;
			Update();
		}
		
	},
	draw: function(ctx) {
		ctx.save();
		
		for(var i = 0; i < this.txt.length; i++) {
			this.lbl[i].set(this.x+15, this.y+15+(i*30));
			this.txt[i].set(this.x+100, this.y+15+(i*30));
		}
		
		this.link.set(this.x+180, this.y+26);
		
		// Drawing begins here
		this._super(ctx);
	
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
		
		this.cpick = new ImageButton(Icons["Color Pick"], 25, 25);
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
			if(!noBarUpdate && i < 3) this.cb[i].value = this.hsla[i];	// While we're here, update color box values
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
		// Callback when we're done
		if(this.callback) this.callback.call(this.callobj, HSL2RGB(this.hsla[0], this.hsla[1], this.hsla[2]).concat(this.hsla[3]));
	},
	cancel: function() {
		// Do nothing
	},
	detect: function(x, y, type) {
		
		var changed = false, c = 0, cx = 0, cy = 0, i = 0;
		
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
				SC("crosshair");
				this.picking = true;
			} else if(this.picking) {
				SC();
				if(ImageArea.open && WB(x, y, ImageArea)) {
					cx = x-ImageArea.x;
					cy = y-ImageArea.y;
					c = IMGFX.SampleColor(cx, cy, 1);
				} else {
					c = GC(canvas).getImageData(x, y, 1, 1).data;
				}
				this.setRGBA(c);
				Update();
				this.picking = false;
			}
		}
		
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
		
		this.setChildren(this.rb);
	},
	def: function() {
		for(var e in this.rb) this.rb[e].toggle(false);
		this.rb[0].toggle(true);
		IMGFX.Grayscale(0);
	},
	apply: function() {
		IMGFX.AddHistory("Grayscale");
	},
	detect: function(x, y, type) {
		
		// Radio buttons
		if(type == "click") {
			for(var i = 0; i < this.rb.length; i++) {
				this.rb[i].toggle(false);
				if(this.rb[i].detect(x, y, type)) IMGFX.Grayscale(i);
			}
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
					IMGFX.Brightness(Math.round(this.s.value*400), i);
				}
			}
			this.rb[this.mode].toggle(true);
		}
		
		// Slider
		if(this.s.detect(x, y, type)) {
			IMGFX.Brightness(Math.round(this.s.value*400), this.mode);
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
		ctx.fillText(Math.round(this.s.value*400), this.s.x+this.s.w+10, this.s.y+20, this.s.w);
	
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
			IMGFX.AddNoise(Math.round(this.s.value*200));
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
		ctx.fillText(Math.round(this.s.value*200), this.s.x+this.s.w+10, this.s.y+20, this.s.w);
	
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
			IMGFX.BoxBlur(Math.round(this.s.value*20));
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
		ctx.fillText(Math.round(this.s.value*20), this.s.x+this.s.w+10, this.s.y+20, this.s.w);		
	
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
		if(this.sw.detect(x, y, type) || this.sh.detect(x, y, type)) IMGFX.Shift(Math.round(this.sw.value*ImageArea.w), Math.round(this.sh.value*ImageArea.h));
		
		this._super(x, y, type);
		
	},
	draw: function(ctx) {
		ctx.save();
	
		this.sw.set(this.x+20, this.y+10);		
		this.sh.set(this.x+20, this.y+40);
		
		// Drawing begins here
		this._super(ctx);
		
		ctx.font = "22px "+F1;
		ctx.fillStyle = C1;
		ctx.fillText(Math.round(this.sw.value*ImageArea.w), this.sw.x+this.sw.w+10, this.sw.y+20, this.sw.w);
		ctx.fillText(Math.round(this.sh.value*ImageArea.h), this.sh.x+this.sh.w+10, this.sh.y+20, this.sh.w);		
	
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
		ctx.fillText(Math.round(this.sh.value*100)-50, this.sh.x+this.sh.w+10, this.sh.y+20, this.sh.w);
		ctx.fillText(Math.round(this.ss.value*200)-100, this.ss.x+this.ss.w+10, this.ss.y+20, this.ss.w);
		ctx.fillText(Math.round(this.sl.value*200)-100, this.sl.x+this.sl.w+10, this.sl.y+20, this.sl.w);
	
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
		IMGFX.ReplaceColor(this.col_a.getColor(), this.col_b.getColor(), Math.round(this.st.value*300));
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
		ctx.fillText(Math.round(this.st.value*300), this.st.x+this.st.w+10, this.st.y+20, this.w-this.st.w-30);
		
		ctx.font = "14px "+F1;
		ctx.fillText("Amount", this.x+20, this.st.y-10, this.w);
	
		ctx.restore();
	}
});

/* Theme chooser */
PBOX_ChooseTheme = PBOX_Base.extend({
	init: function() {
		this._super("Choose Theme", 250, 280, true);
		
		this.rb = [new RadioButton("Default"), new RadioButton("Green"), new RadioButton("Red"), new RadioButton("Yellow"), new RadioButton("Cyan"),
		new RadioButton("Pink"), new RadioButton("Orange"), new RadioButton("Lime"), new RadioButton("Gray"), new RadioButton("Deep Blue"),
		new RadioButton("Deep Green"), new RadioButton("Deep Red"), new RadioButton("Deep Yellow"), new RadioButton("Deep Cyan"),
		new RadioButton("Deep Pink"), new RadioButton("Dela"), new RadioButton("High Contrast"), new RadioButton("Black")];
		
		this.setChildren(this.rb);
	},
	last: 0,
	def: function() {
		this.last = CurrentTheme;
		this.rb[CurrentTheme].toggle(true);
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
				this.rb[i].toggle(false);
				if(this.rb[i].detect(x, y, type)) SetTheme(i);
			}
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
		
		this.setChildren(this.b_next, this.b_prev, this.rb);		
	},
	images: [],	// Images array
	hover: -1,	// Hovered image
	page: 0,	// Current page #
	pages: 0,	// Total pages
	tol: 2000,	// Total difference tolerance
	tol_cutoff: 0,
	
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
		var i = p8 = this.page*8, img = x2 = y2 = 0;
		
		for(; i < MIN(this.images.length, p8+8); i++) {
						
			img = this.images[i].d;
			if(img.loaded) {
				var x2 = this.pos(i), y2 = x2[1], x2 = x2[0];
				if(x >= x2 && x < x2+200 && y >= y2 && y < y2+200) {
					if(type == "move") {
						if(this.hover != i) {
							this.hover = i;
							Update();
						}
					} else if(type == "click") {
						CL("OPEN "+i);
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
		
		var il = this.images.length, i = p8 = this.page*8, img = x = y = l = 0;
		
		ctx.font = "18px "+F1;
		
		// Draw thumbnails
		for(; i < MIN(il, p8+8); i++) {
			
			img = this.images[i];
				
			var x = this.pos(i), y = x[1], x = x[0];
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
				ctx.fillText(img.s >= 1000 ? (img.s >= 1000000 ? Math.round((img.s/1000000)*10)/10 + " MB" : Math.round((img.s/1000)*10)/10 + " KB") : img.s+" bytes", x+10, y+190, 190);
			}			
			ctx.fillStyle = BG7, ctx.lineWidth = 2, ctx.strokeRect(x, y, 200, 200);			
		}
		
		// # of matches found + # of pages
		ctx.font = "20px "+F1;
		ctx.fillStyle = C2;
		if(this.pages > 0)
			ctx.fillText((this.tol_cutoff)+" results (page "+(this.page+1)+"/"+this.pages+")", this.x+20, this.y+40, this.w);
		
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
		this.version = "0.1.5";
		this.update = "Updated 02/15/2015";		
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
		
		SC();
		
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
	Resize: new PBOX_Resize(),
	ColorBox: new PBOX_ColorBox(),
	FontBox: new PBOX_FontBox(),
	Grayscale: new PBOX_Grayscale(),
	Mirror: new PBOX_Mirror(),
	InvertColors: new PBOX_InvertColors(),
	Brightness: new PBOX_Brightness(),
	AddNoise: new PBOX_AddNoise(),
	BoxBlur: new PBOX_BoxBlur(),
	Shift: new PBOX_Shift(),
	ChangeHSL: new PBOX_ChangeHSL(),
	ReplaceColor: new PBOX_ReplaceColor(),
	ChooseTheme: new PBOX_ChooseTheme(),
	ImageBrowser: new PBOX_ImageBrowser(),
	About: new PBOX_About(),
	
	detect: function(x, y, type) {
		
		var t = undefined, opened = false;
		for(var i in this) {
			t = this[i];
			if(typeof(t) == "object" && t.draw != undefined && t.active == true) {
			
				opened = true;
				
				// Detect mouse within window
					
				// Detect mouse on title bar
				if(x-t.x >= 0 && x-t.x < t.w && t.y-y >= 0 && t.y-y <= 30) {
				
					// Start window dragging
					if(!t.isDragging && type == "down") {
						t.isDragging = true;
						t.dragx = t.x-x;
						t.dragy = t.y-y;
					}
				
					// X button
					if(type == "click" && ((t.x+t.w)-x) >= 0 && ((t.x+t.w)-x) <= 30) t.close();
					
				}
				
				t.detect(x, y, type);
				
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
				if(!t.isDragging && (t.x <= 0 || t.x >= canvas.width || t.y <= 0 || t.y >= canvas.height))
				{
					t.x = (canvas.width-t.w)/2;
					t.y = (canvas.height-t.h)/3;
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
				
			}
		}	
	}
};
