"use client";

import Button from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function Modal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
  danger = false,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description && (
          <p className="text-sm text-zinc-500">{description}</p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant={danger ? "destructive" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
