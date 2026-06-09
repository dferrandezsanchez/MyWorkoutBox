#!/usr/bin/env python3
"""Dry-run normalizer for TuMeta XLSX training records.

This script intentionally uses only Python's standard library so it can parse
the workbook without adding runtime dependencies to the project.

Default mode is dry-run:
  python3 prisma/import-tu-meta-xlsx.py "/path/to/Registro de carga TuMeta.xlsx"

The database import is deliberately not implemented yet. The current goal is to
produce a trustworthy normalization report before replacing the older CSV import.
"""

from __future__ import annotations

import json
import re
import shutil
import sqlite3
import sys
import unicodedata
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET
from zipfile import ZipFile
from uuid import uuid4

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

MONTHS = {
    "ENERO": 1,
    "FEBRERO": 2,
    "MARZO": 3,
    "ABRIL": 4,
    "MAYO": 5,
    "JUNIO": 6,
    "JULIO": 7,
    "SEPTIEMBRE": 9,
    "OCTUBRE": 10,
    "NOVIEMBRE": 11,
    "DICIEMBRE": 12,
}

EXERCISE_GROUPS = [
    ("SENTADILLA", 1, 2, 9),
    ("ZANCADA", 3, 4, 9),
    ("PESO MUERTO", 5, 6, 9),
    ("STEP UP", 7, 8, 9),
    ("FLEXIONES", 10, 11, 18),
    ("REMOS", 12, 13, 18),
    ("PRESS MILITAR", 14, 15, 18),
    ("DOMINADAS", 16, 17, 18),
]

SOURCE_LABEL = "Registro de carga TuMeta.xlsx"
OLD_CSV_LABEL = "Registro de carga TuMeta - JUNIO 25.csv"
DEFAULT_BIRTH_DATE = "1900-01-01T00:00:00.000Z"
IMPORT_TRAINER_EMAIL = "admin@gym.com"

EXERCISE_META = {
    "SENTADILLA": ("Tren inferior", "kg"),
    "ZANCADA": ("Tren inferior", "kg"),
    "PESO MUERTO": ("Tren inferior", "kg"),
    "STEP UP": ("Tren inferior", "kg"),
    "FLEXIONES": ("Tren superior", "repetitions"),
    "REMOS": ("Tren superior", "repetitions"),
    "PRESS MILITAR": ("Tren superior", "kg"),
    "DOMINADAS": ("Tren superior", "repetitions"),
}


@dataclass
class NormalizedRecord:
    sheet: str
    date: str
    client: str
    exercise: str
    value: Any
    unit: str
    weight: float | None
    repetitions: float | int | None
    duration: float | None
    distance: float | None
    variant: str | None
    rawIntensity: str
    rawVolume: str
    observation: str
    confidence: str
    notes: list[str]


@dataclass
class ClientNameResolution:
    raw: str
    canonical: str
    strategy: str


def clean(value: Any) -> str:
    text = "" if value is None else str(value).strip()
    if re.fullmatch(r"\d+\.0", text):
        return text[:-2]
    return text


def strip_accents(value: str) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFD", value) if unicodedata.category(char) != "Mn"
    )


