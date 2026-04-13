import Button from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-2xl">
        ○
      </div>
      <p className="text-zinc-700 font-medium">{title}</p>
      {description && (
        <p className="text-zinc-400 text-sm max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
