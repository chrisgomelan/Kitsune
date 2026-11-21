import os
from PIL import Image, ImageDraw

# Create public directory if needed
os.makedirs("public", exist_ok=True)
os.makedirs("app", exist_ok=True)

# 1. Clean, vibrant modern SVG icon
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1338"/>
      <stop offset="100%" stop-color="#0b0c14"/>
    </linearGradient>
    <linearGradient id="fox" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c4b5fd"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#bg)"/>
  <rect width="32" height="32" rx="7" fill="none" stroke="#8b5cf6" stroke-width="1.2" stroke-opacity="0.4"/>
  <g transform="translate(4, 4)">
    <path d="M4 4l3.5 8.5L12 10l4.5 2.5L20 4l-2 13-6 4-6-4L4 4z" fill="none" stroke="url(#fox)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 13l3 2 3-2" fill="none" stroke="url(#fox)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="8" cy="11" r="1.2" fill="#f5f3ff"/>
    <circle cx="16" cy="11" r="1.2" fill="#f5f3ff"/>
  </g>
</svg>"""

with open("app/icon.svg", "w", encoding="utf-8") as f:
    f.write(svg_content)
with open("public/icon.svg", "w", encoding="utf-8") as f:
    f.write(svg_content)

# 2. Render high-res raster version for ICO and PNG
size = 512
img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Background rounded rect
r = 112
draw.rounded_rectangle([0, 0, size, size], radius=r, fill=(15, 12, 28, 255), outline=(139, 92, 246, 120), width=8)

# Subtle violet inner glow
for i in range(12):
    draw.rounded_rectangle([8+i*2, 8+i*2, size-8-i*2, size-8-i*2], radius=r-i*2, outline=(139, 92, 246, max(0, 40 - i*3)), width=2)

def s(x, y):
    return (64 + x * 16, 64 + y * 16)

# Main mask outline
pts = [
    s(4, 4),
    s(7.5, 12.5),
    s(12, 10),
    s(16.5, 12.5),
    s(20, 4),
    s(18, 17),
    s(12, 21),
    s(6, 17),
    s(4, 4)
]

draw.polygon(pts, fill=(139, 92, 246, 35))
draw.line(pts, fill=(167, 139, 250, 255), width=26, joint="curve")

# Nose / mouth: M9 13l3 2 3-2
nose_pts = [s(9, 13), s(12, 15), s(15, 13)]
draw.line(nose_pts, fill=(196, 181, 253, 255), width=20, joint="curve")

# Eyes
eye_r = 16
for cx, cy in [s(8, 11), s(16, 11)]:
    draw.ellipse([cx - eye_r, cy - eye_r, cx + eye_r, cy + eye_r], fill=(245, 243, 255, 255))

# Save icons
img.save("app/apple-icon.png", "PNG")
img.save("public/apple-icon.png", "PNG")

# Multi-res favicon.ico
img.save("app/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
img.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

print("Kitsune icons and favicons created successfully!")

