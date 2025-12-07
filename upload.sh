ip=192.168.177.178


sshpass -f "passwordfile" ssh root@$ip "mkdir -p /usr/bin/webserver/frontend"
sshpass -f "passwordfile" scp main.py root@$ip:/usr/bin/webserver/main.py
sshpass -f "passwordfile" scp webserver.init root@$ip:/etc/init.d/webserver
sshpass -f "passwordfile" scp gpio_ip_monitor.py root@$ip:/usr/bin/webserver/gpio_ip_monitor.py
sshpass -f "passwordfile" scp mt7688gpio.py root@$ip:/usr/bin/webserver/mt7688gpio.py
sshpass -f "passwordfile" scp ip_tool.py root@$ip:/usr/bin/webserver/ip_tool.py
sshpass -f "passwordfile" scp -r frontend/dist/ root@$ip:/usr/bin/webserver/frontend/dist
echo "Upload complete. Restarting Service"
sshpass -f "passwordfile" ssh root@$ip "/etc/init.d/webserver restart"
echo "Done"
