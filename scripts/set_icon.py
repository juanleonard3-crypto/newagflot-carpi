#!/usr/bin/env python3
"""Pone la mascota en las tres apps. Uso: python scripts/set_icon.py ruta/mascota.png"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
if len(sys.argv) != 2:
    sys.exit("Uso: python scripts/set_icon.py ruta/mascota.png")
im = Image.open(sys.argv[1]).convert("RGBA")
lado = min(im.size)
im = im.crop(((im.width - lado) // 2, (im.height - lado) // 2, (im.width + lado) // 2, (im.height + lado) // 2))
res = ROOT / "android" / "app" / "src" / "main" / "res"
im.resize((512, 512), Image.LANCZOS).save(ROOT / "shared-ui" / "assets" / "mascota.png")
im.resize((192, 192), Image.LANCZOS).save(res / "drawable" / "mascota.png")
im.resize((192, 192), Image.LANCZOS).save(res / "mipmap-xxxhdpi" / "ic_launcher.png")
print("Ícono actualizado en shared-ui y android")
