import "server-only";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { PDF_FONT_FAMILY, registerPdfFonts } from "./fonts";

export type PdfLocale = "ar" | "fr";

/** Logo as a decoded image buffer (prefetched in `lib/pdf.ts`). */
export interface PdfLogo {
  data: Buffer;
  format: "png" | "jpg";
}

/**
 * Fully-resolved, presentation-ready data for the booking PDF. The builder in
 * `lib/pdf.ts` does all I/O, i18n and money/date formatting; this component is
 * intentionally "dumb" so it stays pure and trivially testable.
 */
export interface BookingPdfData {
  locale: PdfLocale;
  brand: { primary: string; secondary: string };
  agency: {
    name: string;
    logo: PdfLogo | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
  };
  booking: {
    reference: string;
    issuedAt: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    startDate: string;
    endDate: string;
    totalDays: string;
    pickupLocation: string;
    dropoffLocation: string | null;
    notes: string | null;
  };
  car: {
    name: string;
    subtitle: string;
    pricePerDay: string;
    deposit: string;
  };
  extras: { label: string; price: string }[];
  money: { subtotal: string; extras: string; total: string };
}

type LabelKey =
  | "bookingVoucher"
  | "reference"
  | "issuedAt"
  | "customer"
  | "name"
  | "phone"
  | "email"
  | "car"
  | "pricePerDay"
  | "deposit"
  | "rental"
  | "from"
  | "to"
  | "days"
  | "pickup"
  | "dropoff"
  | "extras"
  | "notes"
  | "subtotal"
  | "extrasTotal"
  | "total"
  | "footer"
  | "contact";

const STR: Record<PdfLocale, Record<LabelKey, string>> = {
  ar: {
    bookingVoucher: "قسيمة حجز",
    reference: "رقم المرجع",
    issuedAt: "تاريخ الإصدار",
    customer: "معلومات الزبون",
    name: "الاسم",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    car: "السيارة",
    pricePerDay: "السعر اليومي",
    deposit: "الضمان",
    rental: "تفاصيل الكراء",
    from: "من",
    to: "إلى",
    days: "عدد الأيام",
    pickup: "مكان الاستلام",
    dropoff: "مكان الإرجاع",
    extras: "الإضافات",
    notes: "ملاحظات",
    subtotal: "المجموع الفرعي",
    extrasTotal: "مجموع الإضافات",
    total: "المجموع الإجمالي",
    footer: "هذه القسيمة مولّدة آليا. شكرا لاختياركم وكالتنا.",
    contact: "للتواصل",
  },
  fr: {
    bookingVoucher: "Bon de réservation",
    reference: "Référence",
    issuedAt: "Date d'émission",
    customer: "Informations client",
    name: "Nom",
    phone: "Téléphone",
    email: "E-mail",
    car: "Véhicule",
    pricePerDay: "Prix par jour",
    deposit: "Caution",
    rental: "Détails de la location",
    from: "Du",
    to: "Au",
    days: "Nombre de jours",
    pickup: "Lieu de prise en charge",
    dropoff: "Lieu de restitution",
    extras: "Options",
    notes: "Remarques",
    subtotal: "Sous-total",
    extrasTotal: "Total des options",
    total: "Total",
    footer: "Bon généré automatiquement. Merci de votre confiance.",
    contact: "Contact",
  },
};

function createStyles(isRtl: boolean, primary: string, secondary: string) {
  const align = isRtl ? "right" : "left";
  return StyleSheet.create({
    page: {
      fontFamily: PDF_FONT_FAMILY,
      fontSize: 10,
      color: "#1a1a1a",
      paddingTop: 36,
      paddingBottom: 56,
      paddingHorizontal: 40,
      direction: isRtl ? "rtl" : "ltr",
      textAlign: align,
    },
    // ── Header ──
    header: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 2,
      borderBottomColor: secondary,
      paddingBottom: 14,
      marginBottom: 18,
    },
    brandBlock: {
      flexDirection: isRtl ? "row-reverse" : "row",
      alignItems: "center",
      gap: 10,
    },
    logo: { width: 54, height: 54, objectFit: "contain" },
    agencyName: { fontSize: 18, fontWeight: 800, color: primary },
    voucherBlock: { alignItems: isRtl ? "flex-start" : "flex-end" },
    voucherTitle: { fontSize: 13, fontWeight: 700, color: primary },
    refValue: {
      fontSize: 12,
      fontWeight: 800,
      color: secondary,
      marginTop: 4,
    },
    meta: { fontSize: 8, color: "#666", marginTop: 2 },
    // ── Sections ──
    section: { marginBottom: 14 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: 700,
      color: primary,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 0.75,
      borderBottomColor: "#e2e2e2",
    },
    row: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    label: { color: "#666", fontSize: 9 },
    value: { fontWeight: 700, fontSize: 9 },
    // ── Extras table ──
    extraRow: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      paddingVertical: 3,
      borderBottomWidth: 0.5,
      borderBottomColor: "#eee",
    },
    // ── Totals ──
    totals: {
      marginTop: 6,
      alignSelf: isRtl ? "flex-start" : "flex-end",
      width: "55%",
    },
    totalRow: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    grandTotalRow: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: primary,
    },
    grandTotalLabel: { fontSize: 12, fontWeight: 800, color: primary },
    grandTotalValue: { fontSize: 13, fontWeight: 800, color: primary },
    notesBox: {
      backgroundColor: "#faf7ef",
      borderRadius: 4,
      padding: 8,
      fontSize: 9,
      color: "#444",
    },
    // ── Footer ──
    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      borderTopWidth: 0.75,
      borderTopColor: "#e2e2e2",
      paddingTop: 8,
    },
    footerText: { fontSize: 8, color: "#888", textAlign: "center" },
    contactText: {
      fontSize: 8,
      color: "#666",
      textAlign: "center",
      marginBottom: 2,
    },
  });
}

