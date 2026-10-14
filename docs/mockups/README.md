# Widget mockups

Mockups that show each widget variant embedded in an online news article. The
news sites are **fictional**: invented names, invented authors and `.example`
domains, and every image carries a "MOCKUP · fiktive Zeitung" (fictional
newspaper) badge. They are layout styles, not real publications. The widget
inside each page is the real `widget.html`.

| Image | Style | Widget |
| --- | --- | --- |
| [`gezeiten.png`](gezeiten.png) | Weekly paper: serif headline, drop cap, long read | `v=vergleich` in the right column |
| [`kompass.png`](kompass.png) | News magazine: red bar, bold sans-serif headlines | `v=auto` inside the article |
| [`morgenzeitung.png`](morgenzeitung.png) | Classic daily: blackletter masthead | `v=bahn` in the right column |

## Re-rendering

The pages load the widget from a local preview server, so start one first:

```bash
npm run build
npx vite preview --port 4173 --strictPort   # keep running in a second terminal
npm install --no-save playwright && npx playwright install chromium
node docs/mockups/render.cjs
```

The article text uses figures from `src/config/countries.ts`, such as about
6 of 10 punctual long-distance trains in Germany and 9 of 10 in the Netherlands.
