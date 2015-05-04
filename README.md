Some tools for making awesome RaspberryPi media streaming box.

The idea is to pass any torrents/magnets to RaspberryPi in the same network running Peerflix (node.js app).
As soon as the stream is ready, Peerflix launches script that loads and starts playing video on Smart TV using DLNA commands.

RaspberryPi is also running MiniDLNA server to be able to watch already downloaded files later on.
For everything that peerflix doesn't support RaspberryPi has running transmission-daemon (bittorrent client with remote control).

This allows more freedom than just using Popcorn Time because user is not limited to those movies/tv shows available on Popcorn Time.


========== Notes =========
MKV containers on Samsung smart TV with peerflix by default didn't work. 
Had to change mime module mime type for mkv from x-matroska to x-mkv.


========== Installing =========
npm install mime
npm install peerflix -g
npm install dlncast -g
npm install node-ssdp
npm install ...


peerflix -c 100 -p 8888 --on-listening 'node node-dlna-test.js' --on-downloaded 'node store-file.js???' ...


... use different ports for multiple streams.