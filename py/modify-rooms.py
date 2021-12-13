import sys
import json
from PIL import Image

with open(sys.argv[1], "r") as f:
    work = ""

    for line in f:
        work += line.replace("'", "\"")

    regions = json.loads(work)

    minx = 1000000
    miny = 1000000
    maxx = -1000000
    maxy = -1000000
    for r in regions:
        for room in r["rooms"]:
            img = Image.open(room["src"])
            width, height = img.size

            x = int(room["x"])
            y = int(room["y"])
            if x < minx:
                minx = x
            if x + width > maxx:
                maxx = x + width
            if y < miny:
                miny = y
            if y + height > maxy:
                maxy = y + height

    print("minx: " + str(minx))
    print("miny: " + str(miny))
    print("maxx: " + str(maxx))
    print("maxy: " + str(maxy))

    for r in regions:
        for room in r["rooms"]:
            room["x"] = int(room["x"]) - minx
            room["y"] = int(room["y"]) - miny

    j = json.dumps(regions)
    j = j.replace(", {", ", \n{").replace("[", "[\n")
    with open(sys.argv[2], "w") as f2:
        f2.write(j)
