"""Daily monitor (runs in GitHub Actions). Checks the site is up and records Gumroad sales.
Env: SITE_URL (required), GUMROAD_TOKEN (optional). Exits 1 on failure -> GitHub emails the owner.
Appends one line per day to ops/metrics.csv: date,site_ok,sales_total,gross_usd,refunds."""
import csv, datetime, json, os, sys, urllib.parse, urllib.request
from pathlib import Path

def get(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "tallythread-monitor"}), timeout=20) as r:
                return r.status, r.read()
        except Exception as e:  # retry transient errors
            err = e
    raise err

def gumroad_sales(token):
    """All sales so far (Gumroad paginates with next_page_key)."""
    sales, key = [], None
    while True:
        q = {"access_token": token, **({"page_key": key} if key else {})}
        _, body = get("https://api.gumroad.com/v2/sales?" + urllib.parse.urlencode(q))
        data = json.loads(body)
        if not data.get("success"):
            raise RuntimeError(f"Gumroad API error: {data.get('message')}")
        sales += data.get("sales", [])
        key = data.get("next_page_key")
        if not key:
            return sales

def main():
    site = os.environ["SITE_URL"].rstrip("/")
    problems, site_ok = [], True
    for path in ("/", "/etsy-fee-calculator/"):
        try:
            status, body = get(site + path)
            if status != 200 or b"TallyThread" not in body:
                raise RuntimeError(f"status {status}")
        except Exception as e:
            site_ok = False; problems.append(f"{path}: {e}")
    total = gross = refunds = ""
    if os.environ.get("GUMROAD_TOKEN"):
        try:
            s = gumroad_sales(os.environ["GUMROAD_TOKEN"])
            total = len(s)
            gross = round(sum(x.get("price", 0) for x in s) / 100, 2)  # cents
            refunds = sum(1 for x in s if x.get("refunded"))
        except Exception as e:
            problems.append(f"gumroad: {e}")
    out = Path(__file__).parent / "metrics.csv"
    new = not out.exists()
    with out.open("a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["date", "site_ok", "sales_total", "gross_usd", "refunds"])
        w.writerow([datetime.date.today().isoformat(), site_ok, total, gross, refunds])
    print(f"site_ok={site_ok} sales={total} gross=${gross} refunds={refunds}")
    if problems:
        print("PROBLEMS:\n" + "\n".join(problems)); sys.exit(1)

if __name__ == "__main__":
    main()
