// ==UserScript==
// @name         Torrent stream dlna
// @namespace    https://wololo.lol
// @version      0.1
// @description  Stream torrents from regular bittorrent trackers to your smart TV easily
// @author       Me
// @include      https://www.inperil.net/browse.php*
// @include      https://www.inperil.net/details.php*
// @include      https://thepiratebay.*/*
// @include      https://www.fano.in/browse_old.php*
// @include      https://www.fano.in/details.php*
// @grant        none
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

function binaryToBase64(binary){
    return Uint8ToBase64(new Uint8Array(binary));
}

function Uint8ToBase64(u8Arr){
  var CHUNK_SIZE = 0x8000; //arbitrary number
  var index = 0;
  var length = u8Arr.length;
  var result = '';
  var slice;
  while (index < length) {
    slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length)); 
    result += String.fromCharCode.apply(null, slice);
    index += CHUNK_SIZE;
  }
  return btoa(result);
}

 /**
 *
 * jquery.binarytransport.js
 *
 * @description. jQuery ajax transport for making binary data type requests.
 * @version 1.0 
 * @author Henry Algus <henryalgus@gmail.com>
 *
 */

// use this transport for "binary" data type
$.ajaxTransport("+binary", function(options, originalOptions, jqXHR){
    // check for conditions and support for blob / arraybuffer response type
    if (window.FormData && ((options.dataType && (options.dataType == 'binary')) || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) || (window.Blob && options.data instanceof Blob)))))
    {
        return {
            // create new XMLHttpRequest
            send: function(headers, callback){
		// setup all variables
                var xhr = new XMLHttpRequest(),
		url = options.url,
		type = options.type,
		async = options.async || true,
		// blob or arraybuffer. Default is blob
		dataType = options.responseType || "blob",
		data = options.data || null,
		username = options.username || null,
		password = options.password || null;
					
                xhr.addEventListener('load', function(){
			var data = {};
			data[options.dataType] = xhr.response;
			// make callback and send data
			callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
                });

                xhr.open(type, url, async, username, password);
				
		// setup custom headers
		for (var i in headers ) {
			xhr.setRequestHeader(i, headers[i] );
		}
				
                xhr.responseType = dataType;
                xhr.send(data);
            },
            abort: function(){
                jqXHR.abort();
            }
        };
    }
});

console.log("Looking for torrent links");

var restServerLocation="http://127.0.0.1:54321";

var playerLoading="Loading torrent file...";

function playTorrent(){
    //console.log($(this).parent("span").next("a").next("a").children("b").html());
    var name = $(this).attr("data-name");
    var value = $(this).attr('href');
    
    var r = confirm("Do you really want to play \""+name+"\"?");
    if (r == true) {
    } else {
        return false;
    }

    console.log("Loading torrent with link "+value);
    
    
    if (value.toLowerCase().indexOf("magnet:?xt=") >= 0){
        $("#torrentPlayerPreloader").html("Passing magnet to streamer...").fadeIn("slow");
        $.ajax({
            type: "POST",
            url: restServerLocation+"/load",
            data: {"magnet":value, "name":name},
            success: function(){
                $("#torrentPlayerPreloader").html("Magnet passed to streamer.").fadeOut("slow");
            }
        }).fail(function() {
            $("#torrentPlayerPreloader").html("Failed passing magnet to streamer.").fadeOut("slow");
        });
        return;
    }
    
    $("#torrentPlayerPreloader").html(playerLoading).fadeIn("slow");

    $.ajax({
        url: value,
        type: "GET",
        dataType: "binary",
        responseType:'arraybuffer',
        processData: false,
        success: function(data){
            
            $("#torrentPlayerPreloader").html("Torrent loaded, passing data to streamer.");
            
            var base64String = binaryToBase64(data);//btoa(String.fromCharCode.apply(null, new Uint8Array(data)));
            
            //console.log(base64String);
            $.ajax({
                type: "POST",
                url: restServerLocation+"/load",
                data: {"torrent":base64String, "name":name},
                success: function(){
                    $("#torrentPlayerPreloader").html("Torrent passed to streamer.").fadeOut("slow");
                }
            }).fail(function() {
                $("#torrentPlayerPreloader").html("Failed passing data to streamer.").fadeOut("slow");
            });
        }
    });
    
    return false;
}

function checkStatus(){

     $.ajax({
        url: restServerLocation+"/status",
        type: "GET",
        success: function(data){
            if(data=="0"){
                $("#torrentStatus").html("Nothing being streamed.");
            }else
            $("#torrentStatus").html("Streaming: "+data);
        }
    }).fail(function() {
         $("#torrentStatus").html("Not running");
    });;
    
    
}

