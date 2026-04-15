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

type Status = "draft" | "pending_approval" | "scheduled";

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

function ordinal(n: number): string {
  return `${n}º`;
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return !(aEnd < bStart || aStart > bEnd);
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
  const panel = useQuery(api.panels.getPanel, { id: pid });
  const allItems = useQuery(api.content.listContent, { panelId: pid });
  const campaigns = useQuery(api.campaigns.listCampaigns, { panelId: pid });
  const categories = useQuery(api.contentCategories.listContentCategories);

  const createContent = useMutation(api.content.createContent);
  const updateContent = useMutation(api.content.updateContent);

  const [form, setForm] = useState({
    title: "",
    source: "cassol" as "cassol" | "fornecedor",
    contentCategory: "",
    fileRef: "",
    duration: "10",
    slotNumber: searchParams.get("slot") ?? "",
    startDate: searchParams.get("startDate") ?? "",
    endDate: "",
    status: "draft" as Status,
    campaignId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        source: item.source ?? "cassol",
        contentCategory: item.contentCategory ?? "",
        fileRef: item.fileRef ?? "",
        duration: String(item.duration ?? 10),
        slotNumber: String(item.slotNumber ?? ""),
        startDate: item.startDate ?? "",
        endDate: item.endDate ?? "",
        status: item.status,
        campaignId: item.campaignId ?? "",
      });
    }
  }, [item]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const totalSlots = panel?.totalSlots ?? 8;
  const periodReady = form.startDate !== "" && form.endDate !== "";
  const dateRangeInvalid = periodReady && form.endDate < form.startDate;

  // Slots com sobreposição de período (apenas aviso, não bloqueia)
  const overlappingSlots = new Set<number>();
  if (periodReady && !dateRangeInvalid && allItems) {
    for (const existing of allItems) {
      if (!existing.startDate || !existing.endDate) continue;
      if (!isNew && existing._id === (contentId as Id<"content_items">)) continue;
      if (
        existing.slotNumber !== undefined &&
        rangesOverlap(form.startDate, form.endDate, existing.startDate, existing.endDate)
      ) {
        overlappingSlots.add(existing.slotNumber);
      }
    }
  }

  const selectedSlot = form.slotNumber ? Number(form.slotNumber) : null;
  const slotHasOverlap = selectedSlot !== null && overlappingSlots.has(selectedSlot);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (dateRangeInvalid || !form.contentCategory) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        type: "video" as const,
        source: form.source,
        contentCategory: form.contentCategory as Id<"content_categories">,
        fileRef: form.fileRef || undefined,
        duration: Number(form.duration) || 10,
        slotNumber: form.slotNumber ? Number(form.slotNumber) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conteúdo.");
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

  const canSave = !loading && !dateRangeInvalid && !!form.contentCategory;

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
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
                className={inputCls}
              />
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
            <Field label="Tipo de conteúdo *">
              {categories === undefined ? (
                <div className="h-9 flex items-center">
                  <Spinner size="sm" />
                </div>
              ) : categories.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  Nenhum tipo cadastrado.{" "}
                  <Link
                    href="/settings/content-categories"
                    className="underline font-medium hover:text-amber-900"
                  >
                    Cadastrar tipos em Configurações →
                  </Link>
                </div>
              ) : (
                <select
                  value={form.contentCategory}
                  onChange={(e) => set("contentCategory", e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">Selecionar tipo…</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Referência do arquivo de vídeo">
              <input
                value={form.fileRef}
                onChange={(e) => set("fileRef", e.target.value)}
                placeholder="Ex: video_bosch_outubro.mp4"
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Agendamento</h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data de início">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => {
                    set("startDate", e.target.value);
                    set("slotNumber", "");
                  }}
                  className={inputCls}
                />
              </Field>
              <Field label="Data de fim">
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || undefined}
                  onChange={(e) => {
                    set("endDate", e.target.value);
                    set("slotNumber", "");
                  }}
                  className={inputCls}
                />
              </Field>
            </div>
            {dateRangeInvalid && (
              <p className="text-xs text-red-600">
                A data de fim deve ser igual ou posterior à data de início.
              </p>
            )}

            <Field label="Ordem de exibição">
              <select
                value={form.slotNumber}
                onChange={(e) => set("slotNumber", e.target.value)}
                className={inputCls}
              >
                <option value="">Selecionar posição…</option>
                {Array.from({ length: totalSlots }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {ordinal(n)}
                  </option>
                ))}
              </select>
              {slotHasOverlap && (
                <p className="text-xs text-zinc-500 mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                  Esta posição já tem outro conteúdo neste período. Ambos serão exibidos — o mais antigo aparece primeiro. Gerencie a ordem de exibição para evitar sobreposições inesperadas.
                </p>
              )}
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
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={inputCls}
              >
                <option value="draft">Rascunho</option>
                <option value="pending_approval">Em aprovação</option>
                <option value="scheduled">Agendado</option>
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
                <select
                  value={form.campaignId}
                  onChange={(e) => set("campaignId", e.target.value)}
                  className={inputCls}
                >
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

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={!canSave}>
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
