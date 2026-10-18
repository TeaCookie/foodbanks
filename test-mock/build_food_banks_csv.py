#!/usr/bin/env python3
"""Download the BC Food Banks layer (WFS) and write food_banks.csv.

The KML you attached is only a NetworkLink to a WMS image overlay, so it holds
no point data. The same layer is published as a WFS feature service, which
returns the real points (about 100 records).

Usage:  python3 build_food_banks_csv.py
Needs:  Python 3.8+, internet access. No third-party packages.
"""
import csv
import json
import urllib.parse
import urllib.request

LAYER = "pub:WHSE_IMAGERY_AND_BASE_MAPS.GSR_FOOD_BANKS_SV"
BASE = "https://openmaps.gov.bc.ca/geo/pub/WHSE_IMAGERY_AND_BASE_MAPS.GSR_FOOD_BANKS_SV/ows"
OUT = "food_banks.csv"

# CSV column -> source property in the WFS layer
COLUMNS = [
    ("sequence_id", "SEQUENCE_ID"),
    ("facility_name", "FACILITY_NAME"),
    ("physical_address", "PHYSICAL_ADDRESS"),
    ("mailing_address", "MAILING_ADDRESS"),
    ("locality", "LOCALITY"),
    ("postal_code", "POSTAL_CODE"),
    ("phone", "CONTACT_PHONE"),
    ("website", "WEBSITE_URL"),
    ("latitude", "LATITUDE"),
    ("longitude", "LONGITUDE"),
    ("date_updated", "DATE_UPDATED"),
]


def fetch_features():
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": LAYER,
        "outputFormat": "application/json",
        "srsName": "EPSG:4326",
        "sortBy": "SEQUENCE_ID",
    }
    url = BASE + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=60) as resp:
        return json.load(resp)["features"]


def clean(value):
    if value is None:
        return ""
    if isinstance(value, str):
        value = value.strip()
        if value.endswith("Z") and len(value) == 11:  # 2025-03-06Z -> 2025-03-06
            value = value[:-1]
    return value


def main():
    rows = []
    for feat in fetch_features():
        props = feat.get("properties", {})
        coords = (feat.get("geometry") or {}).get("coordinates")
        row = {col: clean(props.get(src)) for col, src in COLUMNS}
        # Prefer the geometry; fall back to the attribute columns.
        if coords:
            row["longitude"], row["latitude"] = coords[0], coords[1]
        if row["latitude"] == "" or row["longitude"] == "":
            continue
        rows.append(row)

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[c for c, _ in COLUMNS])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {OUT}")


if __name__ == "__main__":
    main()
