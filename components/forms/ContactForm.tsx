"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TextField } from "./TextField";
import { TextAreaField } from "./TextAreaField";
import { Button } from "@/components/ui/Button";
import { submitContactForm } from "@/lib/actions/contact";

const CONTACT_EMAIL = "contact@africafoundersfactory.com";

const emptyForm = {
  name: "",
  email: "",
  organization: "",
  subject: "",
  message: "",
  consent: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const t = useTranslations("about.contact");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "validation" | "not_configured" | "send_failed"
  >("idle");

  const isValid =
    form.name.trim() !== "" &&
    EMAIL_RE.test(form.email.trim()) &&
    form.subject.trim() !== "" &&
    form.message.trim() !== "" &&
    form.consent;

  const setField =
    (key: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setStatus("validation");
      return;
    }

    setStatus("loading");
    try {
      const result = await submitContactForm(form);
      setStatus(result.ok ? "success" : result.error);
    } catch {
      setStatus("send_failed");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-aff-line bg-aff-bg2 p-8 text-center sm:p-10">
        <h3 className="mb-3 font-heading text-xl font-semibold text-aff-text">
          {t("successTitle")}
        </h3>
        <p className="text-[15px] text-aff-muted">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-aff-line bg-aff-bg2 p-6 sm:p-10"
    >
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-[18px] sm:flex-row">
          <div className="flex-1">
            <TextField
              id="contact-name"
              label={t("fullName")}
              required
              value={form.name}
              onChange={setField("name")}
              autoComplete="name"
            />
          </div>
          <div className="flex-1">
            <TextField
              id="contact-email"
              label={t("email")}
              type="email"
              required
              value={form.email}
              onChange={setField("email")}
              autoComplete="email"
            />
          </div>
        </div>

        <TextField
          id="contact-organization"
          label={t("organization")}
          value={form.organization}
          onChange={setField("organization")}
          autoComplete="organization"
        />

        <TextField
          id="contact-subject"
          label={t("subject")}
          required
          value={form.subject}
          onChange={setField("subject")}
        />

        <TextAreaField
          id="contact-message"
          label={t("message")}
          required
          rows={5}
          value={form.message}
          onChange={setField("message")}
        />

        <label htmlFor="contact-consent" className="flex items-start gap-3 text-[13.5px] text-aff-muted">
          <input
            id="contact-consent"
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-aff-line bg-aff-bg accent-aff-cta-bg"
          />
          <span>{t("consent")}</span>
        </label>
      </div>

      {status === "validation" ? (
        <p role="alert" className="mt-5 text-sm text-red-400">
          {t("errorValidation")}
        </p>
      ) : null}

      {status === "not_configured" ? (
        <p role="alert" className="mt-5 text-sm text-red-400">
          {t("errorNotConfigured")}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      ) : null}

      {status === "send_failed" ? (
        <p role="alert" className="mt-5 text-sm text-red-400">
          {t("errorSendFailed")}
        </p>
      ) : null}

      <Button type="submit" block className="mt-7 sm:w-auto" disabled={status === "loading"}>
        {status === "loading" ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
