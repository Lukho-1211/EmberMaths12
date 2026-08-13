"use client";

import { MunicipalityAutocomplete } from "@/components/municipality-autocomplete";
import { SA_PROVINCES } from "@/lib/sa-geography";

const fieldClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40";

export function GeoFilters({
  province,
  municipality,
  onProvinceChange,
  onMunicipalityChange,
}: {
  province: string;
  municipality: string;
  onProvinceChange: (province: string) => void;
  onMunicipalityChange: (municipality: string) => void;
}) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Province</span>
        <select
          className={fieldClass}
          value={province}
          onChange={(e) => {
            onProvinceChange(e.target.value);
            onMunicipalityChange("");
          }}
        >
          <option value="">All provinces (national)</option>
          {SA_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Municipality</span>
        <MunicipalityAutocomplete
          province={province}
          value={municipality}
          onChange={onMunicipalityChange}
          disabled={!province}
        />
      </label>
    </div>
  );
}
