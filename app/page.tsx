"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

const STATUS_LABEL: Record<string, string> = {
  construction: "Em construção",
  active: "Ativo",
  inactive: "Inativo",
};

const STATUS_COLOR: Record<string, string> = {
  construction: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  inactive: "bg-zinc-100 text-zinc-500",
};

export default function PanelListPage() {
  const panels = useQuery(api.panels.listPanels);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">
              Painéis de LED
            </h1>
            <p className="text-zinc-500 mt-1">
              Selecione um painel para gerenciar
            </p>
          </div>
          <Link href="/panels/new">
            <Button>+ Novo painel</Button>
          </Link>
        </div>

        {panels === undefined ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : panels.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📺</div>
            <h2 className="text-xl font-medium text-zinc-900 mb-2">
              Nenhum painel cadastrado
            </h2>
            <p className="text-zinc-500 mb-6">
              Comece cadastrando o primeiro painel de LED.
            </p>
            <Link href="/panels/new">
              <Button>+ Cadastrar painel</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {panels.map((panel) => (
              <Link
                key={panel._id}
                href={`/panels/${panel._id}`}
                className="block bg-white border border-zinc-200 rounded-xl p-6 hover:border-zinc-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-lg shrink-0">
                    ▦
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      STATUS_COLOR[panel.status]
                    }`}
                  >
                    {STATUS_LABEL[panel.status]}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-zinc-900 group-hover:text-zinc-700 mb-1">
                  {panel.name}
                </h2>
                <p className="text-sm text-zinc-500">{panel.companyName}</p>
                <p className="text-xs text-zinc-400 mt-1 truncate">
                  {panel.address}
                </p>
                <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-4 text-xs text-zinc-400">
                  <span>{panel.responsible}</span>
                  <span className="ml-auto text-zinc-300">Acessar →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
