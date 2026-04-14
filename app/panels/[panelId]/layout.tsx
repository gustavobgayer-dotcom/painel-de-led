import PanelSidebarNav from "@/components/layout/PanelSidebarNav";

export default async function PanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ panelId: string }>;
}) {
  const { panelId } = await params;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <PanelSidebarNav panelId={panelId} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
