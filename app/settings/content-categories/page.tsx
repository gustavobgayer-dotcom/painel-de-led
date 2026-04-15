"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import Link from "next/link";

const inputCls =
  "w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white";

export default function ContentCategoriesPage() {
  const categories = useQuery(api.contentCategories.listContentCategories);
  const createCategory = useMutation(api.contentCategories.createContentCategory);
  const deleteCategory = useMutation(api.contentCategories.deleteContentCategory);
  const ensureDefaults = useMutation(api.contentCategories.ensureDefaultCategories);

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [deleteId, setDeleteId] = useState<Id<"content_categories"> | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Garante que os 3 padrões existem na primeira carga
  useEffect(() => {
    if (!seeded) {
      setSeeded(true);
      ensureDefaults({});
    }
  }, [ensureDefaults, seeded]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    await createCategory({ label: label.trim() });
    setLabel("");
    setShowForm(false);
  }

  const defaults = (categories ?? []).filter((c) => c.isDefault);
  const custom = (categories ?? []).filter((c) => !c.isDefault);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 mt-3">
            Tipos de conteúdo
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Categorias disponíveis ao cadastrar conteúdo nos painéis.
          </p>
        </div>

        {categories === undefined ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-700">
                Tipos cadastrados
              </h2>
              <Button onClick={() => setShowForm(true)}>+ Adicionar</Button>
            </div>

            {showForm && (
              <form
                onSubmit={handleCreate}
                className="mb-4 p-4 bg-zinc-50 rounded-lg flex gap-3 items-end"
              >
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600">
                    Nome do tipo *
                  </label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Ex: Lançamento"
                    required
                    autoFocus
                    className={inputCls}
                  />
                </div>
                <Button type="submit">Salvar</Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => { setShowForm(false); setLabel(""); }}
                >
                  Cancelar
                </Button>
              </form>
            )}

            <div className="flex flex-col divide-y divide-zinc-100">
              {defaults.map((cat) => (
                <div key={cat._id} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-zinc-800">
                    {cat.label}
                  </span>
                  <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                    padrão
                  </span>
                </div>
              ))}
              {custom.map((cat) => (
                <div key={cat._id} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-zinc-800">
                    {cat.label}
                  </span>
                  <button
                    onClick={() => setDeleteId(cat._id)}
                    className="text-xs text-zinc-300 hover:text-red-500 cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {defaults.length === 0 && custom.length === 0 && !showForm && (
                <p className="text-sm text-zinc-400 py-4 text-center">
                  Carregando tipos padrão…
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={deleteId !== null}
        title="Excluir tipo de conteúdo"
        description="Tem certeza que deseja excluir este tipo? Conteúdos já cadastrados não serão afetados."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (deleteId) await deleteCategory({ id: deleteId });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
}
