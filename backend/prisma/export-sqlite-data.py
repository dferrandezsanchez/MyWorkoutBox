#!/usr/bin/env python3
import json
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

TABLES = [
    "organizations",
    "tenants",
    "users",
    "user_tenant_memberships",
    "clients",
    "exercises",
    "performance_records",
    "audit_logs",
]


def usage() -> None:
    raise SystemExit("Usage: python3 prisma/export-sqlite-data.py <sqlite-db-path> <output-json-path>")


def rows_for_table(conn: sqlite3.Connection, table: str) -> list[dict[str, Any]]:
    cursor = conn.execute(f'SELECT * FROM "{table}"')
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def main() -> None:
    if len(sys.argv) != 3:
        usage()

    db_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    if not db_path.exists():
        raise SystemExit(f"SQLite database not found: {db_path}")

    backup_path = db_path.with_name(f"{db_path.name}-{datetime.now().strftime('%Y%m%d%H%M%S')}.bak")
    shutil.copy2(db_path, backup_path)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    payload = {
        "source": str(db_path),
        "backup": str(backup_path),
        "exportedAt": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "tables": {},
    }

    for table in TABLES:
        try:
            rows = rows_for_table(conn, table)
        except sqlite3.OperationalError as exc:
            raise SystemExit(f"Cannot read table {table}: {exc}") from exc
        payload["tables"][table] = rows

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    counts = {table: len(rows) for table, rows in payload["tables"].items()}
    print(json.dumps({"output": str(output_path), "backup": str(backup_path), "counts": counts}, indent=2))


if __name__ == "__main__":
    main()
