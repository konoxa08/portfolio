# Portfolio site (konoxa08/portfolio)

Static 3D portfolio (Three.js 0.160 from jsDelivr, no build). All content is in `works.json`.

## Adding a video (the usual request: "добавь ролик, ниша — X" + attached video)
- Follow README.md steps 1–3 exactly; pick a short latin `id`.
- `niche` must be an id from `niches`; if the user names a new niche, add it there.
- Write `title`, `desc`, `style` in Ukrainian, short.
- Portfolio rule from the owner: in self-made spec ads, names and phones are placeholders
  ("ВАШЕ ІМ'Я", "+38066 XXX XX XX"); never invent real-looking contacts.
- Up to 12 floating screens fit the 3D arc (6 featured + 6 extra slots). If there are more than 12 works,
  only the first 12 get screens; the rest still appear in the niche lists.
- Commit and push to `main`; hosting redeploys automatically.
