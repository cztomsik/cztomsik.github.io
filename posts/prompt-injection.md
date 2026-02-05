---
title: Why is it so hard to fix prompt injection?
date: 2026-02-05
---

> Disclaimer: This is my personal feeling, based on my previous research,
> experiments with LLMs, and simply by following the area closely and reading
> lots of papers myself. I have no proofs, no hard evidence, but people saying
> otherwise don't have that either and yet they are so confident that prompt
> injection can be fixed. So let me disagree here a bit.

Modern LLMs are trained in multiple phases, and it all starts with the so-called
pre-training which is simply about plowing the model through lots and lots of
text data (tokens), with the task of predicting the next token. This is 99% of
all training costs.

It's like if you were trying to memorize all the books in the universe, word by
word, desperately trying to fit everything in your constant-space brain. You
can't, and the model cannot either, but it will certainly try, and during that
it will learn how to compress that text (sequence of tokens) into some abstract
meaning.

This abstract meaning is interesting because it can still be combined and
extended, just like language, so "apple" has a different meaning than "apple
computer".

> BTW: See https://mattmahoney.net/dc/dce.html if you're interested in learning
> about compression in general, this was written way before LLMs were a thing,
> and yet so many things apply, and it is still very on point.

Such a base model is a little bit useful already, if you know how to prompt it
(GPT-3), but it's not well-suited for the chat usage, so what follows is
instruction fine-tuning and then some alignment, this can also be done together,
and it's sort of the secret sauce unique to each AI lab.

Instruction tuning is just about making the model useful, adapting it to the
general pattern of system prompt, user prompt and assistant responses, and
fulfilling tasks given by the user. This is what we want, and it is the
**primary feature** of all LLMs we are using today.

Such a model could be used directly but it could be dangerous to general public
(as they say), and so the labs also do something called alignment. This phase is
about teaching the model to "behave", be a good citizen, and to reject certain
things, and it's also where its "character" emerges from.

I suppose that this is also where they add some examples of prompt-injection,
and how the model should still follow the system prompt instead. I also assume
that this can help, at least to the extent that the general public cannot tell.
Unfortunately, it doesn't matter if you are vulnerable in 1%, or in 0.0001% of
the cases, there is still a hole and it can be (and will be) abused.

Obviously, if the model spent so much time learning all the things, it is very
unlikely that it can completely unlearn something in those 1% of what's left.
Let alone that this something cannot be easily identified.

This is also why it's possible to undo (at least partially) the alignment, and
we call such models abliterated. Abliterated models are only available for
open-weights models, as labs don't have a motivation to publish such.

I consider the sole existence of abliterated models as proof that the model cannot
unlearn things from the pretraining dataset completely, and given that the
instruction following (chat format, usefulness) is still present even during
alignment, it's safe to assume that even if you collect enough counter-examples
for prompt-injection, it will still be possible to break out of the original
prompt, and persuade the model to do something else entirely. We just need to
confuse it enough to think that it is just helping us.

Now, here's where things get a little more interesting, that "abstract meaning"
I've mentioned at the beginning, it works a bit like math. You can get similar
meanings even if you use different tokens. And again, this is another desired
property of LLMs, and the language modelling in general. We don't want to think
about specific syntax/words when submitting our tasks, we want to be able to use
plain English.

So, just like you have `2 * 8 = 16`, you can also get that result for
`1 * 2 * 2 * 4`. Different numbers (sequence of tokens), same result. All you
need to do is to use such combination of tokens that the model will think that
this is now what user really wants.

Long story short: As long as the real intent is distributed and computed from
multiple tokens, there will always be some (unknown) combination of tokens that
can trigger the "bad" behavior. The models are still taught to follow
instructions in order to be useful, so this is unlikely to ever go away.

> BTW: OpenAI said that they can fix this, but they said that when, 2 years
> ago? They could be lying but I think they were hoping to fix it
> but they might be just as clueless as everybody else is.
