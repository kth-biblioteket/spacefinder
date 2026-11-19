import { describe, expect, test } from "vitest";
import { readTextSchedule, stockholmTimestamp, textIsVisible, validateTextSchedule } from "./textSchedule";
import { emptyForm, formToSpace, getFormValues, setFormValues, spaceToForm } from "@/components/admin/adminForm";
import { validateSpaceForm } from "./adminSpaceSchema";

describe("scheduled card texts", () => {
  test("blank bounds display immediately and indefinitely", () => {
    expect(textIsVisible({}, "notice", Date.parse("2026-11-19T08:18:00Z"))).toBe(true);
    expect(textIsVisible({}, "info", Date.parse("2030-01-01T00:00:00Z"))).toBe(true);
  });
  test("starts at the Stockholm start time and hides at the end", () => {
    const schedule = { notice_from: "2026-11-20T08:00", notice_to: "2026-11-25T17:00" };
    expect(textIsVisible(schedule, "notice", Date.parse("2026-11-20T06:59:59Z"))).toBe(false);
    expect(textIsVisible(schedule, "notice", Date.parse("2026-11-20T07:00:00Z"))).toBe(true);
    expect(textIsVisible(schedule, "notice", Date.parse("2026-11-25T16:00:00Z"))).toBe(false);
  });
  test("yellow notice and neutral information have independent bounds", () => {
    const schedule = { notice_from: "2026-11-20T08:00", info_to: "2026-11-19T10:00" };
    expect(textIsVisible(schedule, "notice", Date.parse("2026-11-19T08:18:00Z"))).toBe(false);
    expect(textIsVisible(schedule, "info", Date.parse("2026-11-19T08:18:00Z"))).toBe(true);
  });
  test("supports one-sided bounds", () => {
    expect(textIsVisible({ info_to: "2026-11-19T10:00" }, "info", Date.parse("2026-11-19T09:00:00Z"))).toBe(false);
    expect(textIsVisible({ notice_from: "2026-11-19T10:00" }, "notice", Date.parse("2030-01-01T00:00:00Z"))).toBe(true);
  });
  test("Stockholm daylight saving differs from winter time", () => {
    expect(stockholmTimestamp("2026-07-01T10:00")).toBe(Date.parse("2026-07-01T08:00:00Z"));
    expect(stockholmTimestamp("2026-11-19T10:00")).toBe(Date.parse("2026-11-19T09:00:00Z"));
    expect(stockholmTimestamp("2026-03-29T02:30")).toBeNull();
  });
  test("invalid or reversed periods cannot be saved", () => {
    expect(validateTextSchedule({ notice_from: "2026-11-20T10:00", notice_to: "2026-11-20T09:00" })).toHaveLength(1);
    expect(validateTextSchedule({ info_from: "2026-02-30T10:00" })).toHaveLength(1);
    expect(validateSpaceForm({ ...emptyForm, name: "Test", tags: { schedule: { info_from: "2026-11-20T10:00", info_to: "2026-11-20T09:00" } } })).toHaveLength(1);
  });
  test("editing filters preserves schedules and existing filter values", () => {
    const form = { ...emptyForm, tags: { environment: ["Lugnt"], schedule: { notice_from: "2026-11-20T08:00" } } };
    const edited = setFormValues(form, "environment", ["Ljust"]);
    const restored = spaceToForm(formToSpace(edited));
    expect(getFormValues(restored, "environment")).toEqual(["Ljust"]);
    expect(readTextSchedule(restored.tags)).toEqual({ notice_from: "2026-11-20T08:00" });
    expect(getFormValues(restored, "schedule")).toEqual([]);
  });
});