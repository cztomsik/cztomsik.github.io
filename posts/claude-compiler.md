---
title: Why is a C compiler written by Claude not a big deal?
date: 2026-02-08
---

So, this week, two things happened in the Claude universe: a new model dropped
(Opus 4.6), and I can't comment too much about that yet. And also, Claude
engineers wrote [a blog post](https://www.anthropic.com/engineering/building-c-compiler)
about how they let this model implement a C compiler from scratch, which is then
able to compile a bootable Linux kernel.

It was "a team-effort" (meaning that there were multiple agents running in
parallel) and the tokens alone would cost you $20k if you were to do that
yourself, using the API. The article also mentions that this was done without
any access to the Internet. And as expected, people went completely crazy about
it...

So, first of all, it is very likely that the model was trained on one of the
compiler codebases, because if there is anything you want to put to your
training set, it's high-quality data with possibly a long history of
maintenance, and I would include such repos too, so I'm quite sure they did.

And I'm not saying that the result is a copycat but it certainly helps if you
have a lot of context already encoded in the weights and also the whole "no
access to internet" point is kind of silly if you consider this.

But let's suppose (for a moment) that none of LLVM, GCC, TCC, Go, Zig, Odin, D,
V, ... were part of the training data. Well, GitHub, Stack Overflow, Reddit, and
various blogs are still full of the compiler theory and also lots of tutorials
and examples. It just happens to be so that some people, usually highly skilled
individuals, **enjoy** implementing compilers, and/or reading and writing about
that.

And I get that it's not something that typical programming Joe is interested in,
but if you peek just a little under the hood and start looking for the
resources, there are lots and lots of things where you can learn about compilers
and lots of hobby projects as well. Sure, lots of them also get abandoned, but
they usually get so after some important milestone is met. Like being able to
compile the Linux kernel. Which is where Claude stopped too and I don't think
that's a coincidence.

> BTW: there are also some good books about this, and many wikipedia articles
> too, and I guess I'm repeating myself here a bit but it's just hard for me to
> see how a compiler might be a hard task for any LLM (except maybe the context
> rot)

The hard part for any project is maintenance, testing, perf optimization (and
benchmarking), interacting with other people on github/xxx, reviewing work done
by others, and I just can't see how Claude could easily help with that. There's
always going to be somebody responsible for the project, whose name is there,
and that's the final bottleneck, unfortunately, but it's also a good thing
because it takes time to become trustworthy and "you're absolutely right" is not
going to spark a lot of confidence.

It feels like all of this was just a PR stunt, for a common programming
audience, because most people just don't care about compilers, and they also
consider it a hard task. And it's also like that with web browsers, people
suppose that it's some god-level coding but it's really not.

One interesting thing though, it seems that Claude might be able to write Rust
now, which is great because it was definitely struggling with that a lot before.
