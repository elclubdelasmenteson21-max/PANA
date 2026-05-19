from PIL import Image, ImageDraw, ImageFont
import os

COLORS = {"bg": (255, 107, 0), "fg": (255, 255, 255)}
SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
BASE = r"C:\Users\alvat\AppData\Local\Temp\opencode\PANA\android\app\src\main\res"

for folder, size in SIZES.items():
    img = Image.new("RGBA", (size, size), COLORS["bg"])
    draw = ImageDraw.Draw(img)
    try:
        fs = int(size * 0.6)
        font = ImageFont.truetype("arial.ttf", fs)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), "P", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    draw.text((x, y), "P", fill=COLORS["fg"], font=font)
    path = os.path.join(BASE, folder, "ic_launcher.png")
    img.save(path, "PNG")
    print(f"Created {os.path.basename(folder)} ({size}x{size})")

for folder, size in SIZES.items():
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    try:
        fs = int(size * 0.6)
        font = ImageFont.truetype("arial.ttf", fs)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), "P", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    draw.text((x, y), "P", fill=COLORS["bg"], font=font)
    path = os.path.join(BASE, folder, "ic_launcher_foreground.png")
    img.save(path, "PNG")
print("All icons generated!")
