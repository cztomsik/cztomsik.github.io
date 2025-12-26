---
date: 2025-08-14
title: Testing in Zig
---

One of the areas where Zig is drastically different from Rust is when you are
writing unit-tests for your code. It's also one of the things where I was
initially very disappointed because in Rust you have the `assert_eq!` macro
which can be used for pretty much anything that implements `PartialEq + Debug`
and you get free deep-equality checks and really nice debug prints.

## std.testing.expectEqual()

In Zig, you can sometimes use the `std.testing.expectEqual()` because it works
for any type but unfortunately, you can't easily compare structs with any
strings/slices inside (it will only check for pointer equality, not for the
contents). There is also `expectEqualDeep()` which **does follow** the pointers
but it does not show a pretty string diff because it cannot tell if it's a
string. Some people use it but I don't.

Anyway, the final outcome is that the `expectEqual()` is **much less useful**
than its Rust counter-part. And as I said, I was disappointed initially, because
I tend to write a lot of tests, not necessarily the TDD-way but still, I like to
have a decent coverage to be sure that I won't break anything unintentionally,
and given that Zig is memory-unsafe, it's also good to exercise the API a bit
just to be sure that it is behaving correctly.

At that point I was still deciding if I want to switch or not, but I just
decided to keep going and evaluate again later. And it turns out it was a good
idea because as I was writing more and more code, I eventually started writing
various small helpers, often specific for the given use-case and I have to say,
this is **MUCH better** than what I was doing in Rust before. For example, this
is what I usually do when I need to implement a tokenizer:

```zig
const Token = union(enum) {
    char: u8,
    dot,
    ...
}

fn expectTokens(regex: []const u8, tokens: []const std.meta.Tag(Token)) !void {
    var tokenizer = Tokenizer{ .input = regex };

    for (tokens) |tag| {
        const tok: @TypeOf(tag) = tokenizer.next() orelse return error.Eof;
        try testing.expectEqual(tok, tag);
    }

    try testing.expectEqual(tokenizer.pos, regex.len);
}

test Tokenizer {
    try expectTokens("", &.{});
    try expectTokens("a.c+", &.{ .char, .dot, .char, .plus });
    ...
}
```

There are several things going on:

- `std.meta.Tag(Token)` is a comptime-derived type - it's the discriminator part
  of the tagged-union
- there is a `for (tokens) |t|` loop which just calls `expectEqual()` for every
  expected token, and it also checks for `null` (unexpected end)
- and finally, I check that the whole string was exhausted

The first point is super-cool because when I'm implementing a tokenizer, I don't
really care about the actual values in the tagged-union, I only want to check if
it emits correct token kinds and I can do that with a **simple one-liner**!

## Diving deeper

You can (mostly) do such things in any language. But what's really interesting
is that it flips your brain to **think in an entirely different way**, here's
another example, this time much more interesting:

```zig
const Person = struct { name: []const u8, age: u32, salary: ?u32 };

const items: []const Person = &.{
    .{ .name = "John", .age = 21, .salary = 1000 },
    .{ .name = "Jane", .age = 23, .salary = 2000 },
    .{ .name = "James", .age = 25, .salary = null },
};

try expectTable(items,
    \\| name | age |
    \\|------|-----|
    \\| John | 21  |
    \\| Jane | 23  |
    \\| Jam. | 25  |
);

try expectTable(items,
    \\| name  | age |
    \\|-------|-----|
    \\| John  | 21  |
    \\| Jane  | 23  |
    \\| James | 25  |
);

try expectTable(items,
    \\| name | salary |
    \\|------|--------|
    \\| John | 1000   |
    \\| Jane | 2000   |
    \\| Jam. |        |
);
```

This is nice, right? But what the hell is going on? You can check [the
code](https://github.com/cztomsik/tokamak/blob/488ef59665665ca72768a5d31176c34970636eeb/src/testing.zig#L58)
but the short story is that it automatically prints a slice of arbitrary structs
but it does so in a way, which is auto-configured from the **comptime-known**
string with the expected table.

In other words, the table defines:

- **which fields** should be printed (and in which order)
- how the output should be **truncated** (the width of the column)
- and obviously, what the final output should be so we can fail (and **show a
  diff**)

## Domain-specific helpers

Another example, this time from my [toy regex
implementation](https://github.com/cztomsik/tokamak/blob/488ef59665665ca72768a5d31176c34970636eeb/src/regex.zig).

```zig
try expectCompile("a?c",
    \\  0: dotstar
    \\  1: split :4 :6
    \\  4: char a
    \\  6: char c
    \\  8: match
);
```

You can probably guess what it does but just to be sure:

- it will attempt to **tokenize** the regexp
- then it will **compile** it
- and then it will simply go through the ops and print their human-friendly
  representation, including a pseudo-ASM **labels** and **addresses**.

> The new version is using same-width `Op` again so the addresses are not useful
> anymore, but it's still a nice example for this blog post because this is
> exactly what you can do in your tests and it adds a lot of meaningful
> assertions which are also **very readable**
