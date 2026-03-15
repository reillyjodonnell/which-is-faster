## Which is faster

Saw a tweet today about which pattern was most performant:

<blockquote class="twitter-tweet">
  <p lang="en" dir="ltr">
    genuine question for react heads, which of these is most performant?
    Consider that we may have thousands of them all receiving new x y props on
    each frame. <a href="https://t.co/t2tc7Z9qBG">pic.twitter.com/t2tc7Z9qBG</a>
  </p>
  &mdash; Steve Ruiz (@steveruizok){' '}
  <a href="https://twitter.com/steveruizok/status/2033158878267875404?ref_src=twsrc%5Etfw">
    March 15, 2026
  </a>
</blockquote>
<script
  async
  src="https://platform.twitter.com/widgets.js"
  charset="utf-8"
></script>

My intuition thought that the minimal effects / work would win. So in this case I presumed A would win bc of it's doing
the least amount of work - just object creation (fast in js)

But tbh I didn't really know so I ran an experiment!

## To run:

`bun i && bun run dev`

Then use Chrome Performance tab, press play on the ui and record the results!

Bonus points for feeding to claude and having it diff results.
