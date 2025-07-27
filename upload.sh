ip=192.168.177.55

ssh root@$ip "mkdir -p /usr/bin/webserver/frontend"
scp webserver.init root@$ip:/etc/init.d/webserver
scp gpio_ip_monitor.py root@$ip:/usr/bin/webserver/gpio_ip_monitor.py
scp mt7688gpio.py root@$ip:/usr/bin/webserver/mt7688gpio.py
scp main.py root@$ip:/usr/bin/webserver/main.py
scp ip_tool.py root@$ip:/usr/bin/webserver/ip_tool.py
scp -r frontend/dist/ root@$ip:/usr/bin/webserver/frontend/dist
