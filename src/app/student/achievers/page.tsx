"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/app-shell";
import { RankSummaryCard, TopAchieversBoard } from "@/components/top-achievers";
import { findRank, rankStudents } from "@/lib/rankings";
import { useStore } from "@/lib/store";

export default function StudentAchieversPage() {
  const { user, state } = useStore();
  const province = user?.province ?? "";
  const municipality = user?.municipality ?? "";
  const userId = user?.id ?? "";

  const national = useMemo(
    () => rankStudents(state.users, state.progress),
    [state.users, state.progress],
  );

  const provincial = useMemo(
    () =>
      province
        ? rankStudents(state.users, state.progress, { province })
        : [],
    [state.users, state.progress, province],
  );

  const municipal = useMemo(
    () =>
      province && municipality
        ? rankStudents(state.users, state.progress, { province, municipality })
        : [],
    [state.users, state.progress, province, municipality],
  );

  if (!user) return null;

  const myNational = findRank(national, userId);
  const myProvincial = findRank(provincial, userId);
  const myMunicipal = findRank(municipal, userId);

  const topNational = national.slice(0, 10);
  const topProvincial = provincial.slice(0, 10);
  const topMunicipal = municipal.slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Top achievers"
        subtitle={
          province && municipality
            ? `Your rankings in ${municipality}, ${province}, and nationally.`
            : "Complete your profile location to see area rankings."
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <RankSummaryCard
          title={municipality || "Municipality"}
          entry={myMunicipal}
          total={municipal.length}
        />
        <RankSummaryCard
          title={province || "Province"}
          entry={myProvincial}
          total={provincial.length}
        />
        <RankSummaryCard title="National" entry={myNational} total={national.length} />
      </div>

      {municipality ? (
        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-ember-navy">
            Top 10 · {municipality}
          </h2>
          <TopAchieversBoard
            rows={topMunicipal}
            highlightUserId={userId}
            emptyMessage="No ranked students in your municipality yet."
          />
        </section>
      ) : null}

      {province ? (
        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-ember-navy">Top 10 · {province}</h2>
          <TopAchieversBoard
            rows={topProvincial}
            highlightUserId={userId}
            emptyMessage="No ranked students in your province yet."
          />
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-semibold text-ember-navy">Top 10 · National</h2>
        <TopAchieversBoard
          rows={topNational}
          highlightUserId={userId}
          emptyMessage="No ranked students yet."
        />
      </section>
    </div>
  );
}
