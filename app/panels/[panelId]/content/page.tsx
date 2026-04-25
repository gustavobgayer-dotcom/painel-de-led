"use client";

import { use, useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type View = "day" | "week" | "month";

type ContentItem = {
  _id: Id<"content_items">;
  title: string;
  source?: "cassol" | "fornecedor";
  fileRef?: string;
  duration?: number;
  slotNumber?: number;
  status: "draft" | "pending_approval" | "scheduled";
  startDate?: string;
  endDate?: string;
  campaignId?: Id<"panel_campaigns">;
  type: "text" | "image" | "video";
  panelId?: Id<"panels">;
  createdAt: number;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-red-50 text-red-700 border-red-200",
  pending_approval: "bg-yellow-50 text-yellow-700 border-yellow-200",
  scheduled: "bg-green-50 text-green-700 border-green-200",
};

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDate(str: string): Date {
  return new Date(str + "T00:00:00");
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function formatDay(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${DAY_NAMES[date.getDay()]} ${day}/${month}`;
}

// ─── Colunas por modo ─────────────────────────────────────────────────────────

function getColumns(view: View, anchor: Date): Date[] {
  if (view === "day") return [new Date(anchor)];

  if (view === "week") {
    const monday = getMondayOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }

  // month: Segundas das semanas ISO que se sobrepõem ao mês do anchor
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstMonday = getMondayOfWeek(firstDay);
  const mondays: Date[] = [];
  let d = firstMonday;
  while (d <= lastDay) {
    mondays.push(new Date(d));
    d = addDays(d, 7);
  }
  return mondays;
}

// ─── Resolução de itens ───────────────────────────────────────────────────────

/** Itens ativos em um dia específico, ordenados por (slotNumber, createdAt) */
function resolveDayItems(items: ContentItem[], day: Date): ContentItem[] {
  const dayStr = dateKey(day);
  const active = items.filter((item) => {
    if (!item.startDate || !item.endDate) return false;
    return item.startDate <= dayStr && item.endDate >= dayStr;
  });
  return active.sort(
    (a, b) =>
      (a.slotNumber ?? 9999) - (b.slotNumber ?? 9999) ||
      a.createdAt - b.createdAt
  );
}

/** Itens ativos em uma semana, ordenados por (slotNumber, createdAt) */
function resolveWeekItems(items: ContentItem[], monday: Date): ContentItem[] {
  const sunday = addDays(monday, 6);
  const active = items.filter((item) => {
    if (!item.startDate || !item.endDate) return false;
    return parseDate(item.startDate) <= sunday && parseDate(item.endDate) >= monday;
  });
  return active.sort(
    (a, b) =>
      (a.slotNumber ?? 9999) - (b.slotNumber ?? 9999) ||
      a.createdAt - b.createdAt
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ContentPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = use(params);
  const pid = panelId as Id<"panels">;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [anchor, setAnchor] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [view, setView] = useState<View>("week");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<Id<"content_items"> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const panel = useQuery(api.panels.getPanel, { id: pid });
  const items = useQuery(api.content.listContent, { panelId: pid });
  const deleteContent = useMutation(api.content.deleteContent);

  const totalSlots = panel?.totalSlots ?? 8;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const columns = getColumns(view, anchor);
  const todayKey = dateKey(today);
  const currentWeekKey = dateKey(getMondayOfWeek(today));

  // ─── Navegação ────────────────────────────────────────────────────────────

  function prev() {
    if (view === "day") setAnchor(addDays(anchor, -1));
    else if (view === "week") setAnchor(addDays(anchor, -7));
    else {
      const d = new Date(anchor);
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      setAnchor(d);
    }
  }

  function next() {
    if (view === "day") setAnchor(addDays(anchor, 1));
    else if (view === "week") setAnchor(addDays(anchor, 7));
    else {
      const d = new Date(anchor);
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      setAnchor(d);
    }
  }

  function goToToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setAnchor(d);
  }

  // ─── Label do período atual ───────────────────────────────────────────────

  function periodLabel(): string {
    if (view === "day") {
      return `${DAY_NAMES[anchor.getDay()]}, ${anchor.getDate()} de ${MONTH_NAMES[anchor.getMonth()]} de ${anchor.getFullYear()}`;
    }
    if (view === "week") {
      const monday = getMondayOfWeek(anchor);
      return `Semana ${getISOWeek(monday)} · ${formatWeekRange(monday)}`;
    }
    return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }

  // ─── Ações ────────────────────────────────────────────────────────────────

  if (items === undefined || panel === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const typedItems = (items ?? []) as ContentItem[];
  const unscheduled = typedItems.filter((i) => !i.startDate);

  // min-w por modo
  const colMinW =
    view === "day" ? "" : view === "week" ? "min-w-[110px]" : "min-w-[150px]";

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Conteúdo</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {totalSlots} slots · ordem de exibição resolvida por {view === "month" ? "semana" : "dia"}
          </p>
        </div>
        <Link href={`/panels/${panelId}/content/new`}>
          <Button>+ Novo conteúdo</Button>
        </Link>
      </div>

      {/* Navegação + Toggle */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button onClick={prev} className="text-zinc-400 hover:text-zinc-700 cursor-pointer px-2 py-1 rounded hover:bg-zinc-100">
          ← Anterior
        </button>
        <button onClick={goToToday} className="text-xs text-zinc-500 hover:text-zinc-800 border border-zinc-200 px-3 py-1 rounded-lg hover:border-zinc-400 transition-colors cursor-pointer">
          Hoje
        </button>
        <button onClick={next} className="text-zinc-400 hover:text-zinc-700 cursor-pointer px-2 py-1 rounded hover:bg-zinc-100">
          Próximo →
        </button>

        <span className="text-sm text-zinc-500 mx-1">{periodLabel()}</span>

        {/* Segmented control */}
        <div className="ml-auto flex items-center border border-zinc-200 rounded-lg overflow-hidden text-xs">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${
                view === v
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-5 mb-6 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
          <span><strong>Rascunho</strong> — em construção ou não vai ao ar</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
          <span><strong>Em aprovação</strong> — aguardando aprovação</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
          <span><strong>Agendado</strong> — ativo ou aguardando a data de exibição</span>
        </span>
      </div>

      {/* Grade */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-zinc-400 pb-4 pr-4 w-16">
                Pos.
              </th>
              {columns.map((col) => {
                const key = dateKey(col);
                const isHighlighted =
                  view === "month"
                    ? key === currentWeekKey
                    : key === todayKey;

                return (
                  <th key={key} className={`text-left pb-4 px-2 align-top ${colMinW}`}>
                    <div className={`inline-flex flex-col gap-0.5 rounded-lg px-2 py-1 ${isHighlighted ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>
                      {view === "month" ? (
                        <>
                          <span className="text-xs font-semibold">Semana {getISOWeek(col)}</span>
                          <span className={`text-[11px] font-normal ${isHighlighted ? "text-zinc-300" : "text-zinc-400"}`}>
                            {formatWeekRange(col)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold">{formatDay(col)}</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalSlots }, (_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-zinc-100">
                <td className="py-2 pr-4 text-xs text-zinc-400 font-medium align-top pt-3">
                  {rowIndex + 1}º
                </td>
                {columns.map((col) => {
                  const key = dateKey(col);
                  const isHighlighted =
                    view === "month"
                      ? key === currentWeekKey
                      : key === todayKey;

                  const resolved =
                    view === "month"
                      ? resolveWeekItems(typedItems, col)
                      : resolveDayItems(typedItems, col);

                  const item = resolved[rowIndex];

                  return (
                    <td key={key} className={`py-2 px-2 align-top${isHighlighted ? " bg-zinc-50" : ""}`}>
                      {item ? (
                        <div className="relative">
                          <div className={`border rounded-lg px-2 py-1.5 text-xs ${STATUS_COLOR[item.status] ?? "bg-zinc-50 text-zinc-700 border-zinc-200"}`}>
                            <div className="flex items-start justify-between gap-1">
                              <p className="font-medium truncate flex-1">{item.title}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const menuKey = `${item._id}:${key}`;
                                  setActiveMenu(activeMenu === menuKey ? null : menuKey);
                                }}
                                className="opacity-50 hover:opacity-100 shrink-0 px-0.5 leading-none text-base"
                              >
                                ⋯
                              </button>
                            </div>
                            <p className="opacity-60 mt-0.5">
                              {item.source === "fornecedor" ? "Fornecedor" : "Cassol"}
                              {item.duration ? ` · ${item.duration}s` : ""}
                            </p>
                            {item.startDate && item.endDate && (
                              <p className="opacity-40 mt-0.5 text-[10px]">
                                {item.startDate.split("-").reverse().join("/")} → {item.endDate.split("-").reverse().join("/")}
                              </p>
                            )}
                            {item.slotNumber !== undefined && item.slotNumber !== rowIndex + 1 && (
                              <p className="mt-1 text-[10px] opacity-70 italic">
                                Pref. {item.slotNumber}º → exibindo em {rowIndex + 1}º
                              </p>
                            )}
                          </div>

                          {activeMenu === `${item._id}:${key}` && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-full mt-1 z-20 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 min-w-[140px]"
                            >
                              <Link
                                href={`/panels/${panelId}/content/${item._id}`}
                                className="block px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                                onClick={() => setActiveMenu(null)}
                              >
                                Editar
                              </Link>
                              <div className="border-t border-zinc-100 mt-1 pt-1">
                                <button
                                  onClick={() => { setDeleteId(item._id); setActiveMenu(null); }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={`/panels/${panelId}/content/new?slot=${rowIndex + 1}&startDate=${key}`}
                          className="text-zinc-300 hover:text-zinc-500 text-lg leading-none transition-colors block py-0.5"
                        >
                          +
                        </Link>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sem período definido */}
      {unscheduled.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-500 mb-3">
            Sem período definido ({unscheduled.length})
          </h2>
          <div className="flex flex-col gap-2">
            {unscheduled.map((item) => (
              <div key={item._id} className="flex items-center gap-4 bg-white border border-zinc-200 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{item.title}</p>
                  <p className="text-xs text-zinc-400">
                    {item.source === "fornecedor" ? "Fornecedor" : "Cassol"}
                    {item.duration ? ` · ${item.duration}s` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/panels/${panelId}/content/${item._id}`}>
                    <Button variant="ghost">Editar</Button>
                  </Link>
                  <Button variant="ghost" onClick={() => setDeleteId(item._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
        description="Tem certeza? O conteúdo será removido de todo o período cadastrado."
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
