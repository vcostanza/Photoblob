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
** Image filter object/library containing all effect functions
*/
IMGFX = {

	target: undefined,
	selection: undefined,
	history: new Array(),
	current: 0,
	
	/* Set image target */
	SetTarget: function(img) {
		this.target = img;
	},
	
	/* Set selection mask */
	SetSelection: function(s) {
		
		delete this.selection;
		
		if(s == null || s.w <= 0 || s.h <= 0 || !IMGFX.target) return;
		
		var sm = s.mask, i = j = 0;
		
		// Empty selection mask - default to box select
		if(!sm) {
			sm = s.mask = new Uint8ClampedArray(s.w*s.h);
			for(; i < sm.length; i++) {
				//sm[i] = 128+(Math.cos(((i%s.w)/s.w)*Math.PI)*128);
				sm[i] = 255;
			}
		}
		
		// No image data means it can't be drawn
		if(s.img == null) {
			s.img = ImageData(s.w, s.h);
			
			// Only draw pixels where the border is
			var d = s.img.data, inside = false, dl = s.w*s.h;
			for(; j < dl; j++) {
				i = j*4;
				
				// Reset state when new line
				if(j % s.w == 0) inside = false;
				
				if(inside) {					
					// Upcoming empty area or new line
					if(sm[j+1] == 0 || (j+1) % s.w == 0) {
						d[i] = d[i+3] = 255;
						d[i+1] = d[i+2] = 0;
						inside = false;
					// Top or bottom is empty
					} else if(!(sm[j+s.w] && sm[j-s.w])) {
						d[i+1] = d[i+3] = 255;
						d[i] = d[i+2] = 0;
					}
				} else {
					// Inside selection
					if(sm[j] > 0) {
						d[i] = d[i+3] = 255;
						d[i+1] = d[i+2] = 0;
						inside = true;
					}
				}
			}
			
			// We need to convert the image data to a real image or else
			// the alpha doesn't blend when we draw the selection
			var selcan = document.createElement("canvas");
			selcan.width = s.w;
			selcan.height = s.h;
			GC(selcan).putImageData(s.img, 0, 0);
			s.img = IMG(selcan.toDataURL("image/png"));
		}
		
		this.selection = s;
		Update();
	},
	
	/* Return the target's image data */
	GetTarget: function() {		
		if(!IMGFX.target) return null;
		
		var w = fw = IMGFX.target.width, h = fh = IMGFX.target.height, s = IMGFX.selection, o = 0, m = null;
		
		if(s) {			
			o = s.x+(s.y*w);
			w = s.w;
			h = s.h;
			m = s.mask;
		}
		
		return {w: w, h: h, fw: fw, fh: fh, o: o, m: m};
	},
	
	/* Default pixel set */
	PIX_Default: function(i, d, d2) {
		d[i] = d2[i];
		d[i+1] = d2[i+1];
		d[i+2] = d2[i+2];
		d[i+3] = d2[i+3];
	},
	
	/* Mix pixels with selection mask */
	// This should be called immediately after the pixel is modified
	PIX_MixSelection: function(i, d, d2, m) {
		d[i] = FLOOR((d[i]*m)+(d2[i]*(1-m)));
		d[i+1] = FLOOR((d[i+1]*m)+(d2[i+1]*(1-m)));
		d[i+2] = FLOOR((d[i+2]*m)+(d2[i+2]*(1-m)));
	},
	
	/* Load history at index */
	LoadHistory: function(index, clear) {
		if(IMGFX.history.length == 0) return;
		
		var oldimg = IMGFX.GetHistory(index).img;
		if(oldimg.width != ImageArea.img.width || oldimg.height != ImageArea.img.height) {
			IMGFX.target = ImageArea.img = GC(canvas).createImageData(oldimg.width, oldimg.height);
		}
			
		var d = IMGFX.target.data, d2 = oldimg.data, dl = IMGFX.target.width*IMGFX.target.height, i = j = 0;
		
		for(; j < dl; j++) {
			i = j*4;
			
			d[i] = d2[i];
			d[i+1] = d2[i+1];
			d[i+2] = d2[i+2];
			d[i+3] = d2[i+3];			
		}
		
		if(clear == true) IMGFX.ClearHistory(true);
		
		if(index != "last")
			IMGFX.current = index;
		
		Update();
	},
	
	/* Return history at index */
	GetHistory: function(index) {
		if(IMGFX.history.length == 0) return undefined;
		
		if(index == "last") index = IMGFX.current;
		
		return IMGFX.history[index];
	},
	
	AddHistory: function(func) {
		if(!IMGFX.target) return;
		
		if(IMGFX.current < IMGFX.history.length-1)
			IMGFX.history.splice(IMGFX.current+1, IMGFX.history.length-IMGFX.current-1);
			
		IMGFX.history.push({name: func, img: CloneImg(IMGFX.target)});
		IMGFX.current = IMGFX.history.length-1;
		Update();
	},
	
	ClearHistory: function(savefirst) {
	
		if(savefirst) {
			IMGFX.history.splice(1, IMGFX.history.length-1);
		} else {		
			delete IMGFX.history;
			IMGFX.history = new Array();
		}
	},	
	
	Undo: function() {	
		if(IMGFX.current > 0) IMGFX.LoadHistory(--IMGFX.current);
	},
	
	Redo: function() {
		if(IMGFX.current < IMGFX.history.length-1) IMGFX.LoadHistory(++IMGFX.current);
	},
	
	/* These are the most common variables used in the processing functions below
	 * d	RGB array to write to
	 * d2	RGB array to read from
	 * img	Image data such as width, height, and selection data
	 * w	Image/selection width
	 * h	Image/selecton height
	 * fw	Full image width
	 * fh	Full image height
	 * o	Selection offset
	 * dl	Working array length; Break point
	 * px	Loop: X offset
	 * py	Loop: Y offset
	 * i	Loop: Pixel index
	 * t1	Benchmark start time
	 */

	// Each function more or less follows this framework:
	Example: function() {
		if(!IMGFX.target) return;	// Stop if there's no image loaded
		
		// Typical variables
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(),
			w = img.w, h = img.h, fw = img.fw, fh = img.fh, o = img.o, dl = h*fw, px = py = i = 0, t1 = T();
		
		// Loop until the Y offset exceeds the data length
		while(py < dl) {
			
			// Calculate pixel index
			i = (o+px+py)*4;
			
			// This is where the pixels are actually modified
			// NOTE: Always write to 'd' and always read from 'd2'
			d[i] = d2[i];		// Red channel
			d[i+1] = d2[i+1]	// Green channel
			d[i+2] = d2[i+2]	// Blue channel
			d[i+3] = d2[i+3]	// Alpha channel
			
			// By the way, this example simply syncs the current image with the last saved history data
			// Most of the time this shouldn't change anything
			
			// Increment X offset and reset if we're on a new line, also increment Y offset
			// Incrementation should almost always look like this
			px++;
			if(px == w) {
				px = 0;
				py += fw;
			}
		}
		
		// Optional: Echo the function and time back for debugging purposes
		// Should be commented out when not being used
		/* CL("Example(): "+(T() - t1)); */
		
		return T()-t1;	// Return the total time (milliseconds) it took to run this
	},
	
	/* Convert to black and white
	** Types for 'g' are 0 (average), 1 (dark), 2 (light), 3 (desaturate)
	** 4 (red-channel), 5 (green-channel), 6 (blue-channel),
	** 7 (BT.709), 8 (BT.601), 9 (BT.2020) */
	Grayscale: function(g) {
		if(!IMGFX.target) return;
		
		g |= 0;
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = IMGFX.target.width*IMGFX.target.height, j = i = 0, t1 = T();
		
		switch(g) {
		
			// Average
			case 0:
				for(; j < dl; j++) {			
					i = j*4;
					d[i] = d[i+1] = d[i+2] = (d2[i]+d2[i+1]+d2[i+2])/3;
				} break;
			
			// Darken
			case 1:
				for(; j < dl; j++) {			
					i = j*4;
					d[i] = d[i+1] = d[i+2] = MIN(d2[i], d2[i+1], d2[i+2]);
				} break;
				
			// Lighten
			case 2:
				for(; j < dl; j++) {			
					i = j*4;
					d[i] = d[i+1] = d[i+2] = MAX(d2[i], d2[i+1], d2[i+2]);
				} break;
				
			// Desaturate
			case 3:
				for(; j < dl; j++) {			
					i = j*4;
					d[i] = d[i+1] = d[i+2] = (MIN(d2[i], d2[i+1], d2[i+2])+MAX(d2[i], d2[i+1], d2[i+2]))/2;
				} break;
			
			// Red-channel
			case 4:
				for(; j < dl; j++) {			
					i = j*4;
					d[i] = d[i+1] = d[i+2] = d2[i];
				} break;
				
			// Green-channel
			case 5:
				for(; j < dl; j++) {			
					i = j*4;
					d[i] = d[i+1] = d[i+2] = d2[i+1];
				} break;
				
			// Blue-channel
			case 6:
				for(; j < dl; j++) {			
					i = j*4;
					d[i] = d[i+1] = d[i+2] = d2[i+2];
				} break;
			
			// Standard luminance coefficients
			case 7:
			case 8:
			case 9:
				var w = [];
				switch(g) {
					case 7: w = [0.299, 0.587, 0.114]; break;
					case 8: w = [0.2126, 0.7152, 0.0722]; break;
					case 9: w = [0.2627, 0.6780, 0.0593]; break;
				}
			
				for(; j < dl; j++) {			
					i = j*4;
					d[i] = d[i+1] = d[i+2] = (d2[i]*w[0])+(d2[i+1]*w[1])+(d2[i+2]*w[2]);
				} break;
		}
		
		CL("Grayscale("+g+"): "+(T() - t1));
		
	},

	/* Invert each pixel's color values
	** Arguments control which colors to invert */
	InvertColors: function(r, g, b) {
		if(!IMGFX.target) return;
	
		if(r == undefined) {
			r = true;
			g = true;
			b = true;
		}
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, h = img.h, fw = img.fw, o = img.o, dl = h*fw, m = img.m, px = py = i = j = 0, t1 = T();
		
		while(py < dl) {
			
			i = (o+px+py)*4;
			
			if(!m || m[j] > 0) {
				if(r) d[i] = 255-d2[i]; else d[i] = d2[i];
				if(g) d[i+1] = 255-d2[i+1]; else d[i+1] = d2[i+1];
				if(b) d[i+2] = 255-d2[i+2]; else d[i+2] = d2[i+2];
				if(m) IMGFX.PIX_MixSelection(i, d, d2, m[j]/255);
			} else {
				IMGFX.PIX_Default(i, d, d2);
			}
			
			px++;
			j++;
			if(px == w) {
				px = 0;
				py += fw;
			}
		}
		
		//CL("InvertColors("+r+", "+g+", "+b+"): "+(T() - t1));
		
		return T()-t1;
	},
	
	/* Auto contrast - stretch image contrast so it reaches pure black and pure white (may alter color) */
	AutoContrast: function() {
		if(!IMGFX.target) return;
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(),
			w = img.w, h = img.h, fw = img.fw, o = img.o, dl = h*fw, min = 255, max = 0, t = mind = maxd = px = py = i = 0, t1 = T();

		// First find the brightest and darkest pixels based on average
		while(py < dl) {
			i = (o+px+py)*4;
			t = (d2[i]+d2[i+1]+d2[i+2])/3;
			if(t < min) {
				min = t;
				mind = i;
			} else if(t > max) {
				max = t;
				maxd = i;
			}
			
			px++;
			if(px == w) {
				px = 0;
				py += fw;
			}
		}
		
		// Calculate normals off white/black
		maxd = [d2[maxd]/255, d2[maxd+1]/255, d2[maxd+2]/255];
		
		// Minimum has to be inverted first
		mind = [
			(255-(d2[mind]/maxd[0]))/255,
			(255-(d2[mind+1]/maxd[1]))/255,
			(255-(d2[mind+2]/maxd[2]))/255
		];
		
		// Apply transformation to entire image
		px = py = 0;
		while(py < dl) {
			i = (o+px+py)*4;
			d[i] = 255-ROUND((255-(d2[i]/maxd[0]))/mind[0]);
			d[i+1] = 255-ROUND((255-(d2[i+1]/maxd[1]))/mind[1]);
			d[i+2] = 255-ROUND((255-(d2[i+2]/maxd[2]))/mind[2]);
			
			px++;
			if(px == w) {
				px = 0;
				py += fw;
			}
		}
		
		// This should output the normals on the first pass
		// If a second pass is done, this should always output [1,1,1] [1,1,1]
		//CL("["+mind+" "+maxd+"]");
		
		//CL("AutoContrast(): "+(T() - t1));
		
		return T()-t1;		
	},
	
	/* Adjust brightness */
	Brightness: function(val, type) {
		if(!IMGFX.target) return;
	
		if(val < 0) val = 128;
		
		if(type == null) type = 0;
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = IMGFX.target.width*IMGFX.target.height, n = i = j = 0, t1 = T();
		
		switch(type) {
			
			// Normal
			case 0:
				n = 128;
				for(; j < dl; j++) {
					i = j*4;
					d[i] = (d2[i]/n)*val;
					d[i+1] = (d2[i+1]/n)*val;
					d[i+2] = (d2[i+2]/n)*val;
				}
				break;
				
			// Additive
			case 1:
				for(; j < dl; j++) {
					i = j*4;
					d[i] = d2[i]+(val-128);
					d[i+1] = d2[i+1]+(val-128);
					d[i+2] = d2[i+2]+(val-128);
				}
				break;
				
			// Glow/Average
			case 2:
				for(; j < dl; j++) {
					i = j*4;
					n = 255-((d2[i]+d2[i+1]+d2[i+2])/3);
					d[i] = (d2[i]/n)*val;
					d[i+1] = (d2[i+1]/n)*val;
					d[i+2] = (d2[i+2]/n)*val;
				}
				break;
		}
		
		CL("Brightness("+val+", "+type+"): "+(T() - t1));
		
	},
	
	/* Shift each pixel's hue
	** h = 	The amount to change the hue */
	ChangeHSL: function(h, s, l) {
		if(!IMGFX.target) return;
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = IMGFX.target.width*IMGFX.target.height, p = j = i = 0, t1 = T();
		
		for(; j < dl; j++) {
			
			i = j*4;
			
			p = ShiftHSL(d2[i], d2[i+1], d2[i+2], h, s, l);
			
			d[i] = p[0];
			d[i+1] = p[1];
			d[i+2] = p[2];
			
		}
		
		//CL("ChangeHSL("+h+"): "+(T() - t1));
		
	},
	
	/* Shift pixels based on x and y offset
	**
	** x = 	amount of pixels to shift horizontally
	** y =	amount of pixels to shift vertically */
	Shift: function(x, y) {
		if(!IMGFX.target) return;
		
		/*
		** d =  	image data to write to
		** d2 =		image data to read from
		** w =		image width
		** h =		image height
		** dl =		loop iterations
		** dl4 =	indicies in image data
		** pw =		indicies per row
		** s =		starting index of row
		** e =		starting index of next row
		** p =		pixel to read from
		** i =		pixel to write to
		** j = 		loop var
		** t1 =		precision timing
		*/
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, w = IMGFX.target.width, h = IMGFX.target.height,
			dl = w*h, dl4 = dl*4, pw = w*4, s = e = p = i = j = 0, t1 = T();
		
		// Set defaults (offset image halfway)
		if(x == undefined) { x = FLOOR(w/2); }
		if(y == undefined) { y = FLOOR(h/2); }
		
		// Wrap offsets
		x = (x%w)*4;
		y = (y%h);
		
		// Convert negative offsets to positive
		if(x < 0) x = pw+x;
		if(y < 0) y = h+y;
		
		for(; j < dl; j++) {
			
			i = j*4;
			
			// Catch index of start of current line and start of next line
			if(j % w == 0) {
				e += pw;
				s = e-pw;
			}
			
			// Calculate shift
			p = (i-s) + (e-x) - (pw*y);
			
			// Wrap shift
			if(i-s >= x) p -= pw;
			if(p < 0) p += dl4;
			
			// Apply shift
			d[i] = d2[p];
			d[i+1] = d2[p+1];
			d[i+2] = d2[p+2];
			d[i+3] = d2[p+3];
		}
		
		// DEBUG: Time it took to perform the shift
		CL("Shift("+x/4+", "+y+"): "+(T() - t1));
		
	},
	
	/* Rotate picture
	** Only works in 90 degree turns
	** TODO: Implement 180 and 270 turns as well as arbitrary rotation */
	Rotate: function(deg) {
		if(!IMGFX.target) return;
		
		if(deg != 1 && deg != -1) deg = 1;
		
		var w = IMGFX.target.width, h = IMGFX.target.height, pw = w*4, ph = h*4;
		
		IMGFX.target = ImageArea.img = GC(canvas).createImageData(h, w);
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = w*h, s = m = p = i = j = 0, t1 = T();
	
		for(; j < dl; j++) {
			
			i = j*4;
			
			m = j%h;
			if(m == 0) s = (i/ph)*4;
			
			if(deg == 1)
				p = (pw*(h-m-1))+s;
			else
				p = (pw*(m+1))-4-s;
			
			d[i] = d2[p];
			d[i+1] = d2[p+1];
			d[i+2] = d2[p+2];
			d[i+3] = d2[p+3];
		}
		
		CL("Rotate("+deg+"): "+(T() - t1));
		
		IMGFX.AddHistory("Rotate");
		
	},
	
	/* Mirror picture
	** 
	** x = 	true to mirror on x axis (vertical)
	** y =	true to mirror on y axis (horizontal) */
	Mirror: function(x, y) {
		if(!IMGFX.target) return;
		
		var d = IMGFX.target.data, w = IMGFX.target.width, h = IMGFX.target.height, d2 = IMGFX.GetHistory("last").img.data, dl = w*h, pw = w*4, s = e = p = i = j = 0, t1 = T();
	
		for(; j < dl; j++) {
			
			i = j*4;
			
			if(j % w == 0) {
				e += pw;
				s = e-pw;
			}
			
			if(x && y)
				p = pw*(h-(e/pw)+1)-(i-s);
			else if(x)
				p = pw*(h-(e/pw)+1)+(i-e);
			else if(y)
				p = e-(i-s)-4;
			else
				p = i;
				
			
			d[i] = d2[p];
			d[i+1] = d2[p+1];
			d[i+2] = d2[p+2];
			d[i+3] = d2[p+3];
		}
		
		CL("Mirror("+x+", "+y+"): "+(T() - t1));
		
	},	
	
	/* Resize image
	** TODO: Make this not suck; needs more averages */
	Resize: function(new_w, new_h) {
		if(!IMGFX.target) return;
		
		// Get the original width and height and also the width/height integer and decimal offsets
		var w = IMGFX.target.width, h = IMGFX.target.height, wr = w/new_w, hr = h/new_h, wi = CEIL(wr), hi = CEIL(hr), pw = w*4;
		
		// Create resized image container
		IMGFX.target = ImageArea.img = GC(canvas).createImageData(new_w, new_h);
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = new_w*new_h, s = e = p = i = j = k = l = 0, t1 = T();
		
		CL(wr);
	
		for(; j < dl; j++) {
			
			i = j*4;
			
			l = FLOOR(j/new_w);
			
			p = (FLOOR(wr*(j%new_w))+(w*FLOOR(hr*l)))*4;
			
			// Resize without interpolation
			d[i] = d2[p];
			d[i+1] = d2[p+1];
			d[i+2] = d2[p+2];
			d[i+3] = d2[p+3];			
		}
		
		CL("Resize("+new_w+", "+new_h+"): "+(T() - t1));
		
	},
	
	/* Map the "value" of each color to a point within a gradient
	** TODO: Support for gradients with dynamic color stops */
	GradientMap: function(grad) {
		if(!IMGFX.target) return;
		
		if(grad == undefined || grad.length == 1) {
			// Default to background and foreground colors
			grad = [ColorBox.bg.slice(0, 3), ColorBox.fg.slice(0, 3)];
			grad[0][3] = ROUND(255*ColorBox.bg[3]);
			grad[1][3] = ROUND(255*ColorBox.fg[3]);
		}
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = IMGFX.target.width*IMGFX.target.height, t = j = i = c = k = 0, g = grad.length-1, f = 1/g, t1 = T();
		
		for(; j < dl; j++) {
			i = j*4;
			
			// BT.709 Grayscale conversion
			t = ((d2[i]*0.2126)+(d2[i+1]*0.7152)+(d2[i+2]*0.0722))/255;
			
			c = CEIL(g*t);
			if(c == 0) c++;
			k = (t-(f*(c-1)))/f;
			
			d[i] = (grad[c-1][0]*(1-k))+(grad[c][0]*k);
			d[i+1] = (grad[c-1][1]*(1-k))+(grad[c][1]*k);
			d[i+2] = (grad[c-1][2]*(1-k))+(grad[c][2]*k);
			d[i+3] = (grad[c-1][3]*(1-k))+(grad[c][3]*k);
			
		}
		
		CL("GradientMap("+grad+"): "+(T()-t1));
		
		IMGFX.AddHistory("Gradient Map");
		
	},
	
	/* Replaces a color with another */
	ReplaceColor: function(ca, cb, tol) {
		if(!IMGFX.target) return;
		
		if(ca == undefined) {
			// Default to replace background with foreground color
			ca = MainColors.bg;
			cb = MainColors.fg;
		}
		
		if(tol == null || tol < 0) tol = 0;
				
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = IMGFX.target.width*IMGFX.target.height, hue = j = i = t = 0, hsl = RGB2HSL(ca), t1 = T();
		
		for(; j < dl; j++) {
			i = j*4;
			
			t = (ABS(d2[i]-ca[0])+ABS(d2[i+1]-ca[1])+ABS(d2[i+2]-ca[2]))/tol;
			
			if(t <= 1) {
				d[i] = d2[i]*t + cb[0]*(1-t);
				d[i+1] = d2[i+1]*t + cb[1]*(1-t);
				d[i+2] = d2[i+2]*t + cb[2]*(1-t);
				d[i+3] = d2[i+3]*t + cb[3]*(1-t);
			} else {
				d[i] = d2[i];
				d[i+1] = d2[i+1];
				d[i+2] = d2[i+2];
				d[i+3] = d2[i+3];
			}
			
		}
		
		CL("ReplaceColor("+ca+", "+cb+", "+tol+"): "+(T()-t1));
		
		//IMGFX.AddHistory("Replace Color");
		
	},
	
	/* Add noise */
	AddNoise: function(a) {
		if(!IMGFX.target) return;
		
		if(a == undefined || a < 0)
			a = 64;
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = IMGFX.target.width*IMGFX.target.height, t = j = i = 0, m = a*2, t1 = T();
		
		for(; j < dl; j++) {			
			i = j*4;
			
			t = (Math.random()*m)-a;
			d[i] = d2[i]+t;
			d[i+1] = d2[i+1]+t;
			d[i+2] = d2[i+2]+t;
		}
		
		CL("AddNoise("+a+"): "+(T()-t1));
		
	},
	
	/* Median noise reduction by value
	** r =	sample radius
	**
	** TODO:	Only read pixels not already known and overwrite pixels no longer within radius
	**			I.e. radius = 1 means only read the right-most 3 pixels as progress is made
	**			This reduces a potential exponential O((1 + r*2)^2) algorithm to just O(1 + r*2) */
	BoxBlur: function(r) {
		if(!IMGFX.target) return;
		
		if(!r || r < 1) r = 1;
		
		/*
		*	dl =	loop iterations / pixels
		*	ppl =	pixels per line (times 4 for indexes)
		*	pr =	pixels per line in radius
		*	r2 = 	number of pixels compared per loop iteration
		*	rh = 	median index in luma array
		*	l = 	array of luma tones
		*	m = 	median temp var
		*	i = 	pixel index
		*	j = 	loop count
		*	k = 	radius loop count
		*	t1 = 	algorithm start time
		*/
		
		var d = IMGFX.target.data, w = IMGFX.target.width, h = IMGFX.target.height, d2 = IMGFX.GetHistory("last").img.data,
			dl = w*h, ppl = w*4, pr = 1 + r*2, r2 = pr*pr, r4 = (r*4); rh = CEIL(r2/2)-1, l = new Array(r2), m = s = e = i = j = k = mi1 = mi2 = mi3 = mi4 = 0, t1 = T();
			
		for(var ll = 0; ll < r2; ll++) {
			l[ll] = 128;
		}
	
		for(; j < dl; j++) {
			
			i = j*4;
			
			if(j % w == 0) {
				e += ppl;
				s = e-ppl;
				mi1 = d[i], mi2 = d[i+1], mi3 = d[i+2], mi4 = d[i+3];
			}
			
			for(k = 0; k < pr; k++) {
			
				p = ((k-r)*ppl)+r4;
				
				//l.shift();
			
				if(i+p > -1 && i+p < dl*4 && i+r4 < e) {
					
					//l.push((d2[i+p]+d2[i+p+1]+d2[i+p+2])/3);
					//mi = ((mi*(r2-1))+((d2[i+p]+d2[i+p+1]+d2[i+p+2])/3))/r2;
					mi1 = ((mi1*(r2-1))+d2[i+p])/r2
					mi2 = ((mi2*(r2-1))+d2[i+1+p])/r2
					mi3 = ((mi3*(r2-1))+d2[i+2+p])/r2
					mi4 = ((mi4*(r2-1))+d2[i+3+p])/r2
				} else {
					//l.push((d2[i]+d2[i+1]+d2[i+2])/3);
					//mi = ((mi*(r2-1))+((d2[i]+d2[i+1]+d2[i+2])/3))/r2;
					mi1 = ((mi1*(r2-1))+d2[i])/r2
					mi2 = ((mi2*(r2-1))+d2[i+1])/r2
					mi3 = ((mi3*(r2-1))+d2[i+2])/r2
					mi4 = ((mi4*(r2-1))+d2[i+3])/r2
					
					//mi1 = 255, mi2 = 0, mi3 = 0;
				}
			}
			
			//m = l[rh];
			
			d[i] = mi1;
			d[i+1] = mi2;
			d[i+2] = mi3;
			d[i+3] = mi4;
			
		}
		
		CL("Reduce Noise("+r+"): "+(T() - t1));
		
		//IMGFX.AddHistory("Reduce Noise");
		
	},
	
	/* Motion blur */
	MotionBlur: function(a) {
		if(!IMGFX.target) return;
		
		if(a == undefined || a < 1)
			a = 5;
		
		var d = IMGFX.target.data, w = IMGFX.target.width, h = IMGFX.target.height, d2 = IMGFX.GetHistory("last").img.data, dl = w*h, i = j = k = l = 0, t1 = T();
		
		for(; j < dl; j++) {
			
			i = j*4;
			
			for(k = 0; k < a; k++) {
				
				l = (k % 2 == 1 ? i+(-k*4) : i+(k*4));
				
				d[i] = ((d[i]*k)+d2[l])/(1+k);
				d[i+1] = ((d[i+1]*k)+d2[l+1])/(1+k);
				d[i+2] = ((d[i+2]*k)+d2[l+2])/(1+k);
				d[i+3] = ((d[i+3]*k)+d2[l+3])/(1+k);
				
			}
			
		}
		
		CL("MotionBlur("+a+"): "+(T()-t1));
		
		IMGFX.AddHistory("Motion Blur");
		
	},
	
	Colorize: function() {
		if(!IMGFX.target) return;
		
		var d = IMGFX.target.data, last = IMGFX.GetHistory("last");
		
		if(!last) return;
	
		var d2 = last.img.data, dl = IMGFX.target.width*IMGFX.target.height, ra = new Array(768), w = [0.2627, 0.6780, 0.0593],
		up_r = up_g = up_b = low_r = low_g = low_b = i = j = t = 0, t1 = T();
		
		for(j = 0; j < 256; j++) {
			
			i = j*3;
			
			up_r = Clamp(j/w[0], 0, 255);
			up_g = Clamp(j/w[1], 0, 255);
			up_b = Clamp(j/w[2], 0, 255);
			
			low_g = Clamp(255-((255/w[1])-(j/w[1])), 0, up_g);
			
			ra[i+1] = ROUND(Math.random()*(up_g-low_g))+low_g;
			ra[i] = Clamp(ROUND(up_g-((ra[i+1]-low_g)*(w[1]/w[0]))), 0, up_r);
			
			ra[i+2] = Clamp(ROUND(up_g-((ra[i+1]-low_g)*(w[1]/w[2]))), 0, up_b);
			
			/*if(ra[i+1] < 0) {
				ra[i] += (ra[i+1]*(w[1]/w[0]));
				if(ra[i] < 0) {
					ra[i+2] += (ra[i]*(w[0]/w[2]));
					ra[i] = 0;
				}
				ra[i+1] = 0;
			}*/
			
			
			// Blue has the most leeway
			/*ra[i+2] = ROUND(Math.random()*255);
			
			ra[i] = ROUND(Math.random()*255);
			
			ra[i+1] = ROUND(1.474926254*j - 0.387463127*ra[i] - 0.087463127*ra[i+2]);
			
			if(ra[i+1] < 0) ra[i+1] = 0;
			else if(ra[i+1] > 255) ra[i+1] = 255;*/
			//(ROUND((ra[i]*w[0])+(ra[i+1]*w[1])+(ra[i+2]*w[2])) != j)
			//	CL(ROUND((ra[i]*w[0])+(ra[i+1]*w[1])+(ra[i+2]*w[2]))+" "+j);
			
		}
		
		for(j = 0; j < dl; j++) {
			
			i = j*4;
			
			t = ROUND((d2[i]*w[0])+(d2[i+1]*w[1])+(d2[i+2]*w[2]))*3;
			
			/*r = Math.random()*255;
			b = Math.random()*255;
			g = 1.474926254*t - 0.387463127*r - 0.087463127*b*/
			
			
			
			//d[i] = d[i+1] = d[i+2] = ROUND((r*0.2627)+(g*0.6780)+(b*0.0593));
			
			d[i] = ra[t]
			d[i+1] = ra[t+1];
			d[i+2] = ra[t+2];
			
		}
		
		//CL("Colorize(): "+(T() - t1));
	},
	
	/* Apply a brush to the image */
	ApplyBrush: function(x, y, c, brush, erase) {
		if(!IMGFX.target) return;
		
		var d = IMGFX.target.data, w = IMGFX.target.width, h = IMGFX.target.height, dl = d.length,
		bd = brush.data, bw = brush.width, bh = brush.height, bdl = bw*bh,
		r1 = FLOOR(bw/2), r2 = FLOOR(bh/2), pw = w*4,
		bs = ((x-r1)+((y-r2)*w))*4, p = bs, 
		i = j = a1 = a2 = 0;
		
		if(c == undefined) {
			c[0] = 255, c[1] = 0, c[2] = 0, c[3] = 255;
		}
		
		for(; j < bdl; j++) {
			
			i = j*4;
			
			if(p >= 0 && p < dl) {
				a1 = (c[3]*bd[i+3])/255;
				a2 = a1/255;
				if(erase) {
					d[p+3] = d[p+3]*(1-a2)-a1;
				} else {
					d[p] = d[p]*(1-a2)+c[0]*a2;
					d[p+1] = d[p+1]*(1-a2)+c[1]*a2;
					d[p+2] = d[p+2]*(1-a2)+c[2]*a2;
					d[p+3] = d[p+3]*(1-a2)+a1;
				}
			}
			
			if(j % bw == 0)
				p = bs+(j/bw)*pw;
			else
				p += 4;
			
		}
		
	},
	
	/* Fill tool */
	Fill: function(x, y, col, tol) {
		if(!IMGFX.target) return;
	
		var t1 = T(), d = IMGFX.target.data, w = IMGFX.target.width, h = IMGFX.target.height, pw = w*4, last = IMGFX.GetHistory("last");
		
		if(!last) return;
		
		var d2 = last.img.data, dl = w*h, dl4 = dl*4, s = (x+(y*w))*4, filled = new Uint8ClampedArray(dl), sc = [d2[s], d2[s+1], d2[s+2]], scsum = sc[0]+sc[1]+sc[2], cb = 1,
		
		// Returns tolerance of a pixel
		getTol = function(p) {
			return ABS((d2[p]+d2[p+1]+d2[p+2])-scsum)/tol;
		},
		
		fillDot = function(i, diff) {
			d[i] = (d2[i]*diff)+(col[0]*(1-diff));
			d[i+1] = (d2[i+1]*diff)+(col[1]*(1-diff));
			d[i+2] = (d2[i+2]*diff)+(col[2]*(1-diff));
			filled[i/4] = 1;
		},
		
		fillSegment = function(p) {
			var div = p/pw, start_w = FLOOR(div)*pw, end_w = CEIL(div)*pw, e = 0, i = 0;
			
			for(i = 0; i < 4; i++) {
			
				if(i == 0) e = p+pw;
				else if(i == 1) e = p-pw;
				else if(i == 2) e = p-4;
				else if(i == 3) e = p+4;					
				
				if(filled[e/4] || e < 0 || e > dl4 || (i > 1 && (e < start_w || e >= end_w))) continue;
				
				diff = getTol(e);
				if(diff <= 1) {
					fillDot(e, diff);					
					fillSegment(e);
				}
			}
		};
		
		fillSegment(s);
		
		CL("Fill("+x+", "+y+", "+col+", "+tol+"): "+(T()-t1));
		
		//IMGFX.AddHistory("Fill");
		
	},
	
	/* Make the image fuzzier */
	Fuzzify: function(amt) {
		if(!IMGFX.target) return;
	
		var d = IMGFX.target.data, w = IMGFX.target.width, pw = w*4, last = IMGFX.GetHistory("last");
		
		if(!last) return;
		
		if(!amt || amt <= 1) amt = 2;
		else if(amt > pw) amt = pw;
		
		var d2 = last.img.data, dl = w*IMGFX.target.height, halfamt = CEIL(amt/2), s = e = i = j = t = 0, t1 = T();
		
		for(j = 0; j < dl; j++) {
			
			i = j*4;
			
			if(j % w == 0) {
				e += pw;
				s = e-pw;
			}
			
			t = FLOOR((Math.random()*amt)-halfamt)*4;
			
			if(i+t >= e) t -= pw;
			else if(i+t < s) t += pw;
			
			d[i] = d2[i+t];
			d[i+1] = d2[i+1+t];
			d[i+2] = d2[i+2+t];
			d[i+3] = d2[i+3+t];
			
		}
		
	},
	
	/* Compute the averages for image comparison
	** 'mag' is a percentage (0 to 1 exclusive) to split avgs of image into
	** The lower the mag, the more averages returned
	** Default is 0.1 or 10x10 grid of averages */
	ComputeAvgs: function(mag) {
		if(!IMGFX.target) return;
		
		if(mag == undefined || mag <= 0 || mag > 1) mag = 0.1;
		
		var mag_w = FLOOR(mag*IMGFX.target.width), mag_h = FLOOR(mag*IMGFX.target.height), mag_size = mag_w*mag_h, mag_q = FLOOR(1/mag);
		
		IMGFX.Resize(mag_w/mag, mag_h/mag);
	
		var d = IMGFX.target.data, w = IMGFX.target.width, h = IMGFX.target.height, pw = w*4, dl = w*h, avg = new Array(mag_q*mag_q), t = [0, 0, 0], s = e = i = j = b = ac = 0;

		for(j = 0; j < dl; j++) {
		
			// x offset from left + y offset + x block offset + y block offset * 4
			i = ((b%mag_w) + (FLOOR(b/mag_w)*w) + (ac%mag_q)*mag_w + (FLOOR(ac/mag_q)*w*mag_h))*4;
			
			if(i < 0 || i >= dl*4) CL("ERROR at ac = "+ac);
			
			t[0] = (d[i]+(t[0]*b))/(b+1);
			t[1] = (d[i+1]+(t[1]*b))/(b+1);
			t[2] = (d[i+2]+(t[2]*b))/(b+1);
			
			b++;
			
			if(b >= mag_size) {
				avg[ac++] = [ROUND(t[0]), ROUND(t[1]), ROUND(t[2])];
				b = 0;
			}
			
			if(ac >= mag_q*mag_q) break;
			
		}
		
		return avg;
		
	},
	
	/* Compare image average maps - This works nicely on resized and noise variation images
	** There are 3 important measurements here:
	** TOTAL DIFFERENCE	= sum of all differences between colors
	** CLOSE MATCHES	= # of matches where each diff is < 10
	** PERFECT MATCHES	= # of matches where each diff is 0
	**
	** TODO: Recognize color alterations and 90 degree rotations */
	CompareAvgs: function(avg1, avg2) {
		
		if(avg1 == undefined || avg2 == undefined || avg1.length != avg2.length) return;
		
		var l = avg1.length, diff = new Array(l), totaldiff = cms = pms = dr = dg = db = i = 0;
		
		for(; i < l; i++) {
			
			dr = ABS(avg1[i][0]-avg2[i][0]);
			dg = ABS(avg1[i][1]-avg2[i][1]);
			db = ABS(avg1[i][2]-avg2[i][2]);
			
			// Total difference (lower is better)
			totaldiff += (dr + dg + db);
			
			// Close matches (should be at least 90%)
			if(dr < 10 && dg < 10 && db < 10) cms++;
			
			// Perfect matches (usually isn't very high)
			if(dr == 0 && dg == 0 && db == 0) pms++;
			
			diff[i] = [dr, dg, db];
		}
		
		CL("Total Difference: "+totaldiff);
		CL("Close matches: "+cms+"/"+l);
		CL("Perfect matches: "+pms+"/"+l);
		
		return diff;
		
	},
	
	/* Samples a single color within a circle */
	SampleColor: function(x, y, amt) {

		if(!IMGFX.target) return;
		
		var d = IMGFX.target.data, w = IMGFX.target.width;
		
		if(amt == 1) {
			var i = (x*4)+(y*w*4);
			return [d[i], d[i+1], d[i+2], d[i+3]];
		}
		
	},
	
	/* How fast can Javascript generate an image? */
	GenTest: function(size) {
		var img = GC(canvas).createImageData(size, size);
		
		var d = img.data, dl = size*size, i = j = k = 0;
		
		var t1 = T();
		
		while(j < dl) {				
			i = j*4;
			
			d[i] = FLOOR(Math.random()*255);
			d[i+1] = ROUND(Math.random()*255);
			d[i+2] = CEIL(Math.random()*255);
			d[i+3] = CEIL((Math.random()*128)+127);
			j++;
		}
		
		CL(T() - t1);
		
		
		IMGFX.target = ImageArea.img = img;
		ImageArea.open = true;
		Update();
	},
	
	/* Speed test for individual algorithms */
	SpeedTest: function(func, arg, iter, freq, sum, cb) {		
		if(iter < 1) {
			cb(sum);
			return;
		}
		if(sum == null) {
			sum = 0;
			CL("Performing speed test for "+func+"...");
			cb = function(s) {
				var avg = s/iter;
				CL("Average time for "+func+": "+(ROUND(avg*1000)/1000)+" ms");
			}
		}
		
		sum = sum+IMGFX[func].apply(IMGFX, arg);
		
		setTimeout(function() {
			IMGFX.SpeedTest(func, arg, iter-1, freq, sum, cb);
		}, freq);
	}
	
};















