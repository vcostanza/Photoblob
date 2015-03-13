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

var http = require("http"),
https = require("https"),
path = require("path"),
CL = function(str){console.log(str);};

exports.GetFromLink = GetFromLink = function(link, cb) {
	
	// Fix link
	if(link.indexOf("http") != 0) {
		if(link.indexOf("//") > -1) link = link.substring(link.indexOf("//")+2);
		link = "http://"+link;
	}
	
	// HTTP or HTTPS call
	// Done this way so we only have to write the 'get' function once
	var ht = (link.indexOf("https://") == 0 ? https : http);
	
	ht.get(link, function(res) {
		GetFromLink_Response(link, res, cb);
	}).on('error', function(e) {
		CL("GetFromLink ERROR: "+e.message);
		cb();
	});
}

function GetFromLink_Response(link, res, cb) {
	
	// Check that the link is valid
	if(res.headers.connection == 'close') {
		cb();
		return;
	}
	
	// Get content type
	var type = res.headers['content-type'].split(" ")[0],
	
	// Check if image file
	isImage = (type.indexOf("image/") == 0),
	
	// Data chunks are stored here
	data = "";
	
	// Set encoding based on content type
	res.setEncoding(isImage ? 'base64' : 'utf8');
	
	// Part of image
	res.on('data', function (chunk) {
		data += chunk;
	});
	res.on('end', function() {		
		// Return image base64
		if(isImage) {
			cb("data:"+type+";base64,"+data);
			
		// Scan page for images
		} else {	
			// Clean up link
			if(link.substring(link.indexOf("://")+3).lastIndexOf("/") > -1)
				link = link.substring(0, link.lastIndexOf("/"))+'/';
			else
				link += '/';
				
			var last = 0, linx = [], protocol = link.substring(0, link.indexOf("://")),
			
			findImageLink = function(done) {
				last = data.search(/<img/i)+1;
				
				// Check if there's any image links left
				if(last == 0) {
					done();
					return;
				} else {
					data = data.substring(last);
					last = data.search(/src="/i)+5;
				}
				var src = data.substring(last, data.indexOf('"', last)), i = 0, dupe = false;
				
				// Convert relative paths to absolute
				if(src.indexOf("//") == 0) {
					src = protocol+':'+src;
				} else if(src.indexOf(".") == 0 || src.indexOf("http") != 0 && src.indexOf("/") <= src.indexOf(".")) {
					src = path.join(link, src).replace(':/', '://');
				}
				
				// Prevent duplicates
				for(; i < linx.length; i++) {
					if(linx[i] == src) {
						dupe = true;
						break;
					}
				}
				if(!dupe) {
					linx.push(src);
					CL(src+" "+process.hrtime());
				}
				
				// Continue on next tick
				process.nextTick(function(){findImageLink(done);});
			};
			
			// Begin finding links
			findImageLink(function() {
				//CL(linx);
				if(linx.length > 0) cb(linx); else cb();
			});
		}
	});
}
