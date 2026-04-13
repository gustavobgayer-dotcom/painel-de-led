import SidebarNav from "./SidebarNav";

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-zinc-200 bg-white px-3 py-5 h-screen sticky top-0">
      <div className="px-3 mb-2">
        <span className="text-sm font-semibold text-zinc-900 leading-tight">
          Painel de LED
        </span>
        <p className="text-xs text-zinc-400 mt-0.5">Gestão de conteúdo</p>
      </div>
      <SidebarNav />
    </aside>
  );
}
