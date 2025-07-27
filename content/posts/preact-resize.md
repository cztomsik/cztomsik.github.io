---
date: 2023-09-30
title: Efficient Sidebar Resizing with Preact Signals
---

## Introduction

In my [recent tweet](https://twitter.com/cztomsik/status/1707462107510280459),
I quickly shared a video demonstrating how I implemented sidebar resizing with
Preact in a way that is both straightforward and efficient.

<div>
<blockquote class="twitter-tweet"><p lang="en" dir="ltr">I love <a href="https://twitter.com/preactjs?ref_src=twsrc%5Etfw">@preactjs</a> with signals, many things are so much easier, and very efficient. For example it&#39;s possible to do resize in plain preact without any hacks and it still does not re-render during mousemove.<a href="https://twitter.com/hashtag/buildinpublic?src=hash&amp;ref_src=twsrc%5Etfw">#buildinpublic</a> <a href="https://twitter.com/hashtag/reactjs?src=hash&amp;ref_src=twsrc%5Etfw">#reactjs</a> <a href="https://t.co/uIKvsW2Kki">pic.twitter.com/uIKvsW2Kki</a></p>&mdash; Kamil Tomšík (@cztomsik) <a href="https://twitter.com/cztomsik/status/1707462107510280459?ref_src=twsrc%5Etfw">September 28, 2023</a></blockquote>
</div>

The tweet was then retweeted by [Jason Miller](https://twitter.com/_developit),
an original author of Preact, and it gained significant traction, and a few
people also asked for the source code.

The codebase in the video is not open-source; it's a [personal project I'm
currently working on](https://www.avapls.com). However, I decided to share a
snippet of the resize functionality for your reference.

Please note that the code provided below is by no means a perfect or
comprehensive solution. It is simply a copy-paste of what I am currently using,
and it only supports horizontal resizing. Nevertheless, it should be relatively
easy to adapt, and its simplicity makes it easy to understand, as it does not
attempt to address every potential edge case.

## Preact Signals: A Quick Overview

Before we dive into the implementation, let's briefly recap what [Preact Signals](https://preactjs.com/guide/v10/signals/) are.

Signals are like small observables with a getter and setter for their
`.value` property.

You create a signal with `signal(123)`, and whenever you read the `.value`, the
component will subscribe to the signal and it will get re-rendered
automatically.

If you use the signal directly in the template or a prop, it has special
treatment in Preact; it just updates the DOM and skips the render call entirely.

## Efficient Sidebar Resizing Implementation

So ideally, we want to render the Preact component once, set up listeners and
the logic, and then opt out of the automatic re-rendering.

We cannot use a computed width in the style prop because that would cause a full
re-render on every change of the `width.value`. Instead, we can create another
computed signal to pass directly to the `style` prop in Preact.

Here's the full code:

```js
import { computed } from "@preact/signals";
import { useMemo } from "preact/hooks";

export const useResize = ({
  width,
  minWidth = 0,
  maxWidth = Number.MAX_SAFE_INTEGER,
}) =>
  useMemo(() => {
    const onMouseDown = (e: MouseEvent) => {
      const { pageX: startX } = e;
      const startWidth = width?.value;

      const updater = (e: MouseEvent) =>
        (width.value = Math.max(
          minWidth,
          Math.min(maxWidth, startWidth + e.pageX - startX)
        ));

      // setup listener to compute and update the width
      window.addEventListener("mousemove", updater);

      // setup listener which will remove the update listener
      window.addEventListener(
        "mouseup",
        () => window.removeEventListener("mousemove", updater),
        { once: true }
      );

      // prevent any other interaction during resize
      e.preventDefault();
      e.stopPropagation();
    };

    // this is the trick, computed signal which we can then
    // pass directly to the style prop
    const style = computed(() => `width: ${width.value}px`);

    const resizeHandle = (
      <div
        class="absolute right-0 inset-y-0 w-2 cursor-col-resize"
        onMouseDown={onMouseDown}
      />
    );

    return { style, resizeHandle, onMouseDown };
  }, [width, minWidth, maxWidth]);
```

And usage could look like this:

```jsx
export const Sidebar = () => {
  const width = useSignal(200);
  const { style, resizeHandle } = useResize({
    width,
    minWidth: 150,
    maxWidth: 400,
  });

  return (
    // where the CSS would be something like:
    // .sidebar { position: relative; display: flex; flex-direction: column }
    <div class="sidebar" style={style}>
      sidebar content
      {resizeHandle}
    </div>
  );
};
```

The `useResize` hook takes in a `width` signal as a prop and optional `minWidth`
and `maxWidth` props to define the minimum and maximum width of the sidebar.

When the user clicks and drags the resize handle, the `onMouseDown` function is
called. This function sets up event listeners for `mousemove` and `mouseup`
events and calculates the new width based on the starting point and the current
mouse position.

The `width.value` is then updated using the updater function, and the sidebar's
style is updated accordingly.
