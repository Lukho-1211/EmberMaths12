import { describe, expect, it } from "vitest";
import {
  filterMunicipalities,
  isSaProvince,
  isValidMunicipality,
  municipalitiesForProvince,
} from "@/lib/sa-geography";

describe("sa-geography", () => {
  it("validates provinces", () => {
    expect(isSaProvince("Gauteng")).toBe(true);
    expect(isSaProvince("California")).toBe(false);
  });

  it("returns municipalities for a province", () => {
    const list = municipalitiesForProvince("Gauteng");
    expect(list).toContain("City of Johannesburg");
    expect(municipalitiesForProvince("NotAProvince")).toEqual([]);
  });

  it("validates municipality against province", () => {
    expect(isValidMunicipality("Gauteng", "City of Johannesburg")).toBe(true);
    expect(isValidMunicipality("Gauteng", "City of Cape Town")).toBe(false);
  });

  it("filters municipalities by query", () => {
    const matches = filterMunicipalities("Gauteng", "johannes");
    expect(matches).toContain("City of Johannesburg");
    expect(filterMunicipalities("Gauteng", "zzzz")).toEqual([]);
  });
});
