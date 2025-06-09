import netifaces
from uci import Uci

class IPTools:
    def __init__(self):
        self.ip = ""
        self.netmask = ""
        self.gateway = ""
        self.hostname = ""
        self.mode = "DHCP"

    def get_ip_config(self) -> dict:
        """Get the current IP configuration."""
        addrss = netifaces.ifaddresses('eth0')
        self.ip = addrss[netifaces.AF_INET][0]['addr']
        self.netmask = addrss[netifaces.AF_INET][0]['netmask']
        gws = netifaces.gateways()
        self.gateway = gws['default'][netifaces.AF_INET][0]
        u = Uci()
        self.mode = u.get("network","lan","proto")
        if self.mode == 'static':
            self.mode = 'Static'
        elif self.mode == 'dhcp':
            self.mode = 'DHCP'
        system =  u.get("system")
        for obj in system:
            for key in system[obj]:
                if key == "hostname":
                    self.hostname = system[obj][key]
                    break

        return {
            "mode": self.mode,
            "ip": self.ip,
            "netmask": self.netmask,
            "gateway": self.gateway
        }
    
    def set_ip_config(self, mode: str, ip: str, netmask: str, gateway: str = None) -> bool:
        """Set the IP configuration."""
        u = Uci()
        if mode == "Static":
            u.set("network","lan","proto", "static")
        else:
            u.set("network","lan","proto", "dhcp")
        u.set("network","lan","ipaddr", ip)
        u.set("network","lan","netmask", netmask)
        if gateway:
            u.set("network","lan","gateway", gateway)
        else:
            u.unset("network","lan","gateway")
        
        try:
            u.commit('network',"lan")
            return True
        except Exception as e:
            print(f"Error setting IP configuration: {e}")
            return False

    @staticmethod
    def is_valid_ip(ip: str) -> bool:
        """Check if the given string is a valid IP address."""
        parts = ip.split('.')
        if len(parts) != 4:
            return False
        for part in parts:
            if not part.isdigit() or not (0 <= int(part) <= 255):
                return False
        return True

    @staticmethod
    def is_private_ip(ip: str) -> bool:
        """Check if the given IP address is a private IP address."""
        if not IPTools.is_valid_ip(ip):
            return False
        first_octet = int(ip.split('.')[0])
        return first_octet == 10 or \
               (first_octet == 172 and 16 <= int(ip.split('.')[1]) <= 31) or \
               (first_octet == 192 and int(ip.split('.')[1]) == 168)
    

if __name__ == "__main__":
    ip_tools = IPTools()
    config = ip_tools.get_ip_config()
    print("Current IP Configuration:")
    print(f"Mode: {config['mode']}")
    print(f"IP: {config['ip']}")
    print(f"Netmask: {config['netmask']}")
    print(f"Gateway: {config.get('gateway', 'Not set')}")
    print(f"Hostname: {ip_tools.hostname}")
