import sys
import re
from PIL import Image

meta = open(sys.argv[1] + ".meta", "r")
img = Image.open(sys.argv[1])

r = []
current = None
rect = 0

for line in meta:
    if " name:" in line:
        current = { "name": line.split(":")[1][:-1] + ".png" }
        r.append(current)
        pass
    if current is not None and "rect:" in line:
        rect = 5
    elif rect > 0:
        if rect == 4:
            current["x"] = float(line.split(": ")[1])
        if rect == 3:
            current["y"] = float(line.split(": ")[1])
        if rect == 2:
            current["width"] = float(line.split(": ")[1])
        if rect == 1:
            current["height"] = float(line.split(": ")[1])
        rect -= 1

meta.close()
for i in r:
    print(i)


for i in r:
    x = i["x"]
    y = i["y"]
    w = i["width"]
    h = i["height"]

    rect = (x, img.height - (y+h), x+w, img.height - y)
    print(rect)

    crop = img.crop(rect)
    crop.save(i["name"])
img.close()
