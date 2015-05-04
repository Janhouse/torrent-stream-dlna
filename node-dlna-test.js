var MediaRendererClient = require('upnp-mediarenderer-client');
var Client = require('node-ssdp').Client
  , client = new Client();
  
var localAddress='127.0.0.1';

//getLocalIP(123);
//console.log(localAddress);
//process.exit(code=0);

client.on('response', function (headers, statusCode, rinfo) {
  console.log('Got a response to an m-search.');
  console.log(headers);
  console.log(statusCode);
  console.log(rinfo);
  console.log("Found endpoint: "+headers['LOCATION']);
  
  getLocalIP(rinfo['address']); // we pass renderer address to send it IP from same subnet
  runVideoStream(headers['LOCATION'], localAddress);
  
});

// Search for renderer in local network
client.search('urn:schemas-upnp-org:device:MediaRenderer:1');

function runVideoStream(url, streamIp){

	// Instanciate a client with a device description URL (discovered by SSDP) 
	var client = new MediaRendererClient(url);

	// Load a stream with subtitles and play it immediately 
	var options = { 
	  autoplay: true,
		contentType: 'video/mpeg', // mpeg is very generic. //'video/x-mkv', //'video/avi',
	  metadata: {
	    title: 'video',
	    creator: 'video',
	    type: 'video', // can be 'video', 'audio' or 'image' 
	    //subtitlesUrl: 'http://'+streamIp+'/subtitles.srt'
	  }
	};

	client.load('http://'+streamIp+':8888/', options, function(err, result) {
	  if(err) throw err;
	  console.log('playing ...');
	  process.exit(code=0);
	});

}


function getLocalIP(renderer){
	//console.log("Trying to get IP");
	var os = require('os');
	var ifaces = os.networkInterfaces();

	Object.keys(ifaces).forEach(function (ifname) {
	  var alias = 0
	    ;

	  ifaces[ifname].forEach(function (iface) {
	    if ('IPv4' !== iface.family || iface.internal !== false) {
	      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
	      return;
	    }

	    if (alias >= 1) {
	      // this single interface has multiple ipv4 addresses
	      console.log(ifname + ':' + alias, iface.address);
	    } else {
	      // this interface has only one ipv4 adress
	      console.log(ifname, iface.address);
	    }

		localAddress=iface.address;
	  });
	});
}