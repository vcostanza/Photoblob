/*
** Image filter object/library containing all effect functions
*/
IMGFX = {

	target: undefined,
	history: Array(),
	current: 0,
	
	/* Set image target */
	SetTarget: function(img) {
		this.target = img;
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
		
		// For some strange reason, using imgcpy instead of the code above
		// causes a permanent 1 second lag to history reading and writing calls
		// CloneImg (which uses imgcpy) doesn't cause any type of lag
		// In short: WTF?
		
		//imgcpy(IMGFX.target, oldimg);
		
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
			IMGFX.history = Array();
		}
	},	
	
	Undo: function() {	
		if(IMGFX.current > 0) IMGFX.LoadHistory(--IMGFX.current);
	},
	
	Redo: function() {
		if(IMGFX.current < IMGFX.history.length-1) IMGFX.LoadHistory(++IMGFX.current);
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
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = IMGFX.target.width*IMGFX.target.height, i = j = 0, t1 = T();
		
		for(; j < dl; j++) {
			
			i = j*4;
			
			if(r) d[i] = 255-d2[i]; else d[i] = d2[i];
				
			if(g) d[i+1] = 255-d2[i+1]; else d[i+1] = d2[i+1];
			
			if(b) d[i+2] = 255-d2[i+2]; else d[i+2] = d2[i+2];
			
		}
		
		CL("InvertColors("+r+", "+g+", "+b+"): "+(T() - t1));
		
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
		var w = IMGFX.target.width, h = IMGFX.target.height, wr = w/new_w, hr = h/new_h, wi = CEIL(wr), hi = CEIL(hr), ppl = w*4;
		
		// Create resized image container
		IMGFX.target = ImageArea.img = GC(canvas).createImageData(new_w, new_h);
		
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = new_w*new_h, s = e = p = i = j = k = l = 0, t1 = T();
	
		for(; j < dl; j++) {
			
			i = j*4;
			
			l = FLOOR(j/new_w);
			
			p = (CEIL(wr*(j%new_w))*4)+(ppl*ROUND(hr*l));
			
			// Resize without interpolation
			d[i] = d2[p];
			d[i+1] = d2[p+1];
			d[i+2] = d2[p+2];
			d[i+3] = d2[p+3];
			
			// Interpolate smaller
			for(k = 1; k < wi*wi; k++) {
				s = ((k%wi)*4)+(FLOOR(k/wi)*ppl);
				if(p+s < w*h*4) {
					d[i] = ((d[i]*(k-1)) + d2[p+s])/k;
					d[i+1] = ((d[i+1]*(k-1)) + d2[p+s+1])/k;
					d[i+2] = ((d[i+2]*(k-1)) + d2[p+s+2])/k;
					d[i+3] = ((d[i+3]*(k-1)) + d2[p+s+3])/k;
				}
			}
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
	ReplaceColor: function(col_a, col_b, tol) {
		if(!IMGFX.target) return;
		
		if(col_a == undefined) {
			// Default to replace background with foreground color
			col_a = MainColors.bg;
			col_b = MainColors.fg;
		}
		
		if(tol == null || tol < 0) tol = 0;
				
		var d = IMGFX.target.data, d2 = IMGFX.GetHistory("last").img.data, dl = IMGFX.target.width*IMGFX.target.height, ca = [], cb = [], j = i = t = 0, t1 = T();
		
		for(; i < 4; i++) {
			ca[i] = col_a[i];
			cb[i] = col_b[i];
		}
		
		for(; j < dl; j++) {
			i = j*4;
			
			t = ABS((d2[i]+d2[i+1]+d2[i+2])-(ca[0]+ca[1]+ca[2]))/tol;
			
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
	
	/* Morph pixels to another image */
	Morph: function() {
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
	
	/* Apply a brush to the image */
	ApplyBrush: function(x, y, c, brush, erase) {
		if(!IMGFX.target) return;
		
		var d = IMGFX.target.data, w = IMGFX.target.width, h = IMGFX.target.height, dl = d.length,
		bd = brush.data, bw = brush.width, bh = brush.height, bdl = bw*bh,
		r1 = FLOOR(bw/2), r2 = FLOOR(bh/2), pw = w*4,
		bs = ((x-r1)+((y-r2)*w))*4, p = bs, 
		i = j = a = 0;
		
		if(c == undefined) {
			c[0] = 255, c[1] = 0, c[2] = 0, c[3] = 255;
		}
		
		for(; j < bdl; j++) {
			
			i = j*4;
			
			if(p >= 0 && p < dl) {
				a = (bd[i+3]*c[3])/255;
				if(erase) {
					d[p+3] = d[p+3]*(1-a)-bd[i+3];
				} else {
					d[p] = d[p]*(1-a)+c[0]*a;
					d[p+1] = d[p+1]*(1-a)+c[1]*a;
					d[p+2] = d[p+2]*(1-a)+c[2]*a;
					d[p+3] = d[p+3]*(1-a)+bd[i+3];
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
		
		var d2 = last.img.data, dl = w*h, dl4 = dl*4, s = (x+(y*w))*4, filled = new Array(dl), sc = [d2[s], d2[s+1], d2[s+2]], scsum = sc[0]+sc[1]+sc[2],
		
		// Returns tolerance of a pixel
		getTol = function(p) {
			return ABS((d2[p]+d2[p+1]+d2[p+2])-scsum)/tol;
		},
		
		fillSegment = function(start) {
			var off = j = (start/4)%w, i = e = diff = 0, dir = 1;
			start -= off*4;
			while(j >= 0) {
				i = start+(j*4);
				
				diff = getTol(i);
				
				// PASS
				if(j < w && !filled[i/4] && diff <= 1) {
					d[i] = (d2[i]*diff)+(col[0]*(1-diff));
					d[i+1] = (d2[i+1]*diff)+(col[1]*(1-diff));
					d[i+2] = (d2[i+2]*diff)+(col[2]*(1-diff));
					
					// Mark pixel as filled so we don't loop forever
					filled[i/4] = true;
					
					e = i+pw;
					
					if(e >= 0) {
						diff = getTol(e);
						if(!filled[e/4] && diff <= 1) {
							fillSegment(e);
						}
					}
				
				// Switch direction or stop
				} else {
					if(dir == 1) {
						dir = -1;
						j = off;
						return;
					} else {
						break;
					}
				}
				
				j += dir;
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
		
	}
	
};















