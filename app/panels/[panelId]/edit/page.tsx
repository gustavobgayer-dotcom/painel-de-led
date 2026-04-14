"use client";

import { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import Modal from "@/components/ui/Modal";

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

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

export default function EditPanelPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = use(params);
  const pid = panelId as Id<"panels">;
  const router = useRouter();

  const panel = useQuery(api.panels.getPanel, { id: pid });
  const updatePanel = useMutation(api.panels.updatePanel);
  const deletePanel = useMutation(api.panels.deletePanel);

  const [form, setForm] = useState({
    name: "",
    companyName: "",
    address: "",
    responsible: "",
    email: "",
    locationCountry: "Brasil",
    locationState: "SC",
    locationCity: "",
    dailyCarTraffic: "",
    status: "active" as "construction" | "active" | "inactive",
    constructionStartDate: "",
    constructionEndDate: "",
    operationReleaseDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (panel) {
      setForm({
        name: panel.name,
        companyName: panel.companyName,
        address: panel.address,
        responsible: panel.responsible,
        email: panel.email,
        locationCountry: panel.locationCountry,
        locationState: panel.locationState,
        locationCity: panel.locationCity ?? "",
        dailyCarTraffic: String(panel.dailyCarTraffic),
        status: panel.status,
        constructionStartDate: panel.constructionStartDate ?? "",
        constructionEndDate: panel.constructionEndDate ?? "",
        operationReleaseDate: panel.operationReleaseDate ?? "",
      });
    }
  }, [panel]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePanel({
        id: pid,
        name: form.name,
        companyName: form.companyName,
        address: form.address,
        responsible: form.responsible,
        email: form.email,
        locationCountry: form.locationCountry,
        locationState: form.locationState,
        locationCity: form.locationCity || undefined,
        dailyCarTraffic: Number(form.dailyCarTraffic) || 0,
        status: form.status,
        constructionStartDate: form.constructionStartDate || undefined,
        constructionEndDate: form.constructionEndDate || undefined,
        operationReleaseDate: form.operationReleaseDate || undefined,
      });
      router.push(`/panels/${panelId}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    await deletePanel({ id: pid });
    router.push("/");
  }

  if (panel === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/panels/${panelId}`}
          className="text-sm text-zinc-400 hover:text-zinc-700"
        >
          ← Voltar
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 mt-3">
          Configurações do painel
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Identificação</h2>
          <div className="flex flex-col gap-4">
            <Field label="Nome do painel *">
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Empresa *">
              <input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Responsável *">
              <input value={form.responsible} onChange={(e) => set("responsible", e.target.value)} required className={inputCls} />
            </Field>
            <Field label="E-mail do responsável *">
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Endereço">
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Localização e impacto</h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Estado">
                <select value={form.locationState} onChange={(e) => set("locationState", e.target.value)} className={inputCls}>
                  {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Cidade (opcional)">
                <input value={form.locationCity} onChange={(e) => set("locationCity", e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="Tráfego diário de carros">
              <input type="number" min="0" value={form.dailyCarTraffic} onChange={(e) => set("dailyCarTraffic", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Status e construção</h2>
          <div className="flex flex-col gap-4">
            <Field label="Status atual">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                <option value="active">Ativo</option>
                <option value="construction">Em construção</option>
                <option value="inactive">Inativo</option>
              </select>
            </Field>
            {form.status === "construction" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Início da construção">
                  <input type="date" value={form.constructionStartDate} onChange={(e) => set("constructionStartDate", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Previsão de término">
                  <input type="date" value={form.constructionEndDate} onChange={(e) => set("constructionEndDate", e.target.value)} className={inputCls} />
                </Field>
              </div>
            )}
            <Field label="Data de liberação para operação">
              <input type="date" value={form.operationReleaseDate} onChange={(e) => set("operationReleaseDate", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Salvar"}
            </Button>
            <Link href={`/panels/${panelId}`}>
              <Button variant="ghost" type="button">Cancelar</Button>
            </Link>
          </div>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            Excluir painel
          </Button>
        </div>
      </form>

      <Modal
        open={showDelete}
        title="Excluir painel"
        description="Tem certeza? O painel será desativado. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        danger
      />
    </div>
  );
}
