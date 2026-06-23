import { describe, it, expect } from "vitest";
import {
  isTableRow,
  isTableSeparatorRow,
  parseTableRow,
} from "../../src/components/Markdown";

describe("markdown tables", () => {
  it("detects table rows and separators", () => {
    expect(isTableRow("| A | B |")).toBe(true);
    expect(isTableRow("not a table")).toBe(false);
    expect(isTableSeparatorRow("|---|---|")).toBe(true);
    expect(isTableSeparatorRow("| --- | --- |")).toBe(true);
    expect(isTableSeparatorRow("| data | row |")).toBe(false);
    expect(parseTableRow("| Показатель | Значение |")).toEqual([
      "Показатель",
      "Значение",
    ]);
  });

  it("parses vacancy analytics style tables", () => {
    const rows = [
      "| Показатель | Значение |",
      "|------------|----------|",
      "| Открытых вакансий | ≈ 12 400 (всего по всей России) |",
      "| Средняя зарплата | ≈ 180 000 ₽ в месяц (по платформе) |",
    ];
    expect(rows.every(isTableRow)).toBe(true);
    expect(isTableSeparatorRow(rows[1])).toBe(true);
    expect(parseTableRow(rows[2])[0]).toBe("Открытых вакансий");
  });
});
