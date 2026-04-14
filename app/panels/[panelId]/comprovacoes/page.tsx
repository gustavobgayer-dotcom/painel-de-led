"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function daysBetween(start: string, end: string) {
  return Math.max(
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1,
    1
  );
}

function formatDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ComprovacoesPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = use(params);
  const pid = panelId as Id<"panels">;

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  const panel = useQuery(api.panels.getPanel, { id: pid });
  const campaigns = useQuery(api.campaigns.listCampaigns, { panelId: pid });
  const factor = useQuery(api.locationFactors.getFactorForPanel, {
    state: panel?.locationState ?? "",
    city: panel?.locationCity,
    country: panel?.locationCountry ?? "Brasil",
  });

  if (panel === undefined || campaigns === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const avgPeoplePerCar = factor?.averagePeoplePerCar ?? 1;
  const dailyImpact = (panel.dailyCarTraffic ?? 0) * avgPeoplePerCar;

  const selectedCampaign = campaigns.find((c) => c._id === selectedCampaignId);

  const report = selectedCampaign
    ? (() => {
        const days = daysBetween(selectedCampaign.startDate, selectedCampaign.endDate);
        const totalImpressions = Math.round(dailyImpact * days);
        const cpm =
          totalImpressions > 0
            ? (selectedCampaign.totalAmount / totalImpressions) * 1000
            : 0;
        return { days, totalImpressions, cpm };
      })()
    : null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8 print:hidden">
        <h1 className="text-2xl font-semibold text-zinc-900">Comprovações</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Relatório de campanha para envio ao fornecedor
        </p>
      </div>

      {/* Seletor de campanha */}
      {campaigns.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500 text-center py-4">
            Nenhuma campanha cadastrada para este painel.
          </p>
        </Card>
      ) : (
        <div className="mb-8 print:hidden">
          <label className="text-xs font-medium text-zinc-600 block mb-1.5">
            Selecionar campanha
          </label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full max-w-md"
          >
            <option value="">Selecionar campanha…</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>
                {c.companyName} · {formatDate(c.startDate)} → {formatDate(c.endDate)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Relatório */}
      {selectedCampaign && report && (
        <>
          {/* Cabeçalho de impressão */}
          <div className="hidden print:block mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">
              Comprovante de Campanha
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {panel.companyName} · {panel.name}
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden print:border-0 print:shadow-none">
            {/* Header da campanha */}
            <div className="bg-zinc-900 text-white px-8 py-6 print:bg-zinc-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
                    Comprovante de Campanha
                  </p>
                  <h2 className="text-2xl font-bold">{selectedCampaign.companyName}</h2>
                  {selectedCampaign.description && (
                    <p className="text-zinc-400 text-sm mt-1">
                      {selectedCampaign.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">Painel</p>
                  <p className="text-sm font-medium">{panel.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{panel.address}</p>
                </div>
              </div>
            </div>

            {/* Dados da campanha */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <ReportField label="Período" value={`${formatDate(selectedCampaign.startDate)} → ${formatDate(selectedCampaign.endDate)}`} />
                <ReportField label="Duração" value={`${report.days} dias`} />
                <ReportField label="Valor investido" value={formatCurrency(selectedCampaign.totalAmount)} highlight />
                <ReportField label="CPM (custo por mil impressões)" value={formatCurrency(report.cpm)} />
              </div>

              <div className="border-t border-zinc-100 pt-6">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                  Alcance estimado
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-zinc-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-zinc-900">
                      {dailyImpact.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">pessoas/dia</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-zinc-900">
                      {report.totalImpressions.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      impressões no período
                    </p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-zinc-900">
                      {formatCurrency(report.cpm)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">CPM</p>
                  </div>
                </div>
              </div>

              {/* Metodologia */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                <p className="font-semibold mb-1">Metodologia de cálculo</p>
                <p>
                  Tráfego diário de{" "}
                  <strong>{panel.dailyCarTraffic.toLocaleString("pt-BR")} carros/dia</strong> ×
                  fator de {avgPeoplePerCar}x pessoas/carro ({panel.locationState}
                  {panel.locationCity ? ` — ${panel.locationCity}` : ""}) ={" "}
                  <strong>{dailyImpact.toLocaleString("pt-BR")} pessoas/dia</strong>.
                  Total no período: {dailyImpact.toLocaleString("pt-BR")} × {report.days} dias ={" "}
                  <strong>{report.totalImpressions.toLocaleString("pt-BR")} impressões</strong>.
                </p>
              </div>

              {/* Rodapé */}
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Responsável: {panel.responsible} · {panel.email}
                </span>
                <span>
                  Emitido em {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>

          {/* Botão imprimir */}
          <div className="mt-6 flex gap-3 print:hidden">
            <Button onClick={() => window.print()}>
              🖨 Imprimir / Salvar PDF
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ReportField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p
        className={`text-lg font-semibold ${
          highlight ? "text-zinc-900" : "text-zinc-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