def normalized_name(value: str) -> str:
    value = re.sub(r"\([^)]*\)", "", value)
    value = strip_accents(value).lower()
    value = re.sub(r"[^a-z0-9 ]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def split_client_name(full_name: str) -> tuple[str, str]:
    parts = full_name.strip().split()
    if len(parts) <= 1:
        return full_name.strip(), ""
    return parts[0], " ".join(parts[1:])


def excel_serial_to_range(value: str) -> str | None:
    if not re.fullmatch(r"\d{5}", value):
        return None
    serial = int(value)
    if not 40000 <= serial <= 50000:
        return None
    date = datetime(1899, 12, 30) + timedelta(days=serial)
    return f"{date.day}-{date.month}"


def display_value(value: Any) -> str:
    text = clean(value)
    return excel_serial_to_range(text) or text


def numbers(text: str) -> list[float]:
    normalized = text.lower().replace(",", ".")
    return [float(match) for match in re.findall(r"\d+(?:\.\d+)?", normalized)]


def number_or_int(value: float) -> float | int:
    return int(value) if value.is_integer() else value


def parse_sheet_date(sheet_name: str) -> str:
    parts = sheet_name.upper().split()
    month = MONTHS.get(parts[0], 1)
    if len(parts) > 1 and parts[1].isdigit():
        year = 2000 + int(parts[1])
    else:
        # The workbook order places bare JULIO/SEPTIEMBRE/NOVIEMBRE after ENERO 23.
        year = 2022
    return f"{year:04d}-{month:02d}-01"


def col_to_idx(cell_ref: str) -> int:
    letters = re.match(r"([A-Z]+)", cell_ref).group(1)  # type: ignore[union-attr]
    index = 0
    for letter in letters:
        index = index * 26 + ord(letter) - 64
    return index


def extract_variant(text: str) -> str | None:
    normalized = text.lower()
    variants = {
        "prono": "Prono",
        "supino": "Supino",
        "neutro": "Neutro",
        "neutra": "Neutro",
        "normal": "Normal",
        "normales": "Normal",
        "australiana": "Australiana",
    }
    for key, label in variants.items():
        if key in normalized:
            return label
    return None


def normalize_mark(exercise: str, intensity: str, volume: str) -> dict[str, Any]:
    joined = f"{intensity} {volume}".strip().lower()
    intensity_numbers = numbers(intensity)
    volume_numbers = numbers(volume)
    result: dict[str, Any] = {
        "value": None,
        "unit": "text",
        "weight": None,
        "repetitions": None,
        "duration": None,
        "distance": None,
        "variant": extract_variant(joined),
        "confidence": "low",
        "notes": [],
    }

    if "-" in intensity or "-" in volume:
        result["notes"].append("Rango original")
    if any(token in joined for token in ["x lado", "unilateral", "por pierna"]):
        result["notes"].append("Unilateral/por lado")

    if exercise == "DOMINADAS":
        reps = volume_numbers[-1] if volume_numbers else None
        if reps is not None:
            result.update(
                value=number_or_int(reps),
                unit="repetitions",
                repetitions=number_or_int(reps),
                confidence="medium",
            )
        if intensity_numbers and any(token in intensity.lower() for token in ["kg", "lastr"]):
            result["weight"] = intensity_numbers[0]

    elif exercise in {"SENTADILLA", "ZANCADA", "PESO MUERTO", "PRESS MILITAR"}:
        if intensity_numbers and "kg" in intensity.lower():
            result.update(
                value=number_or_int(intensity_numbers[0]),
                unit="kg",
                weight=intensity_numbers[0],
                confidence="medium",
            )
        if volume_numbers:
            result["repetitions"] = number_or_int(volume_numbers[-1])

    elif exercise == "STEP UP":
        if intensity_numbers and "kg" in intensity.lower():
            result.update(
                value=number_or_int(intensity_numbers[0]),
                unit="kg",
                weight=intensity_numbers[0],
                confidence="medium",
            )
        if volume_numbers:
            result["repetitions"] = number_or_int(volume_numbers[-1])

    elif exercise in {"FLEXIONES", "REMOS"}:
        if volume_numbers:
            result.update(
                value=number_or_int(volume_numbers[-1]),
                unit="repetitions",
                repetitions=number_or_int(volume_numbers[-1]),
                confidence="medium",
            )
        if intensity_numbers and "kg" in intensity.lower():
            result["weight"] = intensity_numbers[0]

    if result["value"] is None:
        if intensity_numbers:
            result["value"] = number_or_int(intensity_numbers[0])
        elif volume_numbers:
            result["value"] = number_or_int(volume_numbers[0])
        else:
            result["value"] = intensity or volume

    return result


def parse_workbook(path: Path) -> tuple[list[NormalizedRecord], list[dict[str, Any]], list[str]]:
    with ZipFile(path) as archive:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in root.findall("a:si", NS):
                shared_strings.append("".join(t.text or "" for t in item.findall(".//a:t", NS)))

        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rid_to_target = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}

        sheets: list[tuple[str, str]] = []
        for sheet in workbook.findall("a:sheets/a:sheet", NS):
            name = sheet.attrib["name"]
            rid = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            target = rid_to_target[rid]
            sheet_path = target if target.startswith("xl/") else f"xl/{target.lstrip('/')}"
            sheets.append((name, sheet_path))

        def cell_value(cell: ET.Element) -> str:
            value = cell.find("a:v", NS)
            if value is None:
                return ""
            raw = value.text or ""
            if cell.attrib.get("t") == "s":
                return shared_strings[int(raw)] if raw.isdigit() and int(raw) < len(shared_strings) else raw
            return display_value(raw)

        records: list[NormalizedRecord] = []
        per_sheet: list[dict[str, Any]] = []

        for sheet_name, sheet_path in sheets:
            root = ET.fromstring(archive.read(sheet_path))
            rows = root.findall("a:sheetData/a:row", NS)
            sheet_records = 0
            sheet_clients = 0
            date = parse_sheet_date(sheet_name)

            for row in rows[3:]:
                values = [""] * 22
                for cell in row.findall("a:c", NS):
                    index = col_to_idx(cell.attrib.get("r", "A1")) - 1
                    if index < len(values):
                        values[index] = cell_value(cell)

                client = clean(values[0])
                if not client:
                    continue
                sheet_clients += 1

                for exercise, intensity_col, volume_col, observation_col in EXERCISE_GROUPS:
                    intensity = display_value(values[intensity_col])
                    volume = display_value(values[volume_col])
                    observation = display_value(values[observation_col])
                    if not intensity and not volume:
                        continue

                    normalized = normalize_mark(exercise, intensity, volume)
                    records.append(
                        NormalizedRecord(
                            sheet=sheet_name,
                            date=date,
                            client=client,
                            exercise=exercise,
                            rawIntensity=intensity,
                            rawVolume=volume,
                            observation=observation,
                            **normalized,
                        )
                    )
                    sheet_records += 1

            per_sheet.append(
                {
                    "sheet": sheet_name,
                    "date": date,
                    "clients": sheet_clients,
                    "records": sheet_records,
                }
            )

    return records, per_sheet, [sheet[0] for sheet in sheets]


