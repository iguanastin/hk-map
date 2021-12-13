import os
import sys

dir = sys.argv[1]
if not dir.endswith("/") and not dir.endswith("\\"):
    dir += "/"
for f in os.listdir(dir):
    if f.startswith(' '):
        print("fixing: " + dir + f)
        os.rename(dir + f, dir + f[1:])
