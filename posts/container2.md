---
date: 2025-07-11
title: Container v2 (experimental)
---

> NOTE: This is a draft; I didn't have enough time to finish this post. Either
> there will be a part two, or I'll just update this post. Check again later.

I am currently in the process of rewriting the DI container in Tokamak, so I
thought I could take this opportunity to recap why we are even doing this and
what are the benefits of using DI in the context of a web application written in
Zig.

## The Injector

The first part is the `Injector`, and it's all about not having to "pull" your
dependencies yourself. Suppose you have a `/sign-up` endpoint and you need to do
many different things there: db inserts, sending emails, notifying admins in
chat, etc.

It's likely that you have this functionality spread across multiple places,
outside of the handler itself, and many times, these things are also stateful.
So this usually leads either to some global variables, the singleton pattern
(also global), or some `Env` struct which is passed around to all the handlers.

```zig
// App-wide "context"
struct Env {
    db_pool: *db.Pool,
    mailer: *Mailer,
    discord: *discord.Client,
}

fn initEnv(allocator: std.mem.Allocator) *Env {
    // Not necessary but common in practice...
    const env = try allocator.create(Env);
    errdefer allocator.destroy(env);

    const db_pool = try db.Pool.init(...)
    errdefer db_pool.deinit();

    ...

    env.* = .{
        .db_pool = db_pool,
        ...
    };

    return env;
}

// The "classic" approach
fn handler(env: *Env, req: *Req, res: *Res) !void {
    ...
    try env.db_pool.insert(...);
    ...
}
```

Now, there's nothing strictly wrong about this approach but you are either
coupled to a concrete code/structure, or you need to use `env: anytype`, or make
the handler itself generic. All should work, but we can do better.

In Zig, we can introspect method signatures, so what if instead of "pulling" the
dependencies from the `env.xxx`, we could just declare them as fn arguments?
That way, we could also unit-test the function easily, without any need of the
`Env` struct, or whatever.

And that's precisely what `Injector` does in tokamak. Once you have `*Injector`,
you can do `inj.call(myfun)` and the function will be called with all the
dependencies filled-in automatically. There are some minor details but that's
the spirit.

```zig
fn handler(db_pool: *db.Pool, mailer: *Mailer, discord: *discord.Client, req: *Req, res: *Res) !void {
    ...
}

// somewhere in the framework init code (this is what we will be talking about next):
var inj = Injector.init(&.{ ... })

// and then somewhere in the framework routing code:
inj.call(handler)
```

> NOTE: You can also use `Injector` directly, with your own, already created
> `Env` struct or with any other struct. Not very common, but might be useful.

## The Container

The other part is obviously, how to create an `Injector`. You can do it
yourself, you just need a `[]const Ref` but that's not a lot of fun and there
are some actual challenges in the whole process of the context creation (but all
of them would also apply to the `Env` approach, it's just that you'd probably
never get that far!)

Let's go through all of that first, before we get to a better solution.

### Challenge #1 - Ordering

Often, to init something, you might need something else to be initialized
already. The compiler and the type system can help a lot but you can still shoot
yourself in the foot if you are initializing a struct inplace or if you forget
to deinit properly in both errdefer and env deinit.

> `DebugAllocator` can help, but there are also files, directories,
> connections, etc. And obviously, if you introduce a new dep, you need to
> **update all the code manually**.

Lastly, there might be some other order constraints that are not obvious from
the type system (we will get to that later).

### Challenge #2 - Conditionals

Arguably, this is not something you will have to deal with since the beginning
of the project but eventually, there might be some branching, and the common
solution to that is to introduce some feature flags, either as args to the
`initEnv()` or as (comptime) build options. It works, but it's messy and it can
also affect the order!

```zig
struct Env {
    ...
    client: *tk.http.Client,
    std_client: ?tk.http.StdClient = null,
    // ideally, we'd like to strip this away completely so it's not even compiled/linked
    curl_client: ?tk.http.Client = null,
}

fn initEnv(allocator: std.mem.Allocator, opts: EnvOpts) *Env {
    ...

    // One of our customers is using an old HTTP server so we can't use std.http.StdClient
    //
    // NOTE that we are somewhere in the middle of initEnv() and at this point
    // compiler cannot easily tell if `env.client` was initialized already or not,
    // so if anyone already used that value it's definitely a bug.
    if (opts.use_curl) {
        env.curl_client = try ...;

        // Let's do intrusive iface (thanks to kprotty for the idea!)
        env.client = &env.curl_client.client;
    } else {
        ...
    }

    // We also need to handle errdefer properly!
    errdefer {
        if (opts.use_curl) {
            ...
        } else {
            ...
        }
    }
}
```