def resolve_client_names(records: list[NormalizedRecord]) -> list[ClientNameResolution]:
    raw_names = sorted({record.client for record in records})
    multi_word_names = [name for name in raw_names if len(name.split()) > 1]
    first_name_index: dict[str, list[str]] = defaultdict(list)
    for name in multi_word_names:
        first = normalized_name(name).split()[0]
        first_name_index[first].append(name)

    resolutions: list[ClientNameResolution] = []
    for name in raw_names:
      normalized = normalized_name(name)
      tokens = normalized.split()
      if len(tokens) > 1:
          resolutions.append(ClientNameResolution(raw=name, canonical=name, strategy="exact_full_name"))
          continue

      if not tokens:
          resolutions.append(ClientNameResolution(raw=name, canonical=name, strategy="empty"))
          continue

      token = tokens[0]
      candidates = [
          candidate
          for first, names in first_name_index.items()
          if first.startswith(token)
          for candidate in names
      ]
      unique_candidates = sorted(set(candidates))
      if len(unique_candidates) == 1:
          resolutions.append(
              ClientNameResolution(raw=name, canonical=unique_candidates[0], strategy="unique_first_name_alias")
          )
      else:
          resolutions.append(ClientNameResolution(raw=name, canonical=name, strategy="ambiguous_or_single_name"))

    by_raw = {resolution.raw: resolution.canonical for resolution in resolutions}
    for record in records:
        record.client = by_raw.get(record.client, record.client)

    return resolutions


