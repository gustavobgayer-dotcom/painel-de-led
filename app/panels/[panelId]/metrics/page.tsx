"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function daysBetween(start: string, end: string) {
  return Math.max(
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    1
  );
}

export default function MetricsPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = use(params);
  const pid = panelId as Id<"panels">;

  const panel = useQuery(api.panels.getPanel, { id: pid });
  const campaigns = useQuery(api.campaigns.listCampaigns, { panelId: pid });
  const investments = useQuery(api.investments.listInvestments, { panelId: pid });
  const factor = useQuery(api.locationFactors.getFactorForPanel, {
    state: panel?.locationState ?? "",
    city: panel?.locationCity,
    country: panel?.locationCountry ?? "Brasil",
  });

  if (panel === undefined || campaigns === undefined || investments === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const avgPeoplePerCar = factor?.averagePeoplePerCar ?? 1;
  const dailyImpact = (panel?.dailyCarTraffic ?? 0) * avgPeoplePerCar;

  const totalInvestment = investments.reduce((s, i) => s + i.amount, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.totalAmount, 0);

  // CPM por campanha
  const campaignsWithCPM = campaigns.map((c) => {
    const days = daysBetween(c.startDate, c.endDate);
    const impressions = dailyImpact * days;
    const cpm = impressions > 0 ? (c.totalAmount / impressions) * 1000 : 0;
    return { ...c, days, impressions, cpm };
  });

  const avgCPM =
    campaignsWithCPM.length > 0
      ? campaignsWithCPM.reduce((s, c) => s + c.cpm, 0) /
        campaignsWithCPM.length
      : 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Métricas</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Indicadores de impacto e financeiro do painel
        </p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <MetricCard
          title="Impacto diário"
          value={dailyImpact.toLocaleString("pt-BR")}
          sub="pessoas/dia"
        />
        <MetricCard
          title="Alcance mensal"
          value={(dailyImpact * 30).toLocaleString("pt-BR")}
          sub="pessoas/mês"
        />
        <MetricCard
          title="Total investido"
          value={formatCurrency(totalInvestment)}
          sub={`${investments.length} lançamentos`}
        />
        <MetricCard
          title="Total arrecadado"
          value={formatCurrency(totalRevenue)}
          sub={`${campaigns.length} campanhas`}
        />
        <MetricCard
          title="CPM médio"
          value={
            avgCPM > 0
              ? formatCurrency(avgCPM)
              : "—"
          }
          sub="por mil impressões"
        />
        <MetricCard
          title="Saldo"
          value={formatCurrency(totalRevenue - totalInvestment)}
          sub={
            totalRevenue - totalInvestment >= 0
              ? "Positivo"
              : "Investimento pendente"
          }
          highlight={
            totalRevenue - totalInvestment >= 0 ? "green" : undefined
          }
        />
      </div>

      {/* Campanhas com CPM */}
      {campaignsWithCPM.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">
            CPM por campanha
          </h2>
          <div className="flex flex-col gap-3">
            {campaignsWithCPM.map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {c.companyName}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {c.startDate} → {c.endDate} · {c.days} dias ·{" "}
                    {c.impressions.toLocaleString("pt-BR")} impressões
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900">
                    {formatCurrency(c.cpm)}
                  </p>
                  <p className="text-xs text-zinc-400">CPM</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  highlight,
}: {
  title: string;
  value: string;
  sub: string;
  highlight?: "green";
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
        {title}
      </p>
      <p
        className={`text-2xl font-semibold mb-1 ${
          highlight === "green" ? "text-green-600" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-zinc-400">{sub}</p>
    </div>
  );
}
