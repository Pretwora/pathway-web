"""Картинки сайта из исходников приложения Pathway.

Запуск из корня сайта: python tools/make-images.py
Берёт логотип и фон плитки из ../Pathway/assets, шрифты — из node_modules
приложения. Пишет в assets/img: логотип, фавиконки, фон плитки для анимации
и картинку-превью для соцсетей (og.png, 1200×630).
"""
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
APP = os.path.join(os.path.dirname(SITE), 'Pathway')
IMG = os.path.join(SITE, 'assets', 'img')
FONTS = os.path.join(APP, 'node_modules', '@expo-google-fonts')
os.makedirs(IMG, exist_ok=True)

logo = Image.open(os.path.join(APP, 'assets', 'logo-source.png')).convert('RGBA')
logo.resize((256, 256), Image.LANCZOS).save(os.path.join(IMG, 'logo-256.webp'), quality=92)
logo.resize((96, 96), Image.LANCZOS).save(os.path.join(IMG, 'logo-96.png'))
logo.resize((32, 32), Image.LANCZOS).save(os.path.join(IMG, 'favicon-32.png'))

# apple-touch-icon — без прозрачности: iOS заливает её чёрным.
touch = Image.new('RGBA', (180, 180), (10, 15, 26, 255))
touch.alpha_composite(logo.resize((180, 180), Image.LANCZOS))
touch.convert('RGB').save(os.path.join(IMG, 'apple-touch-icon.png'))

tile = Image.open(os.path.join(APP, 'assets', 'images', 'logo-tile-bg.png')).convert('RGB')
tile.save(os.path.join(IMG, 'tile-bg.webp'), quality=90)

# --- Превью ссылки ---------------------------------------------------------------
W, H = 1200, 630
og = Image.new('RGB', (W, H), (10, 15, 26))
d = ImageDraw.Draw(og)
display = ImageFont.truetype(os.path.join(FONTS, 'unbounded', '500Medium', 'Unbounded_500Medium.ttf'), 92)
body = ImageFont.truetype(os.path.join(FONTS, 'manrope', '500Medium', 'Manrope_500Medium.ttf'), 40)
small = ImageFont.truetype(os.path.join(FONTS, 'manrope', '700Bold', 'Manrope_700Bold.ttf'), 26)

big = logo.resize((300, 300), Image.LANCZOS)
og.paste(big, (110, 165), big)
d.text((470, 205), 'pathway', font=display, fill=(238, 243, 250))
d.text((474, 330), 'Большое складывается из малого', font=body, fill=(155, 168, 189))
d.text((474, 400), 'ТРЕКЕР ЦЕЛЕЙ ДЛЯ ANDROID', font=small, fill=(47, 134, 255))

# Тропа понизу — тот же градиент, что на счётчике.
stops = [(0.0, (20, 113, 253)), (0.55, (48, 214, 244)), (1.0, (75, 227, 157))]


def grad(t):
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        if t <= b:
            f = (t - a) / (b - a)
            return tuple(round(x + (y - x) * f) for x, y in zip(ca, cb))
    return stops[-1][1]


for x in range(110, 1090):
    t = (x - 110) / 980
    y = 560 - 18 * (t * t)
    d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=grad(t))
og.save(os.path.join(IMG, 'og.png'), optimize=True)
print('готово:', sorted(os.listdir(IMG)))
