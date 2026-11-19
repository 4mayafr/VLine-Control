"use client";

import { cx } from "@/components/ui";

export function ConfirmForm({
  action,
  fields,
  label,
  confirmText,
  variant = "ghost",
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  confirmText?: string;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
}) {
  const variants = {
    primary: "btn btn-primary btn-sm",
    ghost: "btn btn-ghost btn-sm",
    danger: "btn btn-danger btn-sm",
  };
  return (
    <form
      action={action}
      className={cx("inline", className)}
      onSubmit={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={variants[variant]}>
        {label}
      </button>
    </form>
  );
}