def get_database_path() -> Path:
    env_path = Path("backend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("DATABASE_URL="):
                value = line.split("=", 1)[1].strip().strip('"')
                if value.startswith("file:"):
                    return Path(value[5:])
    return Path("backend/prisma/dev.db")


def now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="milliseconds") + "Z"


def to_db_number(value: Any) -> float | int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return value
    return None


def record_notes(record: NormalizedRecord) -> str:
    lines = [
        f"Intensidad original: {record.rawIntensity}" if record.rawIntensity else "",
        f"Volumen original: {record.rawVolume}" if record.rawVolume else "",
        f"Variante: {record.variant}" if record.variant else "",
        f"Observaciones: {record.observation}" if record.observation else "",
        *record.notes,
        f"Importado desde {SOURCE_LABEL}",
        f"Hoja: {record.sheet}",
    ]
    return "\n".join(line for line in lines if line)


def apply_import(records: list[NormalizedRecord], resolutions: list[ClientNameResolution]) -> dict[str, Any]:
    db_path = get_database_path()
    if not db_path.exists():
        raise SystemExit(f"No existe la base de datos: {db_path}")

    backup_path = db_path.with_name(f"{db_path.name}-{datetime.now().strftime('%Y%m%d%H%M%S')}.bak")
    shutil.copy2(db_path, backup_path)

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE email = ?", (IMPORT_TRAINER_EMAIL,))
    row = cur.fetchone()
    if not row:
        raise SystemExit(f"No existe el usuario importador {IMPORT_TRAINER_EMAIL}")
    trainer_id = row[0]

    source_like = f"%Importado desde {SOURCE_LABEL}%"
    old_csv_like = f"%Importado desde {OLD_CSV_LABEL}%"

    cur.execute(
        "DELETE FROM audit_logs WHERE metadata LIKE ? OR metadata LIKE ?",
        (f"%tu-meta-xlsx-import%", f"%tu-meta-csv-import%"),
    )
    audit_deleted = cur.rowcount
    cur.execute(
        "DELETE FROM performance_records WHERE notes LIKE ? OR notes LIKE ?",
        (source_like, old_csv_like),
    )
    performance_deleted = cur.rowcount

    exercise_ids: dict[str, str] = {}
    for exercise, (category, unit) in EXERCISE_META.items():
        cur.execute("SELECT id FROM exercises WHERE name = ?", (exercise,))
        existing = cur.fetchone()
        if existing:
            exercise_id = existing[0]
            cur.execute(
                """
                UPDATE exercises
                SET category = ?, defaultUnit = ?, status = 'ACTIVE',
                    description = ?, updatedAt = ?
                WHERE id = ?
                """,
                (category, unit, f"Normalizado desde {SOURCE_LABEL}", now_iso(), exercise_id),
            )
        else:
            exercise_id = str(uuid4())
            cur.execute(
                """
                INSERT INTO exercises (id, name, category, defaultUnit, description, status, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
                """,
                (exercise_id, exercise, category, unit, f"Normalizado desde {SOURCE_LABEL}", now_iso(), now_iso()),
            )
        exercise_ids[exercise] = exercise_id

    client_ids: dict[str, str] = {}
    for client_name in sorted({record.client for record in records}):
        first_name, last_name = split_client_name(client_name)
        cur.execute(
            "SELECT id FROM clients WHERE firstName = ? AND lastName = ?",
            (first_name, last_name),
        )
        existing = cur.fetchone()
        if existing:
            client_id = existing[0]
            cur.execute(
                "UPDATE clients SET status = 'ACTIVE', updatedAt = ? WHERE id = ?",
                (now_iso(), client_id),
            )
        else:
            client_id = str(uuid4())
            cur.execute(
                """
                INSERT INTO clients (
                  id, firstName, lastName, birthDate, notes, status, createdAt, updatedAt
                )
                VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
                """,
                (
                    client_id,
                    first_name,
                    last_name,
                    DEFAULT_BIRTH_DATE,
                    f"Importado desde {SOURCE_LABEL}",
                    now_iso(),
                    now_iso(),
                ),
            )
            cur.execute(
                """
                INSERT INTO audit_logs (id, userId, action, entityType, entityId, metadata, createdAt)
                VALUES (?, ?, 'CREATE', 'Client', ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    trainer_id,
                    client_id,
                    json.dumps({"source": "tu-meta-xlsx-import"}),
                    now_iso(),
                ),
            )
        client_ids[client_name] = client_id

    inserted = 0
    for record in records:
        record_id = str(uuid4())
        value = str(record.value)
        notes = record_notes(record)
        cur.execute(
            """
            INSERT INTO performance_records (
              id, clientId, exerciseId, trainerId, value, unit, weight, repetitions,
              duration, distance, date, notes, createdAt, updatedAt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record_id,
                client_ids[record.client],
                exercise_ids[record.exercise],
                trainer_id,
                value,
                record.unit,
                to_db_number(record.weight),
                int(record.repetitions) if isinstance(record.repetitions, (int, float)) else None,
                to_db_number(record.duration),
                to_db_number(record.distance),
                f"{record.date}T00:00:00.000Z",
                notes,
                now_iso(),
                now_iso(),
            ),
        )
        cur.execute(
            """
            INSERT INTO audit_logs (id, userId, action, entityType, entityId, metadata, createdAt)
            VALUES (?, ?, 'CREATE', 'PerformanceRecord', ?, ?, ?)
            """,
            (
                str(uuid4()),
                trainer_id,
                record_id,
                json.dumps({"source": "tu-meta-xlsx-import", "sheet": record.sheet}),
                now_iso(),
            ),
        )
        inserted += 1

    conn.commit()
    conn.close()

    return {
        "database": str(db_path),
        "backup": str(backup_path),
        "performanceRecordsDeleted": performance_deleted,
        "auditLogsDeleted": audit_deleted,
        "performanceRecordsInserted": inserted,
        "clientsTouched": len(client_ids),
        "exercisesTouched": len(exercise_ids),
        "aliasesResolved": len([r for r in resolutions if r.strategy == "unique_first_name_alias"]),
        "aliasesAmbiguous": len([r for r in resolutions if r.strategy == "ambiguous_or_single_name"]),
    }


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Uso: python3 prisma/import-tu-meta-xlsx.py <ruta-xlsx> [--apply]")

    path = Path(sys.argv[1])
    records, per_sheet, sheet_names = parse_workbook(path)
    resolutions = resolve_client_names(records)
    clients = {record.client for record in records}
    confidence = Counter(record.confidence for record in records)
    by_exercise = Counter(record.exercise for record in records)
    ambiguous_examples = [asdict(record) for record in records if record.confidence == "low"][:20]
    sample_by_exercise: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        bucket = sample_by_exercise[record.exercise]
        if len(bucket) < 3:
            bucket.append(asdict(record))

    report: dict[str, Any] = {
        "mode": "apply" if "--apply" in sys.argv else "dry-run",
        "source": str(path),
        "sheets": len(sheet_names),
        "sheetNames": sheet_names,
        "uniqueClientsRaw": len(clients),
        "nameResolution": dict(Counter(resolution.strategy for resolution in resolutions)),
        "aliasExamples": [asdict(resolution) for resolution in resolutions if resolution.raw != resolution.canonical][:20],
        "recordsDetected": len(records),
        "confidence": dict(confidence),
        "recordsByExercise": dict(by_exercise),
        "perSheet": per_sheet,
        "sampleByExercise": sample_by_exercise,
        "ambiguousExamples": ambiguous_examples,
    }
    if "--apply" in sys.argv:
        report["applyResult"] = apply_import(records, resolutions)
    else:
        report["nextStep"] = "Review report, then run again with --apply to replace older CSV import."
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
