import { describe, it, expect } from "vitest";
import { moveInOrder, nextOrder } from "../../src/lib/order";

const items = [
  { id: "a", order: 0 },
  { id: "b", order: 1 },
  { id: "c", order: 2 },
];

describe("moveInOrder", () => {
  it("moves down by swapping order with next", () => {
    const res = moveInOrder(items, "a", "down");
    expect(res).toEqual([
      { id: "a", order: 1 },
      { id: "b", order: 0 },
    ]);
  });
  it("moves up by swapping order with previous", () => {
    const res = moveInOrder(items, "c", "up");
    expect(res).toEqual([
      { id: "c", order: 1 },
      { id: "b", order: 2 },
    ]);
  });
  it("returns empty at boundaries", () => {
    expect(moveInOrder(items, "a", "up")).toEqual([]);
    expect(moveInOrder(items, "c", "down")).toEqual([]);
  });
  it("returns empty for unknown id", () => {
    expect(moveInOrder(items, "z", "up")).toEqual([]);
  });
});

describe("nextOrder", () => {
  it("is 0 for empty list", () => {
    expect(nextOrder([])).toBe(0);
  });
  it("is max+1 otherwise", () => {
    expect(nextOrder(items)).toBe(3);
  });
});
