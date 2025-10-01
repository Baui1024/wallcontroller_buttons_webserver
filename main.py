#!/usr/bin/python3
from bottle import Bottle, request, response, run, static_file
from ip_tool import IPTools  # Assuming you have an ip_tools.py with the IPTools class
import subprocess
import threading
import os
import json
import hashlib
import secrets
import time

try:
    import uci  # noqa: F401
    EMULATE_UCI = False
except ImportError:
    EMULATE_UCI = True

SECURITY_CONFIG_FILE = "security.json" if EMULATE_UCI else "/etc/webserver/security.json"

# Session management
sessions = {}  # In production, use Redis or database
SESSION_DURATION = 2 * 60 * 60  # 2 hours in seconds

app = Bottle()
ip_tools = IPTools()

def hash_password(password, salt=None):
    """Hash password with salt using PBKDF2"""
    if salt is None:
        salt = secrets.token_hex(16)
    
    # Use PBKDF2 for secure password hashing
    hashed = hashlib.pbkdf2_hmac('sha256', 
                                password.encode('utf-8'), 
                                salt.encode('utf-8'), 
                                100000)  # 100k iterations
    return f"{salt}${hashed.hex()}"

def verify_password(password, hashed_password):
    """Verify password against hash"""
    try:
        salt, hash_part = hashed_password.split('$')
        test_hash = hashlib.pbkdf2_hmac('sha256',
                                       password.encode('utf-8'),
                                       salt.encode('utf-8'),
                                       100000)
        return test_hash.hex() == hash_part
    except Exception:
        return False

def create_session(username):
    """Create a new session for authenticated user"""
    session_id = secrets.token_urlsafe(32)
    sessions[session_id] = {
        'username': username,
        'created': time.time(),
        'last_access': time.time()
    }
    return session_id

def get_session(session_id):
    """Get session if valid, None otherwise"""
    if not session_id or session_id not in sessions:
        return None
    
    session = sessions[session_id]
    
    # Check if session has expired
    if time.time() - session['created'] > SESSION_DURATION:
        del sessions[session_id]
        return None
    
    # Update last access time
    session['last_access'] = time.time()
    return session

def require_auth(func):
    """Decorator to require authentication"""
    def wrapper(*args, **kwargs):
        # Check if access control is enabled
        try:
            with open(SECURITY_CONFIG_FILE, 'r') as f:
                security_config = json.load(f)
        except FileNotFoundError:
            security_config = {'accessControl': False}
        
        if not security_config.get('accessControl'):
            return func(*args, **kwargs)
        
        # Check for valid session
        session_id = request.get_cookie('session_id')
        session = get_session(session_id)
        
        if session:
            return func(*args, **kwargs)
        else:
            response.status = 401
            return {"error": "Authentication required", "redirect": "/login"}
    
    return wrapper

# Web UI route
@app.route('/')
def home():
    if EMULATE_UCI:
        return static_file('index.html', root="frontend/dist")
    else:
        return static_file('index.html', root="/usr/bin/webserver/frontend/dist")


def restart_network_delayed():
    def restart():
        subprocess.run(["/etc/init.d/network", "restart"])
    threading.Timer(1.5, restart).start()

@app.route('/api/version', method=['GET'])
def get_version():
    """Return the version of the web server"""
    if EMULATE_UCI:
        return {
                "firmware_version": "1.0.2",
                "build_date": "2025-07-20",
                "components": {
                    "webserver": "1.0.3",
                    "gpio-daemon": "1.0.10",
                    "cert-renew": "1.0.0"   
                }
            }

    else:
        try:
            with open('/etc/wallcontroller/version.json', 'r') as f:
                version = f.read().strip()
            return json.loads(version)
        except FileNotFoundError:
            response.status = 500
            return {"error": "Version file not found"}

@app.route('/api/config', method=['GET', 'POST'])
@require_auth
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
            return {"status": "error", "message": "Invalid Netmask"}
        if new_config.get('gateway', '') != "" and not ip_tools.is_valid_ip(new_config.get('gateway', '')):
            response.status = 400
            return {"status": "error", "message": "Invalid Gateway address"}
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
    
@app.route('/api/security', method=['GET', 'POST'])
@require_auth
def security_config():
    if request.method == 'POST':
        new_config = request.json
        
        # Validate input
        if new_config.get('accessControl') and not new_config.get('username'):
            response.status = 400
            return {"status": "error", "message": "Username required when access control is enabled"}
        
        if new_config.get('accessControl') and not new_config.get('password'):
            response.status = 400
            return {"status": "error", "message": "Password required when access control is enabled"}
        
        # Prepare config to save
        config_to_save = {
            'accessControl': new_config.get('accessControl', False),
            'username': new_config.get('username', ''),
        }
        
        # Hash password if provided
        if new_config.get('password'):
            config_to_save['passwordHash'] = hash_password(new_config['password'])
        
        # Save to file
        config_dir = os.path.dirname(SECURITY_CONFIG_FILE)
        if config_dir and not os.path.exists(config_dir):
            os.makedirs(config_dir, exist_ok=True)
        
        with open(SECURITY_CONFIG_FILE, 'w') as f:
            json.dump(config_to_save, f)
        
        # Set proper permissions (readable only by root)
        os.chmod(SECURITY_CONFIG_FILE, 0o600)

        # Create session
        session_id = create_session(config_to_save["username"])
        
        # Set cookie
        response.set_cookie('session_id', session_id, 
                          max_age=SESSION_DURATION, 
                          httponly=True, 
                          secure=False)  # Set to True in production with HTTPS
        
        return {"status": "success", "message": "Security settings updated"}
    
    else:  # GET
        try:
            with open(SECURITY_CONFIG_FILE, 'r') as f:
                config = json.load(f)
            
            # Never send password hash to frontend
            return {
                'accessControl': config.get('accessControl', False),
                'username': config.get('username', ''),
                'password': '****' if config.get('passwordHash') else ''
            }
        except FileNotFoundError:
            return {
                'accessControl': False,
                'username': '',
                'password': ''
            }


