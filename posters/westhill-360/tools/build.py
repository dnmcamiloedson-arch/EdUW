"""Inline Font Awesome SVGs into <i ... data-ic="name"></i> placeholders.
Usage: python3 build.py poster.src.html poster.html <fontawesome>/svgs/solid
"""
import re, sys, pathlib
src, out, fa = map(pathlib.Path, sys.argv[1:4])
html = src.read_text(encoding="utf8")
def rep(m):
    before, name, after = m.group(1), m.group(2), m.group(3)
    svg = (fa / f"{name}.svg").read_text(encoding="utf8")
    svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S).strip()
    return f"<i {before.strip()} {after.strip()}>{svg}</i>".replace("  ", " ").replace(" >", ">")
html = re.sub(r'<i ([^>]*?)data-ic="([^"]+)"([^>]*)></i>', rep, html)
out.write_text(html, encoding="utf8")
print("icons left:", html.count("data-ic="))
