"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function EditPanel({
  open,
  title,
  onClose,
  onSave,
  saving,
  saveLabel,
  cancelLabel,
  error,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel: string;
  cancelLabel: string;
  error?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-aff-line bg-aff-bg2"
      >
        <div className="flex items-center justify-between border-b border-aff-line px-6 py-5">
          <h2 className="font-heading text-lg font-semibold text-aff-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={cancelLabel}
            className="flex h-8 w-8 items-center justify-center rounded-full text-aff-muted hover:bg-aff-bg hover:text-aff-text"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-6 py-6">{children}</div>
        {error ? (
          <p role="alert" className="border-t border-aff-line px-6 py-3 text-sm text-red-400">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3 border-t border-aff-line px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? "…" : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
