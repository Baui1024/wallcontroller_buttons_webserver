#!/usr/bin/python3


import os
from bottle import Bottle, request, response, run, static_file

app = Bottle()
project_path = os.path.abspath("")

# Data storage (for demonstration purposes)
data = {"message": "Hello, World!"}

# REST API endpoint
@app.route('/api/data', method=['GET', 'POST'])
def api_data():
    if request.method == 'POST':
        new_data = request.json
        data.update(new_data)
        response.content_type = 'application/json'
        return {"status": "success", "data": data}
    response.content_type = 'application/json'
    return data

# Web UI route
@app.route('/')
# @app.route('/<:re:.*>')
def home():
    return static_file('index.html', root=f"{project_path}/frontend/dist")

@app.route('/api/config')
def get_ip_config():
    return {
        "mode" : "DHCP",
        "ip": "192.168.1.100",
        "netmask": "255.255.255.0",
        "gateway": "192.168.1.1"
    }


@app.route('/<filename:path>')
def serve_static(filename):
    print("requested IP")
    return static_file(filename, root=f"{project_path}/frontend/dist")



if __name__ == '__main__':
    run(app, host='0.0.0.0', port=5000, debug=True, reloader=True)


