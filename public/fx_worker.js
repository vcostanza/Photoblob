CL = function(str) { console.log(str); }

function ImageData(w, h) {
	this.width = w;
	this.height = h;
	this.data = [];
}

function CloneImg(g) {

	var n = new ImageData(g.width, g.height);
	
	imgcpy(n, g);
	
	return n;
	
}

function imgcpy(n, g) {

	var d = n.data, e = g.data, el = (g.width*g.height)/8, i = j = 0;
	for(; j < el; j++) {
		i = j * 32;
		d[i] = e[i];
		d[i+1] = e[i+1];
		d[i+2] = e[i+2];
		d[i+3] = e[i+3];
		d[i+4] = e[i+4];
		d[i+5] = e[i+5];
		d[i+6] = e[i+6];
		d[i+7] = e[i+7];
		d[i+8] = e[i+8];
		d[i+9] = e[i+9];
		d[i+10] = e[i+10];
		d[i+11] = e[i+11];
		d[i+12] = e[i+12];
		d[i+13] = e[i+13];
		d[i+14] = e[i+14];
		d[i+15] = e[i+15];
		d[i+16] = e[i+16];
		d[i+17] = e[i+17];
		d[i+18] = e[i+18];
		d[i+19] = e[i+19];
		d[i+20] = e[i+20];
		d[i+21] = e[i+21];
		d[i+22] = e[i+22];
		d[i+23] = e[i+23];
		d[i+24] = e[i+24];
		d[i+25] = e[i+25];
		d[i+26] = e[i+26];
		d[i+27] = e[i+27];
		d[i+28] = e[i+28];
		d[i+29] = e[i+29];
		d[i+30] = e[i+30];
		d[i+31] = e[i+31];
	}
}

onmessage = function(e) {
	
	postMessage(CloneImg({width: e.data[0], height: e.data[1], data: e.data[2]}));
}
