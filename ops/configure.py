"""Fills the site placeholders once accounts exist.
python ops/configure.py --gumroad https://x.gumroad.com/l/shop-profit-tracker --site https://x.github.io --email you@x.com --operator "Name" """
import argparse
from pathlib import Path

a = argparse.ArgumentParser()
for f in ("gumroad", "site", "email", "operator"):
    a.add_argument(f"--{f}", required=True)
args = a.parse_args()
assert args.gumroad.startswith("https://") and args.site.startswith("https://"), "URLs must be https://"
subs = {"GUMROAD_URL": args.gumroad, "SITE_URL": args.site.rstrip("/"), "CONTACT_EMAIL": args.email, "OPERATOR_NAME": args.operator}
site = Path(__file__).parent.parent / "site"
for p in site.rglob("*"):
    if p.suffix in (".html", ".xml", ".txt", ".js") and p.is_file():
        t = p.read_text(encoding="utf-8"); n = t
        for k, v in subs.items():
            n = n.replace(k, v)
        if n != t:
            p.write_text(n, encoding="utf-8"); print("updated", p.relative_to(site))
left = [str(p) for p in site.rglob("*.html") if any(k in p.read_text(encoding="utf-8") for k in subs)]
assert not left, f"placeholders remain: {left}"