type Styles = ReturnType<typeof createStyles>;

function InfoRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: Styles;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function BookingPdf({ data }: { data: BookingPdfData }) {
  registerPdfFonts();

  const t = STR[data.locale];
  const isRtl = data.locale === "ar";
  const { primary, secondary } = data.brand;
  const s = createStyles(isRtl, primary, secondary);

  const contactBits = [
    data.agency.phone,
    data.agency.whatsapp && data.agency.whatsapp !== data.agency.phone
      ? data.agency.whatsapp
      : null,
    data.agency.email,
  ].filter(Boolean) as string[];

  return (
    <Document
      title={`${t.bookingVoucher} ${data.booking.reference}`}
      author={data.agency.name}
    >
      <Page size="A4" style={s.page} wrap>
        {/* Header */}
        <View style={s.header}>
          <View style={s.brandBlock}>
            {data.agency.logo ? (
              // @react-pdf <Image> is a PDF primitive, not an <img>; no alt.
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image style={s.logo} src={data.agency.logo} />
            ) : null}
            <Text style={s.agencyName}>{data.agency.name}</Text>
          </View>
          <View style={s.voucherBlock}>
            <Text style={s.voucherTitle}>{t.bookingVoucher}</Text>
            <Text style={s.refValue}>{data.booking.reference}</Text>
            <Text style={s.meta}>
              {t.issuedAt}: {data.booking.issuedAt}
            </Text>
          </View>
        </View>

        {/* Customer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t.customer}</Text>
          <InfoRow
            label={t.name}
            value={data.booking.customerName}
            styles={s}
          />
          <InfoRow
            label={t.phone}
            value={data.booking.customerPhone}
            styles={s}
          />
          {data.booking.customerEmail ? (
            <InfoRow
              label={t.email}
              value={data.booking.customerEmail}
              styles={s}
            />
          ) : null}
        </View>

        {/* Car */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t.car}</Text>
          <InfoRow label={t.car} value={data.car.name} styles={s} />
          <InfoRow label="" value={data.car.subtitle} styles={s} />
          <InfoRow
            label={t.pricePerDay}
            value={data.car.pricePerDay}
            styles={s}
          />
          <InfoRow label={t.deposit} value={data.car.deposit} styles={s} />
        </View>

        {/* Rental details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t.rental}</Text>
          <InfoRow label={t.from} value={data.booking.startDate} styles={s} />
          <InfoRow label={t.to} value={data.booking.endDate} styles={s} />
          <InfoRow label={t.days} value={data.booking.totalDays} styles={s} />
          <InfoRow
            label={t.pickup}
            value={data.booking.pickupLocation}
            styles={s}
          />
          {data.booking.dropoffLocation ? (
            <InfoRow
              label={t.dropoff}
              value={data.booking.dropoffLocation}
              styles={s}
            />
          ) : null}
        </View>

        {/* Extras */}
        {data.extras.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t.extras}</Text>
            {data.extras.map((ex, i) => (
              <View key={i} style={s.extraRow}>
                <Text style={s.label}>{ex.label}</Text>
                <Text style={s.value}>{ex.price}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.label}>{t.subtotal}</Text>
            <Text style={s.value}>{data.money.subtotal}</Text>
          </View>
          {data.extras.length > 0 ? (
            <View style={s.totalRow}>
              <Text style={s.label}>{t.extrasTotal}</Text>
              <Text style={s.value}>{data.money.extras}</Text>
            </View>
          ) : null}
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>{t.total}</Text>
            <Text style={s.grandTotalValue}>{data.money.total}</Text>
          </View>
        </View>

        {/* Notes */}
        {data.booking.notes ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t.notes}</Text>
            <View style={s.notesBox}>
              <Text>{data.booking.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Footer */}
        <View style={s.footer} fixed>
          {contactBits.length > 0 ? (
            <Text style={s.contactText}>
              {t.contact}: {contactBits.join("  •  ")}
            </Text>
          ) : null}
          <Text style={s.footerText}>{t.footer}</Text>
        </View>
      </Page>
    </Document>
  );
}
