import sys
import json

r = {}
with open("EN_UI.bytes", "r") as f:
    for line in f:
        if len(line) < 13:
            continue
        if line.startswith("<entry name=\"CHARM_NAME") or line.startswith("<entry name=\"CHARM_DESC"):
            type = line[19:23].lower()
            name = line[24:line.index("\"", 24)]
            value = line[line.index(">")+1:line.index("</")]
            if name not in r:
                r[name] = { "type": "charm", "id": "", "name": "", "desc": "", "icon": "" }
            r[name][type] = value.strip().replace("&lt;br&gt;", "<br>").replace("&quot;", "\"").replace("&#39;", "'").replace("&amp;", "&")
        elif line.startswith("<entry name=\"INV_NAME") or line.startswith("<entry name=\"INV_DESC"):
            type = line[17:21].lower()
            name = line[22:line.index("\"", 22)]
            value = line[line.index(">")+1:line.index("</")]
            if name not in r:
                r[name] = { "type": "item", "id": "", "name": "", "desc": "", "icon": "" }
            r[name][type] = value.strip().replace("&lt;br&gt;", "<br>").replace("&quot;", "\"").replace("&#39;", "'").replace("&amp;", "&")
        elif line.startswith("<entry name=\"PIN_NAME") or line.startswith("<entry name=\"PIN_DESC"):
            type = line[17:21].lower()
            name = line[22:line.index("\"", 22)]
            value = line[line.index(">")+1:line.index("</")]
            if name not in r:
                r[name] = { "type": "pin", "id": "", "name": "", "desc": "", "icon": "" }
            r[name][type] = value.strip().replace("&lt;br&gt;", "<br>").replace("&quot;", "\"").replace("&#39;", "'").replace("&amp;", "&")

temp = r
r = []
for i in temp:
    temp[i]["id"] = i
    r.append(temp[i])

with open("out.js", "w") as f:
    f.write(json.dumps(r).replace("}, {", "},\n{"))
