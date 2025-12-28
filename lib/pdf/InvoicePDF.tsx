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
  registryLine:
    "Commercial Register of the Municipal Court Bratislava III, Section: Sro, Insert No. 174357/B",
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

function shortenAddress(a?: string | null) {
  const raw = safeStr(a);
  if (!raw) return "—";
  const oneLine = raw.replace(/\s+/g, " ").trim();
  if (oneLine.length <= 70) return oneLine;
  return oneLine.slice(0, 67) + "...";
}

function normalizeVat(v?: string | null) {
  const s = safeStr(v);
  return s || "—";
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 40,
    fontSize: 10,
    color: "#111",
    fontFamily: "Inter",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  headerLeft: { width: "55%" },
  headerRight: { width: "40%", alignItems: "flex-end" },

  logoWrap: { marginBottom: 10 },
  logo: { width: 70, height: 60 },

  title: { fontSize: 18, fontWeight: 700, letterSpacing: 0.4 },
  invoiceNo: { fontSize: 16, fontWeight: 700, marginTop: 2 },

  metaBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
  },
  metaLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  metaLabel: { color: "#555" },
  metaValue: { fontWeight: 700 },

  sectionRow: { flexDirection: "row", gap: 14, marginTop: 10, marginBottom: 12 },
  box: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 6 },
  boxTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", color: "#333" },
  line: { marginBottom: 2 },

  tableTitle: {
    marginTop: 6,
    marginBottom: 6,
    fontSize: 10,
    fontWeight: 700,
    color: "#222",
    textTransform: "uppercase",
  },

  table: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, overflow: "hidden" },
  trHead: {
    flexDirection: "row",
    backgroundColor: "#f6f6f6",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  th: { paddingVertical: 8, paddingHorizontal: 8, fontWeight: 700 },
  td: { paddingVertical: 8, paddingHorizontal: 8 },

  colDesc: { width: "50%" },
  colQty: { width: "8%", textAlign: "right" },
  colUnit: { width: "15%", textAlign: "right" },
  colNet: { width: "15%", textAlign: "right" },
  colVat: { width: "12%", textAlign: "right" },

  bottomRow: { flexDirection: "row", gap: 14, marginTop: 12, alignItems: "stretch" },

  bankBox: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 6 },
  bankTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", color: "#333" },

  totalsBox: { width: 260, borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 10 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalsStrong: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  strong: { fontWeight: 700 },

  reverseNote: { marginTop: 8, fontSize: 9, color: "#444", lineHeight: 1.3 },

  noteBox: { marginTop: 12, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 6 },
  noteTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", color: "#333" },
  noteText: { color: "#111", lineHeight: 1.3 },

  legal: { marginTop: 10, fontSize: 9, color: "#444", lineHeight: 1.35 },
});

export default function InvoicePDF({
  invoice,
  logoDataUri,
}: {
  invoice: InvoiceLike;
  logoDataUri?: string | null;
}) {
  const currency = invoice.currency || "EUR";
  const items = invoice.items || [];

  const subtotalFallback = items.reduce((s, it) => s + toNum(it.lineTotal), 0);
  const vatFallback = items.reduce((s, it) => s + toNum(it.vatAmount), 0);
  const totalFallback = subtotalFallback + vatFallback;

  const subtotal = invoice.subtotal != null ? toNum(invoice.subtotal) : subtotalFallback;
  const vatAmount = invoice.vatAmount != null ? toNum(invoice.vatAmount) : vatFallback;
  const total = invoice.total != null ? toNum(invoice.total) : totalFallback;

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

  const orderRef = invoice.order?.orderRef || "TEST-01";
  const pickup = shortenAddress(invoice.order?.pickupAddress || "");
  const drop = shortenAddress(invoice.order?.deliveryAddress || "");
  const servicesTitle =
    pickup !== "—" && drop !== "—"
      ? `Transport service (${orderRef}: ${pickup} → ${drop})`
      : `Transport service (${orderRef})`;

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

            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNo}>{invoice.number}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.metaBox}>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>Issue date</Text>
                <Text style={styles.metaValue}>{fmtDate(invoice.issueDate)}</Text>
              </View>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>Delivery date</Text>
                <Text style={styles.metaValue}>{fmtDate(deliveryDate)}</Text>
              </View>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>Due date</Text>
                <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
              </View>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>Currency</Text>
                <Text style={styles.metaValue}>{currency}</Text>
              </View>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>Payment reference</Text>
                <Text style={styles.metaValue}>{paymentReference}</Text>
              </View>
              {invoice.order?.orderRef ? (
                <View style={{ marginTop: 6 }}>
                  <Text style={{ color: "#555" }}>Order: {invoice.order.orderRef}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Supplier</Text>
            <Text style={styles.line}>{sellerName}</Text>
            {addressLines(sellerAddress).map((l, idx) => (
              <Text key={idx} style={styles.line}>
                {l}
              </Text>
            ))}
            <Text style={styles.line}>Company ID: {safeStr(sellerIco) || "—"}</Text>
            <Text style={styles.line}>Tax ID: {safeStr(sellerDic) || "—"}</Text>
            <Text style={styles.line}>VAT ID: {safeStr(sellerVat) || "—"}</Text>
            <Text style={styles.line}>{COMPANY.registryLine}</Text>
            <Text style={styles.line}>Email: {COMPANY.email}</Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>Client</Text>
            <Text style={styles.line}>{buyerName}</Text>
            {addressLines(buyerAddress).map((l, idx) => (
              <Text key={idx} style={styles.line}>
                {l}
              </Text>
            ))}
            <Text style={styles.line}>VAT ID: {normalizeVat(buyerVat)}</Text>
          </View>
        </View>

        <Text style={styles.tableTitle}>{servicesTitle}</Text>

        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, styles.colDesc]}>Services</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colUnit]}>Unit price</Text>
            <Text style={[styles.th, styles.colNet]}>Net</Text>
            <Text style={[styles.th, styles.colVat]}>VAT</Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.tr}>
              <Text style={[styles.td, { width: "100%" }]}>No items</Text>
            </View>
          ) : (
            items.map((it) => (
              <View key={it.id} style={styles.tr}>
                <Text style={[styles.td, styles.colDesc]}>{it.description || "Transport service"}</Text>
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
            <Text style={styles.bankTitle}>Bank details</Text>
            <Text style={styles.line}>{BANK.bankName}</Text>
            <Text style={styles.line}>
              IBAN / SWIFT: {BANK.iban} / {BANK.swift}
            </Text>
            <Text style={styles.line}>Payment reference: {paymentReference}</Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>VAT base</Text>
              <Text>{money(subtotal, currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>VAT amount</Text>
              <Text>{money(vatAmount, currency)}</Text>
            </View>
            <View style={styles.totalsStrong}>
              <Text style={styles.strong}>Invoice total</Text>
              <Text style={styles.strong}>{money(total, currency)}</Text>
            </View>

            {showReverseCharge ? (
              <Text style={styles.reverseNote}>
                The supply of services is subject to the reverse charge procedure (VAT 0%).
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Note</Text>
          <Text style={styles.noteText}>
            {invoice.note && String(invoice.note).trim().length > 0 ? String(invoice.note) : "—"}
          </Text>
        </View>

        <Text style={styles.legal}>
          This invoice is generated electronically. Contact: {COMPANY.email}
        </Text>
      </Page>
    </Document>
  );
}
