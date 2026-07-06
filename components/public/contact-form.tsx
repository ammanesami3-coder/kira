"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, MessageCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Zero-backend contact form: composes the visitor's message and hands it to
 * the channel the agency already monitors — WhatsApp (preferred, prefilled
 * `wa.me` text) or email (`mailto:`) as fallback. No message ever touches our
 * servers, so there is no PII to store and no spam surface to protect.
 * Renders nothing when the agency has neither channel configured.
 */
export function ContactForm({
  whatsappDigits,
  email,
}: {
  whatsappDigits: string | null;
  email: string | null;
}) {
  const t = useTranslations("contactPage");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  if (!whatsappDigits && !email) return null;

  const viaWhatsApp = Boolean(whatsappDigits);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = [
      t("formIntro", { name: name.trim() }),
      phone.trim() ? `${t("formPhone")}: ${phone.trim()}` : null,
      "",
      message.trim(),
    ]
      .filter((line) => line !== null)
      .join("\n");

    const url = viaWhatsApp
      ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(body)}`
      : `mailto:${email}?subject=${encodeURIComponent(
          t("formSubject"),
        )}&body=${encodeURIComponent(body)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          {viaWhatsApp ? (
            <MessageCircle className="size-5" aria-hidden />
          ) : (
            <Mail className="size-5" aria-hidden />
          )}
          {t("formTitle")}
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm text-pretty">
          {viaWhatsApp ? t("formHintWhatsapp") : t("formHintEmail")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">{t("formName")}</Label>
          <Input
            id="contact-name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">{t("formPhone")}</Label>
          <Input
            id="contact-phone"
            dir="ltr"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">{t("formMessage")}</Label>
        <Textarea
          id="contact-message"
          required
          rows={4}
          placeholder={t("formPlaceholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full gap-2 sm:w-auto">
        <Send className="size-4" aria-hidden />
        {viaWhatsApp ? t("formSendWhatsapp") : t("formSendEmail")}
      </Button>
    </form>
  );
}
