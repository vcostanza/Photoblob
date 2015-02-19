var express = require("express"),
path = require('path'),
app	= express(),
CL = function(str) { console.log(str); };

// Define public directory (visible to client)
app.use(express.static(__dirname+'/public'));

// Define main app page
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
app.listen(3000, /*"150.156.215.211", */function(){
	CL("Working on port 3000");
});
