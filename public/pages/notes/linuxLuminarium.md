---
title: Linux Luminarium
date: 2026-04-24
tag: writeup
category: pwn-college
---

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
