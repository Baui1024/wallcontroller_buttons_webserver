#!/usr/bin/python3
from bottle import Bottle, request, response, run, static_file
from ip_tool import IPTools  # Assuming you have an ip_tools.py with the IPTools class
import subprocess
import threading


app = Bottle()
ip_tools = IPTools()

# Web UI route
@app.route('/')
# @app.route('/<:re:.*>')
def home():
    return static_file('index.html', root="/usr/bin/webserver/frontend/dist")


def restart_network_delayed():
    def restart():
        subprocess.run(["/etc/init.d/network", "restart"])
    threading.Timer(1.5, restart).start()

@app.route('/api/config', method=['GET', 'POST'])
def get_ip_config():
    if request.method == 'POST':
        new_config = request.json
        # Here you would typically save the new configuration to a file or database
        print("New configuration received:", new_config)
        if not ip_tools.is_valid_ip(new_config.get('ip', '')):
            response.status = 400
            return {"status": "error", "message": "Invalid IP address"}
        if not ip_tools.is_private_ip(new_config.get('ip', '')):
            response.status = 400
            return {"status": "error", "message": "IP address must be a private IP"}
        if not ip_tools.is_valid_ip(new_config.get('netmask', '')):
            response.status = 400
            return {"status": "error", "message": "Invalid IP address"}
        if not ip_tools.is_valid_ip(new_config.get('gateway', '')):
            response.status = 400
            return {"status": "error", "message": "Invalid IP address"}
        ip_tools.set_ip_config(
            mode=new_config.get('mode', 'DHCP'),
            ip=new_config.get('ip', ''),
            netmask=new_config.get('netmask', ''),
            gateway=new_config.get('gateway', '')
        )
        restart_network_delayed()
        response.content_type = 'application/json'
        return {"status": "success", "config": new_config, "message": "Success! Restarting network in 1.5 seconds."}
    else:
        return ip_tools.get_ip_config()


@app.route('/<filename:path>')
def serve_static(filename):
    return static_file(filename, root="/usr/bin/webserver/frontend/dist")



if __name__ == '__main__':
    run(app, host='0.0.0.0', port=80, quiet=True, debug=False, reloader=True)


