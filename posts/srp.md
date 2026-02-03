---
date: 2026-02-03
title: Single Responsibility Principle
---

In the spirit of my [previous blog post about OOP](./oop), I'd like to say a few
words about (in my opinion) a mostly misunderstood principle in the whole
history of object-oriented programming.

I think it was even mentioned in one of the OOP books back in the day, but I
totally remember people saying & citing over and over again, that SRP means that
"class should do one thing, and do it well", which is **totally not** what SRP
is supposed to mean. And I'm not sure if Wikipedia didn't say that too at the
time.

> Maybe Bertrand Meyer? A class has a single responsibility: it does it all,
> does it well, and does it only.

There's a more exact (still a bit cryptic) description by Robert C. Martin (and
full disclosure, I am not a fan of his talks or anything, not my cup of tea at
all), it's just that he's credited for this explanation which I consider to be
much better: "A class should have only one reason to change."

Since then he even expanded it to "Gather together the things that change for
the same reasons. Separate those things that change for different reasons."
which I think, is much better wording.

If you go with the original description, and confuse it with the UNIX philosophy
and then follow this fanatically, believing that you are doing the right thing,
you'll eventually have just a bunch of single-method classes, not doing anything
useful. And it happens, and sometimes it's also desirable, but in general, a
single-method class is a **code-smell**, and should be avoided.

Ok, so what does the other description really mean? What is SRP about? Well,
simply put, it means that *related things should be together* (in one unit).

It's a bit vague but suppose that you are implementing the admin interface for
some e-commerce platform, and you need to add some **data-exporting** feature
(dump everything to some XML file), either for your accountant, or for your
re-seller partners, or whatever.

You totally could have this together with the rest of the CRUD logic, but how
often is this really going to change? And when you change the XML format, it's
unlikely that you'd be also doing changes in the CRUD part, right? So having a
class (or unit/module) just for this part, possibly with dedicated test-suite is
a good application of the SRP principle. You can have as many methods there as
you like, as long as they are all related to that exporting feature, ie. fetch
the data, do some aggregations, perform date formatting, figure out a file-name,
write the file, or send it over network, upload to some exchange server, ...

Now, going back to the original description: Is it doing one thing? Yes, but you
could also say that one thing is just figuring out the correct filename, and
have a class just for that - but that would be a **violation** of the principle,
not a good application.

I like to think of SRP (my subjective take) more as a passive process, or maybe
a code-smell indicator, and opportunity for refactoring - you don't have to
worry too much about it since the beginning, but if you find yourself changing
multiple files over and over again, when working on one feature, which is kind
of separate, then it might be time to re-split these things.

> And just one small thing, don't worry too much if you are just starting with
> programming, and maybe you are still confused about these things - the most
> important thing after all is if the code does what was requested. Principles
> are great, but it's just theory, I have way more respect for people who ship
> something useful, than for those lecturing about it.