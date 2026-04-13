"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

type Status = "draft" | "scheduled" | "active" | "archived";
type ContentType = "text" | "image" | "video";

const STATUS_FILTERS: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "scheduled", label: "Agendados" },
  { value: "draft", label: "Rascunhos" },
  { value: "archived", label: "Arquivados" },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContentPage() {
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [deleteId, setDeleteId] = useState<Id<"content_items"> | null>(null);

  const items = useQuery(api.content.listContent, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const deleteContent = useMutation(api.content.deleteContent);

  async function handleDelete() {
    if (!deleteId) return;
    await deleteContent({ id: deleteId });
    setDeleteId(null);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Conteúdo</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Gerencie o que passa no painel de LED
          </p>
        </div>
        <Link href="/content/new">
          <Button>+ Novo conteúdo</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value as Status | "all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              statusFilter === f.value
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items === undefined ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo encontrado"
          description="Crie um novo item para começar a organizar o painel de LED."
          actionLabel="+ Novo conteúdo"
          onAction={() => (window.location.href = "/content/new")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item._id} padding={false}>
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={item.type as ContentType} />
                    <Badge variant={item.status as Status} />
                  </div>
                  <p className="font-medium text-zinc-900 truncate">
                    {item.title}
                  </p>
                  {item.scheduledAt && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Agendado para: {formatDate(item.scheduledAt)}
                    </p>
                  )}
                  {item.status === "active" && item.publishedAt && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ativo desde: {formatDate(item.publishedAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/content/${item._id}`}>
                    <Button variant="ghost">Editar</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteId(item._id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={deleteId !== null}
        title="Excluir conteúdo"
        description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
}
