"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { GeoFilters } from "@/components/geo-filters";
import { TopAchieversBoard } from "@/components/top-achievers";
import { rankStudents } from "@/lib/rankings";
import { useStore } from "@/lib/store";

export default function TeacherAchieversPage() {
  const { user, state } = useStore();
  const [tab, setTab] = useState<"class" | "area">("class");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");

  const myClasses = useMemo(
    () => state.classes.filter((c) => c.teacherId === user?.id),
    [state.classes, user?.id],
  );

  const classStudentIds = useMemo(
    () => [...new Set(myClasses.flatMap((c) => c.studentIds))],
    [myClasses],
  );

  const classRows = useMemo(
    () =>
      rankStudents(state.users, state.progress, {
        studentIds: classStudentIds,
      }),
    [state.users, state.progress, classStudentIds],
  );

  const areaRows = useMemo(
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
        subtitle="See how your classes rank, and compare learners by province or municipality."
      />

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("class")}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            tab === "class" ? "bg-ember-navy text-white" : "border border-border bg-white"
          }`}
        >
          My classes
        </button>
        <button
          type="button"
          onClick={() => setTab("area")}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            tab === "area" ? "bg-ember-navy text-white" : "border border-border bg-white"
          }`}
        >
          By area
        </button>
      </div>

      {tab === "class" ? (
        <>
          <p className="mb-3 text-sm text-muted">
            Students in your {myClasses.length} class{myClasses.length === 1 ? "" : "es"} ·{" "}
            {classRows.length} ranked
          </p>
          <TopAchieversBoard
            rows={classRows}
            emptyMessage="No active students in your classes yet."
          />
        </>
      ) : (
        <>
          <GeoFilters
            province={province}
            municipality={municipality}
            onProvinceChange={setProvince}
            onMunicipalityChange={setMunicipality}
          />
          <p className="mb-3 text-sm text-muted">
            Showing <span className="font-semibold text-ember-navy">{scopeLabel}</span> ·{" "}
            {areaRows.length} ranked student{areaRows.length === 1 ? "" : "s"}
          </p>
          <TopAchieversBoard
            rows={areaRows}
            emptyMessage="No active students match this area yet."
          />
        </>
      )}
    </div>
  );
}
