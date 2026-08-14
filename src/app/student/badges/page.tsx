"use client";

import { Award, Calendar, Flame, Trophy, Zap } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";

const ICONS = {
  flame: Flame,
  calendar: Calendar,
  trophy: Trophy,
  award: Award,
  zap: Zap,
};

export default function StudentBadgesPage() {
  const { state, user } = useStore();
  const progress = state.progress.find((p) => p.studentId === user?.id);

  return (
    <div>
      <PageHeader title="Badges" subtitle="Milestones earned as you move through Ember Maths12." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.badges.map((badge) => {
          const earned = progress?.badgeIds.includes(badge.id);
          const Icon = ICONS[badge.icon as keyof typeof ICONS] ?? Award;
          return (
            <div
              key={badge.id}
              className={`rounded-xl border p-5 ${
                earned
                  ? "border-ember-gold bg-white"
                  : "border-border bg-surface opacity-60"
              }`}
            >
              <Icon className={earned ? "text-ember-gold" : "text-muted"} />
              <h2 className="mt-3 font-display text-xl">{badge.name}</h2>
              <p className="mt-1 text-sm text-muted">{badge.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider">
                {earned ? "Earned" : "Locked"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
