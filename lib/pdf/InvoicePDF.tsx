import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

type InvoiceLike = {
  id: string;
  number: string;

  issueDate?: any;
  dueDate?: any;
  deliveryDate?: any;

  currency?: string;
  status?: string;

  language?: string | null; // "SK" | "EN"

  sellerName?: string;
  sellerAddress?: string;
  sellerVat?: string | null;
  sellerIco?: string | null;
  sellerDic?: string | null;

  buyerName?: string;
  buyerAddress?: string;
  buyerVat?: string | null;

  subtotal?: any;
  vatAmount?: any;
  total?: any;

  order?: {
    orderRef?: string | null;
    pickupAddress?: string | null;
    deliveryAddress?: string | null;
  } | null;

  trip?: { deliveryAt?: any; pickupAt?: any } | null;

  note?: string | null;

  items?: Array<{
    id: string;
    description: string;
    qty: number;
    unitPrice: any;
    lineTotal: any;
    vatRate?: any;
    vatAmount?: any;
  }>;
};

const COMPANY = {
  name: "SYZYGY s. r. o.",
  address: "Galvaniho 19140/14E\n821 04 Bratislava, Slovakia",
  companyId: "55903126",
  vatId: "SK2122124686",
  taxId: "2122124686",
  email: "invoice@syzygy-log.com",
};

const BANK = {
  bankName: "UniCredit Bank Czech Republic and Slovakia, a.s.",
  iban: "SK49 1111 0000 0018 5757 6003",
  swift: "UNCRSKBX",
};

function fmtDate(d: any) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toISOString().slice(0, 10);
}

function toNum(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  if (typeof v?.toNumber === "function") return v.toNumber();
  if (typeof v?.toString === "function") return Number(v.toString()) || 0;
  return Number(v) || 0;
}

function money(v: any, currency = "EUR") {
  const n = toNum(v);
  return `${n.toFixed(2)} ${currency}`;
}

function safeStr(v: any) {
  const s = String(v ?? "").trim();
  return s.length ? s : "";
}

function addressLines(text?: string | null) {
  const raw = safeStr(text);
  if (!raw) return ["—"];

  if (raw.includes("\n")) {
    const lines = raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return lines.length ? lines : ["—"];
  }

  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length >= 2) return parts;
  return [raw];
}

function normalizeVat(v?: string | null) {
  const s = safeStr(v);
  return s || "—";
}

function cleanPercentLabel(v: number) {
  // 23 or 23.00 -> "23%"
  // 20.5 -> "20.5%"
  const rounded2 = Math.round(v * 100) / 100;
  const asInt = Math.abs(rounded2 - Math.round(rounded2)) < 0.000001 ? String(Math.round(rounded2)) : String(rounded2);
  return `${asInt}%`;
}

const styles = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 34, paddingHorizontal: 40, fontSize: 10, color: "#111", fontFamily: "Inter" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  headerLeft: { width: "55%" },
  headerRight: { width: "40%", alignItems: "flex-end" },
  logoWrap: { marginBottom: 10 },
  logo: { width: 70, height: 60 },
  title: { fontSize: 18, fontWeight: 700, letterSpacing: 0.4 },
  invoiceNo: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  metaBox: { width: "100%", borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 10 },
  metaLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  metaLabel: { color: "#555" },
  metaValue: { fontWeight: 700 },
  sectionRow: { flexDirection: "row", gap: 14, marginTop: 10, marginBottom: 12 },
  box: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 6 },
  boxTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", color: "#333" },
  line: { marginBottom: 2 },
  table: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, overflow: "hidden" },
  trHead: { flexDirection: "row", backgroundColor: "#f6f6f6", borderBottomWidth: 1, borderBottomColor: "#ddd" },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  th: { paddingVertical: 8, paddingHorizontal: 8, fontWeight: 700 },
  td: { paddingVertical: 8, paddingHorizontal: 8 },
  colDesc: { width: "47%" },
  colQty: { width: "8%", textAlign: "right" },
  colUnit: { width: "15%", textAlign: "right" },
  colNet: { width: "15%", textAlign: "right" },
  colVat: { width: "15%", textAlign: "right" },
  bottomRow: { flexDirection: "row", gap: 14, marginTop: 12, alignItems: "stretch" },
  bankBox: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 6 },    bankTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", color: "#333" },
  totalsBox: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 6 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalsStrong: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  strong: { fontWeight: 700 },
  reverseNote: { marginTop: 8, fontSize: 9, color: "#444", lineHeight: 1.3 },
  noteBox: { marginTop: 12, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 6 },
  noteTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", color: "#333" },
  noteText: { color: "#111", lineHeight: 1.3 },
  legal: { marginTop: 10, fontSize: 9, color: "#444", lineHeight: 1.35 },
});

