var config = require('./config').config;

var restify = require('restify');
var fs = require('fs');
var spawn = require('child_process').spawn;
var sanitize = require("sanitize-filename");

var server = restify.createServer({
  name: 'command-handler',
  version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser({ mapParams: true }));

server.get('/status', function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.send(201, whatIsRunning());
	return next();
});
 
server.get('/stop', function (req, res, next) {
	stopPeerflix();
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.send(201, "Stopping peerflix...");
	return next();
});

server.get('/relaunch', function (req, res, next) {
	pushStream();
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.send(201, "Relaunching");
	return next();
});

server.post('/load', function load(req, res, next) {
	console.log(req.params.name);
	//console.log(req.params.torrent);
	
	saveTorrent(req.params);
	
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.send(201, "Accepted");
	return next();
});
 
server.listen(config.listenPort, config.listenIp, function () {
  console.log('%s listening at %s', server.name, server.url);
});

function saveTorrent(data){
	
	if(data.magnet!=undefined){
		console.log("Got magnet link...");
		data.path=data.magnet;
		runPeerflix(data);
		return;
	}
	
	var filePath=config.tmpFolder+sanitize(data.name)+".torrent";
	
	//console.log(data.torrent);
	var buffer=Base64Binary.decode(data.torrent);
	var binaryData=toBuffer(buffer);

	fs.writeFile(filePath, binaryData, 'binary', function(err) {
	    if(err) {
	        return console.log(err);
	    }
		data.path=filePath;

	    console.log("Torrent file was saved to "+filePath);
		
		runPeerflix(data);
	}); 
}

var runningPeerFlix;
var lastData;

function pushStream(){
	spawn(config.pushScript);
}

function whatIsRunning(){
	if(runningPeerFlix!=undefined){
		return lastData.name;
	}else{
		return "0";
	}
}

function stopPeerflix(){
	if(runningPeerFlix!=undefined){
		lastData=undefined;
		runningPeerFlix.kill('SIGINT');
		return;
	}
}

function runPeerflix(data){
	
	
	if(runningPeerFlix!=undefined){
		lastData=data;
		runningPeerFlix.kill('SIGINT');
		return;
	}
	
	lastData=data;
	
	
	console.log("Launching peerflix");
	
	
	var child = spawn("node", [ "node_modules/peerflix/app.js", data.path, "-f", config.downloadPath, "-c", "100", "-p", "8888", "--on-listening", config.pushScript, "--on-downloaded", config.saveScript]);
	child.stdout.on('data', function(data) {
	    //console.log('stdout: ' + data);
	});
	child.stderr.on('data', function(data) {
	    console.log('stdout: ' + data);
	});
	child.on('close', function(code) {
	    console.log('Peerflix closed...');
		
		runningPeerFlix=undefined;
		if(lastData!=undefined){
			runPeerflix(lastData);
			lastData=undefined;
		}

	});

	runningPeerFlix=child;
	
	//node node_modules/peerflix/app.js -c 100 -p 8888 --on-listening 'node node-dlna-test.js' --on-downloaded 'node store-file.js???'
	//"node node_modules/peerflix/app.js"
}






/*
Copyright (c) 2011, Daniel Guerrero
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL DANIEL GUERRERO BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Uses the new array typed in javascript to binary base64 encode/decode
 * at the moment just decodes a binary base64 encoded
 * into either an ArrayBuffer (decodeArrayBuffer)
 * or into an Uint8Array (decode)
 * 
 * References:
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array
 */

var Base64Binary = {
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	
	/* will return a  Uint8Array type */
	decodeArrayBuffer: function(input) {
		var bytes = (input.length/4) * 3;
		var ab = new ArrayBuffer(bytes);
		this.decode(input, ab);
		
		return ab;
	},
	
	decode: function(input, arrayBuffer) {
		//get last chars to see if are valid
		var lkey1 = this._keyStr.indexOf(input.charAt(input.length-1));		 
		var lkey2 = this._keyStr.indexOf(input.charAt(input.length-2));		 
	
		var bytes = (input.length/4) * 3;
		if (lkey1 == 64) bytes--; //padding chars, so skip
		if (lkey2 == 64) bytes--; //padding chars, so skip
		
		var uarray;
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		var j = 0;
		
		if (arrayBuffer)
			uarray = new Uint8Array(arrayBuffer);
		else
			uarray = new Uint8Array(bytes);
		
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		
		for (i=0; i<bytes; i+=3) {	
			//get the 3 octects in 4 ascii chars
			enc1 = this._keyStr.indexOf(input.charAt(j++));
			enc2 = this._keyStr.indexOf(input.charAt(j++));
			enc3 = this._keyStr.indexOf(input.charAt(j++));
			enc4 = this._keyStr.indexOf(input.charAt(j++));
	
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
	
			uarray[i] = chr1;			
			if (enc3 != 64) uarray[i+1] = chr2;
			if (enc4 != 64) uarray[i+2] = chr3;
		}
	
		return uarray;	
	}
}


function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}


