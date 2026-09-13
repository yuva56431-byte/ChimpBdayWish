"""Save the published birthday wishes for pages opened directly as files."""

import csv
import io
import json
import os
from pathlib import Path
import tempfile
import time
from urllib.request import Request, urlopen


SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vS7Twn036xXZ3pzwHPQR1OadA3OTktmpCMdYn8KDpOppoBshGm4xlc9MEw_ATVb33DWViH-OE7mg6tk/"
    "pub?output=csv"
)
DATA_FILE = Path(__file__).resolve().parent / "wishes-data.js"


def download_wishes():
    request = Request(
        f"{SHEET_URL}&refresh={time.time_ns()}",
        headers={"Cache-Control": "no-cache"},
    )
    with urlopen(request, timeout=20) as response:
        csv_text = response.read().decode("utf-8-sig")

    reader = csv.DictReader(io.StringIO(csv_text))
    if not reader.fieldnames:
        raise ValueError("The published sheet is empty")
    reader.fieldnames = [heading.strip() for heading in reader.fieldnames]
    if "Your Name" not in reader.fieldnames or "Your Wish" not in reader.fieldnames:
        raise ValueError("The sheet needs 'Your Name' and 'Your Wish' columns")

    wishes = []
    for row in reader:
        name = (row.get("Your Name") or "").strip()
        message = (row.get("Your Wish") or "").strip()
        if name and message:
            wishes.append({"name": name, "message": message})
    return wishes


def main():
    wishes = download_wishes()
    script = (
        "// Generated from the published sheet by Start Birthday.bat.\n"
        "window.BIRTHDAY_WISHES = "
        + json.dumps(wishes, ensure_ascii=True, indent=2)
        + ";\n"
    )

    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=DATA_FILE.parent,
        prefix=".wishes-", suffix=".tmp", delete=False,
    ) as temporary:
        temporary.write(script)
        temporary_path = Path(temporary.name)
    try:
        os.replace(temporary_path, DATA_FILE)
    finally:
        temporary_path.unlink(missing_ok=True)

    print(f"Saved {len(wishes)} wishes to {DATA_FILE.name}.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        raise SystemExit(f"Could not refresh wishes: {error}") from error
