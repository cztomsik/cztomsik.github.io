---
title: Using Zig for web applications
date: 2026-02-28
---

So I said previously that using Rust for web programming is kind of silly,
because you suddenly need to worry about a lot more things, and you also
(largely) forego that nicety of programming against interfaces and being able to
easily swap the implementation of anything, at any time, for any purpose.

> You can program against interfaces in any language, but doing so in a
> language where it's implied and a default way of doing things, is an entirely
> different experience - and huge enabler.

And if I stand by that then why it might still make sense, and in what world it
might be better to use Zig rather than Rust, which is arguably a much
higher-level than Zig?

I think that it mostly goes down to writing robust systems. It is harder to
implement a web app in Zig, it is way more work, and LLMs are not going to be
very useful to you, so it's also a bit of a challenge, but the main thing is
that Zig makes it trivial to write code with predictable memory usage. There are
other nice things, but let's keep them for some future posts.

If you ever had to trace a memory-leak in Java/JS (your app was getting slower
and/or eventually crashed/got killed because it was consuming too much memory)
then that's exactly what's impossible with carefully written Zig code.

You are always responsible for every alloc/free which is a lot of pain, it
really is, but you also get this nice property that suddenly you can tell how
much memory is something allowed to consume, and when it is going to be freed.
You can estimate better what machine you might need for handling N concurrent
requests. You can be more confident about your system.

You will start to write better code too, instead of fetching HTTP responses
fully in the memory without any limit, you'll avoid allocation (instinctively,
because it's extra typing), you will use provided buffers, and/or you will have
a way to cap the max usage for a single request because every allocation is
going through whatever allocator you have passed, ie. `ArenaAllocator`.

It's easy and common to use arenas, exactly for this purpose. Arenas are also
existent in other languages, but specifically in Rust, the only thing they share
is the name, because there's always this borrow-checker carefully checking
mem-safety for you, but also preventing you from writing any code **it does not
know how to check**.

> This is the real catch, borrow-checker achieves mem-safety, but it limits
> significantly what you can do in your code.

And that's where it all gets interesting with arenas, you can use a single
arena, over the life-time and call-stack of many, many structs, however deep you
want, without having to declare lifetimes, no need for complicated branding,
your arena is the lifetime.

And it's a simple idea, it could be replicated in most of non-Rust languages
too, yet no other language does it so carefully, and so you don't get this
property anywhere else in practice. Zig libraries are written with this in mind,
C/C++ are not. And as I said, it's impossible to do the same thing in current
Rust unless it gets runtime branding or you use some ECS store but that is
arguably just a way to get around borrow-checker entirely.

> BTW: I like Zig and I enjoy using it but it's not very suited for writing a
> webapp. Use JS, Ruby, Python, Java/Kotlin, or whatever, you will have much
> easier life. Zig is great if you want this level of robustness - I do.