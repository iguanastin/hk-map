import sys

file = open(sys.argv[1], "r")

groups = []

doing = False
for line in file:
    if doing:
        if line.startswith("      </div>"):
            break
        if line.startswith("        <!--"):
            groups.append({ "name": line[line.index("<!-- ") + 5:line.index(" -->")], "rooms": [] })
            print(groups[-1])
        if line.startswith("        <img"):
            x = line[line.index("left: ") + 6:line.index("px;")]
            line = line[line.index("px;") + 3:]
            y = line[line.index("top: ") + 5:line.index("px;")]
            src = line[line.index("mapped/") + 7:line.index(".png")]
            # print(line)
            # print(x)
            # print(y)
            # print(src)
            groups[-1]["rooms"].append({ "name": src, "src": "assets/map/rooms/mapped/" + src + ".png", "x": x, "y": y })
    elif line.startswith("      <div class=\"panzoom-content\""):
        doing = True

file.close()


with open('rooms.js', 'w', encoding='utf-8') as f:
    f.write("regions = [\n")

    r = []
    for g in groups:
        r.append(str(g))

    f.write(",\n".join(r));

    f.write("];\n")
