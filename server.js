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

var express = require("express"),
path = require('path'),
bodyParser = require("body-parser"),
//TDB = require('./texturedb.js'),
L2I = require('./link2img.js'),
app	= express(),
CL = function(str) { console.log(str); };

// Init body parser
app.use(bodyParser.json());

// Define public directory (visible to client)
app.use(express.static(__dirname+'/public'));

// Define main app page
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Request texture list
app.post('/textures', function(req, res) {
	CL(req);
	res.send("Hey");
});

// Open image from link
app.post('/openlink', function(req, res) {
	if(req.body && req.body.link) {
		L2I.GetFromLink(req.body.link, function(img) {
			if(img) {
				if(typeof(img) == "string") res.send(img);
				else res.send("IMAGES: "+JSON.stringify(img));
			} else {
				res.send("Couldn't load image");
			}
		});
	} else {
		res.send("Couldn't access JSON.");
	}
});

// Start server
app.listen(3000, function(){
	CL("Working on port 3000");
});
