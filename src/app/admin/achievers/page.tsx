"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { GeoFilters } from "@/components/geo-filters";
import { TopAchieversBoard } from "@/components/top-achievers";
import { rankStudents } from "@/lib/rankings";
import { useStore } from "@/lib/store";

export default function AdminAchieversPage() {
  const { state } = useStore();
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");

  const rows = useMemo(
    () =>
      rankStudents(state.users, state.progress, {
        province: province || undefined,
        municipality: municipality || undefined,
      }),
    [state.users, state.progress, province, municipality],
  );

  const scopeLabel = municipality
    ? municipality
    : province
      ? province
      : "National";

  return (
    <div>
      <PageHeader
        title="Top achievers"
        subtitle="Rank learners by overall progress — filter by province and municipality."
      />

      <GeoFilters
        province={province}
        municipality={municipality}
        onProvinceChange={setProvince}
        onMunicipalityChange={setMunicipality}
      />

      <p className="mb-3 text-sm text-muted">
        Showing <span className="font-semibold text-ember-navy">{scopeLabel}</span> ·{" "}
        {rows.length} ranked student{rows.length === 1 ? "" : "s"}
      </p>

      <TopAchieversBoard
        rows={rows}
        emptyMessage="No active students match this area yet."
      />
    </div>
  );
}
