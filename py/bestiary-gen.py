import sys
from os import walk
import json

_, _, f = next(walk(sys.argv[1]))

r = []
for i in f:
    r.append({ "name": "", "desc": "", "icon": i, "preview": "" })

print(json.dumps(r).replace("}, {", "},\n{"))
