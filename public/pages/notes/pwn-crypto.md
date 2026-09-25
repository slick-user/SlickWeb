---
title: Introduction to Cryptography
date: 2026-04-24
tag: writeup
category: pwn-college
---

# One-Time Tampering

looking through the code, The Dispatcher opens and reads the key and then runs a xor operation on the key with the another key of.... "sleep"?

``` python
# Dispatcher code
from Crypto.Util.strxor import strxor

key = open("/challenge/.key", "rb").read()
ciphertext = strxor(b"sleep", key[:5])

print(f"Task: {ciphertext.hex()}")
```

`TASK: 6483f98429` is the output which means that we have a xored file that has possibly xored the cipher text sleep with whatever the key is?

``` python
# Worker Code

from Crypto.Util.strxor import strxor

import time
import sys

key = open("/challenge/.key", "rb").read()

while line := sys.stdin.readline():
    if not line.startswith("TASK: "):
        continue
    data = bytes.fromhex(line.split()[1])
    cipher_len = min(len(data), len(key))
    plaintext = strxor(data[:cipher_len], key[:cipher_len])

    print(f"Hex of plaintext: {plaintext.hex()}")
    print(f"Received command: {plaintext}")
    if plaintext == b"sleep":
        print("Sleeping!")
        time.sleep(1)
    elif plaintext == b"flag!":
        print("Victory! Your flag:")
        print(open("/flag").read())
    else:
        print("Unknown command!")
```

I just need to strxor (perform XOR again) with the output cipher text I recieved and with the plaintext `sleep`, then using that key I will xor that with `flag` and provide it as output to the worker

``` python
from Crypto.Util.strxor import strxor

dispatcher_output = "6483f98429"
old_ciphertext = bytes.fromhex(dispatcher_output)

known_plaintext   = b"sleep"
desired_plaintext = b"flag!"

new_ciphertext = strxor(strxor(old_ciphertext, known_plaintext), desired_plaintext)

print(f"TASK: {new_ciphertext.hex()}")

```

![[OTP2.png]]
![[OTP1.png]]
