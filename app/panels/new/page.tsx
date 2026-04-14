"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

export default function NewPanelPage() {
  const router = useRouter();
  const createPanel = useMutation(api.panels.createPanel);

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

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.companyName || !form.responsible || !form.email) return;
    setLoading(true);
    try {
      const id = await createPanel({
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
      router.push(`/panels/${id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 mt-3">
            Novo painel de LED
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-700 mb-4">
              Identificação
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Nome do painel *">
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex: Painel Loja Centro"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Empresa *">
                <input
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder="Ex: Cassol Centerlar"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Responsável *">
                <input
                  value={form.responsible}
                  onChange={(e) => set("responsible", e.target.value)}
                  placeholder="Nome do responsável"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="E-mail do responsável *">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="responsavel@empresa.com"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Endereço">
                <input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Rua, número, cidade"
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-700 mb-4">
              Localização e impacto
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Estado">
                  <select
                    value={form.locationState}
                    onChange={(e) => set("locationState", e.target.value)}
                    className={inputCls}
                  >
                    {BR_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Cidade (opcional)">
                  <input
                    value={form.locationCity}
                    onChange={(e) => set("locationCity", e.target.value)}
                    placeholder="Ex: Florianópolis"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Tráfego diário de carros (estimativa)">
                <input
                  type="number"
                  min="0"
                  value={form.dailyCarTraffic}
                  onChange={(e) => set("dailyCarTraffic", e.target.value)}
                  placeholder="Ex: 5000"
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-700 mb-4">
              Status e construção
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Status atual">
                <select
                  value={form.status}
                  onChange={(e) =>
                    set("status", e.target.value)
                  }
                  className={inputCls}
                >
                  <option value="active">Ativo</option>
                  <option value="construction">Em construção</option>
                  <option value="inactive">Inativo</option>
                </select>
              </Field>
              {form.status === "construction" && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Início da construção">
                    <input
                      type="date"
                      value={form.constructionStartDate}
                      onChange={(e) =>
                        set("constructionStartDate", e.target.value)
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Previsão de término">
                    <input
                      type="date"
                      value={form.constructionEndDate}
                      onChange={(e) =>
                        set("constructionEndDate", e.target.value)
                      }
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}
              <Field label="Data de liberação para operação">
                <input
                  type="date"
                  value={form.operationReleaseDate}
                  onChange={(e) =>
                    set("operationReleaseDate", e.target.value)
                  }
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Criar painel"}
            </Button>
            <Link href="/">
              <Button variant="ghost" type="button">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-600">{label}</label>
      {children}
    </div>
  );
}
