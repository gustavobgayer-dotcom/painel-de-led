type StatusBadgeVariant = "draft" | "scheduled" | "active" | "archived";
type TypeBadgeVariant = "text" | "image" | "video";
type BadgeVariant = StatusBadgeVariant | TypeBadgeVariant | "default";

const badgeClasses: Record<BadgeVariant, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  scheduled: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  archived: "bg-zinc-200 text-zinc-500",
  text: "bg-purple-100 text-purple-700",
  image: "bg-orange-100 text-orange-700",
  video: "bg-pink-100 text-pink-700",
  default: "bg-zinc-100 text-zinc-600",
};

const badgeLabels: Partial<Record<BadgeVariant, string>> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  active: "Ativo",
  archived: "Arquivado",
  text: "Texto",
  image: "Imagem",
  video: "Vídeo",
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export default function Badge({ variant, label }: BadgeProps) {
  const classes = badgeClasses[variant] ?? badgeClasses.default;
  const text = label ?? badgeLabels[variant] ?? variant;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}
    >
      {text}
    </span>
  );
}
