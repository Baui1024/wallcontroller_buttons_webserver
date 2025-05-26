ip=192.168.177.51

ssh root@$ip "mkdir -p webserver/frontend"
scp main.py root@$ip:webserver/main.py
scp ip_tool.py root@$ip:webserver/ip_tool.py
scp -r frontend/dist/ root@$ip:webserver/frontend/dist
