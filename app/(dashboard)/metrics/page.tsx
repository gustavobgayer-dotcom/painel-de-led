"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

type Period = "week" | "month";

function dateKeyFromDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPeriodRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = dateKeyFromDate(now);
  const from = new Date(now);
  if (period === "week") {
    from.setDate(from.getDate() - 6);
  } else {
    from.setDate(from.getDate() - 29);
  }
  return { from: dateKeyFromDate(from), to };
}

function getDayKeys(from: string, to: string) {
  const keys: string[] = [];
  const current = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");
  while (current <= end) {
    keys.push(dateKeyFromDate(current));
    current.setDate(current.getDate() + 1);
  }
  return keys;
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-3xl font-bold ${highlight ? "text-green-600" : "text-zinc-900"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </Card>
  );
}

export default function MetricsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const { from, to } = getPeriodRange(period);

  const allContent = useQuery(api.content.listContent, {});
  const templates = useQuery(api.checklist.listTemplates);
  const completions = useQuery(api.checklist.listCompletionHistory, {
    from,
    to,
  });

  if (
    allContent === undefined ||
    templates === undefined ||
    completions === undefined
  ) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const dayKeys = getDayKeys(from, to);
  const periodLabel = period === "week" ? "últimos 7 dias" : "últimos 30 dias";

  const publishedInPeriod = allContent.filter(
    (c) =>
      c.publishedAt &&
      dateKeyFromDate(new Date(c.publishedAt)) >= from &&
      dateKeyFromDate(new Date(c.publishedAt)) <= to
  );

  const activeNow = allContent.filter((c) => c.status === "active").length;

  const daysWithPerfect = dayKeys.filter((dk) => {
    if (templates.length === 0) return false;
    const dayDone = completions.filter((c) => c.dateKey === dk).length;
    return dayDone >= templates.length;
  }).length;

  const totalPossibleCompletions = templates.length * dayKeys.length;
  const totalDone = completions.length;
  const completionRate =
    totalPossibleCompletions > 0
      ? Math.round((totalDone / totalPossibleCompletions) * 100)
      : 0;

  const countByType = {
    text: allContent.filter((c) => c.type === "text").length,
    image: allContent.filter((c) => c.type === "image").length,
    video: allContent.filter((c) => c.type === "video").length,
  };
  const maxType = Math.max(...Object.values(countByType), 1);

  const typeLabels: Record<string, string> = {
    text: "Texto",
    image: "Imagem",
    video: "Vídeo",
  };
  const typeColors: Record<string, string> = {
    text: "bg-purple-500",
    image: "bg-orange-400",
    video: "bg-pink-500",
  };

  const publishedByDay = dayKeys.map((dk) => ({
    dateKey: dk,
    count: allContent.filter(
      (c) =>
        c.publishedAt &&
        dateKeyFromDate(new Date(c.publishedAt)) === dk
    ).length,
  }));
  const maxPublished = Math.max(...publishedByDay.map((d) => d.count), 1);

  const checklistByDay = dayKeys.map((dk) => {
    const done = completions.filter((c) => c.dateKey === dk).length;
    return {
      dateKey: dk,
      rate:
        templates.length > 0 ? Math.round((done / templates.length) * 100) : 0,
    };
  });

  function shortDate(dk: string) {
    const [, month, day] = dk.split("-");
    return `${day}/${month}`;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Métricas</h1>
          <p className="text-zinc-500 text-sm mt-1 capitalize">{periodLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("week")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              period === "week"
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              period === "month"
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            30 dias
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <StatCard
          label="Publicados"
          value={publishedInPeriod.length}
          sub={periodLabel}
        />
        <StatCard
          label="Ativos agora"
          value={activeNow}
          sub="no painel"
          highlight={activeNow > 0}
        />
        <StatCard
          label="Checklist"
          value={`${completionRate}%`}
          sub="taxa de conclusão"
          highlight={completionRate === 100}
        />
        <StatCard
          label="Dias 100%"
          value={daysWithPerfect}
          sub="checklist completo"
          highlight={daysWithPerfect > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold text-zinc-700 mb-4">
            Conteúdo por tipo
          </p>
          <div className="flex flex-col gap-3">
            {Object.entries(countByType).map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-600">{typeLabels[type]}</span>
                  <span className="font-medium text-zinc-800">{count}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div
                    className={`${typeColors[type]} h-2 rounded-full transition-all`}
                    style={{
                      width: `${Math.round((count / maxType) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-zinc-700 mb-4">
            Publicações por dia
          </p>
          <div className="flex items-end gap-1 h-24">
            {publishedByDay.map(({ dateKey, count }) => (
              <div
                key={dateKey}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full flex items-end justify-center h-20">
                  <div
                    className="w-full bg-zinc-800 rounded-t transition-all"
                    style={{
                      height: `${Math.max(
                        Math.round((count / maxPublished) * 100),
                        count > 0 ? 8 : 0
                      )}%`,
                    }}
                    title={`${count} publicações`}
                  />
                </div>
                <span className="text-[10px] text-zinc-400">
                  {shortDate(dateKey)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <p className="text-sm font-semibold text-zinc-700 mb-4">
            Checklist — conclusão diária
          </p>
          <div className="flex items-end gap-1 h-24">
            {checklistByDay.map(({ dateKey, rate }) => (
              <div
                key={dateKey}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full flex items-end justify-center h-20">
                  <div
                    className={`w-full rounded-t transition-all ${
                      rate === 100
                        ? "bg-green-500"
                        : rate > 0
                          ? "bg-yellow-400"
                          : "bg-zinc-200"
                    }`}
                    style={{
                      height: `${Math.max(rate, rate > 0 ? 8 : 0)}%`,
                    }}
                    title={`${rate}%`}
                  />
                </div>
                <span className="text-[10px] text-zinc-400">
                  {shortDate(dateKey)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              100%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
              Parcial
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-200 inline-block" />
              Nenhuma
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