function runCheck(){
    checkStatus();
    setTimeout(function(){ runCheck(); }, 3000);   
}

function stopTorrent(){
    var button=$(this);
    button.css("opacity", 0.5);
    var r = confirm("Do you really want to stop?");
    if (r == true) {
    } else {
        button.css("opacity", 1);
        return false;
    }
    $.ajax({
        url: restServerLocation+"/stop",
        type: "GET",
        success: function(data){
            button.css("opacity", 1);
            checkStatus();
        }
    }).fail(function() {
         button.css("opacity", 1);
        checkStatus();
    });;
}

function relaunchTorrent(){
    
    var button=$(this);
    button.css("opacity", 0.5);
    
    var r = confirm("Do you really want to relaunch?");
    if (r == true) {
    } else {
        button.css("opacity", 1);
        return false;
    }
    
    $.ajax({
        url: restServerLocation+"/relaunch",
        type: "GET",
        success: function(data){
            button.css("opacity", 1);
            checkStatus();
        }
    }).fail(function() {
         button.css("opacity", 1);
        checkStatus();
    });;
}

$(document).ready(function(){

    $("body").after('<div style="z-index:100000;font-size: 12px; width: 400px; position: fixed;  bottom: 0px;  left: 0px;  background: rgba(170, 42, 122, 0.71);  padding: 7px;  color: white;  font-family: sans-serif;"><div id="torrentStatus" style="float: left">Manually load unsafe content!</div><div id="torrentStop" style="cursor:pointer;cursor: pointer; float: right;  font-size: 20px;  position: relative;top: -7px;">📴</div><div style="cursor:pointer; float: right;  font-size: 20px;  position: relative;top: -7px;" id="torrentRelaunch">🔄</div></div>');    

    runCheck();

    $("body").after('<div id="torrentPlayerPreloader" style="z-index: 100000;display: none;  width: 300px;  height: 18px;  position: fixed;  bottom: 5px;  left: 50%;  background: rgba(170, 42, 122, 0.71);  margin-left: -175px;  border: 2px solid rgb(72, 0, 0);  border-radius: 5px;  padding: 25px;  color: white;  font-family: sans-serif;">'+playerLoading+'</div>');    

    
    // Add links to inperil.net
    if (location.hostname.toLowerCase().indexOf("inperil.net") != -1){
        
        $('a').each(function() {
            var value = $(this).attr('href');
            if (value!=undefined && value.toLowerCase().indexOf("download.php") >= 0 && value.toLowerCase().indexOf(".torrent") >= 0){
                console.log("Found link to torrent: "+value);
                var name=$(this).next("a").children("b").html();
                $(this).before('<span title="Play torrent!" style="font-size: 2em"><a style="text-decoration: none" onclick="return false" class="loadTorrent" data-name="'+name+'" href="'+value+'">📺</a></span>');
            } 
        });
        
    }
    
    // Add links to fano.in
    if (location.hostname.toLowerCase().indexOf("fano.in") != -1){
        
        $('a').each(function() {
            var value = $(this).attr('href');
            if (value!=undefined && value.toLowerCase().indexOf("download.php") >= 0 && value.toLowerCase().indexOf(".torrent") >= 0){
                console.log("Found link to torrent: "+value);
                var name=value.substr(value.indexOf("name=")+5, value.indexOf(".torrent"));
                $(this).before('<span title="Play torrent!" style="font-size: 2em"><a style="text-decoration: none" onclick="return false" class="loadTorrent" data-name="'+name+'" href="'+value+'">📺</a></span>');
            } 
        });
        
    }

    // Add links to thepiratebay
    if (location.hostname.toLowerCase().indexOf("thepiratebay.") != -1){
        
        $('a').each(function() {
            var value = $(this).attr('href');
            if (value!=undefined && value.toLowerCase().indexOf("magnet:?xt=") >= 0){
                console.log("Found link to torrent: "+value);
                var name=$(this).parent().children(".detName").children("a").html();
                $(this).before('<span title="Play torrent!" style="font-size: 2em"><a style="text-decoration: none" onclick="return false" class="loadTorrent" data-name="'+name+'" href="'+value+'">📺</a></span>');
            } 
        });
    }
    
    $(".loadTorrent").click(playTorrent);
    $("#torrentStop").click(stopTorrent);
    $("#torrentRelaunch").click(relaunchTorrent);

});

console.log("Done");
