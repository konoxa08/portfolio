# Темна студія: портфоліо моушн-реклами

Статичний сайт без збірки: `index.html`, `assets/`, `works.json`, `media/`.
Публікація: Netlify або GitHub Pages, коренева папка `/`.

## Як додати ролик
1. Стиснути відео: 720×1280, H.264, CRF 27, `-movflags +faststart`, до 15 МБ:
   `ffmpeg -i in.mp4 -vf "scale=720:1280:flags=lanczos,fps=30" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart media/<id>.mp4`
2. Постер: `ffmpeg -ss <сек> -i in.mp4 -frames:v 1 -vf scale=540:960 -q:v 4 media/<id>.jpg`
3. Додати запис у `works.json` → `works`: `id, title, niche, style, dur, desc`.
4. Нова ніша: додати в `niches` (і за потреби в `briefNiches`).
5. Щоб ролик став окремим розділом при прокрутці, додати `id` у `featured` (до 6, у порядку показу).

Контакти: `works.json` → `contacts`.
