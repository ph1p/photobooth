# description

A small python script with a node server to run your own raspberry pi photo booth.


# needed python packages

* sudo pip RPi.GPIO
* sudo pip picamera
* sudo pip requests
* sudo pip colorama
* sudo pip phue
* https://github.com/adafruit/Python-Thermal-Printer


# start

install `nodejs` (https://nodejs.org/en/)

set secrets in `photobooth.py (LINE 24)` and `/server/config/config.json (LINE 5 and 10)`
start photobooth python -> `python photobooth.py`

got to ./server` folder
* npm install (yarn install)
    * install all dependencies
* npm start (yarn run start)
    * start dev server on port 3000


* npm run prod (yarn run prod)
    * start production mode
* npm run forever (yarn run forever)
    * run script in production mode as service on port 80 (`$ [sudo] npm install forever -g`)
* npm run start-win (yarn run start-win)
    * run server on windows
* npm run clean (yarn run clean)
    * remove images and database


# configs

* all camera python configs in `photobooth.py`
* server config -> `./server/config/config.json`

# rsync

* rsync -av --exclude-from=./photobooth/exclude_rsync --delete ./photobooth your_ssh_entry:`


# needed devices

- Raspberry PI (~35 €)
- Mini Thermal Printer RS232 / TTL (~30 €)
- Kamera Modul für Raspberry Pi (2.0 or 1.3) (~30 €)
- Physical switch/push button
- power supplies for the raspberry PI (smartphone charger) and the thermal printer (5V 2A)