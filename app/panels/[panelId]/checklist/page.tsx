"use client";

import { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dateKeyFromDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const today = dateKeyFromDate(new Date());
  if (dateKey === today) return "Hoje";
  const yesterday = dateKeyFromDate(new Date(Date.now() - 86400000));
  if (dateKey === yesterday) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function getLast7DayKeys() {
  const keys = [];
  for (let i = 6; i >= 0; i--) {
    keys.push(dateKeyFromDate(new Date(Date.now() - i * 86400000)));
  }
  return keys;
}

export default function ChecklistPage({
  params,
}: {
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = use(params);
  const pid = panelId as Id<"panels">;

  const today = dateKeyFromDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [tab, setTab] = useState<"hoje" | "historico">("hoje");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newRecurrence, setNewRecurrence] = useState<"daily" | "weekly">("daily");
  const [newDayOfWeek, setNewDayOfWeek] = useState<number>(1);

  const templates = useQuery(api.checklist.listTemplates, { panelId: pid });
  const completions = useQuery(api.checklist.listCompletionsForDate, {
    panelId: pid,
    dateKey: selectedDate,
  });

  const last7Keys = getLast7DayKeys();
  const historyCompletions = useQuery(api.checklist.listCompletionHistory, {
    panelId: pid,
    from: last7Keys[0],
    to: last7Keys[6],
  });

  const toggleCompletion = useMutation(api.checklist.toggleCompletion);
  const createTemplate = useMutation(api.checklist.createTemplate);
  const deleteTemplate = useMutation(api.checklist.deleteTemplate);

  const completedIds = new Set(
    completions?.map((c) => c.templateId.toString()) ?? []
  );

  const total = templates?.length ?? 0;
  const done =
    templates?.filter((t) => completedIds.has(t._id.toString())).length ?? 0;

  async function handleToggle(templateId: Id<"checklist_templates">) {
    await toggleCompletion({ panelId: pid, templateId, dateKey: selectedDate });
  }

  async function handleAddTemplate() {
    if (!newLabel.trim()) return;
    const maxOrder =
      templates?.reduce((m, t) => Math.max(m, t.order), -1) ?? -1;
    await createTemplate({
      panelId: pid,
      label: newLabel.trim(),
      recurrence: newRecurrence,
      dayOfWeek: newRecurrence === "weekly" ? newDayOfWeek : undefined,
      order: maxOrder + 1,
    });
    setNewLabel("");
    setShowAddForm(false);
  }

  function getCompletionRateForDay(dateKey: string) {
    if (!historyCompletions || !templates) return null;
    const dayCompletions = historyCompletions.filter(
      (c) => c.dateKey === dateKey
    );
    if (templates.length === 0) return null;
    return Math.round((dayCompletions.length / templates.length) * 100);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Checklist</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Tarefas recorrentes do painel
          </p>
        </div>
        <div className="flex gap-2">
          {(["hoje", "historico"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                tab === t
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {t === "hoje" ? "Hoje" : "Histórico"}
            </button>
          ))}
        </div>
      </div>

      {tab === "hoje" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const d = new Date(selectedDate + "T12:00:00");
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(dateKeyFromDate(d));
                }}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer px-1"
              >
                ←
              </button>
              <span className="text-sm font-medium text-zinc-700 capitalize">
                {formatDateLabel(selectedDate)}
              </span>
              <button
                onClick={() => {
                  const d = new Date(selectedDate + "T12:00:00");
                  d.setDate(d.getDate() + 1);
                  const next = dateKeyFromDate(d);
                  if (next <= today) setSelectedDate(next);
                }}
                className={`text-zinc-400 px-1 ${
                  selectedDate < today
                    ? "hover:text-zinc-700 cursor-pointer"
                    : "opacity-30 cursor-default"
                }`}
              >
                →
              </button>
            </div>
            {total > 0 && (
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  done === total
                    ? "bg-green-100 text-green-700"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {done} / {total} concluídos
              </span>
            )}
          </div>

          {templates === undefined || completions === undefined ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              title="Nenhuma tarefa configurada"
              description="Adicione tarefas recorrentes para acompanhar o painel."
              actionLabel="+ Adicionar tarefa"
              onAction={() => setShowAddForm(true)}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {templates.map((template) => {
                const isCompleted = completedIds.has(template._id.toString());
                return (
                  <Card key={template._id} padding={false}>
                    <label className="flex items-center gap-4 px-5 py-4 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggle(template._id)}
                        className="w-4 h-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium transition-colors ${
                            isCompleted
                              ? "line-through text-zinc-400"
                              : "text-zinc-800"
                          }`}
                        >
                          {template.label}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {template.recurrence === "daily"
                            ? "Diário"
                            : `Semanal — ${DAY_NAMES[template.dayOfWeek ?? 1]}`}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          deleteTemplate({ id: template._id });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-xs text-zinc-300 hover:text-red-500 transition-all cursor-pointer"
                      >
                        remover
                      </button>
                    </label>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-6">
            {showAddForm ? (
              <Card>
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ex: Atualizar conteúdo do painel"
                    autoFocus
                    className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <div className="flex gap-3">
                    <select
                      value={newRecurrence}
                      onChange={(e) =>
                        setNewRecurrence(e.target.value as "daily" | "weekly")
                      }
                      className="border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                    >
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                    </select>
                    {newRecurrence === "weekly" && (
                      <select
                        value={newDayOfWeek}
                        onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                        className="border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                      >
                        {DAY_NAMES.map((d, i) => (
                          <option key={i} value={i}>{d}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTemplate} disabled={!newLabel.trim()}>
                      Adicionar
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowAddForm(false); setNewLabel(""); }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                + Adicionar tarefa
              </button>
            )}
          </div>
        </>
      )}

      {tab === "historico" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500 mb-2">Últimos 7 dias</p>
          {last7Keys.map((dateKey) => {
            const rate = getCompletionRateForDay(dateKey);
            const dayCompletions =
              historyCompletions?.filter((c) => c.dateKey === dateKey) ?? [];
            return (
              <Card key={dateKey} padding={false}>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700 capitalize">
                      {formatDateLabel(dateKey)}
                    </span>
                    {rate !== null && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          rate === 100
                            ? "bg-green-100 text-green-700"
                            : rate > 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {rate}%
                      </span>
                    )}
                  </div>
                  {templates && templates.length > 0 && (
                    <div className="w-full bg-zinc-100 rounded-full h-1.5">
                      <div
                        className="bg-zinc-800 h-1.5 rounded-full transition-all"
                        style={{ width: `${rate ?? 0}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 mt-2">
                    {dayCompletions.length > 0
                      ? `${dayCompletions.length} de ${templates?.length ?? 0} tarefas`
                      : "Nenhuma tarefa concluída"}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
