import sys
import json

r = {}
with open("EN_Journal.bytes", "r") as f:
    for line in f:
        if len(line) < 13:
            continue
        type = line[13:17]
        name = line[18:line.index("\"", 18)]
        value = line[line.index(">")+1:line.index("</")]
        if name not in r:
            r[name] = {}
        r[name][type] = value.strip().replace("&lt;br&gt;", "\n").replace("&quot;", "\"").replace("&#39;", "'").replace("&amp;", "&")

temp = r
r = []
for i in temp:
    if "NAME" in temp[i]:
        temp[i]["id"] = i;
        r.append(temp[i])

j = json.load(open("bestiary.js", "r"))
m = {}
for i in r:
    m[i["NAME"]] = i

for i in j:
    if i["name"] in m:
        i["id"] = m[i["name"]]["id"]
        i["note"] = i["note"].replace("\n", "<br>")
        i["desc"] = i["desc"].replace("\n", "<br>")

s = json.dumps(j).replace("}, {", "},\n{")
with open("out2.js", "w") as f:
    f.write(s);
