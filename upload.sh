ssh hilink "mkdir -p /usr/bin/webserver/frontend"
scp main.py hilink:/usr/bin/webserver/main.py &
scp webserver.init hilink:/etc/init.d/webserver &
scp ip_tool.py hilink:/usr/bin/webserver/ip_tool.py &
scp -r frontend/dist/ hilink:/usr/bin/webserver/frontend
echo "Upload complete. Restarting Service"
ssh hilink "/etc/init.d/webserver restart"
echo "Done"
