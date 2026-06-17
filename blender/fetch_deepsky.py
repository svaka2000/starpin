"""
Fetch the iconic public-domain telescope photo for each Starpin deep-sky object
from Wikipedia's REST lead-image API, then downscale.
Saves to public/textures/deepsky/<id>.jpg
"""
import json
import os
import subprocess
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "textures", "deepsky")
os.makedirs(OUT, exist_ok=True)

# starpin id -> Wikipedia article title (lead image = the iconic photo)
TARGETS = {
    "orion": "Orion Nebula",
    "crab": "Crab Nebula",
    "ring": "Ring Nebula",
    "helix": "Helix Nebula",
    "carina": "Carina Nebula",
    "eagle": "Pillars of Creation",
    "andromeda": "Andromeda Galaxy",
    "whirlpool": "Whirlpool Galaxy",
    "sombrero": "Sombrero Galaxy",
    "stephans-quintet": "Stephan's Quintet",
    "pleiades": "Pleiades",
    "m13": "Messier 13",
    "virgo-cluster": "Virgo Cluster",
}

UA = {"User-Agent": "Starpin/1.0 (Stardance hackathon; educational)"}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def lead_image(title):
    enc = urllib.parse.quote(title.replace(" ", "_"))
    data = json.loads(get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{enc}"))
    img = data.get("originalimage", {}).get("source") or data.get("thumbnail", {}).get("source")
    return img


def main():
    for pid, title in TARGETS.items():
        try:
            src = lead_image(title)
            if not src:
                print("NO IMAGE", pid, title)
                continue
            tmp = os.path.join(OUT, f"_{pid}.src")
            with open(tmp, "wb") as f:
                f.write(get(src))
            out = os.path.join(OUT, f"{pid}.jpg")
            # downscale + convert to jpg via macOS sips
            subprocess.run(["sips", "-s", "format", "jpeg", "-Z", "1400", tmp, "--out", out],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            os.remove(tmp)
            size = os.path.getsize(out) // 1024
            print(f"OK {pid:18s} {size}KB  <- {title}")
        except Exception as e:
            print("FAILED", pid, e)
    print("DONE")


main()
