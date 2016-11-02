import RPi.GPIO as GPIO
import binascii
import os
import picamera
import requests
import time
from colorama import init, Fore
from phue import Bridge
import Image, sys

# path to adafruit pyhton thermal printer lib
sys.path.append("../Python-Thermal-Printer")
from Adafruit_Thermal import *


# printer settings
photoResize = 512, 384
printer = Adafruit_Thermal("/dev/ttyAMA0", 19200, timeout=5)


# config
config = {
    "url": "http://YOUR_URL",
    "secret": "123456",
    "gpioPin": 23,
    "hue": {
        "bridgeIp": "YOUR_LOCAL_HUE_BRIDGE_IP",
        "lampName": "Cellar",
    },
    "camera": {
        "width": 1152,
        "height": 900
    }
}

# hue bridge settings
bridge = Bridge(config["hue"]["bridgeIp"])
bridge.connect()
bridge.get_api()

# camera settings
camera = picamera.PiCamera()
camera.hflip = True
camera.resolution = (config["camera"]["width"], config["camera"]["height"])

init(autoreset=True)

GPIO.setwarnings(False)

GPIO.setmode(GPIO.BCM)

# setup gpio pin behaviour
GPIO.setup(config["gpioPin"], GPIO.IN, pull_up_down=GPIO.PUD_UP)

# turn light on
commandOn = {
    'transitiontime': 0,
    'on': True,
    'bri': 254,
    'xy': [0.4596, 0.4105]
}

#turn light off
commandOff = {
    'transitiontime': 0,
    'on': False,
    'bri': 254,
    'xy': [0.4596, 0.4105]
}

# red light
commandOffRed = {
    'transitiontime': 0,
    'on': False,
    'bri': 254,
    'xy': [0.6621, 0.3123]
}

# image counter
counter = 0

# headline
print('')
print(Fore.GREEN + '--------------------------')
print(Fore.GREEN + '---- START PHOTOBOOTH ----')
print(Fore.GREEN + '--------------------------')
print('')


# wait for input
while True:
    if GPIO.input(config["gpioPin"]) == False:
        counter += 1

        print('--       Photo: ' + str(counter))

        # set image name and path
        pictureName = binascii.hexlify(os.urandom(16)) + '.jpg'
        picturePath = './' + pictureName

        time.sleep(1)
        print('- 1...')

        time.sleep(1)
        print('- 2...')

        time.sleep(1)
        print('- cheese...')

        # turn light on
        bridge.set_light(config["hue"]["lampName"], commandOn)

        camera.capture(picturePath)
        time.sleep(0.3)

        # turn light off
        bridge.set_light(config["hue"]["lampName"], commandOff)

        # resize and rotate image
        Image.open(picturePath).resize(photoResize, Image.ANTIALIAS).transpose(3).save("temp.jpg")

        # start print progress
        printer.begin(60)
        printer.setTimes(40000, 3000)
        printer.justify('C')
        printer.feed(1)
        printer.feed(1)

        printer.printImage(Image.open("temp.jpg"), True)

        printer.feed(1)
        printer.feed(1)
        printer.feed(1)


        # send photo to webserver
        r = requests.post(config["url"] + '/upload', files={
            'file': open(picturePath, 'rb')
        }, params={
            'secret': config["secret"]
        })

        # turn light off
        bridge.set_light(config["hue"]["lampName"], commandOff)

        time.sleep(0.3)

        # remove picture
        os.remove(picturePath)

        print('--------------------------')
    time.sleep(0.2)
