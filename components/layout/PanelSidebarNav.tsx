"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const NAV_ITEMS = [
  { segment: "", label: "Visão Geral", icon: "◈" },
  { segment: "campaigns", label: "Campanha", icon: "📣" },
  { segment: "content", label: "Conteúdo", icon: "▦" },
  { segment: "checklist", label: "Checklist", icon: "✓" },
  { segment: "finance", label: "Financeiro", icon: "₿" },
  { segment: "maintenance", label: "Manutenção", icon: "⚙" },
  { segment: "metrics", label: "Métricas", icon: "📊" },
  { segment: "comprovacoes", label: "Comprovações", icon: "📋" },
  { segment: "tutorial", label: "Tutorial", icon: "?" },
];

export default function PanelSidebarNav({
  panelId,
}: {
  panelId: string;
}) {
  const pathname = usePathname();
  const panel = useQuery(api.panels.getPanel, {
    id: panelId as Id<"panels">,
  });

  const base = `/panels/${panelId}`;

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-zinc-200 bg-white px-3 py-5 h-screen sticky top-0">
      <Link href="/" className="px-3 mb-2 block group">
        <span className="text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">
          ← Todos os painéis
        </span>
        <p className="text-sm font-semibold text-zinc-900 leading-tight mt-1 truncate">
          {panel?.name ?? "…"}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5 truncate">
          {panel?.companyName ?? ""}
        </p>
      </Link>

      <nav className="flex flex-col gap-1 mt-4">
        {NAV_ITEMS.map((item) => {
          const href = item.segment ? `${base}/${item.segment}` : base;
          const isActive =
            item.segment === ""
              ? pathname === base
              : pathname.startsWith(`${base}/${item.segment}`);

          return (
            <Link
              key={item.segment}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-100">
        <Link
          href={`${base}/edit`}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <span className="text-base w-5 text-center">✎</span>
          Configurações
        </Link>
        <Link
          href="/settings/location-factors"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <span className="text-base w-5 text-center">⊕</span>
          Fatores de impacto
        </Link>
        <Link
          href="/settings/content-categories"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <span className="text-base w-5 text-center">≡</span>
          Tipos de conteúdo
        </Link>
        <Link
          href="/settings/suppliers"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <span className="text-base w-5 text-center">👤</span>
          Fornecedores
        </Link>
      </div>
    </aside>
  );
}
