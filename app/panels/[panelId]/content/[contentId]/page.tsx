"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";

type ContentType = "text" | "image" | "video";
type Status = "draft" | "scheduled" | "active" | "archived";

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

export default function ContentFormPage({
  params,
}: {
  params: Promise<{ panelId: string; contentId: string }>;
}) {
  const { panelId, contentId } = use(params);
  const isNew = contentId === "new";
  const pid = panelId as Id<"panels">;
  const router = useRouter();
  const searchParams = useSearchParams();

  const item = useQuery(
    api.content.getContent,
    isNew ? "skip" : { id: contentId as Id<"content_items"> }
  );
  const campaigns = useQuery(api.campaigns.listCampaigns, { panelId: pid });

  const createContent = useMutation(api.content.createContent);
  const updateContent = useMutation(api.content.updateContent);

  const [form, setForm] = useState({
    title: "",
    type: "text" as ContentType,
    source: "cassol" as "cassol" | "fornecedor",
    body: "",
    fileRef: "",
    duration: "10",
    slotNumber: searchParams.get("slot") ?? "",
    scheduledWeekStart: searchParams.get("week") ?? "",
    status: "draft" as Status,
    campaignId: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        type: item.type,
        source: item.source,
        body: item.body ?? "",
        fileRef: item.fileRef ?? "",
        duration: String(item.duration ?? 10),
        slotNumber: String(item.slotNumber ?? ""),
        scheduledWeekStart: item.scheduledWeekStart ?? "",
        status: item.status,
        campaignId: item.campaignId ?? "",
      });
    }
  }, [item]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        source: form.source,
        body: form.body || undefined,
        fileRef: form.fileRef || undefined,
        duration: Number(form.duration) || 10,
        slotNumber: form.slotNumber ? Number(form.slotNumber) : undefined,
        scheduledWeekStart: form.scheduledWeekStart || undefined,
        status: form.status,
        campaignId: form.campaignId
          ? (form.campaignId as Id<"panel_campaigns">)
          : undefined,
      };

      if (isNew) {
        await createContent({ panelId: pid, ...payload });
      } else {
        await updateContent({ id: contentId as Id<"content_items">, ...payload });
      }
      router.push(`/panels/${panelId}/content`);
    } finally {
      setLoading(false);
    }
  }

  if (!isNew && item === undefined) {
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
          href={`/panels/${panelId}/content`}
          className="text-sm text-zinc-400 hover:text-zinc-700"
        >
          ← Voltar ao calendário
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 mt-3">
          {isNew ? "Novo conteúdo" : "Editar conteúdo"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Informações</h2>
          <div className="flex flex-col gap-4">
            <Field label="Título *">
              <input value={form.title} onChange={(e) => set("title", e.target.value)} required className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo">
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                  <option value="text">Texto</option>
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                </select>
              </Field>
              <Field label="Origem">
                <select
                  value={form.source}
                  onChange={(e) => {
                    set("source", e.target.value);
                    if (e.target.value === "cassol") set("campaignId", "");
                  }}
                  className={inputCls}
                >
                  <option value="cassol">Cassol</option>
                  <option value="fornecedor">Fornecedor</option>
                </select>
              </Field>
            </div>
            {form.type === "text" && (
              <Field label="Conteúdo do texto">
                <textarea
                  value={form.body}
                  onChange={(e) => set("body", e.target.value)}
                  rows={3}
                  className={inputCls}
                />
              </Field>
            )}
            {(form.type === "image" || form.type === "video") && (
              <Field label="Referência do arquivo">
                <input value={form.fileRef} onChange={(e) => set("fileRef", e.target.value)} placeholder="Ex: video_bosch_outubro.mp4" className={inputCls} />
              </Field>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Agendamento</h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Slot no painel (1–12)">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.slotNumber}
                  onChange={(e) => set("slotNumber", e.target.value)}
                  placeholder="Ex: 3"
                  className={inputCls}
                />
              </Field>
              <Field label="Duração (segundos)">
                <input
                  type="number"
                  min="1"
                  value={form.duration}
                  onChange={(e) => set("duration", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Semana de exibição (segunda-feira)">
              <input
                type="date"
                value={form.scheduledWeekStart}
                onChange={(e) => set("scheduledWeekStart", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendado</option>
                <option value="active">Ativo</option>
                <option value="archived">Arquivado</option>
              </select>
            </Field>
          </div>
        </Card>

        {form.source === "fornecedor" && (
          <Card>
            <h2 className="text-sm font-semibold text-zinc-700 mb-1">Campanha paga</h2>
            <p className="text-xs text-zinc-400 mb-4">
              Conteúdo de fornecedor — vincule a uma campanha para calcular receita e CPM.
            </p>
            {campaigns && campaigns.length > 0 ? (
              <Field label="Campanha">
                <select value={form.campaignId} onChange={(e) => set("campaignId", e.target.value)} className={inputCls}>
                  <option value="">Selecionar campanha…</option>
                  {campaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} · {c.startDate} → {c.endDate}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                Nenhuma campanha cadastrada para este painel.{" "}
                <Link
                  href={`/panels/${panelId}/finance`}
                  className="underline font-medium hover:text-amber-900"
                >
                  Cadastrar campanha no Financeiro →
                </Link>
              </div>
            )}
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando…" : isNew ? "Criar conteúdo" : "Salvar"}
          </Button>
          <Link href={`/panels/${panelId}/content`}>
            <Button variant="ghost" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