function labels(lang: "SK" | "EN") {
  if (lang === "SK") {
    return {
      title: "FAKTÚRA",
      issueDate: "Dátum vystavenia",
      deliveryDate: "Dátum dodania",
      dueDate: "Dátum splatnosti",
      currency: "Mena",
      paymentRef: "Variabilný symbol",
      order: "Objednávka",
      supplier: "DODÁVATEĽ",
      client: "ODBERATEĽ",
      ico: "IČO",
      dic: "DIČ",
      icdph: "IČ DPH",
      email: "Email",
      registryLine: "Obchodný register Mestského súdu Bratislava III, oddiel: Sro, vložka č. 174357/B",
      colServices: "Služby",
      colQty: "Množ.",
      colUnitPrice: "Jedn. cena",
      colNet: "Základ",
      colVat: "DPH",
      bankDetails: "Bankové údaje",
      ibanSwift: "IBAN / SWIFT",
      paymentReference: "Variabilný symbol",
      vatBase: "Základ dane",
      vatAmount: "DPH",
      invoiceTotal: "Spolu na úhradu",
      reverseCharge: "Dodanie služby je prenesenie daňovej povinnosti (DPH 0%).",
      note: "Poznámka",
      noItems: "Bez položiek",
      generated: "Faktúra je generovaná elektronicky. Kontakt:",
    };
  }

  return {
    title: "INVOICE",
    issueDate: "Issue date",
    deliveryDate: "Delivery date",
    dueDate: "Due date",
    currency: "Currency",
    paymentRef: "Payment reference",
    order: "Order",
    supplier: "SUPPLIER",
    client: "CLIENT",
    ico: "Company ID",
    dic: "Tax ID",
    icdph: "VAT ID",
    email: "Email",
    registryLine: "Commercial Register of the Municipal Court Bratislava III, Section: Sro, Insert No. 174357/B",
    colServices: "Services",
    colQty: "Qty",
    colUnitPrice: "Unit price",
    colNet: "Net",
    colVat: "VAT",
    bankDetails: "Bank details",
    ibanSwift: "IBAN / SWIFT",
    paymentReference: "Payment reference",
    vatBase: "VAT base",
    vatAmount: "VAT",
    invoiceTotal: "Invoice total",
    reverseCharge: "The supply of services is subject to the reverse charge procedure (VAT 0%).",
    note: "Note",
    noItems: "No items",
    generated: "This invoice is generated electronically. Contact:",
  };
}

