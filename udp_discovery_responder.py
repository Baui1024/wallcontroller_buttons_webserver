import socket
import struct
import json
import threading


class UdpDiscoveryResponder:
    def __init__(self, name, listen_ip='0.0.0.0', mcast_addr='225.0.0.251', port=7386):
        self.name = name
        self.listen_ip = listen_ip
        self.mcast_addr = mcast_addr
        self.port = port
        self.sock = self._setup_socket()
        self.running = False

    def _setup_socket(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((self.listen_ip, self.port))

        # Join multicast group
        mreq = struct.pack("4s4s", socket.inet_aton(self.mcast_addr), socket.inet_aton(self.listen_ip))
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
        return sock

    def _get_local_ip(self, target_ip):
        # This trick finds the outbound IP used to reach a destination
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect((target_ip, 1))
            return s.getsockname()[0]
        finally:
            s.close()

    def _handle_request(self, data, addr):
        print(f"Received discovery request from {addr}")
        local_ip = self._get_local_ip(addr[0])
        response = json.dumps({
            "ip": local_ip,
            "name": self.name
        }).encode('utf-8')
        self.sock.sendto(response, (self.mcast_addr, addr[1]))
        print(f"Sent response to {(self.mcast_addr, addr[1])}: {response.decode()}")

    def start(self):
        print(f"Listening for discovery on {self.mcast_addr}:{self.port}...")
        self.running = True
        while self.running:
            try:
                data, addr = self.sock.recvfrom(1024)
                self._handle_request(data, addr)
            except Exception as e:
                print(f"Socket error: {e}")

    def stop(self):
        self.running = False
        self.sock.close()


# Example usage
if __name__ == "__main__":
    responder = UdpDiscoveryResponder(name="wallcontroller-ABCD")
    try:
        responder.start()
    except KeyboardInterrupt:
        print("Shutting down responder.")
        responder.stop()
