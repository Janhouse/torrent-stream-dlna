torrent-stream-dlna
================
These are some simple quickly put together scripts making awesome RaspberryPi media streaming box. (Though it could be used on your laptop/desktop as well.)

Though it is working fine, let's call this an "alpha" version.

The idea is to pass any torrents/magnets to RaspberryPi in the same network running Peerflix (node.js app).

As soon as the stream is ready, Peerflix launches script that loads and starts playing video on Smart TV using DLNA commands.

RaspberryPi is also running MiniDLNA server to be able to watch already downloaded files later on.

For everything that peerflix doesn't support RaspberryPi has running transmission-daemon (bittorrent client with remote control). It can also be used to load torrent files after downloading to continue seeding after downloading.

This allows more freedom than just using Popcorn Time because user is not limited to those movies/tv shows available on Popcorn Time.

Notes
--------

MKV containers on Samsung smart TV with peerflix by default didn't work. 
Had to change mime module mime type for mkv from x-matroska to x-mkv.

You can push to any DLNA servers, local VLC player or somewhere else if needed.

Prequisites
--------
node (I tested with node 0.12.2)

Installing
--------
**On raspberry:**

	apt-get install node screen
	git clone https://github.com/Janhouse/torrent-stream-dlna.git
	cd torrent-stream-dlna
	npm install
	sed -i 's/x-matroska/x-mkv/g' node_modules/peerflix/node_modules/mime/types.json
	cp config.js.sample config.js

Edit config file if needed

Run in screen and add to /etc/rc.local to auto start

	sudo -u pi screen -dmS tv /home/pi/torrent-stream-dlna/launch.sh

**On laptop/desktop/mobile:**
Install browser-userscript.js in Greasemonkey/Tampermonkey extension, change server IP (and port) and enjoy. If needed, click the "load unsafe content" in https pages.

Todo
------
Clean up code, fix some bugs and maybe add some nice features.
