"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import Link from "next/link";

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

export default function LocationFactorsPage() {
  const factors = useQuery(api.locationFactors.listLocationFactors);
  const createFactor = useMutation(api.locationFactors.createLocationFactor);
  const deleteFactor = useMutation(api.locationFactors.deleteLocationFactor);

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"location_factors"> | null>(null);
  const [form, setForm] = useState({
    country: "Brasil",
    state: "SC",
    city: "",
    averagePeoplePerCar: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createFactor({
      country: form.country,
      state: form.state,
      city: form.city || undefined,
      averagePeoplePerCar: Number(form.averagePeoplePerCar),
    });
    setForm({ country: "Brasil", state: "SC", city: "", averagePeoplePerCar: "" });
    setShowForm(false);
  }

  const sorted = factors
    ? [...factors].sort((a, b) => {
        if (a.state !== b.state) return a.state.localeCompare(b.state);
        return (a.city ?? "").localeCompare(b.city ?? "");
      })
    : [];

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 mt-3">
            Fatores de impacto
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Média de pessoas por carro por localização — usado no cálculo de alcance dos painéis.
          </p>
        </div>

        {factors === undefined ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-700">
                Fatores cadastrados
              </h2>
              <Button onClick={() => setShowForm(true)}>+ Adicionar</Button>
            </div>

            {showForm && (
              <form onSubmit={handleCreate} className="mb-4 p-4 bg-zinc-50 rounded-lg flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Estado">
                    <select value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls}>
                      {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Cidade (opcional)">
                    <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Deixe vazio para todo o estado" className={inputCls} />
                  </Field>
                </div>
                <Field label="Média de pessoas por carro">
                  <input
                    type="number"
                    min="0.1"
                    step="0.01"
                    value={form.averagePeoplePerCar}
                    onChange={(e) => set("averagePeoplePerCar", e.target.value)}
                    placeholder="Ex: 1.4"
                    required
                    className={inputCls}
                  />
                </Field>
                <div className="flex gap-2">
                  <Button type="submit">Salvar</Button>
                  <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            )}

            {sorted.length === 0 && !showForm ? (
              <p className="text-sm text-zinc-400 py-4 text-center">
                Nenhum fator cadastrado. Adicione fatores para calcular o impacto dos painéis.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-100">
                {sorted.map((f) => (
                  <div key={f._id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="text-sm font-medium text-zinc-800">
                        {f.state}{f.city ? ` — ${f.city}` : " (todo o estado)"}
                      </span>
                      <span className="text-xs text-zinc-400 ml-2">{f.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-zinc-900">
                        {f.averagePeoplePerCar}x
                      </span>
                      <span className="text-xs text-zinc-400">pessoas/carro</span>
                      <button
                        onClick={() => setDeleteId(f._id)}
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
        )}
      </div>

      <Modal
        open={deleteId !== null}
        title="Excluir fator"
        description="Tem certeza que deseja excluir este fator de localização?"
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (deleteId) await deleteFactor({ id: deleteId });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
}
