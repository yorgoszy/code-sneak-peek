"""Strict OptoJump SpreadsheetML reader; never interprets unrelated columns as jumps."""
from datetime import datetime
from decimal import Decimal, InvalidOperation
import json
from defusedxml import ElementTree

NS = "{urn:schemas-microsoft-com:office:spreadsheet}"
SUPPORTED = {"SQUAT JUMP", "CMJ", "DROP JUMP"}

def number(value, optional=False):
    if not value and optional:
        return None
    try:
        result = Decimal(value.replace(",", "."))
    except (InvalidOperation, AttributeError):
        raise ValueError("Invalid numeric measurement") from None
    if not result.is_finite():
        raise ValueError("Non-finite measurement")
    return float(result)

def timestamp(day, clock):
    clock = clock.strip().lower().replace("μμ", "pm").replace("πμ", "am")
    for fmt in ("%d/%m/%Y %I:%M:%S %p", "%d/%m/%Y %H:%M:%S"):
        try:
            return datetime.strptime(day + " " + clock, fmt).isoformat()
        except ValueError:
            pass
    raise ValueError("Unrecognized OptoJump date/time")

def parse_export(raw):
    if len(raw) > 10 * 1024 * 1024:
        raise ValueError("Export exceeds 10 MB")
    root = ElementTree.fromstring(raw)
    if root.tag != NS + "Workbook":
        raise ValueError("Expected OptoJump SpreadsheetML XML")
    attempts, skipped = [], []
    for sheet in root.findall(NS + "Worksheet"):
        if sheet.get(NS + "Name") != "OJ Data":
            continue
        rows = []
        for row in sheet.findall(NS + "Table/" + NS + "Row"):
            cells = []
            for cell in row.findall(NS + "Cell"):
                index = int(cell.get(NS + "Index", len(cells) + 1))
                if index < len(cells) + 1 or index > 1000:
                    raise ValueError("Invalid spreadsheet column index")
                cells.extend([""] * (index - 1 - len(cells)))
                data = cell.find(NS + "Data")
                cells.append((data.text or "").strip() if data is not None else "")
            rows.append(cells)
        if not rows:
            continue
        headers = rows[0]
        if not {"Test", "Date", "Time", "#", "Elevation", "Flight time"}.issubset(headers):
            raise ValueError("Missing OptoJump measurement headers")
        for values in rows[1:]:
            row = dict(zip(headers, values))
            kind = row.get("Test", "").upper().strip()
            if kind not in SUPPORTED:
                if kind:
                    skipped.append(kind)
                continue
            # Extra position rows lack Elevation/Flight time: do not infer heights.
            if not row.get("Elevation") and not row.get("Flight time"):
                continue
            person = json.dumps([row.get("ID", ""), row.get("Last name", ""),
                                 row.get("Name", ""), row.get("BirthDate", "")],
                                ensure_ascii=False, separators=(",", ":"))
            if not row.get("Last name") or not row.get("Name"):
                raise ValueError("Missing OptoJump user identity")
            height = number(row.get("Elevation"))
            flight = number(row.get("Flight time"))
            contact = number(row.get("Contact time"), True)
            rsi = number(row.get("RSI"), True)
            if not 0 < height <= 200 or not 0 < flight <= 5:
                raise ValueError("Measurements outside valid range")
            if contact is not None and not 0 < contact <= 60:
                raise ValueError("Invalid contact time")
            if rsi is not None and not 0 <= rsi <= 100:
                raise ValueError("Invalid RSI")
            attempts.append(dict(external_person=person, test=kind,
                recorded_at=timestamp(row["Date"], row["Time"]), attempt=row["#"],
                height_cm=height, flight_seconds=flight, contact_seconds=contact, rsi=rsi))
    if not attempts and not skipped:
        raise ValueError("No recognized jump results")
    return attempts, sorted(set(skipped))
