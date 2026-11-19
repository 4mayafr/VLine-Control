"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cx } from "./ui";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className,
  variant = "primary",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "ghost" | "danger";
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  const variants = {
    primary: "btn btn-primary",
    ghost: "btn btn-ghost",
    danger: "btn btn-danger",
  };
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={cx(variants[variant], className)}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
