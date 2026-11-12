"""Stable-file polling with durable local acknowledgements; server is final dedupe authority."""
import hashlib
import json
import sqlite3
from pathlib import Path
from optojump_parser import parse_export

class FolderWatcher:
    def __init__(self, state_dir, cloud):
        self.cloud = cloud
        self.db = sqlite3.connect(Path(state_dir) / "processed.sqlite", check_same_thread=False)
        self.db.execute("CREATE TABLE IF NOT EXISTS acknowledged (key TEXT PRIMARY KEY)")
        self.observed = {}

    def scan(self, folder, mappings):
        output = []
        path = Path(folder)
        if not path.is_dir():
            raise ValueError("Ο φάκελος δεν είναι διαθέσιμος.")
        for file in sorted(path.iterdir()):
            if file.suffix.lower() != ".xml" or not file.is_file():
                continue
            stat = file.stat()
            signature = (stat.st_size, stat.st_mtime_ns)
            previous = self.observed.get(str(file))
            self.observed[str(file)] = signature
            if previous != signature:
                continue  # Wait for one whole poll interval with no writes.
            raw = file.read_bytes()
            after = file.stat()
            if (after.st_size, after.st_mtime_ns) != signature:
                continue
            try:
                attempts, skipped = parse_export(raw)
            except ValueError:
                output.append(("invalid", file.name))
                continue
            for kind in skipped:
                output.append(("unsupported", kind))
            pending = []
            for attempt in attempts:
                user_id = mappings.get(attempt["external_person"])
                if not user_id:
                    output.append(("unmapped", attempt["external_person"]))
                    continue
                key = hashlib.sha256(json.dumps([user_id, attempt], sort_keys=True).encode()).hexdigest()
                if not self.db.execute("SELECT 1 FROM acknowledged WHERE key=?", (key,)).fetchone():
                    pending.append((key, user_id, attempt))
            if pending:
                self.cloud.refresh()
            for key, user_id, attempt in pending:
                result = self.cloud.import_attempt(user_id, attempt)
                self.db.execute("INSERT OR IGNORE INTO acknowledged VALUES (?)", (key,))
                self.db.commit()
                output.append((result["status"], attempt["test"]))
        return output
