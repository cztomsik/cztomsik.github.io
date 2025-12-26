---
date: 2017-07-27
title: Raspberry virtual machine from sdcard (linux/mac)
---

> This was originally published on medium.com, but they recently started
> paywalling everybody, so I'm moving my articles here.

Here's a quick way to run Raspbian from an SD card on your Mac or Linux machine.
It will emulate a Raspberry Pi 2 (or different version), but it doesn't matter
because all Raspberry Pi models are binary compatible.

Download the [latest Raspbian](https://www.raspberrypi.com/software/)

![raspbian](/images/raspi-vm-sd-card.png)

Flash to sdcard using [Etcher](https://etcher.io) (or whatever else)

Get qemu

```bash
# or apt-get install qemu on linux
brew install qemu
```

Get kernel and device tree from the first (vfat) partition of the sdcard

```bash
# This is how it's called on mac, on linux it's probably /dev/sdb1 or something
cp /Volumes/boot/{*.img,*.dtb} ./
```

Start qemu with io forwarded to your terminal:

```bash
# optionally unmount /dev/disk2 first
# Mac: sudo diskutil unmountDisk /dev/disk2
sudo qemu-system-arm \
-no-reboot \
-serial stdio \
-machine raspi2 -m 256 \
-dtb ./bcm2709-rpi-2-b.dtb \
-kernel ./kernel7.img \
-drive file=/dev/disk2,format=raw \
```

If what you want to do is to just run it in the VM, you are done here, in my
case I actually wanted to setup raspi to run on my network and then boot it
on the real hardware, and I had to do it from the VM because I didn't have
a keyboard at hand.

Setup network:

```bash
sudo vi /etc/wpa_supplicant/wpa_supplicant.conf
```

Enable ssh:

```bash
sudo raspi-config
```

Shutdown and boot with regular raspberry pi:

```bash
sudo shutdown now
```
