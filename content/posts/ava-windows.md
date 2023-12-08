---
date: 2023-10-18
title: Ava for Windows (experimental)
---

> **TL;DR** There is now an experimental build of [Ava](https://www.avapls.com)
> for Windows. You can [download it here](https://www.avapls.com/#download).

As you may know already, Ava is a webview-based app. This is because I knew from
the start that I want to support multiple platforms and I don't want to write
the same app multiple times.

I could use electron, but I don't like to download big binaries. I could also
use tauri, but I have bad experience with Rust so that was also off the table.
And to be honest, I don't like dependencies in general, so I just tried to make
a simple PoC and see how far I can get.

## macOS

The macos version was much easier than I expected. I just used the `WKWebView`
and given that Zig can include Objective C files, it was just a matter of few
lines to get it working.

This was already a big win for me, and it lasted for a few nice weeks, where I
could just focus on the server and UI part and not worry too much about the
platform.

There was one problem when I was trying to get the app notarized, because for
some reason the x86_64 part of the universal binary was corrupted during the
code-sign process. I have no idea what was wrong, but I just decided to rewrite
it from Objective C to Swift, because I wanted to do that anyway, and it worked
great. This small hiccup took me about 1 day. There was one another issue with
`SIGPIPE` but I'm going to blog about it later.

## Windows (first PoC in C++)

Ok, so let's get to the tricky stuff. Given that I already had the server part
done and the app was already structured to the "platform-shell + app-as-lib"
architecture, I thought it should be easy to just write a new shell for windows.

I was wrong. I was so wrong. First of all, there is no easy way to just use
webview from C or Zig. I mean, it is possible, but you don't want to do that.

Um, ok, so C++ it is, never did anything in that language in my life, but hard
that can be? Well, to be honest, the C++ part was not that hard, the hard part
was to figure out all of the dependencies and linking and stuff like that. And
you have to download header files as part of the build process, etc.

Apart from that, most things were actually working fine. I had to rewrite few
things to be really multi-platform, but that was expected. I was able to get the
basic app running on windows in about 2-3 days.

But it was not really working properly and there were 2 big issues:

1. Occasionally, the app wouldn't start; it would simply display a blank window,
   and the server would not respond at all.

2. Even after the app was closed, the process continued to run in the
   background. This only occurred when the first issue did not so I thought they
   were related.

Ok, so given that I had no idea what was wrong, I thought it might be because of
the C++ wrapper I wrote for the webview because I was not really sure what I was
doing there. So I decided to rewrite it in Zig.

## Windows (this time in Zig)

I was hoping I could just `@cImport` or `zig translate-c` the header file and
use it from Zig but there were some issues. So eventually, I just copy pasted
symbol names and manually filled in signatures only for those COM methods which
I really needed.

Or maybe I'm a bit too ahead... The webview on windows is actually a COM object.
And to load it, you need a WebView2Loader.dll file which contains the
`CreateCoreWebView2EnvironmentWithOptions` symbol. This is the function which
creates the COM object and returns a pointer to it. And then you can call
methods on that object to do stuff.

But there is no support for COM in Zig so I had to do this myself. It was not
hard at all and I definitely want to write about it later because it's a nice
example of what I love about Zig, but for now, let's just say that I was able to
get it working.

## closesocket()

So I had it working, but the same issues were still there. At least I didn't
have to worry about the C++ anymore. Also, the binary got around 500KB smaller,
which is nice.

So from those 2 issues, I decided to tackle the second one first because it was
easier to reproduce and also because it was making me angry every time I had to
kill the process manually. After putting some debugs in the zig stdlib (**you
can do changes to your local copy because it is compiled as part of your app**)
it turned out that the process was waiting for `closesocket()` to return.

I thought this would be easy to fix but it took me at least one whole day.
It turns out that unless you do non-blocking sockets, the `closesocket()` call
will block until the server accepts a new connection. And there was nobody to
connect to because the app was already closing. Bad.

So instead of doing non-blocking sockets, I decided to just introduce a status
flag and then just connect to the socket during the shutdown process.
It's not pretty, but it works.

## Occasional blank window

This took me way longer than I'm willing to admit. I was trying to figure out
what is wrong with the webview, I was sprinkling debugs everywhere, I was moving
the order of the initialization calls but it was still happening.

At some point I was just too tired and gave up. I decided to just refactor few
things in the server part and then I will try to figure it out again.

I had no luck, but then I went to eat something and I left the blank window there,
but when I came back, the UI was there. I was like "what the hell?" and I've checked
again and again and it was always the same. The window was blank for a minute or
so and then it was there. So some change I did in the server part must have
partially fixed the problem.

Ok, so obviously it was a timeout and it got me thinking and looking at the
server code again. And then I realized that I was not doing just `socket.accept()`
in the server thread, I was also doing some common stuff there like sending
`Connection: Close` header before creating a new thread.

The problem was that this should be already in a new thread, not in the server
thread itself. When I've restructured the code to only do `socket.accept()` in
the server thread and then do everything else in a newly created request thread,
then everything started working as expected.

I have no idea why this was happening only on Windows and not on macOS, but I'm
glad it's fixed now and hopefully, this will help somebody else.

## Conclusion

I guess the main takeaway from this is that sometimes you just need to take a
break and go eat something. ¯\_(ツ)\_/¯

## SQLite

I also had to statically link SQLite because it is not available on Windows
unlike on macOS. This was super-easy, I just had to download the amalgamation
file and add it to the build. I'm only mentioning this for completeness, but
it's not really related to the rest of the story.
