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

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
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

  // ── Investimentos ──────────────────────────────────────────────────────────
  const investments = useQuery(api.investments.listInvestments, { panelId: pid });
  const createInvestment = useMutation(api.investments.createInvestment);
  const deleteInvestment = useMutation(api.investments.deleteInvestment);

  // ── Manutenção ─────────────────────────────────────────────────────────────
  const configs = useQuery(api.maintenance.listMaintenanceConfigs, { panelId: pid });
  const records = useQuery(api.maintenance.listMaintenanceRecords, { panelId: pid });
  const createConfig = useMutation(api.maintenance.createMaintenanceConfig);
  const deleteConfig = useMutation(api.maintenance.deleteMaintenanceConfig);
  const createRecord = useMutation(api.maintenance.createMaintenanceRecord);
  const deleteRecord = useMutation(api.maintenance.deleteMaintenanceRecord);

  // ── Estado UI ──────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<"investimentos" | "manutencao">("investimentos");
  const [maintenanceTab, setMaintenanceTab] = useState<"historico" | "configs">("historico");

  const [showInvForm, setShowInvForm] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);

  const [deleteInvId, setDeleteInvId] = useState<Id<"panel_investments"> | null>(null);
  const [deleteConfigId, setDeleteConfigId] = useState<Id<"maintenance_configs"> | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<Id<"maintenance_records"> | null>(null);

  const [invForm, setInvForm] = useState({
    category: "materials" as "materials" | "government" | "software" | "other",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [configForm, setConfigForm] = useState({
    maintenanceType: "",
    frequency: "monthly" as "weekly" | "monthly" | "quarterly" | "yearly",
    estimatedCost: "",
  });

  const [recordForm, setRecordForm] = useState({
    maintenanceConfigId: "",
    date: new Date().toISOString().slice(0, 10),
    actualCost: "",
    description: "",
    performedBy: "",
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

  async function handleCreateConfig(e: React.FormEvent) {
    e.preventDefault();
    await createConfig({
      panelId: pid,
      maintenanceType: configForm.maintenanceType,
      frequency: configForm.frequency,
      estimatedCost: Number(configForm.estimatedCost),
    });
    setConfigForm({ maintenanceType: "", frequency: "monthly", estimatedCost: "" });
    setShowConfigForm(false);
  }

  async function handleCreateRecord(e: React.FormEvent) {
    e.preventDefault();
    await createRecord({
      panelId: pid,
      maintenanceConfigId: recordForm.maintenanceConfigId
        ? (recordForm.maintenanceConfigId as Id<"maintenance_configs">)
        : undefined,
      date: recordForm.date,
      actualCost: Number(recordForm.actualCost),
      description: recordForm.description,
      performedBy: recordForm.performedBy || undefined,
    });
    setRecordForm({ maintenanceConfigId: "", date: new Date().toISOString().slice(0, 10), actualCost: "", description: "", performedBy: "" });
    setShowRecordForm(false);
  }

  const totalInvestment = investments?.reduce((s, i) => s + i.amount, 0) ?? 0;
  const totalMaintenance = records?.reduce((s, r) => s + r.actualCost, 0) ?? 0;

  if (investments === undefined || configs === undefined || records === undefined) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Financeiro</h1>
        <p className="text-zinc-500 text-sm mt-1">Investimentos e custos do painel</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Total investido</p>
          <p className="text-xl font-semibold text-red-600">{formatCurrency(totalInvestment)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Total gasto em manutenção</p>
          <p className="text-xl font-semibold text-zinc-900">{formatCurrency(totalMaintenance)}</p>
        </div>
      </div>

      {/* Tabs principais */}
      <div className="flex gap-2 mb-6">
        {(["investimentos", "manutencao"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMainTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              mainTab === t ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {t === "investimentos" ? "Investimentos" : "Manutenção"}
          </button>
        ))}
      </div>

      {/* ── Investimentos ── */}
      {mainTab === "investimentos" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-700">Investimentos</h2>
            <Button onClick={() => setShowInvForm(true)}>+ Adicionar</Button>
          </div>

          {showInvForm && (
            <form onSubmit={handleCreateInvestment} className="mb-4 p-4 bg-zinc-50 rounded-lg flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria">
                  <select
                    value={invForm.category}
                    onChange={(e) => setInvForm(f => ({ ...f, category: e.target.value as typeof invForm.category }))}
                    className={inputCls}
                  >
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

      {/* ── Manutenção ── */}
      {mainTab === "manutencao" && (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-2 mb-4">
            {(["historico", "configs"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMaintenanceTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  maintenanceTab === t ? "bg-zinc-700 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {t === "historico" ? "Histórico" : "Tipos de manutenção"}
              </button>
            ))}
          </div>

          {maintenanceTab === "historico" && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-700">Manutenções realizadas</h2>
                <Button onClick={() => setShowRecordForm(true)}>+ Registrar</Button>
              </div>

              {showRecordForm && (
                <form onSubmit={handleCreateRecord} className="mb-4 p-4 bg-zinc-50 rounded-lg flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tipo (opcional)">
                      <select value={recordForm.maintenanceConfigId} onChange={(e) => setRecordForm(f => ({ ...f, maintenanceConfigId: e.target.value }))} className={inputCls}>
                        <option value="">Selecionar tipo</option>
                        {configs.map((c) => <option key={c._id} value={c._id}>{c.maintenanceType}</option>)}
                      </select>
                    </Field>
                    <Field label="Data">
                      <input type="date" value={recordForm.date} onChange={(e) => setRecordForm(f => ({ ...f, date: e.target.value }))} required className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Descrição">
                    <input value={recordForm.description} onChange={(e) => setRecordForm(f => ({ ...f, description: e.target.value }))} placeholder="O que foi feito" required className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Custo real (R$)">
                      <input type="number" min="0" step="0.01" value={recordForm.actualCost} onChange={(e) => setRecordForm(f => ({ ...f, actualCost: e.target.value }))} required className={inputCls} />
                    </Field>
                    <Field label="Realizado por (opcional)">
                      <input value={recordForm.performedBy} onChange={(e) => setRecordForm(f => ({ ...f, performedBy: e.target.value }))} className={inputCls} />
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Salvar</Button>
                    <Button variant="ghost" type="button" onClick={() => setShowRecordForm(false)}>Cancelar</Button>
                  </div>
                </form>
              )}

              {records.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">Nenhuma manutenção registrada.</p>
              ) : (
                <div className="flex flex-col divide-y divide-zinc-100">
                  {records.map((r) => {
                    const configName = configs.find(c => c._id === r.maintenanceConfigId)?.maintenanceType;
                    return (
                      <div key={r._id} className="flex items-center justify-between py-3">
                        <div>
                          {configName && (
                            <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full mr-2">
                              {configName}
                            </span>
                          )}
                          <span className="text-sm text-zinc-800">{r.description}</span>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {r.date}{r.performedBy ? ` · ${r.performedBy}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-zinc-900">{formatCurrency(r.actualCost)}</span>
                          <button onClick={() => setDeleteRecordId(r._id)} className="text-xs text-zinc-300 hover:text-red-500 cursor-pointer">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {maintenanceTab === "configs" && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-700">Tipos de manutenção</h2>
                <Button onClick={() => setShowConfigForm(true)}>+ Adicionar tipo</Button>
              </div>

              {showConfigForm && (
                <form onSubmit={handleCreateConfig} className="mb-4 p-4 bg-zinc-50 rounded-lg flex flex-col gap-3">
                  <Field label="Tipo de manutenção">
                    <input value={configForm.maintenanceType} onChange={(e) => setConfigForm(f => ({ ...f, maintenanceType: e.target.value }))} placeholder="Ex: Limpeza da tela" required className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Frequência">
                      <select value={configForm.frequency} onChange={(e) => setConfigForm(f => ({ ...f, frequency: e.target.value as typeof configForm.frequency }))} className={inputCls}>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensal</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="yearly">Anual</option>
                      </select>
                    </Field>
                    <Field label="Custo estimado (R$)">
                      <input type="number" min="0" step="0.01" value={configForm.estimatedCost} onChange={(e) => setConfigForm(f => ({ ...f, estimatedCost: e.target.value }))} required className={inputCls} />
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Salvar</Button>
                    <Button variant="ghost" type="button" onClick={() => setShowConfigForm(false)}>Cancelar</Button>
                  </div>
                </form>
              )}

              {configs.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">Nenhum tipo configurado.</p>
              ) : (
                <div className="flex flex-col divide-y divide-zinc-100">
                  {configs.map((c) => (
                    <div key={c._id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-800">{c.maintenanceType}</p>
                        <p className="text-xs text-zinc-400">{FREQUENCY_LABEL[c.frequency]} · estimado: {formatCurrency(c.estimatedCost)}</p>
                      </div>
                      <button onClick={() => setDeleteConfigId(c._id)} className="text-xs text-zinc-300 hover:text-red-500 cursor-pointer">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
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
        open={deleteConfigId !== null}
        title="Remover tipo de manutenção"
        description="Tem certeza?"
        confirmLabel="Remover"
        onConfirm={async () => { await deleteConfig({ id: deleteConfigId! }); setDeleteConfigId(null); }}
        onCancel={() => setDeleteConfigId(null)}
        danger
      />
      <Modal
        open={deleteRecordId !== null}
        title="Excluir registro de manutenção"
        description="Tem certeza que deseja excluir este registro?"
        confirmLabel="Excluir"
        onConfirm={async () => { await deleteRecord({ id: deleteRecordId! }); setDeleteRecordId(null); }}
        onCancel={() => setDeleteRecordId(null)}
        danger
      />
    </div>
  );
}
