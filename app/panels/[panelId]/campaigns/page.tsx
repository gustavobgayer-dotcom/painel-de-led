"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

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

export default function CampaignsPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = use(params);
  const pid = panelId as Id<"panels">;

  const campaigns = useQuery(api.campaigns.listCampaigns, { panelId: pid });
  const suppliers = useQuery(api.suppliers.listSuppliers);
  const createCampaign = useMutation(api.campaigns.createCampaign);
  const deleteCampaign = useMutation(api.campaigns.deleteCampaign);

  const [showForm, setShowForm] = useState(false);
  const [deleteCampId, setDeleteCampId] = useState<Id<"panel_campaigns"> | null>(null);

  const [form, setForm] = useState({
    name: "",
    supplierId: "" as Id<"suppliers"> | "",
    startDate: "",
    endDate: "",
    totalAmount: "",
    description: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const supplier = suppliers?.find((s) => s._id === form.supplierId);
    if (!supplier) return;

    await createCampaign({
      panelId: pid,
      name: form.name,
      supplierId: supplier._id,
      companyName: supplier.name,
      startDate: form.startDate,
      endDate: form.endDate,
      totalAmount: Number(form.totalAmount),
      description: form.description || undefined,
    });
    setForm({ name: "", supplierId: "", startDate: "", endDate: "", totalAmount: "", description: "" });
    setShowForm(false);
  }

  const totalRevenue = campaigns?.reduce((s, c) => s + c.totalAmount, 0) ?? 0;

  if (campaigns === undefined || suppliers === undefined) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Campanhas</h1>
        <p className="text-zinc-500 text-sm mt-1">Campanhas veiculadas no painel</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Total arrecadado</p>
          <p className="text-xl font-semibold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Campanhas registradas</p>
          <p className="text-xl font-semibold text-zinc-900">{campaigns.length}</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-700">Campanhas</h2>
          <Button onClick={() => setShowForm(true)}>+ Adicionar</Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-4 p-4 bg-zinc-50 rounded-lg flex flex-col gap-3">
            <Field label="Nome da campanha *">
              <input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Promoção de Verão"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Empresa anunciante *">
              {suppliers.length === 0 ? (
                <p className="text-xs text-amber-600 py-2">
                  Nenhum fornecedor cadastrado.{" "}
                  <a href="/settings/suppliers" className="underline hover:text-amber-800">
                    Cadastrar fornecedor
                  </a>
                </p>
              ) : (
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm(f => ({ ...f, supplierId: e.target.value as Id<"suppliers"> }))}
                  required
                  className={inputCls}
                >
                  <option value="">Selecione um fornecedor…</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início *">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Fim *">
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                  required
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Valor total (R$) *">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.totalAmount}
                onChange={(e) => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Descrição (opcional)">
              <input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Salvar</Button>
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
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
                  {c.name && (
                    <p className="text-sm font-medium text-zinc-800">{c.name}</p>
                  )}
                  <p className={c.name ? "text-xs text-zinc-500" : "text-sm font-medium text-zinc-800"}>
                    {c.companyName}
                  </p>
                  <p className="text-xs text-zinc-400">{c.startDate} → {c.endDate}</p>
                  {c.description && <p className="text-xs text-zinc-400">{c.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-green-700">{formatCurrency(c.totalAmount)}</span>
                  <button
                    onClick={() => setDeleteCampId(c._id)}
                    className="text-xs text-zinc-300 hover:text-red-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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