export default function InvoicePDF({
  invoice,
  logoDataUri,
}: {
  invoice: InvoiceLike;
  logoDataUri?: string | null;
}) {
  const lang: "SK" | "EN" = String(invoice.language || "EN").toUpperCase() === "SK" ? "SK" : "EN";
  const L = labels(lang);

  const currency = invoice.currency || "EUR";
  const items = invoice.items || [];

  const subtotalFallback = items.reduce((s, it) => s + toNum(it.lineTotal), 0);
  const vatFallback = items.reduce((s, it) => s + toNum(it.vatAmount), 0);
  const totalFallback = subtotalFallback + vatFallback;

  const subtotal = invoice.subtotal != null ? toNum(invoice.subtotal) : subtotalFallback;
  const vatAmount = invoice.vatAmount != null ? toNum(invoice.vatAmount) : vatFallback;
  const total = invoice.total != null ? toNum(invoice.total) : totalFallback;

  // ✅ VAT % from first item if present (manual uses 1 line)
  const vatRateRaw = items.length > 0 ? toNum(items[0].vatRate) : 0;
  const vatRatePct = vatRateRaw > 0 ? cleanPercentLabel(vatRateRaw) : null;

  const vatLabel =
    vatRatePct ? `${L.vatAmount} (${vatRatePct})` : L.vatAmount;

  const sellerName = COMPANY.name;
  const sellerAddress = COMPANY.address;
  const sellerVat = invoice.sellerVat ?? COMPANY.vatId;
  const sellerIco = invoice.sellerIco ?? COMPANY.companyId;
  const sellerDic = invoice.sellerDic ?? COMPANY.taxId;

  const buyerName = safeStr(invoice.buyerName) || "—";
  const buyerAddress = safeStr(invoice.buyerAddress) || "—";
  const buyerVat = safeStr(invoice.buyerVat) || "";

  const deliveryDate = invoice.deliveryDate ?? (invoice.trip ? invoice.trip.deliveryAt : null) ?? null;

  const paymentReference =
    (invoice.number ? invoice.number.replace(/[^\d]/g, "") : "") || invoice.number || invoice.id;

  const showReverseCharge = vatAmount === 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {logoDataUri ? (
              <View style={styles.logoWrap}>
                <Image src={logoDataUri} style={styles.logo} />
              </View>
            ) : null}

            <Text style={styles.title}>{L.title}</Text>
            <Text style={styles.invoiceNo}>{invoice.number}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.metaBox}>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>{L.issueDate}</Text>
                <Text style={styles.metaValue}>{fmtDate(invoice.issueDate)}</Text>
              </View>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>{L.deliveryDate}</Text>
                <Text style={styles.metaValue}>{fmtDate(deliveryDate)}</Text>
              </View>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>{L.dueDate}</Text>
                <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
              </View>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>{L.currency}</Text>
                <Text style={styles.metaValue}>{currency}</Text>
              </View>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>{L.paymentRef}</Text>
                <Text style={styles.metaValue}>{paymentReference}</Text>
              </View>
              {invoice.order?.orderRef ? (
                <View style={{ marginTop: 6 }}>
                  <Text style={{ color: "#555" }}>
                    {L.order}: {invoice.order.orderRef}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{L.supplier}</Text>
            <Text style={styles.line}>{sellerName}</Text>
            {addressLines(sellerAddress).map((l, idx) => (
              <Text key={idx} style={styles.line}>
                {l}
              </Text>
            ))}
            <Text style={styles.line}>
              {L.ico}: {safeStr(sellerIco) || "—"}
            </Text>
            <Text style={styles.line}>
              {L.dic}: {safeStr(sellerDic) || "—"}
            </Text>
            <Text style={styles.line}>
              {L.icdph}: {safeStr(sellerVat) || "—"}
            </Text>
            <Text style={styles.line}>{L.registryLine}</Text>
            <Text style={styles.line}>
              {L.email}: {COMPANY.email}
            </Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>{L.client}</Text>
            <Text style={styles.line}>{buyerName}</Text>
            {addressLines(buyerAddress).map((l, idx) => (
              <Text key={idx} style={styles.line}>
                {l}
              </Text>
            ))}
            <Text style={styles.line}>
              {L.icdph}: {normalizeVat(buyerVat)}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, styles.colDesc]}>{L.colServices}</Text>
            <Text style={[styles.th, styles.colQty]}>{L.colQty}</Text>
            <Text style={[styles.th, styles.colUnit]}>{L.colUnitPrice}</Text>
            <Text style={[styles.th, styles.colNet]}>{L.colNet}</Text>
            <Text style={[styles.th, styles.colVat]}>{L.colVat}</Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.tr}>
              <Text style={[styles.td, { width: "100%" }]}>{L.noItems}</Text>
            </View>
          ) : (
            items.map((it) => (
              <View key={it.id} style={styles.tr}>
                <Text style={[styles.td, styles.colDesc]}>{it.description || (lang === "SK" ? "Služba" : "Service")}</Text>
                <Text style={[styles.td, styles.colQty]}>{String(it.qty ?? 0)}</Text>
                <Text style={[styles.td, styles.colUnit]}>{money(it.unitPrice, currency)}</Text>
                <Text style={[styles.td, styles.colNet]}>{money(it.lineTotal, currency)}</Text>
                <Text style={[styles.td, styles.colVat]}>{money(it.vatAmount ?? 0, currency)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.bankBox}>
            <Text style={styles.bankTitle}>{L.bankDetails}</Text>
            <Text style={styles.line}>{BANK.bankName}</Text>
            <Text style={styles.line}>
              {L.ibanSwift}: {BANK.iban} / {BANK.swift}
            </Text>
            <Text style={styles.line}>
              {L.paymentReference}: {paymentReference}
            </Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>{L.vatBase}</Text>
              <Text>{money(subtotal, currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>{vatLabel}</Text>
              <Text>{money(vatAmount, currency)}</Text>
            </View>
            <View style={styles.totalsStrong}>
              <Text style={styles.strong}>{L.invoiceTotal}</Text>
              <Text style={styles.strong}>{money(total, currency)}</Text>
            </View>

            {showReverseCharge ? <Text style={styles.reverseNote}>{L.reverseCharge}</Text> : null}
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>{L.note}</Text>
          <Text style={styles.noteText}>
            {invoice.note && String(invoice.note).trim().length > 0 ? String(invoice.note) : "—"}
          </Text>
        </View>

        <Text style={styles.legal}>
          {L.generated} {COMPANY.email}
        </Text>
      </Page>
    </Document>
  );
}
