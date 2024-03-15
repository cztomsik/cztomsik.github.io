---
date: 2024-03-15
title: "Tokamak: A web framework for Zig"
---

I've been recently extracting some parts of Ava into a separate open-source
projects, and one of them is Tokamak, a web framework for Zig.

So first of all, why Zig? Zig is a very interesting language, it's a low-level
language but with a very powerful metaprogramming support. Hm... ok, I'm too far
ahead, so maybe let's start from the beginning...

## Allocators

At first, I thought Zig is not a good fit for server-side programming, because
you need to manage memory manually, and the code usually looks a bit more noisy
for common tasks. But eventually, I've realized that all those allocations are
short-lived, for the time of the request, so it's not a big deal, you can just
slap an `arena.allocator()` everywhere and you're good to go.

This is actually awesome because you get some kind of predictability, you can
identify memory leaks quickly, and in general, you can be more confident about
your application in general. If you've ever had to find a memory leak in an
express.js application, you know what I'm talking about.

Not that it cannot happen but it's way easier to reason about your application
if you know which thing can allocate memory and which cannot. So I guess, it's a
win after all. And there's something magical about looking at the memory usage
charts and seeing that it's pretty much constant, no matter how many requests
you're serving.

Still, the noise was a problem for me, but I had a scratch at the back of my
head, I had a feeling that there has to be some easy way around it.

## Dependency Injection

Zig is not my first language, I've been doing pretty much everything and I've
spent a lot of time with Java, way more than I'd like to admit. But there are
some good things about Java, and one of them is dependency injection.

Maybe let's start with why is dependency injection so cool for Java. Java is a
statically typed language, just like Zig, and despite the JVM which is actually
a dynamically typed marvel, the language itself is, or was, way more statically
typed and rigid than you'd like for a web application.

Let's not get too much into details, but the point is, dependency injection
makes it easy to provide (create & init) something at one place and use it from
somewhere else. So in a way, you get a bit of dynamicity, without actually
sacrificing the static type safety.

So, here's a cool thing, the same pattern can work also for Zig, and it can
solve the same problems. You can create a bunch of things at the beginning of
the request, and then you can use them everywhere, without passing them around
manually, including the allocators.

So your handlers can look like this:

```zig
pub fn createUser(db: *db.Session, data: User) !User {
    return db.create(User, data);
}
```

and you don't have to worry about the allocators, because the `db.Session` will
be created at the beginning of the request, and it will be destroyed at the end
of the request, and it will pass its allocator everywhere it's needed.

But now I'm getting ahead of myself again. How do you provide something at the
beginning of the request?

## Middleware

Apart from Java, I've also spent a lot of time with Node.js, and one of the
things I've always liked is the middleware pattern. You have a function that
takes a request and a response, and it can do whatever it wants with them, and
then it can call the next middleware.

This is a very powerful pattern but I thought it's not directly translatable to
Zig, because you don't have closures. But it turns out, you can do a lot of
stuff in comptime, Zig is really a lot like JavaScript as long as you're in
comptime.

Ok, here's a short example of what is possible:

```zig
var gpa = std.heap.GeneralPurposeAllocator(.{}){};
defer _ = gpa.deinit();

const handler = tk.chain(.{
    tk.logger(.{}),
    tk.get("/", tk.send("Hello")),
    tk.send(error.NotFound),
});

var server = try tk.Server.start(gpa.allocator(), handler, .{ .port = 8080 });
server.wait();
```

As you can see, it's not that far from the express.js...

Oh, where was I? Right, we wanted to provide something at the beginning of the
request. So, you can create a middleware that will create a bunch of things at
the beginning of the request, and then it will call the next middleware, and at
the end of the request, it will destroy all those things.

Something along these lines:

```zig
const withDb = fn(ctx: *tk.Context) !void {
    const pool = ctx.injector.get(*db.Pool);

    var session = try pool.get(ctx.allocator);
    defer session.deinit();

    return next();
};
```

And then you can use it like this:

```zig
const handler = tk.chain(.{
    withDb,
    tk.post("/user", createUser),
});
```

## How does it work?

So, how does it work? It's actually pretty simple, the `tk.chain` function
just creates another function (in comptime), which will call
`ctx.runScoped(handler, next_handlers)` with isolate chain and with dependencies
reset when it returns.

Here's a [link to the source code](https://github.com/cztomsik/tokamak/blob/c838269d4e73282f6f8fac28ff4880643c94a19d/src/middleware.zig#L16).

Obviously, this can be used for many things, like logging, error handling,
user authentication, etc.

## Future

It's still very early, and there are going to be a lot of changes, but I think
the general idea is sound and will not change. If you're interested, you can
check out the [Tokamak](https://github.com/cztomsik/tokamak) repository, and
maybe even help with writing docs :)
