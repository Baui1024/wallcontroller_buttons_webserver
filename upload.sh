ip=192.168.177.51

ssh root@$ip "mkdir -p /usr/bin/webserver/frontend"
scp webserver root@$ip:/etc/init.d/webserver
scp main.py root@$ip:/usr/bin/webserver/main.py
scp ip_tool.py root@$ip:/usr/bin/webserver/ip_tool.py
scp -r frontend/dist/ root@$ip:/usr/bin/webserver/frontend/dist
