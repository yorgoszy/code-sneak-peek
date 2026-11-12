import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock
from optojump_parser import parse_export
from watcher import FolderWatcher


def export(test="CMJ", height="27.1", flight="0.470", extra=""):
    from xml.sax.saxutils import escape
    headers = ["ID", "Last name", "Name", "BirthDate", "Test", "Date", "Time", "#", "Elevation", "Flight time", "Contact time", "RSI"]
    values = ["", "EXAMPLE", "USER", "1/1/2000", test, "2/11/2026", "5:12:05 μμ", "1", height, flight, "", ""]
    row = lambda cells: "<Row>" + "".join('<Cell><Data ss:Type="String">' + escape(v) + '</Data></Cell>' for v in cells) + "</Row>"
    return ('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="OJ Data"><Table>' + row(headers) + row(values) + extra + '</Table></Worksheet></Workbook>').encode()

class ParserTests(unittest.TestCase):
    def test_height_is_cm_not_meters(self):
        result, skipped = parse_export(export())
        self.assertEqual(result[0]["height_cm"], 27.1)
        self.assertEqual(result[0]["flight_seconds"], 0.470)
        self.assertEqual(result[0]["recorded_at"], "2026-11-02T17:12:05")
        self.assertEqual(skipped, [])

    def test_squat_and_drop_mapping(self):
        for kind in ["SQUAT JUMP", "DROP JUMP"]:
            self.assertEqual(parse_export(export(kind))[0][0]["test"], kind)

    def test_free_arms_not_silently_cmj(self):
        attempts, skipped = parse_export(export("CMJ FREE ARMS"))
        self.assertEqual(attempts, [])
        self.assertEqual(skipped, ["CMJ FREE ARMS"])

    def test_position_rows_not_jumps(self):
        self.assertRaises(ValueError, parse_export, export(height="", flight=""))

    def test_invalid_measurements(self):
        for height in ("NaN", "-1", "500"):
            self.assertRaises(ValueError, parse_export, export(height=height))

    def test_entities_rejected(self):
        with self.assertRaises(Exception):
            parse_export(b'<!DOCTYPE x [<!ENTITY y SYSTEM "file:///etc/passwd">]><x>&y;</x>')

    def test_uploaded_reference(self):
        source = os.environ.get("OPTOJUMP_REFERENCE")
        if not source:
            self.skipTest("Reference export not supplied")
        attempts, skipped = parse_export(Path(source).read_bytes())
        self.assertEqual(len(attempts), 5)
        current = {a["test"]: a for a in attempts if a["recorded_at"].startswith("2026-11-02")}
        self.assertEqual(current["SQUAT JUMP"]["height_cm"], 30.2)
        self.assertEqual(current["CMJ"]["height_cm"], 27.1)
        self.assertEqual(current["DROP JUMP"]["height_cm"], 34.8)
        self.assertEqual(current["DROP JUMP"]["contact_seconds"], 0.335)
        self.assertEqual(current["DROP JUMP"]["rsi"], 1.04)
        self.assertEqual(skipped, ["CMJ FREE ARMS"])

class WatcherTests(unittest.TestCase):
    def test_stable_file_and_persistent_dedupe(self):
        with tempfile.TemporaryDirectory() as folder:
            file = Path(folder) / "test.xml"
            file.write_bytes(export())
            attempt = parse_export(file.read_bytes())[0][0]
            cloud = Mock()
            cloud.import_attempt.return_value = {"status": "imported"}
            watcher = FolderWatcher(folder, cloud)
            mapping = {attempt["external_person"]: "test-user"}
            self.assertEqual(watcher.scan(folder, mapping), [])
            self.assertEqual(watcher.scan(folder, mapping), [("imported", "CMJ")])
            watcher.db.close()
            second = FolderWatcher(folder, cloud)
            second.scan(folder, mapping)
            self.assertEqual(second.scan(folder, mapping), [])
            cloud.import_attempt.assert_called_once()
            second.db.close()

    def test_unmapped_never_sent(self):
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder) / "test.xml").write_bytes(export())
            cloud = Mock()
            watcher = FolderWatcher(folder, cloud)
            watcher.scan(folder, {})
            self.assertEqual(watcher.scan(folder, {})[0][0], "unmapped")
            cloud.import_attempt.assert_not_called()
            watcher.db.close()

    def test_failed_upload_retries(self):
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder) / "test.xml").write_bytes(export())
            person = parse_export(export())[0][0]["external_person"]
            cloud = Mock()
            cloud.import_attempt.side_effect = [RuntimeError("offline"), {"status": "duplicate"}]
            watcher = FolderWatcher(folder, cloud)
            mapping = {person: "test-user"}
            watcher.scan(folder, mapping)
            with self.assertRaises(RuntimeError):
                watcher.scan(folder, mapping)
            self.assertEqual(watcher.scan(folder, mapping), [("duplicate", "CMJ")])
            self.assertEqual(cloud.import_attempt.call_count, 2)
            watcher.db.close()

if __name__ == "__main__":
    unittest.main()
