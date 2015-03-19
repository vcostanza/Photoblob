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

	// Target variables
	target: null,
	td: null,
	tw: 0,
	th: 0,
	
	// History variables
	history: new Array(),
	current: 0,
	
	// Misc
	selection: null,
	speedTesting: false,
	
	/* Set image target */
	SetTarget: function(img) {
		this.target = img;
		this.td = img.data;
		this.tw = img.width;
		this.th = img.height;
		this.SEL_Clear();
	},
	
	/* Return the target's image data */
	GetTarget: function() {		
		if(!IMGFX.target) return null;
		
		var w = IMGFX.tw, fw = w, h = IMGFX.th, fh = h, s = IMGFX.selection, o = 0, m = null;
		
		if(s) {			
			o = s.x+(s.y*w);
			w = s.w;
			h = s.h;
			m = s.mask;
		}
		
		return {w: w, h: h, fw: fw, fh: fh, o: o, m: m};
	},
	
	/*
	 * Selection functions
	*/
	
	/* Initiate selection */
	SEL_Init: function(s) {
		delete this.selection;
		if(s == null || s.w <= 0 || s.h <= 0 || !IMGFX.target) return false;
		return true;
	},
	
	/* Remove selection */
	SEL_Clear: function() {
		delete this.selection;
		Update();
	},
	
	/* Select entire image */
	SEL_All: function() {
		IMGFX.SEL_SetBox(new Selection(0, 0, IMGFX.tw, IMGFX.th));
	},
	
	/* Remove selection */
	SEL_Invert: function() {
		if(this.selection) {
			
			var sel = this.selection, sm = sel.mask, w = IMGFX.tw, h = IMGFX.th, sx = Clamp(sel.x, 0, w), sy = Clamp(sel.y, 0, h), sw = Clamp(sx+sel.w-1, 0, w)-sx, sh = Clamp(sy+sel.h-1, 0, h)-sy, i = 0;
			
			// Error checking
			if(sw == sx || sh == sy) {
				IMGFX.SEL_Clear();
				return;
			}
			
			var s = new Selection(0, 0, IMGFX.tw, IMGFX.th), px = 0, py = 0, j = 0;
			
			s.mask = new Uint8ClampedArray(w*h);
			
			// Find inverted bounds
			for(; i < w*h; i++) {
				if(WC(px, py, sx, sy, sw, sh)) {
					s.mask[i] = 255-sm[j];
					j++;
				} else {
					s.mask[i] = 255;
				}
				px++;
				if(px == w) {
					px = 0;
					py++;
				}
			}
			
			IMGFX.SEL_SetImage(s);
			this.selection = s;
			Update();
		} else {
			IMGFX.SEL_All();
		}
	},
	
	/* Set box selection */
	SEL_SetBox: function(s) {
		
		// Check that the selection is valid
		if(IMGFX.SEL_Init(s)) {
			var sm = s.mask = new Uint8ClampedArray(s.w*s.h), i = 0;
			
			// Fill selection
			for(; i < sm.length; i++) {
				//sm[i] = 128+(Math.cos(((i%s.w)/s.w)*Math.PI)*128);
				sm[i] = 255;
			}
			
			// Set draw image
			IMGFX.SEL_SetImage(s);
			
			this.selection = s;
			Update();
		}
	},
	
	/* Set polygon selection based on array of points
	** FORMAT: p = [x0, y0, x1, y1, ... xn, yn]
	**
	** TODO: Figure out how to fix the "star" problem */
	SEL_SetPoly: function(p) {
		
		//CL(p.toString());
		
		// First get bounds of polygon
		var x = IMGFX.tw, y = x, w = 0, h = 0, i = 0, j = 0;
		for(; i < p.length; i+=2) {
			p[i] = Clamp(p[i], 0, IMGFX.tw);
			p[i+1] = Clamp(p[i+1], 0, IMGFX.th);
			if(p[i] < x) x = p[i];
			else if(p[i] > w) w = p[i];
			if(p[i+1] < y) y = p[i+1];
			else if(p[i+1] > h) h = p[i+1];
		}
		
		w -= x;
		h -= y;
		
		var s = new Selection(x, y, w, h);
		
		// Create selection
		if(IMGFX.SEL_Init(s)) {
			
			var sl = s.w*s.h, sm = s.mask = new Uint8ClampedArray(sl), bounds = new Array(), buf = null, inside = false, k = 0;
			
			// Define selection bounds based on line rasterization
			for(i = 0; i < p.length-2; i+=2) {
				buf = Lerp2D(p[i], p[i+1], p[i+2], p[i+3]);
				for(j = 0; j < buf.length; j += 2) {
					k = Clamp(buf[j]-x, 0, w-1)+(Clamp(buf[j+1]-y, 0, h-1)*s.w);
					if(k < sl) {
						sm[k] = 128;
						bounds.push(k);
					}
				}
			}
			
			// Sort bounds ascending value
			bounds.sort(function(a, b){return a-b;});
			
			// Add fill
			for(i = 0; i < bounds.length-1; i++) {
				
				// Skip if next pixel is next line
				if(!(bounds[i] >= s.w && bounds[i] < sl-s.w && FLOOR(bounds[i]/s.w) == FLOOR(bounds[i+1]/s.w))) {
					//inside = false;
					continue;
				}
				
				if(bounds[i+1]-bounds[i] < 2) continue;
				
				//inside = !inside;
				
				for(j = bounds[i]+1; j < bounds[i+1]; j++) {
					if(sm[j-s.w] > 0 && sm[j-1] != 0) sm[j] = 255;
				}
			}
			
			// Remove unwanted areas
			var remove = false;
			for(i = bounds.length-1; i > 0; i--) {
				
				// Skip if next pixel is next line
				if(!(bounds[i] >= s.w && bounds[i] < sl-s.w && FLOOR(bounds[i]/s.w) == FLOOR(bounds[i-1]/s.w) && bounds[i]-bounds[i-1] >= 2)) {
					continue;
				}
				
				remove = restart = false;
				
				// Scan each bound
				for(j = bounds[i]-1; j > bounds[i-1]; j--) {
					
					// Found collision	
					if(!remove && (sm[j+s.w] == 0 || sm[j+1] == 0 || sm[j] == 255 && (sm[j-1] == 0 || sm[j-s.w] == 0))) {
						remove = true;
						j = bounds[i]-1;
					}
					
					// Clear selection pixel
					if(remove) sm[j] = 0;
					
					// Did we forget a collision?
					// This usually happens with spiral selections
					if(sm[j] == 0 && sm[j+s.w] == 255) {
						
						// Find bounds of pixel below
						for(k = 0; k < bounds.length-1; k++) {
							
							// Go back to the bound and scan again
							if(j+s.w > bounds[k] && j+s.w < bounds[k+1]) {
								i = k+2;
								j = bounds[i]-1;
								remove = false;
								break;
							}
						}
					}					
				}
			}
			
			// Set draw image
			IMGFX.SEL_SetImage(s);
			
			this.selection = s;
			Update();
		}
	},
	
	/* Set selection draw image */
	SEL_SetImage: function(s) {
		if(s.img == null) {
			
			// Two image states (one inverted) since selections are typically animated
			s.img = [ImageData(s.w, s.h), ImageData(s.w, s.h)];
			
			// Only draw pixels where the border is
			var sm = s.mask, d1 = s.img[0].data, d2 = s.img[1].data, inside = false, dl = s.w*s.h*4, i = 0, j = 0, px = 0,
			
			// Set pixel to random shade between black and white
			randPix = function(p) {
				d1[p] = d1[p+1] = d1[p+2] = FLOOR(RND()*255);
				d2[p] = d2[p+1] = d2[p+2] = 255-d1[p];
				d1[p+3] = d2[p+3] = 255;
			};
			
			for(; i < dl; i += 4) {
				
				if(inside) {					
					// Upcoming empty area or new line
					if(sm[j+1] == 0 || px+1 == s.w) {
						randPix(i);
						inside = false;
					// Top or bottom is empty
					} else if(!(sm[j+s.w] && sm[j-s.w])) {
						randPix(i);
					}
				} else {
					// Inside selection
					if(sm[j] > 0) {
						randPix(i);
						inside = true;
					}
				}
				
				px++;
				j++;
				// Reset state when new line
				if(px == s.w) {
					px = 0;
					inside = false;
				}
				
			}
			
			// putImageData doesn't blend the alpha correctly, so I need to convert data -> images
			s.img = [IMG(DataURL(s.img[0])), IMG(DataURL(s.img[1]))];
			
			// Animation vars
			s.state = 0;
			s.time = T();
		}
	},
	
	/* Default pixel set */
	PIX_Default: function(i, d, d2) {
		d[i] = d2[i];
		d[i+1] = d2[i+1];
		d[i+2] = d2[i+2];
		d[i+3] = d2[i+3];
	},
	
	/* Set pixel to black */
	PIX_Black: function(i, d) {
		d[i] = d[i+1] = d[i+2] = 0;
		d[i+3] = 255;
	},
	
	/* Mix pixels with selection mask */
	// This should be called immediately after the pixel is modified
	PIX_MixSelection: function(i, d, d2, m) {
		d[i] = FLOOR((d[i]*m)+(d2[i]*(1-m)));
		d[i+1] = FLOOR((d[i+1]*m)+(d2[i+1]*(1-m)));
		d[i+2] = FLOOR((d[i+2]*m)+(d2[i+2]*(1-m)));
	},
	
	/* Separated for use when necessary */
	PIX_MixSelectionAlpha: function(i, d, d2, m) {
		d[i] = FLOOR((d[i]*m)+(d2[i]*(1-m)));
		d[i+1] = FLOOR((d[i+1]*m)+(d2[i+1]*(1-m)));
		d[i+2] = FLOOR((d[i+2]*m)+(d2[i+2]*(1-m)));
		d[i+3] = FLOOR((d[i+3]*m)+(d2[i+3]*(1-m)));
	},
	
	/* Load history at index */
	LoadHistory: function(index, clear) {
		if(!ImageArea.open || IMGFX.history.length == 0) return;
		
		var oldimg = IMGFX.GetHistory(index).img;
		if(oldimg.width != IMGFX.tw || oldimg.height != IMGFX.th) {
			IMGFX.SetTarget(ImageData(oldimg.width, oldimg.height));
		}
			
		var d = IMGFX.td, d2 = oldimg.data, dl = IMGFX.tw*IMGFX.th, i = 0, j = 0;
		
		for(; j < dl; j++) {
			i = j*4;
			
			d[i] = d2[i];
			d[i+1] = d2[i+1];
			d[i+2] = d2[i+2];
			d[i+3] = d2[i+3];			
		}
		
		if(clear == true) IMGFX.ClearHistory(true);
		
		if(index != "last") {
			IMGFX.current = index;
			PBOX.View3D.update();
		}
			
		ImageArea.update();
		Update();
	},
	
	/* Return history at index */
	GetHistory: function(index) {
		if(IMGFX.history.length == 0) return undefined;
		
		if(index == "last") index = IMGFX.current;
		
		return IMGFX.history[index];
	},
	
	/* Add current image data to history buffer
	** func		Function name (string) */
	AddHistory: function(func) {
		if(!IMGFX.target) return;
		
		if(IMGFX.current < IMGFX.history.length-1)
			IMGFX.history.splice(IMGFX.current+1, IMGFX.history.length-IMGFX.current-1);
			
		IMGFX.history.push({name: func, img: CloneImg(IMGFX.target)});
		IMGFX.current = IMGFX.history.length-1;
		Update();
		
		PBOX.View3D.update();
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
	
	/*****************************
	 * IMAGE EFFECT FUNCTIONS *
	 *****************************/
	
	/* These are the most common variables used in the effect functions below
	 * d	RGB array to write to
	 * d2	RGB array to read from
	 * img	Image data such as width, height, and selection data
	 * w	Image/selection width
	 * h	Image/selecton height
	 * fw	Full image width
	 * fh	Full image height
	 * o	Selection offset
	 * pw	Pixels per line * 4
	 * dl	Working array length; Break point
	 * px	Loop: X offset
	 * py	Loop: Y offset
	 * p	Loop: Pixel index
	 * i	Loop: Mask index
	 * t1	Benchmark start time
	 */

	// Each function more or less follows this framework:
	Example: function() {
		if(!IMGFX.target) return;	// Stop if there's no image loaded
		
		// Typical variables
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(),
			w = img.w, h = img.h, fw = img.fw, fh = img.fh, o = img.o*4, pw = fw*4, dl = w*h, px = 0, py = 0, p = o, i = 0, t1 = T();
		
		// Loop until there are no more pixels
		for(; i < dl; i++) {
		
			if(!m || m[i] > 0) {
				// This is where the pixels are actually modified
				// NOTE: Always write to 'd' and always read from 'd2'
				d[p] = d2[p];		// Red channel
				d[p+1] = d2[p+1]	// Green channel
				d[p+2] = d2[p+2]	// Blue channel
				d[p+3] = d2[p+3]	// Alpha channel
				
				// Apply mask, only if it's less than 255 (max)
				if(m && m[i] < 255) IMGFX.PIX_MixSelection(p, d, d2, m[i]/255);
			}
			
			// By the way, this example simply syncs the current image with the last saved history data
			// Most of the time this shouldn't change anything
			
			// Increment X offset and reset if I'm on a new line, also increment Y offset
			// Incrementation should almost always look like this
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}
		}
		
		// Update the image area so we can see the result
		// This applies zoom and grab offset to the image
		ImageArea.update();
		// Note: FX that are called in a loop (like ApplyBrush) shouldn't call this here (should only be called once per frame)
		
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
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, h = img.h, fw = img.fw, o = img.o*4, pw = fw*4, dl = w*h,
			m = img.m, p = o, px = 0, py = 0, i = 0, l = new Float32Array(3), t1 = T();
		
		// Luma coefficients
		if(g > 6) {
			if(g == 7) l.set([0.299, 0.587, 0.114]);
			else if(g == 8) l.set([0.2126, 0.7152, 0.0722]);
			else l.set([0.2627, 0.6780, 0.0593]);
		}
		
		for(; i < dl; i++) {
			if(!m || m[i] > 0) {				
				switch(g) {
					case 0:	d[p] = d[p+1] = d[p+2] = (d2[p]+d2[p+1]+d2[p+2])/3; break;
					case 1: d[p] = d[p+1] = d[p+2] = MIN(d2[p], d2[p+1], d2[p+2]); break;
					case 2: d[p] = d[p+1] = d[p+2] = MAX(d2[p], d2[p+1], d2[p+2]); break;
					case 3: d[p] = d[p+1] = d[p+2] = (MIN(d2[p], d2[p+1], d2[p+2])+MAX(d2[p], d2[p+1], d2[p+2]))/2; break;
					case 4: d[p] = d[p+1] = d[p+2] = d2[p]; break;
					case 5: d[p] = d[p+1] = d[p+2] = d2[p+1]; break;
					case 6: d[p] = d[p+1] = d[p+2] = d2[p+2]; break;
					default: d[p] = d[p+1] = d[p+2] = (d2[p]*l[0])+(d2[p+1]*l[1])+(d2[p+2]*l[2]);
				}				
				if(m && m[i] < 255) IMGFX.PIX_MixSelection(p, d, d2, m[i]/255);
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}
		}
		
		ImageArea.update();
		
		//CL("Grayscale("+g+"): "+(T() - t1));
		
		return T()-t1;
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
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, h = img.h, fw = img.fw, o = img.o*4, pw = fw*4, dl = w*h, m = img.m, ma, p = o, px = 0, py = 0, i = 0, t1 = T();
		
		for(; i < dl; i++) {
			
			if(!m || m[i] > 0) {
				if(m && m[i] < 255) {					
					ma = ((2*m[i])-255)/255;
					if(r) d[p] = m[i]-(ma*d2[p]); else d[p] = d2[p];
					if(g) d[p+1] = m[i]-(ma*d2[p+1]); else d[p+1] = d2[p+1];
					if(b) d[p+2] = m[i]-(ma*d2[p+2]); else d[p+2] = d2[p+2];
				} else {
					if(r) d[p] = 255-d2[p]; else d[p] = d2[p];
					if(g) d[p+1] = 255-d2[p+1]; else d[p+1] = d2[p+1];
					if(b) d[p+2] = 255-d2[p+2]; else d[p+2] = d2[p+2];
				}
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}
		}
		
		ImageArea.update();
		
		//CL("InvertColors("+r+", "+g+", "+b+"): "+(T() - t1));
		
		return T()-t1;
	},
	
	/* Auto contrast - stretch image contrast so it reaches pure black and pure white (may alter color) */
	AutoContrast: function() {
		if(!IMGFX.target) return;
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), m = img.m,
			w = img.w, h = img.h, fw = img.fw, o = img.o*4, pw = fw*4, dl = w*h, min = 255, max = 0, t = 0, mind = 0, maxd = 0, p = o, px = 0, py = 0, i = 0, t1 = T();

		// First find the brightest and darkest pixels based on average
		for(; i < dl; i++) {
			if(!m || m[i] > 0) {
				t = (d2[p]+d2[p+1]+d2[p+2])/3;
				if(t < min) {
					min = t;
					mind = p;
				} else if(t > max) {
					max = t;
					maxd = p;
				}
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
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
		px = py = i = 0;
		p = o;
		for(; i < dl; i++) {
			if(!m || m[i] > 0) {
				d[p] = 255-ROUND((255-(d2[p]/maxd[0]))/mind[0]);
				d[p+1] = 255-ROUND((255-(d2[p+1]/maxd[1]))/mind[1]);
				d[p+2] = 255-ROUND((255-(d2[p+2]/maxd[2]))/mind[2]);
				if(m && m[i] < 255) IMGFX.PIX_MixSelection(p, d, d2, m[i]/255);
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}
		}
		
		ImageArea.update();
		
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
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, h = img.h, fw = img.fw, o = img.o*4, pw = fw*4, dl = w*h, m = img.m, p = o, px = 0, py = 0, n, i = 0, t1 = T();
		
		for(; i < dl; i++) {
			if(!m || m[i] > 0) {
				if(type == 1) {
					d[p] = d2[p]+(val-128);
					d[p+1] = d2[p+1]+(val-128);
					d[p+2] = d2[p+2]+(val-128);
				} else {
					n = (type == 0 ? 128 : 255-((d2[p]+d2[p+1]+d2[p+2])/3));
					d[p] = (d2[p]/n)*val;
					d[p+1] = (d2[p+1]/n)*val;
					d[p+2] = (d2[p+2]/n)*val;
				}
				if(m && m[i] < 255) IMGFX.PIX_MixSelection(p, d, d2, m[i]/255);
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}
		}
		
		ImageArea.update();
		
		//CL("Brightness("+val+", "+type+"): "+(T() - t1));
		
		return T()-t1;
	},
	
	/* Shift each pixel's hue
	** h = 	The amount to change the hue
	** 
	** TODO: Improve performance (especially on Chrome) */
	ChangeHSL: function(hue, sat, lum) {
		if(!IMGFX.target) return;
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, h = img.h, fw = img.fw, o = img.o*4, pw = fw*4, dl = w*h, m = img.m, p = o, px = 0, py = 0, n, i = 0, t1 = T();
		
		for(; i < dl; i++) {
			if(!m || m[i] > 0) {
				n = ShiftHSL(d2[p], d2[p+1], d2[p+2], hue, sat, lum);
				d[p] = n[0];
				d[p+1] = n[1];
				d[p+2] = n[2];
				if(m && m[i] < 255) IMGFX.PIX_MixSelection(p, d, d2, m[i]/255);
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}
		}
		
		ImageArea.update();
		
		//CL("ChangeHSL("+h+"): "+(T() - t1));
		
		return T()-t1;		
	},
	
	/* Crop image */
	Crop: function(x, y, w, h) {
		if(!IMGFX.target) return;
	
		var sel = IMGFX.selection;
	
		if(x == undefined) {
			if(!sel) return;
			x = sel.x, y = sel.y, w = sel.w, h = sel.h;
		}
		
		var old_w = IMGFX.tw;
		
		// Create resized image container
		IMGFX.SetTarget(ImageData(w, h));
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, dl = w*h*4, s = (x+(y*old_w))*4, p, w4 = w*4, pw = old_w*4, px = 0, py = 0, i = 0, t1 = T();
		
		for(; i < dl; i += 4) {
			
			p = s+px+py;
			
			d[i] = d2[p];
			d[i+1] = d2[p+1];
			d[i+2] = d2[p+2];
			d[i+3] = d2[p+3];
			
			px += 4;
			if(px == w4) {
				px = 0;
				py += pw;
			}
		}
		
		ImageArea.update();
		
		Update();
		IMGFX.AddHistory("Crop");
		
		//CL("Crop(): "+(T() - t1));
		
		return T()-t1;
	},
	
	/* Shift pixels based on x and y offset
	**
	** x = 	amount of pixels to shift horizontally
	** y =	amount of pixels to shift vertically */
	Shift: function(x, y) {
		if(!IMGFX.target) return;
		
		var img = IMGFX.GetTarget(), w = img.w, h = img.h, pw2 = w*4;
		
		// Set defaults (offset image halfway)
		if(x == undefined) { x = FLOOR(w/2); }
		if(y == undefined) { y = FLOOR(h/2); }
		
		// Wrap offsets
		x = (x%w)*4;
		y = (y%h);
		
		// Convert negative offsets to positive
		if(x < 0) x = pw2+x;
		if(y < 0) y = h+y;
			
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, fw = img.fw, o = img.o*4,
			pw = fw*4, dl = w*h, m = img.m, p = o, px = 0, n, i = 0, s = o, e = s+(w*4)-x, pwy = pw*y, dlo = pw*h, t1 = T();
		
		for(; i < dl; i++) {
			
			n = (p-s) + e - pwy;
			
			if(p-s >= x) n -= pw2;
			if(n < o) n += dlo;
			
			if(!m || m[i] > 0) {
				d[p] = d2[n];
				d[p+1] = d2[n+1];
				d[p+2] = d2[n+2];
				d[p+3] = d2[n+3];
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				s += pw;
				e += pw;
				p = s;
			}
		}
		
		ImageArea.update();
		
		//CL("Shift("+x/4+", "+y+"): "+(T() - t1));
		
		return T()-t1;
	},
	
	/* Rotate picture
	** Only works in 90 degree turns
	** TODO: Implement 180 and 270 turns as well as arbitrary rotation */
	Rotate: function(deg, arb) {
		if(!IMGFX.target) return;
		
		arb = false;	// Not implemented yet
		
		if(!arb && deg != 90 && deg != -90) deg = 90;
		
		var last = IMGFX.GetHistory("last").img, d2 = last.data, w = last.width, h = last.height, rad = (deg/180)*PI, cos = COS(rad), sin = SIN(rad), pw = w*4, ph = h*4, new_w = ABS(FLOOR(w*cos+h*sin)), new_h = ABS(FLOOR(h*cos+w*sin));
		
		IMGFX.SetTarget(ImageData(new_w, new_h));
		
		var d = IMGFX.td, dl = w*h*4, s, m, p, i = 0, t1 = T();
	
		// 90 degree turns
		if(!arb) {
			for(; i < dl; i += 4) {
				
				m = (i/4)%h;
				if(m == 0) s = (i/ph)*4;
				
				if(deg == 90)
					p = (pw*(h-m-1))+s;
				else
					p = (pw*(m+1))-4-s;
				
				d[i] = d2[p];
				d[i+1] = d2[p+1];
				d[i+2] = d2[p+2];
				d[i+3] = d2[p+3];
			}
			
		// Arbitrary degree turns
		}/* else {
			
			var sx = FLOOR(-w/2), sy = FLOOR(-h/2), ex = CEIL(w/2), ey = CEIL(h/2), px = sx, py = sy, new_w2 = FLOOR(new_w/2), new_h2 = FLOOR(new_h/2);
			
			for(; i < dl; i += 4) {
				
				p = ((FLOOR(px*cos+py*sin)+new_w2)+((FLOOR(py*cos-px*sin)+new_h2)*new_w))*4;
				
				d[p] = d2[i];
				d[p+1] = d2[i+1];
				d[p+2] = d2[i+2];
				d[p+3] = d2[i+3];
				
				px++;
				if(px == ex) {
					px = sx;
					py++;
				}
			}
		}*/
		
		ImageArea.update();
		
		//CL("Rotate("+deg+"): "+(T() - t1));
		
		IMGFX.AddHistory("Rotate");
		
		return T()-t1;
	},
	
	/* Mirror picture
	** 
	** x = 	true to mirror on x axis (vertical)
	** y =	true to mirror on y axis (horizontal) */
	Mirror: function(x, y) {
		if(!IMGFX.target) return;
		
		var d = IMGFX.td, img = IMGFX.GetTarget(), w = img.w, h = img.h, d2 = IMGFX.GetHistory("last").img.data, o = img.o*4,
			pw = img.fw*4, dl = w*h, m = img.m, p = o, px = 0, n, i = 0, s = o, e = o+(w*4), py = e+(pw*(h-1)), t1 = T();
	
		for(; i < dl; i++) {
			
			if(x && y)
				n = py-(p-s)-4;
			else if(x)
				n = py-(e-p);
			else if(y)
				n = e-(p-s)-4;
			else
				n = p;
			
			if(!m || m[i] > 0) {
				d[p] = d2[n];
				d[p+1] = d2[n+1];
				d[p+2] = d2[n+2];
				d[p+3] = d2[n+3];
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py -= pw;
				s += pw;
				e += pw;
				p = s;
			}
		}
		
		ImageArea.update();
		
		//CL("Mirror("+x+", "+y+"): "+(T() - t1));
		
		return T()-t1;
	},	
	
	/* Map the "value" of each color to a point within a gradient
	** TODO: Support for gradients with dynamic color stops */
	GradientMap: function(grad) {
		if(!IMGFX.target) return;
		
		if(grad == undefined || grad.length == 1) {
			// Default to background and foreground colors
			grad = [ARCPY(MainColors.bg), ARCPY(MainColors.fg)];
		}
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, o = img.o*4, m = img.m, pw = img.fw*4, dl = w*img.h,
			p = o, px = 0, py = 0, t, i = 0, c, k, g = grad.length-1, f = 1/g, t1 = T();
		
		for(; i < dl; i++) {
			if(!m || m[i] > 0) {				
				// BT.709 Grayscale conversion
				t = ((d2[p]*0.2126)+(d2[p+1]*0.7152)+(d2[p+2]*0.0722))/255;
				
				// End color index
				c = CEIL(g*t);
				if(c == 0) c++;
				
				// Color weight 'k' based on position 't' in gradient and start color index 'c-1'
				k = (t-(f*(c-1)))*g;
			
				d[p] = (grad[c-1][0]*(1-k))+(grad[c][0]*k);
				d[p+1] = (grad[c-1][1]*(1-k))+(grad[c][1]*k);
				d[p+2] = (grad[c-1][2]*(1-k))+(grad[c][2]*k);
				d[p+3] = (grad[c-1][3]*(1-k))+(grad[c][3]*k);
				
				if(m && m[i] < 255) IMGFX.PIX_MixSelectionAlpha(p, d, d2, m[i]/255);
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}			
		}
		
		ImageArea.update();
		
		//CL("GradientMap("+grad+"): "+(T()-t1));
		
		return T()-t1;		
	},
	
	/* Replaces a color with another */
	ReplaceColor: function(ca, cb, tol) {
		if(!IMGFX.target || tol == null || tol < 0) return;
				
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, o = img.o*4, m = img.m, pw = img.fw*4, dl = w*img.h,
			p = o, px = 0, py = 0, i = 0, t, t1 = T();
		
		for(; i < dl; i++) {
			if(!m || m[i] > 0) {				
				// Get color difference
				// TODO: Better way of determining this
				t = (ABS(d2[p]-ca[0])+ABS(d2[p+1]-ca[1])+ABS(d2[p+2]-ca[2]))/tol;
				
				if(t <= 1) {
					d[p] = CEIL(d2[p]*t + cb[0]*(1-t));
					d[p+1] = CEIL(d2[p+1]*t + cb[1]*(1-t));
					d[p+2] = CEIL(d2[p+2]*t + cb[2]*(1-t));
					d[p+3] = CEIL(d2[p+3]*t + cb[3]*(1-t));
				} else {
					d[p] = d2[p];
					d[p+1] = d2[p+1];
					d[p+2] = d2[p+2];
					d[p+3] = d2[p+3];
				}
				
				if(m && m[i] < 255) IMGFX.PIX_MixSelectionAlpha(p, d, d2, m[i]/255);
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}			
		}
		
		ImageArea.update();
		
		//CL("ReplaceColor("+ca+", "+cb+", "+tol+"): "+(T()-t1));
		
		return T()-t1;		
	},
	
	/* Add noise */
	AddNoise: function(a) {
		if(!IMGFX.target) return;
		
		if(a == undefined || a < 0)
			a = 64;
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, o = img.o*4, m = img.m, pw = img.fw*4, dl = w*img.h,
			p = o, px = 0, py = 0, i = 0, t, a2 = a*2, t1 = T();
		
		for(; i < dl; i++) {
			if(!m || m[i] > 0) {
				
				t = FLOOR(RND()*a2)-a;
				
				d[p] = d2[p]+t;
				d[p+1] = d2[p+1]+t;
				d[p+2] = d2[p+2]+t;
				
				if(m && m[i] < 255) IMGFX.PIX_MixSelection(p, d, d2, m[i]/255);
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}			
		}
		
		ImageArea.update();
		
		//CL("AddNoise("+a+"): "+(T()-t1));
		
		return T()-t1;
	},
	
	/* Separate image into levels */
	Posterize: function(levels) {
		
		if(!IMGFX.target) return;
		
		levels--;
		if(levels < 1) levels = 1;
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, o = img.o*4, m = img.m, pw = img.fw*4, dl = w*img.h,
			p = o, px = 0, py = 0, i = 0, t1 = T();
		
		for(; i < dl; i++) {
			if(!m || m[i] > 0) {
				
				d[p] = (ROUND((d2[p]/255)*levels)/levels)*255;
				d[p+1] = (ROUND((d2[p+1]/255)*levels)/levels)*255;
				d[p+2] = (ROUND((d2[p+2]/255)*levels)/levels)*255;
				
				if(m && m[i] < 255) IMGFX.PIX_MixSelection(p, d, d2, m[i]/255);
			}
			
			px++;
			p+=4;
			if(px == w) {
				px = 0;
				py += pw;
				p = py+o;
			}			
		}
		
		ImageArea.update();
		
		//CL("Posterize("+levels+"): "+(T()-t1));
		
		return T()-t1;
	},
	
	/* Draw pixel by pixel */
	ApplyPencil: function(x, y, c, restore) {
		if(!IMGFX.target) return;
		
		var d = IMGFX.td, p = (x+(y*IMGFX.tw))*4;		
		if(p < 0 || p >= d.length) return;
		
		if(restore) {
			// Load from last non-pencil history state
			var h = IMGFX.history, i = IMGFX.current;
			for(; i >= 0; i--) {
				if(h[i].name != "Pencil") {
					break;
				}
			}
			
			var d2 = h[i].img.data;
			d[p] = d2[p];
			d[p+1] = d2[p+1];
			d[p+2] = d2[p+2];
			d[p+3] = d2[p+3];
		} else {		
			d[p] = c[0];
			d[p+1] = c[1];
			d[p+2] = c[2];
			d[p+3] = c[3];
		}
	},
	
	/* Apply a brush to the image */
	ApplyBrush: function(x, y, c, brush, erase) {
		if(!IMGFX.target) return;
		
		var d = IMGFX.td, w = IMGFX.tw, h = IMGFX.th, dl = w*h*4,
		bd = brush.data, bw = brush.width, bh = brush.height, bdl = bw*bh*4,
		r1 = FLOOR(bw/2), r2 = FLOOR(bh/2), pw = w*4,
		bs = ((x-r1)+((y-r2)*w))*4, p = bs, px = 0, py = 0,
		i = 0, a1 = 0, a2 = 0, p0 = (x-r1)*4, s = (y-r2-1)*pw, e = s+pw;
		
		if(c == null) c[0] = 255, c[1] = 0, c[2] = 0, c[3] = 255;
		
		for(; i < bdl; i += 4) {
			
			if(p >= 0 && p < dl && p >= s && p < e) {
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
			
			px++;
			if(px == bw) {
				py++;
				px = 0;
				s = e;
				e += pw;
				p = s+p0;
			} else p += 4;			
		}
	},
	
	/* Compute the averages for image comparison
	** 'mag' is a percentage (0 to 1 exclusive) to split avgs of image into
	** The lower the mag, the more averages returned
	** Default is 0.1 or 10x10 grid of averages */
	ComputeAvgs: function(mag) {
		if(!IMGFX.target) return;
		
		if(mag == undefined || mag <= 0 || mag > 1) mag = 0.1;
		
		var mag_w = FLOOR(mag*IMGFX.tw), mag_h = FLOOR(mag*IMGFX.th), mag_size = mag_w*mag_h, mag_q = FLOOR(1/mag);
		
		IMGFX.Resize(mag_w/mag, mag_h/mag);
	
		var d = IMGFX.td, w = IMGFX.tw, h = IMGFX.th, pw = w*4, dl = w*h, avg = new Array(mag_q*mag_q), t = [0, 0, 0], s, e, i, j, ac, b = 0;

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
		
		var l = avg1.length, diff = new Array(l), totaldiff, cms, pms, dr, dg, db;
		
		for(i = 0; i < l; i++) {
			
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
		
		var d = IMGFX.td, w = IMGFX.tw;
		
		if(amt == 1) {
			var i = (x*4)+(y*w*4);
			return [d[i], d[i+1], d[i+2], d[i+3]];
		}
		
	},
	
	/* Zoom - A resize function with no interpolation and less overhead */
	/* Made specifically for zooming the image area */
	Zoom: function(z, sx, sy, ex, ey) {
		if(!IMGFX.target) return;
		
		var t1 = T(), img = ImageArea.img, zi = 1/z, d2 = IMGFX.td, w = IMGFX.tw, h = IMGFX.th, new_w = Clamp(FLOOR((ex-sx)*z), 1, EditArea.w), new_h = Clamp(FLOOR((ey-sy)*z), 1, EditArea.h);
		
		// Only create a new image container if we need to
		if(img.width != new_w || img.height != new_h) ImageArea.img = ImageData(new_w, new_h);
		
		var d = ImageArea.img.data, pw = w*4, dl = new_w*new_h*4, i = 0, px = FLOOR(sx*z), py = FLOOR(sy*z), s = sy*pw, p;
		
		new_w += px;
		
		for(; i < dl; i += 4) {
			
			p = (FLOOR(px*zi)*4)+s;
			
			d[i] = d2[p];
			d[i+1] = d2[p+1];
			d[i+2] = d2[p+2];
			d[i+3] = d2[p+3];
			
			px++;
			if(px == new_w) {
				px = FLOOR(sx*z);
				py++;
				s = FLOOR(py*zi)*pw;
			}
		}
		
		return T()-t1;
	},
	
	/*****************************
	 * Performance testing *
	 *****************************/
	 
	/* How fast can Javascript generate an image?
	** size		Square image size */
	GenTest: function(size) {
		var img = ImageData(size, size);
		
		var d = img.data, dl = size*size, i = 0, j = 0;
		
		var t1 = T();
		
		while(j < dl) {				
			i = j*4;
			
			d[i] = FLOOR(RND()*255);
			d[i+1] = ROUND(RND()*255);
			d[i+2] = CEIL(RND()*255);
			d[i+3] = CEIL((RND()*128)+127);
			j++;
		}
		
		t1 = T()-t1;
		
		ImageArea.img = img;
		ImageArea.open = true;
		ZOOM = 1;
		IMGFX.SetTarget(CloneImg(ImageArea.img));
		Update();
		return t1;
	},
	
	/* Speed test for individual algorithms
	** func		Function name (string)
	** arg		Arguments to pass (Array)
	** iter		# of times to run the function
	** freq		Timeout frequency or rest time
	** sum, cb	Recursion variables */
	SpeedTest: function(func, arg, iter, freq, sum, cb) {
		// Return total time
		if(iter < 1) {
			cb(sum);
			return;
		}
		
		// Start and end test
		if(sum == null) {			
			// Make sure we're not already speed testing
			if(IMGFX.speedTesting) {
				CL("A speed test is already being run. Wait until it ends or refresh.");
				return;
			}			
			sum = 0;
			CL("Performing speed test for "+func+"...");
			IMGFX.speedTesting = true;
			cb = function(s) {
				var avg = s/iter;
				CL("Average time for "+func+": "+(ROUND(avg*1000)/1000)+" ms ("+ROUND((1/avg)*1000)+" FPS)");
				IMGFX.speedTesting = false;
			}
		}
		
		// Add time
		sum = sum+IMGFX[func].apply(IMGFX, arg);
		
		// Iterate
		if(freq > 0) {
			setTimeout(function() {
				IMGFX.SpeedTest(func, arg, iter-1, freq, sum, cb);
			}, freq);
		} else {
			IMGFX.SpeedTest(func, arg, iter-1, freq, sum, cb);
		}
	},
	
	/*****************************
	 * EXPERIMENTAL FUNCTIONS *
	 *****************************/
	 
	/* Resize image
	** TODO: Implement upscale interpolation */
	Resize: function(new_w, new_h, interp) {
		if(!IMGFX.target) return;
		
		if(interp == null) interp = 0;
		
		var last = IMGFX.GetHistory("last").img, w = last.width, h = last.height, t1 = T();
		
		// Parse percentages
		if(typeof(new_w) == "string") {
			if(new_w.indexOf("%")) new_w = ROUND(w*(parseInt(new_w)/100));
			else new_w = parseInt(new_w);
		}
		if(typeof(new_h) == "string") {
			if(new_h.indexOf("%")) new_h = ROUND(h*(parseInt(new_h)/100));
			else new_h = parseInt(new_h);
		}
		
		if(new_w < 1) new_w = ROUND(w*new_w);
		if(new_h < 1) new_h = ROUND(h*new_h);
		
		// Get the original width and height and also the width/height integer and decimal offsets
		var pw = w*4, odl = pw*h, wr = w/new_w, hr = h/new_h, wi = CEIL(wr), wc = (wi*2)-1, hi = CEIL(hr), hc = (hi*2)-1, wstart = 4*(wi-1), hstart = pw*(hi-1), wchc = wc*hc;

		// Create resized image container
		IMGFX.SetTarget(ImageData(new_w, new_h));
		
		var d = IMGFX.td, d2 = last.data, dl = new_w*new_h*4, ar = 0, ag = 0, ab = 0, aa = 0, pnw = 0,
			s0 = -pw, s = 0, e = FLOOR(hr)*w*4, wht = 1/wchc, p0, p = -4, p1 = 0, k, j, j1, j0, o1 = 0, o2, px = 1, py = 0, i = 0;
		
		// No interpolation (nearest neighbor)
		if(interp == 0) {		
			px = 0, py = 1;
			for(i = 0; i < dl; i += 4) {
				
				p = (FLOOR(px*wr)*4)+s;
				
				d[i] = d2[p];
				d[i+1] = d2[p+1];
				d[i+2] = d2[p+2];
				d[i+3] = d2[p+3];
				
				px++;
				if(px == new_w) {
					px = 0;
					py++;
					s = e;
					e = FLOOR(hr*py)*pw;
				}
			}
			
		// Nearest neighbor + interpolate gaps
		} else if(interp == 1) {		
			for(i = 0; i < dl; i += 4) {
				
				j0 = p0 = p;
				p = p1;
				j1 = p1 = (FLOOR(px*wr)*4)+s;
				
				if(p-p0 > pw) {
					j0 = (FLOOR(p/pw)*pw)+4;
				}
				
				if(p1-p > pw) {
					j1 = (FLOOR(p/pw)+1)*pw;
				}
				
				o1 = ar = ag = ab = aa = 0;
				for(j = j0; j < j1; j += 4) {
					for(k = j-(s-s0)+pw; k < j+(e-s); k += pw) {
						if(k < 0 || k >= odl) continue;
						ar += d2[k];
						ag += d2[k+1];
						ab += d2[k+2];
						aa += d2[k+3];
						
						o1++;
					}
				}
				
				// Failsafe
				if(o1 == 0) {
					o1 = 1;
					ar = d2[p];
					ag = d2[p+1];
					ab = d2[p+2];
					aa = d2[p+3];
				}
					
				// Interpolation
				d[i] = FLOOR(ar/o1);
				d[i+1] = FLOOR(ag/o1);
				d[i+2] = FLOOR(ab/o1);
				d[i+3] = FLOOR(aa/o1);
				
				px++;
				if(px == new_w) {				
					px = 0;
					py++;
					s0 = s;
					s = e;
					e = FLOOR(hr*(py+1))*pw;
				}
			}
		}
		
		ImageArea.update();
		
		//CL("Resize("+new_w+", "+new_h+"): "+(T() - t1));
		
		return T()-t1;
	},
	 
	/* Fill tool */
	// TODO: Bypass the "Too much recursion" error, only seems to occur during large maze tests
	Fill: function(x, y, col, tol) {
		if(!IMGFX.target) return;
	
		var t1 = T(), d = IMGFX.td, w = IMGFX.tw, h = IMGFX.th, pw = w*4, last = IMGFX.GetHistory("last");
		
		if(!last) return;
		
		var d2 = last.img.data, dl = w*h, dl4 = dl*4, s = (x+(y*w))*4, filled = new Uint8ClampedArray(dl), sc = [d2[s], d2[s+1], d2[s+2]], scsum = sc[0]+sc[1]+sc[2],
		
		// Returns tolerance of a pixel
		getTol = function(p) {
			return ABS((d2[p]+d2[p+1]+d2[p+2])-scsum)/tol;
		},
		
		fillDot = function(i, diff) {
			d[i] = (d2[i]*diff)+(col[0]*(1-diff));
			d[i+1] = (d2[i+1]*diff)+(col[1]*(1-diff));
			d[i+2] = (d2[i+2]*diff)+(col[2]*(1-diff));
			d[i+3] = (d2[i+3]*diff)+(col[3]*(1-diff));
			filled[i/4] = 1;
		},
		
		isBorder = function(i, start_w, end_w) {
			return filled[i/4] || i < start_w || i >= end_w || getTol(i) > 1;
		},
		
		fillSegment = function(p) {
			var div = p/pw, start_w = FLOOR(div)*pw, end_w = (FLOOR(div)+1)*pw, sw = start_w, ew = end_w, e = -4, i = p, above = null, below = null, hit = false, c = 0;
			
			// Stop once the initial pixel is already filled
			if(isBorder(p, sw, ew)) return;
			
			// This prevents wasteful recursion if the left side is blocked initially
			if(isBorder(p-4, sw, ew)) e = 4;
			
			while(c < 10000) {
				
				if(e == 4 || e == -4) {
					
					// Check current
					hit = isBorder(i, sw, ew);
							
					// Check above
					if(!hit && !isBorder(i-pw, 0, dl4)) {
						above = i-pw;
					} else {
						if(above != null) {
							fillSegment(above);
							//fillDot(above, 0);
							above = null;
						}
					}
					
					// Check below
					if(!hit && !isBorder(i+pw, 0, dl4)) {
						below = i+pw;
					} else {
						if(below != null) {
							fillSegment(below);
							//fillDot(below, 0);
							below = null;
						}
					}
				} else {
					// Check current
					hit = isBorder(i, 0, dl4);
					
					// Check left
					if(!hit && !isBorder(i-4, sw, ew)) {
						above = i-4;
					} else {
						if(above != null) {
							fillSegment(above);
							//fillDot(above, 0);
							above = null;
						}
					}
					
					// Check right
					if(!hit && !isBorder(i+4, sw, ew)) {
						below = i+4;
					} else {
						if(below != null) {
							fillSegment(below);
							//fillDot(below, 0);
							below = null;
						}
					}
				}
				
				// Check current
				if(hit) {
					if(e == -4) e = 4;
					else if(e == 4) e = pw;
					else if(e == pw) e = -pw;	
					else return;
					
					i = p;
					sw = start_w;
					ew = end_w;
				} else {
					fillDot(i, getTol(i));
				}
				
				i += e;
				if(e == pw || e == -pw) {
					sw += e;
					ew += e;
				}
				c++;
			}
			if(c >= 10000) CL("Infinite loop...");
		}
		
		fillSegment(s);
		
		//CL("Fill("+x+", "+y+", "+col+", "+tol+"): "+(T()-t1));
		
		ImageArea.update();
		
		return T()-t1;
	},
	
	
	/* Box blurring
	** r =	blur radius
	**
	** Only read pixels not already known and overwrite pixels no longer within radius
	** I.e. radius = 1 means only read the right-most 3 pixels as progress is made
	** This reduces a potential exponential O((1 + r*2)^2) algorithm to just O(1 + r*2)
	** 
	** TODO: Fix the right-ward smearing effect */
	BoxBlur: function(r) {
		if(!IMGFX.target) return;
		
		if(!r || r < 1) r = 1;
		
		var d = IMGFX.td, d2 = IMGFX.GetHistory("last").img.data, img = IMGFX.GetTarget(), w = img.w, h = img.h, o = img.o*4, m = img.m, dl = w*h*4, pw = img.fw*4, pr = 1 + r*2,
			r2 = pr*pr, r4 = r*4, rh = CEIL(r2/2)-1, p, px = 0, py = 0, m, s = o, e = o+pw, i = 0, k, mi1, mi2, mi3, mi4, t1 = T();
	
		for(; i < dl; i += 4) {
			
			mi1 = mi2 = mi3 = mi4 = rh = 0;
			for(k = 0; k < pr; k++) {
				p = ((k-r)*pw)+r4;				
			
				if(i+p > -1 && i+p < dl && i+r4 < e) {
					mi1 += d2[i+p];
					mi2 += d2[i+p+1];
					mi3 += d2[i+p+2];
					mi4 += d2[i+p+3];
					rh++;
				}
			}			
			
			d[i] = mi1/rh;
			d[i+1] = mi2/rh;
			d[i+2] = mi3/rh;
			d[i+3] = mi4/rh;
			
			px++;
			if(px == w) {
				px = 0;
				s += pw;
				e += pw;					
			}
		}
		
		ImageArea.update();
		
		//CL("Reduce Noise("+r+"): "+(T() - t1));
		
		return T()-t1;
	},
	
	/* Motion blur */
	// TODO: Make this faster using the same idea as BoxBlur
	MotionBlur: function(a) {
		if(!IMGFX.target) return;
		
		if(a == undefined || a < 1)
			a = 5;
		
		var d = IMGFX.td, w = IMGFX.tw, h = IMGFX.th, d2 = IMGFX.GetHistory("last").img.data, dl = w*h, i = 0, j = 0, k = 0, l = 0, t1 = T();
		
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
		
		ImageArea.update();
		
		//CL("MotionBlur("+a+"): "+(T()-t1));
		
		return T()-t1;
	},
	 
	/* Make the image fuzzier */
	Fuzzify: function(amt) {
		if(!IMGFX.target) return;
	
		var d = IMGFX.td, w = IMGFX.tw, pw = w*4, last = IMGFX.GetHistory("last");
		
		if(!last) return;
		
		if(!amt || amt <= 1) amt = 2;
		else if(amt > pw) amt = pw;
		
		var d2 = last.img.data, dl = w*IMGFX.th, halfamt = CEIL(amt/2), s, e = 0, i, j, t, t1 = T();
		
		for(j = 0; j < dl; j++) {
			
			i = j*4;
			
			if(j % w == 0) {
				e += pw;
				s = e-pw;
			}
			
			t = FLOOR((RND()*amt)-halfamt)*4;
			
			if(i+t >= e) t -= pw;
			else if(i+t < s) t += pw;
			
			d[i] = d2[i+t];
			d[i+1] = d2[i+1+t];
			d[i+2] = d2[i+2+t];
			d[i+3] = d2[i+3+t];
			
		}
		
		ImageArea.update();
		
	},
	
	/* Make an educated guess (based on BT.2020 luma coefficients) what shades of colors a grayscale image can be */
	/* This function is a mess, don't use it */
	GrayToColor: function() {
		if(!IMGFX.target) return;
		
		var d = IMGFX.td, last = IMGFX.GetHistory("last");
		
		if(!last) return;
	
		var d2 = last.img.data, dl = IMGFX.tw*IMGFX.th, ra = new Array(768), w = [0.2627, 0.6780, 0.0593],
		up_r = 0, up_g = 0, up_b = 0, low_r = 0, low_g = 0, low_b = 0, i = 0, j = 0, t = 0, t1 = T();
		
		for(j = 0; j < 256; j++) {
			
			i = j*3;
			
			up_r = Clamp(j/w[0], 0, 255);
			up_g = Clamp(j/w[1], 0, 255);
			up_b = Clamp(j/w[2], 0, 255);
			
			low_g = Clamp(255-((255/w[1])-(j/w[1])), 0, up_g);
			
			ra[i+1] = ROUND(RND()*(up_g-low_g))+low_g;
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
			/*ra[i+2] = ROUND(RND()*255);
			
			ra[i] = ROUND(RND()*255);
			
			ra[i+1] = ROUND(1.474926254*j - 0.387463127*ra[i] - 0.087463127*ra[i+2]);
			
			if(ra[i+1] < 0) ra[i+1] = 0;
			else if(ra[i+1] > 255) ra[i+1] = 255;*/
			//(ROUND((ra[i]*w[0])+(ra[i+1]*w[1])+(ra[i+2]*w[2])) != j)
			//	CL(ROUND((ra[i]*w[0])+(ra[i+1]*w[1])+(ra[i+2]*w[2]))+" "+j);
			
		}
		
		for(j = 0; j < dl; j++) {
			
			i = j*4;
			
			t = ROUND((d2[i]*w[0])+(d2[i+1]*w[1])+(d2[i+2]*w[2]))*3;
			
			/*r = RND()*255;
			b = RND()*255;
			g = 1.474926254*t - 0.387463127*r - 0.087463127*b*/
			
			
			
			//d[i] = d[i+1] = d[i+2] = ROUND((r*0.2627)+(g*0.6780)+(b*0.0593));
			
			d[i] = ra[t]
			d[i+1] = ra[t+1];
			d[i+2] = ra[t+2];
			
		}
		
		ImageArea.update();
	}
};















