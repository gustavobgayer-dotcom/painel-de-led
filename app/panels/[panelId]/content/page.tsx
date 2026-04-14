"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Link from "next/link";

type Status = "draft" | "scheduled" | "active" | "archived";
type ContentType = "text" | "image" | "video";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekKey(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${monday.toLocaleDateString("pt-BR", opts)} – ${sunday.toLocaleDateString("pt-BR", opts)}`;
}

const WEEKS_TO_SHOW = 8;

function getWeeks(centerMonday: Date): Date[] {
  const weeks: Date[] = [];
  for (let i = 0; i < WEEKS_TO_SHOW; i++) {
    const d = new Date(centerMonday);
    d.setDate(d.getDate() + i * 7);
    weeks.push(d);
  }
  return weeks;
}

const SOURCE_LABEL = { cassol: "Cassol", fornecedor: "Fornecedor" };
const SOURCE_COLOR = {
  cassol: "bg-blue-50 text-blue-700 border-blue-200",
  fornecedor: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function ContentPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = use(params);
  const pid = panelId as Id<"panels">;

  const today = new Date();
  const [startMonday, setStartMonday] = useState(() => getMondayOfWeek(today));
  const [deleteId, setDeleteId] = useState<Id<"content_items"> | null>(null);

  const weeks = getWeeks(startMonday);
  const firstWeek = weekKey(weeks[0]);
  const lastWeek = weekKey(weeks[weeks.length - 1]);

  const items = useQuery(api.content.listContent, { panelId: pid });
  const deleteContent = useMutation(api.content.deleteContent);

  function prevWeeks() {
    const d = new Date(startMonday);
    d.setDate(d.getDate() - 7 * WEEKS_TO_SHOW);
    setStartMonday(d);
  }

  function nextWeeks() {
    const d = new Date(startMonday);
    d.setDate(d.getDate() + 7 * WEEKS_TO_SHOW);
    setStartMonday(d);
  }

  function goToToday() {
    setStartMonday(getMondayOfWeek(today));
  }

  // Itens agrupados por semana
  const byWeek: Record<string, typeof items> = {};
  if (items) {
    for (const item of items) {
      const wk = item.scheduledWeekStart ?? "sem-semana";
      if (!byWeek[wk]) byWeek[wk] = [];
      byWeek[wk].push(item);
    }
  }

  // Itens sem semana definida
  const unscheduled = byWeek["sem-semana"] ?? [];

  if (items === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Conteúdo</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Calendário semanal de exibição
          </p>
        </div>
        <Link href={`/panels/${panelId}/content/new`}>
          <Button>+ Novo conteúdo</Button>
        </Link>
      </div>

      {/* Navegação de semanas */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={prevWeeks}
          className="text-zinc-400 hover:text-zinc-700 cursor-pointer px-2 py-1 rounded hover:bg-zinc-100"
        >
          ← Anterior
        </button>
        <button
          onClick={goToToday}
          className="text-xs text-zinc-500 hover:text-zinc-800 border border-zinc-200 px-3 py-1 rounded-lg hover:border-zinc-400 transition-colors cursor-pointer"
        >
          Hoje
        </button>
        <button
          onClick={nextWeeks}
          className="text-zinc-400 hover:text-zinc-700 cursor-pointer px-2 py-1 rounded hover:bg-zinc-100"
        >
          Próximo →
        </button>
        <span className="text-xs text-zinc-400 ml-2">
          {formatWeekLabel(weeks[0])} → {formatWeekLabel(weeks[weeks.length - 1])}
        </span>
      </div>

      {/* Grid de calendário */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-zinc-400 pb-3 pr-4 w-32">
                Slot
              </th>
              {weeks.map((monday) => {
                const wk = weekKey(monday);
                const isCurrentWeek = wk === weekKey(getMondayOfWeek(today));
                return (
                  <th
                    key={wk}
                    className={`text-left text-xs font-medium pb-3 px-2 min-w-[140px] ${
                      isCurrentWeek ? "text-zinc-900" : "text-zinc-400"
                    }`}
                  >
                    <span
                      className={`${
                        isCurrentWeek
                          ? "bg-zinc-900 text-white px-2 py-0.5 rounded-md"
                          : ""
                      }`}
                    >
                      {formatWeekLabel(monday)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((slot) => {
              return (
                <tr key={slot} className="border-t border-zinc-100">
                  <td className="py-2 pr-4 text-xs text-zinc-400 font-medium">
                    Slot {slot}
                  </td>
                  {weeks.map((monday) => {
                    const wk = weekKey(monday);
                    const slotItems = (byWeek[wk] ?? []).filter(
                      (item) => item.slotNumber === slot
                    );
                    return (
                      <td key={wk} className="py-2 px-2 align-top">
                        <div className="flex flex-col gap-1">
                          {slotItems.map((item) => (
                            <Link
                              key={item._id}
                              href={`/panels/${panelId}/content/${item._id}`}
                              className={`block border rounded-lg px-2 py-1.5 text-xs hover:opacity-80 transition-opacity ${
                                SOURCE_COLOR[item.source as keyof typeof SOURCE_COLOR] ??
                                "bg-zinc-50 border-zinc-200 text-zinc-700"
                              }`}
                            >
                              <p className="font-medium truncate">{item.title}</p>
                              <p className="opacity-70">
                                {SOURCE_LABEL[item.source as keyof typeof SOURCE_LABEL]}
                                {item.duration ? ` · ${item.duration}s` : ""}
                              </p>
                            </Link>
                          ))}
                          <Link
                            href={`/panels/${panelId}/content/new?slot=${slot}&week=${wk}`}
                            className="text-zinc-300 hover:text-zinc-600 text-xs py-0.5 transition-colors block"
                          >
                            +
                          </Link>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Itens sem semana */}
      {unscheduled.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-500 mb-3">
            Sem semana definida ({unscheduled.length})
          </h2>
          <div className="flex flex-col gap-2">
            {unscheduled.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-4 bg-white border border-zinc-200 rounded-xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant={item.type as ContentType} />
                    <Badge variant={item.status as Status} />
                  </div>
                  <p className="text-sm font-medium text-zinc-800 truncate">
                    {item.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/panels/${panelId}/content/${item._id}`}>
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
            ))}
          </div>
        </div>
      )}

      <Modal
        open={deleteId !== null}
        title="Excluir conteúdo"
        description="Tem certeza que deseja excluir este item?"
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (deleteId) await deleteContent({ id: deleteId });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
}
