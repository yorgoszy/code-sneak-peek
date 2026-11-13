import { test, expect } from "bun:test";
import {
  earliestEndDateByUser,
  sortUsersByExpiry,
  daysUntilExpiry,
} from "./activeUserExpiry";

test("earliest end_date wins when a user has several active subscriptions", () => {
  const map = earliestEndDateByUser([
    { user_id: "u1", end_date: "2026-12-30" },
    { user_id: "u1", end_date: "2026-11-20" },
    { user_id: "u2", end_date: "2026-11-25" },
    { user_id: "u3", end_date: null },
  ]);

  expect(map.get("u1")).toBe("2026-11-20");
  expect(map.get("u2")).toBe("2026-11-25");
  expect(map.has("u3")).toBe(false);
});

test("users expiring soonest are listed first", () => {
  const users = [
    { id: "late", name: "Δημήτρης Kώτσας" },
    { id: "soon", name: "ΓΕΩΡΓΙΟΣ ΖΥΓΟΥΡΗΣ" },
    { id: "middle", name: "ΝΙΚΟΣ ΠΟΥΤΛΗΣ" },
  ];
  const dates = new Map([
    ["late", "2027-03-01"],
    ["soon", "2026-11-15"],
    ["middle", "2026-12-01"],
  ]);

  expect(sortUsersByExpiry(users, dates).map(u => u.id)).toEqual(["soon", "middle", "late"]);
});

test("same expiry day falls back to alphabetical order", () => {
  const users = [
    { id: "b", name: "ΒΑΣΙΛΗΣ ΤΖΕΒΕΛΕΚΗΣ" },
    { id: "a", name: "ΑΓΓΕΛΙΚΗ ΛΑΠΠΑ" },
  ];
  const dates = new Map([
    ["b", "2026-11-20"],
    ["a", "2026-11-20"],
  ]);

  expect(sortUsersByExpiry(users, dates).map(u => u.id)).toEqual(["a", "b"]);
});

test("users without a known expiry go last", () => {
  const users = [
    { id: "nodate", name: "ΧΩΡΙΣ ΣΥΝΔΡΟΜΗ" },
    { id: "dated", name: "ΜΕ ΣΥΝΔΡΟΜΗ" },
  ];
  const dates = new Map([["dated", "2030-01-01"]]);

  expect(sortUsersByExpiry(users, dates).map(u => u.id)).toEqual(["dated", "nodate"]);
});

test("days until expiry counts today as zero", () => {
  const today = new Date(2026, 10, 13, 9, 0, 0);

  expect(daysUntilExpiry("2026-11-13", today)).toBe(0);
  expect(daysUntilExpiry("2026-11-20", today)).toBe(7);
  expect(daysUntilExpiry(null, today)).toBeNull();
});
