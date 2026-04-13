"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

type Status = "draft" | "scheduled" | "active" | "archived";
type ContentType = "text" | "image" | "video";

const TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "image", label: "Imagem" },
  { value: "video", label: "Vídeo" },
];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "scheduled", label: "Agendado" },
  { value: "active", label: "Ativo" },
  { value: "archived", label: "Arquivado" },
];

function toDatetimeLocal(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ContentEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";
  const router = useRouter();

  const existing = useQuery(
    api.content.getContent,
    isNew ? "skip" : { id: id as Id<"content_items"> }
  );

  const createContent = useMutation(api.content.createContent);
  const updateContent = useMutation(api.content.updateContent);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("text");
  const [body, setBody] = useState("");
  const [fileRef, setFileRef] = useState("");
  const [status, setStatus] = useState<Status>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isNew && existing && !loaded) {
      setTitle(existing.title);
      setType(existing.type);
      setBody(existing.body ?? "");
      setFileRef(existing.fileRef ?? "");
      setStatus(existing.status);
      setScheduledAt(
        existing.scheduledAt ? toDatetimeLocal(existing.scheduledAt) : ""
      );
      setLoaded(true);
    }
    if (isNew && !loaded) {
      setLoaded(true);
    }
  }, [existing, isNew, loaded]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const scheduledAtMs = scheduledAt
      ? new Date(scheduledAt).getTime()
      : undefined;
    const publishedAtMs =
      status === "active" && !isNew && existing?.publishedAt
        ? existing.publishedAt
        : status === "active"
          ? Date.now()
          : undefined;

    try {
      if (isNew) {
        await createContent({
          title: title.trim(),
          type,
          body: type === "text" ? body : undefined,
          fileRef: type !== "text" ? fileRef : undefined,
          status,
          scheduledAt: scheduledAtMs,
          publishedAt: publishedAtMs,
        });
      } else {
        await updateContent({
          id: id as Id<"content_items">,
          title: title.trim(),
          type,
          body: type === "text" ? body : undefined,
          fileRef: type !== "text" ? fileRef : undefined,
          status,
          scheduledAt: scheduledAtMs,
          publishedAt: publishedAtMs,
        });
      }
      router.push("/content");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded || (!isNew && existing === undefined)) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-zinc-700 transition-colors text-sm cursor-pointer"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {isNew ? "Novo conteúdo" : "Editar conteúdo"}
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Promoção de segunda-feira"
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Tipo</label>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  type === opt.value
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {type === "text" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Texto</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Digite o conteúdo que será exibido no painel..."
              rows={5}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-y"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Nome do arquivo
            </label>
            <input
              type="text"
              value={fileRef}
              onChange={(e) => setFileRef(e.target.value)}
              placeholder="Ex: promocao-marco.mp4"
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <p className="text-xs text-zinc-400">
              Informe o nome do arquivo salvo no computador ou no painel.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {status === "scheduled" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Data e hora de exibição
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
