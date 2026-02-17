import websockets
import asyncio
from mt7688gpio import MT7688GPIOAsync
from ip_tool import IPTools
import subprocess

import json
import time

class Monitor:
    def __init__(self, pin = 11):
        self.socket = None
        self.pin = pin
        self.gpios = []
        self.min_time = 5
        self.max_time = 10
        self.ip_tools = IPTools()
    
    async def open_gpio(self):
        gpio = MT7688GPIOAsync(self.pin)
        gpio.set_direction(is_output=False, flip=True)
        await gpio.start_polling(self.on_change, edge="both")
        while True:
            await asyncio.sleep(1)

    async def close_gpio(self):
        for gpio in self.gpios:
            await gpio.stop_polling()
            gpio.close()
        self.gpios.clear()

    async def on_change(self, state, pin):
        if state == 1:
            print(f"Rising edge detected on pin {pin}")
            self.on_time = time.time()
        elif state == 0:
            print(f"Falling edge detected on pin {pin}")
            passed_time = time.time() - self.on_time
            if passed_time > self.min_time and passed_time < self.max_time:
                self.ip_tools.set_ip_config(
                    mode="Static",
                    ip="192.168.100.100",
                    netmask="255.255.255.0")
                subprocess.run(["/etc/init.d/gpio-daemon", "stop"]) # Stop the GPIO daemon to free the LEDs for blinking
                for x in range(3):
                    for i in range(16):
                        with open(f"/sys/class/leds/pca963x:led{i}/brightness", 'w') as f:
                            f.write("255")
                    time.sleep(0.2)
                    for i in range(16):
                        with open(f"/sys/class/leds/pca963x:led{i}/brightness", 'w') as f:
                            f.write("0")
                    time.sleep(0.2)
                subprocess.run(["/etc/init.d/network", "restart"])
                subprocess.run(["/etc/init.d/gpio-daemon", "start"]) 

if __name__ == "__main__":
    monitor = Monitor()
    asyncio.run(monitor.open_gpio())

     # Keep the script running for a while to test