### Challenge #3 - Testing / Mocking

You could think of that as specific case of the previous point, but IMHO it's a
completely separate thing. Mocks are usually specific, and have nothing to do
with the actual production code, so I really don't want to have any
`isTestEnv()` checks in my hypothetical `initEnv` function.

```zig
fn initEnv(allocator: std.mem.Allocator, opts: EnvOpts) *Env {
    ...

    // We don't use xxx in tests, pinky swear!
    if (!isTestEnv()) {
        env.xxx = try ...;
    }

    errdefer {
        if (!isTestEnv()) {
            ...
        }
    }

    // We do use zzz in tests, but we use a different impl
    env.client = if (isTestEnv()) ... else ...;
    errdefer ...
}
```

### Challenge #4 - Modularity / re-usability

Suppose you got this far and now you'd like to extract something from one
project and reuse it across multiple other projects.

Let's say something like `auth` module. It's mostly the same, it's very common
requirement, so it makes sense to share this between projects, right? Ok, but
different projects are using different databases and surely each project should
have different configuration for secrets etc. So it has to be **both generic,
and configurable**.

Something like `fn AuthContext(comptime B: type) type` where `B` is something
which provides **low-level things**. And then the resulting type would have
something like `.init(allocator, ..., config: AuthConfig) @This()`

> NOTE: This is not about providing project-specific implementation, the `auth`
> module can include various backend implementations and you might just pick one
> of them. The point is that every backend might need different deps.

Now, I think there are 2 common approaches to the backend initialization and
ownership:

- The `AuthContext(B)` owns its backend, and it gets initialized/deinitialized
  together with the `AuthContext` itself. This is great but you somehow need to
  pass all the args to the `Backend.init()`, which is tricky because every impl
  of `B` could need something else...

  So I imagine most people end up making `B.init()` accept `env: anytype` and
  just let the backend pull whatever it needs. It's not pretty but it should
  work. The bad part is that again, there is **no guarantee** that `env.xxx` is
  already initialized, it solely depends on when you have called the
  `AuthContext(B).init(env)` which in turn calls `B.init(env)`. In other words,
  this hides important details somewhere inside, and makes it easier to shoot
  yourself in the foot.

- You pull the backend out and pass it as ptr, so the shape will be
  `AuthContext(B).init(ptr: *B, cfg: AuthConfig)`. This would also work and it
  does not hide anything but it's tedius and repetitive because again, you have
  to initialize the backend properly (yourself), in the correct order, and also
  errdefer and deinit.

#### Feature modules

You might also want to split your project into multiple (resonably) independent
feature modules, and then the `initEnv()` would inevitably grow into a tree of
different init fn calls and again, it should work, it's doable, but it's not
easy to follow and it's not fun. I might add some example later, but the problem
is the same, either you hide the details and risk shooting yourself, or you make
everything explicit but then it's unreadable mess.

The important note about feature-modules is that they often go extra mile, you
might have something like payment module, which is required in several other
features, but in order to initialize it, you might need something from some
other module, and sometimes the modules might even depend on each other, so in
the end, you might need to initialize everything together, in correct sub-steps.

You can totally avoid that somehow, but let's be honest, there's no time to
re-structure the whole project if you're in the middle of something. The major
reason why people are using DI containers is **because they are convenient**!
You can quickly add/remove dependencies, move them between modules, introduce
new abstractions without ever having to think about changes in the plumbing.

### Final Challenge #5 - Deinit

Suppose you really got this far with the original `initEnv()`, it's ugly as hell
but it works. Great job!

But now you need to do all of this once again, in the reverse order for the
happy-path deinit(). It doesn't matter much if you put it in the `Env.deinit()`
or if you define `deinitEnv()` fn but inevitably, all of the previous problems
will still apply:

- order might matter (don't close the file/dir if it might still be needed)
- customer-branching is still a thing and it cas still change the order
- you'd still need `isTestEnv()` checks here and there
- and you'd still need extra generic helper method in your reusable module, so
  you can use your company-shared auth lib.