@app.route('/api/login', method='POST')
def login():
    """Handle login requests"""
    credentials = request.json
    username = credentials.get('username')
    password = credentials.get('password')
    
    try:
        with open(SECURITY_CONFIG_FILE, 'r') as f:
            security_config = json.load(f)
    except FileNotFoundError:
        response.status = 401
        return {"error": "No security configuration found"}
    
    # Verify credentials
    if (username == security_config.get('username') and 
        verify_password(password, security_config.get('passwordHash', ''))):
        
        # Create session
        session_id = create_session(username)
        
        # Set cookie
        response.set_cookie('session_id', session_id, 
                          max_age=SESSION_DURATION, 
                          httponly=True, 
                          secure=False)  # Set to True in production with HTTPS
        
        return {"status": "success", "message": "Login successful"}
    else:
        response.status = 401
        return {"error": "Invalid credentials"}

@app.route('/api/logout', method='POST')
def logout():
    """Handle logout requests"""
    session_id = request.get_cookie('session_id')
    if session_id and session_id in sessions:
        del sessions[session_id]
    
    response.delete_cookie('session_id')
    return {"status": "success", "message": "Logged out"}


@app.route('/api/auth/status', method='GET')
def auth_status():
    """Check if current session is authenticated"""
    try:
        with open(SECURITY_CONFIG_FILE, 'r') as f:
            security_config = json.load(f)
    except FileNotFoundError:
        security_config = {'accessControl': False}
    
    # If access control is disabled, always return authenticated
    if not security_config.get('accessControl'):
        return {"authenticated": True, "accessControl": False}
    
    # Check for valid session
    session_id = request.get_cookie('session_id')
    session = get_session(session_id)
    
    if session:
        return {"authenticated": True, "accessControl": True, "username": session['username']}
    else:
        return {"authenticated": False, "accessControl": True}
    
@app.route('/api/firmware_update', method='GET')
@require_auth
def firmware_update():
    """Handle firmware update requests"""
    # Get the current firmware version
    def start_update():
        subprocess.run(["sysupgrade", "/tmp/firmware.bin"])
    if EMULATE_UCI:
        pass
    else:
        threading.Timer(1.5, start_update).start()
    return {
                "status": "success", 
                "message": "Firmware upgrade started. This can take a few minutes.",
            }


@app.route('/api/firmware_upload', method='POST')
@require_auth
def firmware_upload():
    """Handle firmware file uploads"""
    try:
        # Get the uploaded file
        upload = request.files.get('firmware')
        
        if not upload:
            response.status = 400
            return {"status": "error", "message": "No file uploaded"}
        
        # Check file extension
        if not upload.filename.lower().endswith('.bin'):
            response.status = 400
            return {"status": "error", "message": "Only .bin files are allowed"}

        # Check file size (limit to 20MB) and stream to avoid memory issues
        MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB in bytes
        CHUNK_SIZE = 8192  # 8KB chunks for streaming

        # Save file to /tmp with streaming to avoid memory issues
        output_path = "/tmp/firmware.bin"
        total_size = 0
        
        try:
            with open(output_path, 'wb') as f:
                # Stream the file in chunks to avoid loading entire file into memory
                while True:
                    chunk = upload.file.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    
                    total_size += len(chunk)
                    
                    # Check size limit while streaming
                    if total_size > MAX_FILE_SIZE:
                        # Remove partial file and return error
                        f.close()
                        os.remove(output_path)
                        response.status = 400
                        return {"status": "error", "message": "File too large. Maximum size is 20MB"}
                    
                    f.write(chunk)
            
            # Set appropriate permissions
            os.chmod(output_path, 0o644)
            
            return {
                "status": "success",
                "message": f"Firmware uploaded successfully as {output_path}",
                "filename": upload.filename,
                "size": total_size
            }
            
        except IOError as e:
            # Clean up partial file on error
            if os.path.exists(output_path):
                os.remove(output_path)
            response.status = 500
            return {"status": "error", "message": f"Failed to save file: {str(e)}"}

    except Exception as e:
        # Clean up partial file on error
        output_path = "/tmp/firmware.bin"
        if os.path.exists(output_path):
            os.remove(output_path)
        response.status = 500
        return {"status": "error", "message": f"Upload failed: {str(e)}"}


@app.route('/<filename:path>')
def serve_static(filename):
    if EMULATE_UCI:
        return static_file(filename, root="frontend/dist")
    else:
        return static_file(filename, root="/usr/bin/webserver/frontend/dist")



if __name__ == '__main__':
    if EMULATE_UCI:
        print("Emulating UCI, not actually changing network settings.")
        run(app, host='0.0.0.0', port=8080, quiet=False, debug=False, reloader=True)
    else:
        run(app, host='0.0.0.0', port=80, quiet=True, debug=False, reloader=True)