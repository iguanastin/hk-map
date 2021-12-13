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
        r.append(temp[i])
# with open("out.txt", "w") as f:
#     for i in r:
#         out = i["NAME"] + "\n" + i["DESC"] + "\n" + i["NOTE"] + "\n\n"
#         out = out.replace("&lt;br&gt;", "\\n").replace("&quot;", "\\\"").replace("&#39;", "'").replace("&amp;", "&")
#         f.write(out)

j = json.load(open("bestiary.js", "r"))
m = {}
for i in r:
    m[i["NAME"]] = i

for i in j:
    if i["name"] in m:
        i["desc"] = m[i["name"]]["DESC"]
        i["note"] = m[i["name"]]["NOTE"]

s = json.dumps(j).replace("}, {", "},\n{")
with open("out2.js", "w") as f:
    f.write(s);
