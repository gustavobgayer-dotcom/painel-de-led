"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const CATEGORY_LABEL: Record<string, string> = {
  materials: "Materiais",
  government: "Governo / Licenças",
  software: "Software",
  other: "Outros",
};

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const inputCls =
  "w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-600">{label}</label>
      {children}
    </div>
  );
}

export default function FinancePage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = use(params);
  const pid = panelId as Id<"panels">;

  const investments = useQuery(api.investments.listInvestments, { panelId: pid });
  const campaigns = useQuery(api.campaigns.listCampaigns, { panelId: pid });

  const createInvestment = useMutation(api.investments.createInvestment);
  const deleteInvestment = useMutation(api.investments.deleteInvestment);
  const createCampaign = useMutation(api.campaigns.createCampaign);
  const deleteCampaign = useMutation(api.campaigns.deleteCampaign);

  const [tab, setTab] = useState<"investimentos" | "campanhas">("investimentos");
  const [showInvForm, setShowInvForm] = useState(false);
  const [showCampForm, setShowCampForm] = useState(false);
  const [deleteInvId, setDeleteInvId] = useState<Id<"panel_investments"> | null>(null);
  const [deleteCampId, setDeleteCampId] = useState<Id<"panel_campaigns"> | null>(null);

  const [invForm, setInvForm] = useState({
    category: "materials" as "materials" | "government" | "software" | "other",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [campForm, setCampForm] = useState({
    companyName: "",
    startDate: "",
    endDate: "",
    totalAmount: "",
    description: "",
  });

  async function handleCreateInvestment(e: React.FormEvent) {
    e.preventDefault();
    await createInvestment({
      panelId: pid,
      category: invForm.category,
      description: invForm.description,
      amount: Number(invForm.amount),
      date: invForm.date,
    });
    setInvForm({ category: "materials", description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    setShowInvForm(false);
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    await createCampaign({
      panelId: pid,
      companyName: campForm.companyName,
      startDate: campForm.startDate,
      endDate: campForm.endDate,
      totalAmount: Number(campForm.totalAmount),
      description: campForm.description || undefined,
    });
    setCampForm({ companyName: "", startDate: "", endDate: "", totalAmount: "", description: "" });
    setShowCampForm(false);
  }

  const totalInvestment = investments?.reduce((s, i) => s + i.amount, 0) ?? 0;
  const totalRevenue = campaigns?.reduce((s, c) => s + c.totalAmount, 0) ?? 0;

  if (investments === undefined || campaigns === undefined) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Financeiro</h1>
        <p className="text-zinc-500 text-sm mt-1">Investimentos e receita do painel</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Total investido</p>
          <p className="text-xl font-semibold text-zinc-900">{formatCurrency(totalInvestment)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Total arrecadado</p>
          <p className="text-xl font-semibold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Saldo</p>
          <p className={`text-xl font-semibold ${totalRevenue - totalInvestment >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalRevenue - totalInvestment)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["investimentos", "campanhas"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              tab === t ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {t === "investimentos" ? "Investimentos" : "Campanhas pagas"}
          </button>
        ))}
      </div>

      {tab === "investimentos" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-700">Investimentos</h2>
            <Button onClick={() => setShowInvForm(true)}>+ Adicionar</Button>
          </div>

          {showInvForm && (
            <form onSubmit={handleCreateInvestment} className="mb-4 p-4 bg-zinc-50 rounded-lg flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria">
                  <select value={invForm.category} onChange={(e) => setInvForm(f => ({ ...f, category: e.target.value as typeof invForm.category }))} className={inputCls}>
                    <option value="materials">Materiais</option>
                    <option value="government">Governo / Licenças</option>
                    <option value="software">Software</option>
                    <option value="other">Outros</option>
                  </select>
                </Field>
                <Field label="Data">
                  <input type="date" value={invForm.date} onChange={(e) => setInvForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </Field>
              </div>
              <Field label="Descrição">
                <input value={invForm.description} onChange={(e) => setInvForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Estrutura metálica" required className={inputCls} />
              </Field>
              <Field label="Valor (R$)">
                <input type="number" min="0" step="0.01" value={invForm.amount} onChange={(e) => setInvForm(f => ({ ...f, amount: e.target.value }))} required className={inputCls} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit">Salvar</Button>
                <Button variant="ghost" type="button" onClick={() => setShowInvForm(false)}>Cancelar</Button>
              </div>
            </form>
          )}

          {investments.length === 0 ? (
            <p className="text-sm text-zinc-400 py-4 text-center">Nenhum investimento registrado.</p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-100">
              {investments.map((inv) => (
                <div key={inv._id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full mr-2">
                      {CATEGORY_LABEL[inv.category]}
                    </span>
                    <span className="text-sm text-zinc-800">{inv.description}</span>
                    <span className="text-xs text-zinc-400 ml-2">{inv.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900">{formatCurrency(inv.amount)}</span>
                    <button onClick={() => setDeleteInvId(inv._id)} className="text-xs text-zinc-300 hover:text-red-500 cursor-pointer">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "campanhas" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-700">Campanhas pagas</h2>
            <Button onClick={() => setShowCampForm(true)}>+ Adicionar</Button>
          </div>

          {showCampForm && (
            <form onSubmit={handleCreateCampaign} className="mb-4 p-4 bg-zinc-50 rounded-lg flex flex-col gap-3">
              <Field label="Empresa anunciante">
                <input value={campForm.companyName} onChange={(e) => setCampForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Ex: TCL" required className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Início">
                  <input type="date" value={campForm.startDate} onChange={(e) => setCampForm(f => ({ ...f, startDate: e.target.value }))} required className={inputCls} />
                </Field>
                <Field label="Fim">
                  <input type="date" value={campForm.endDate} onChange={(e) => setCampForm(f => ({ ...f, endDate: e.target.value }))} required className={inputCls} />
                </Field>
              </div>
              <Field label="Valor total (R$)">
                <input type="number" min="0" step="0.01" value={campForm.totalAmount} onChange={(e) => setCampForm(f => ({ ...f, totalAmount: e.target.value }))} required className={inputCls} />
              </Field>
              <Field label="Descrição (opcional)">
                <input value={campForm.description} onChange={(e) => setCampForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit">Salvar</Button>
                <Button variant="ghost" type="button" onClick={() => setShowCampForm(false)}>Cancelar</Button>
              </div>
            </form>
          )}

          {campaigns.length === 0 ? (
            <p className="text-sm text-zinc-400 py-4 text-center">Nenhuma campanha registrada.</p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-100">
              {campaigns.map((c) => (
                <div key={c._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{c.companyName}</p>
                    <p className="text-xs text-zinc-400">{c.startDate} → {c.endDate}</p>
                    {c.description && <p className="text-xs text-zinc-400">{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-green-700">{formatCurrency(c.totalAmount)}</span>
                    <button onClick={() => setDeleteCampId(c._id)} className="text-xs text-zinc-300 hover:text-red-500 cursor-pointer">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal
        open={deleteInvId !== null}
        title="Excluir investimento"
        description="Tem certeza que deseja excluir este lançamento?"
        confirmLabel="Excluir"
        onConfirm={async () => { await deleteInvestment({ id: deleteInvId! }); setDeleteInvId(null); }}
        onCancel={() => setDeleteInvId(null)}
        danger
      />
      <Modal
        open={deleteCampId !== null}
        title="Excluir campanha"
        description="Tem certeza que deseja excluir esta campanha?"
        confirmLabel="Excluir"
        onConfirm={async () => { await deleteCampaign({ id: deleteCampId! }); setDeleteCampId(null); }}
        onCancel={() => setDeleteCampId(null)}
        danger
      />
    </div>
  );
}
