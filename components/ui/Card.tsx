import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export default function Card({
  padding = true,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white border border-zinc-200 rounded-xl shadow-sm ${padding ? "p-5" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
