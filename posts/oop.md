---
date: 2026-02-01
title: In defense of OOP
---

> I wanted to write this for some time but I was a bit shy because who am I to
> tell others what to do, right? But anyway, here's my opinion, feel free to
> disagree.

OOP has been getting quite a bit of pushback in recent years both from the FP
community and also from people doing system-level programming but notably also
from game developers.

Now, I think it's worth noting that game development is a little bit of a niche
area - you really do care about every tick and some alternative patterns like
ECS fit really nicely into that problem domain. I mean, if you think about it, a
typical game is a sort of simulation and you really need to do a ton of work in
every frame, and obviously the closer you can get to the "real thing", the more
immersive the whole experience can get, ie. being able to animate 1000 NPCs vs.
the whole city (or being able to run at 60 vs. 30 FPS) is kind of a deal breaker
(for games).

But OOP patterns have been (at least in my experience) at home mostly in the
context of web applications, and complex business rules, where things tend to
evolve between versions, and you generally like to compose your application from
different modules (often re-used between projects) and to make it behave in a
tiny bit different way, just by changing some configuration, adding decorators,
etc.

I don't want to undermine the game industry but if you are writing a game, it's
rather sort of a sprint - you race against other game companies, and let's say
after 1-2 years, you have to ship something, hopefully sell lots of copies, and
you kind of move on. That's just how it is, it doesn't mean that you cannot
write maintainable code but there's not enough direct reward in doing so.

> I can't tell much about (real) systems programming, but most of the points
> above also apply here, if you care about perf, you avoid allocations,
> pointer-chasing, etc. If you don't care about perf, you'd be better off using
> a different language (ie. using Rust for webapps is just like willingly going
> the hard way, mostly without any benefit).

Whereas in the context of webapps, and especially enterprise webapps (a thing of
the past, admittedly) it makes a lot of sense. Webapp performance is typically
dominated by how fast your SQL queries are, and how fast your networking is, and
also if you are SaaS, it's also about the speed/latency of the consumer's
network. So basically, all of the perf arguments are void in this context, you
just don't have to worry about raw-speed, and that's also why these apps are
typically written in Java, C#, and similar GC-based platforms. You are throwing
away some speed but you also don't need to worry about memory, and it's a good
trade-off, in this context, IMHO.

Most of these platforms are also running some kind of VM, where you can get way
more dynamic, use reflection, generate wrapper classes on-the-fly, etc.

What is that useful for? For one thing, it's easy to do declarative logging, or
declarative auth rules. You can easily ensure that something always runs in a
transaction, you can easily add some performance monitoring, and you can do all
of that simply because you are programming against interfaces and because there
are vtables everywhere, you don't have to think about that, it's always there,
whenever you might need it.

And here's the thing - this was an intentional decision we've made, it's not an
accident, we are not dumb, or ignorant - we are just working in a totally
different domain and we have different objectives. Using a different language
and/or dropping OOP entirely could result in marginal performance gains but our
life could get way more unpleasant in exchange.

> Small addendum, I am nowhere saying that you should use OOP style and patterns
> everywhere, and I am totally on board with people making fun of extremely long
> class names and XyzAbstractFactoryBuilders, those puns are 100% on point and
> justified. There needs to be balance, but saying that OOP was a mistake and
> that it should be avoided is doing huge disservice to our industry.
