"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  construction: "Em construção",
  active: "Ativo",
  inactive: "Inativo",
};

const STATUS_COLOR: Record<string, string> = {
  construction: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  inactive: "bg-zinc-100 text-zinc-500",
};

const MONTHS_PT = [
  "jan","fev","mar","abr","mai","jun",
  "jul","ago","set","out","nov","dez",
];

function formatDate(dateKey?: string) {
  if (!dateKey) return "—";
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function monthsBetween(from: number, to: number) {
  const diff = to - from;
  return Math.max(diff / (1000 * 60 * 60 * 24 * 30), 1);
}

export default function PanelOverviewPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = use(params);
  const pid = panelId as Id<"panels">;

  const panel = useQuery(api.panels.getPanel, { id: pid });
  const investments = useQuery(api.investments.listInvestments, { panelId: pid });
  const campaigns = useQuery(api.campaigns.listCampaigns, { panelId: pid });
  const factor = useQuery(api.locationFactors.getFactorForPanel, {
    state: panel?.locationState ?? "",
    city: panel?.locationCity,
    country: panel?.locationCountry ?? "Brasil",
  });

  if (panel === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (panel === null) {
    return (
      <div className="p-8 text-zinc-500">Painel não encontrado.</div>
    );
  }

  // ─── Cálculos ───────────────────────────────────────────────────────────────
  const avgPeoplePerCar = factor?.averagePeoplePerCar ?? 1;
  const dailyImpact = panel.dailyCarTraffic * avgPeoplePerCar;
  const monthlyReach = dailyImpact * 30;

  const totalInvestment =
    investments?.reduce((sum, i) => sum + i.amount, 0) ?? 0;

  const totalRevenue =
    campaigns?.reduce((sum, c) => sum + c.totalAmount, 0) ?? 0;

  const firstCampaign = campaigns?.[campaigns.length - 1];
  const activeMonths = firstCampaign
    ? monthsBetween(
        new Date(firstCampaign.startDate).getTime(),
        Date.now()
      )
    : 1;

  const monthlyRevenue = campaigns && campaigns.length > 0
    ? totalRevenue / activeMonths
    : 0;

  const paybackMonths =
    monthlyRevenue > 0
      ? Math.ceil((totalInvestment - totalRevenue) / monthlyRevenue)
      : null;

  const paybackDate =
    paybackMonths !== null && paybackMonths > 0
      ? (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + paybackMonths);
          return `${MONTHS_PT[d.getMonth()]}/${d.getFullYear()}`;
        })()
      : paybackMonths !== null && paybackMonths <= 0
      ? "Pago"
      : "—";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-zinc-900">
              {panel.name}
            </h1>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                STATUS_COLOR[panel.status]
              }`}
            >
              {STATUS_LABEL[panel.status]}
            </span>
          </div>
          <p className="text-zinc-500 text-sm">
            {panel.companyName} · {panel.address}
          </p>
          <p className="text-zinc-400 text-xs mt-1">
            Responsável: {panel.responsible} · {panel.email}
          </p>
        </div>
        <Link
          href={`/panels/${panelId}/edit`}
          className="text-sm text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-3 py-1.5 rounded-lg hover:border-zinc-400 transition-colors"
        >
          Editar
        </Link>
      </div>

      {/* Datas de construção */}
      {(panel.constructionStartDate || panel.operationReleaseDate) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800 flex gap-6">
          {panel.constructionStartDate && (
            <span>
              Início construção:{" "}
              <strong>{formatDate(panel.constructionStartDate)}</strong>
            </span>
          )}
          {panel.constructionEndDate && (
            <span>
              Término previsto:{" "}
              <strong>{formatDate(panel.constructionEndDate)}</strong>
            </span>
          )}
          {panel.operationReleaseDate && (
            <span>
              Liberação para operação:{" "}
              <strong>{formatDate(panel.operationReleaseDate)}</strong>
            </span>
          )}
        </div>
      )}

      {/* Cards principais */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <OverviewCard
          title="Alcance mensal"
          value={monthlyReach.toLocaleString("pt-BR")}
          subtitle={`${dailyImpact.toLocaleString("pt-BR")} pessoas/dia · fator ${avgPeoplePerCar}x`}
          icon="👥"
        />
        <OverviewCard
          title="Investimento total"
          value={formatCurrency(totalInvestment)}
          subtitle={`${investments?.length ?? 0} lançamentos`}
          icon="💰"
        />
        <OverviewCard
          title="Receita média mensal"
          value={formatCurrency(monthlyRevenue)}
          subtitle={`Total acumulado: ${formatCurrency(totalRevenue)}`}
          icon="📈"
        />
        <OverviewCard
          title="Projeção de payback"
          value={paybackDate}
          subtitle={
            paybackMonths !== null && paybackMonths > 0
              ? `${paybackMonths} meses restantes`
              : paybackMonths !== null && paybackMonths <= 0
              ? "Investimento recuperado"
              : "Sem receita registrada ainda"
          }
          icon="🎯"
        />
      </div>

      {/* Localização */}
      <Card>
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">
          Localização e tráfego
        </h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Estado</p>
            <p className="font-medium text-zinc-800">{panel.locationState}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Cidade</p>
            <p className="font-medium text-zinc-800">
              {panel.locationCity ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Tráfego diário</p>
            <p className="font-medium text-zinc-800">
              {panel.dailyCarTraffic.toLocaleString("pt-BR")} carros/dia
            </p>
          </div>
        </div>
        {!factor && (
          <p className="text-xs text-amber-600 mt-3">
            Fator de impacto não configurado para este estado/cidade.{" "}
            <Link
              href="/settings/location-factors"
              className="underline hover:text-amber-800"
            >
              Configurar
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}

function OverviewCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          {title}
        </span>
      </div>
      <p className="text-2xl font-semibold text-zinc-900 mb-1">{value}</p>
      <p className="text-xs text-zinc-400">{subtitle}</p>
    </div>
  );
}
