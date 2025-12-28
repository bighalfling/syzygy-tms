export function calcTotals(
  items: Array<{ description: string; qty: number; unitPrice: number; vatRate?: number }>
) {
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  const lines = items.map((it) => {
    const net = it.qty * it.unitPrice;
    const rate = it.vatRate ?? 0;
    const vat = net * (rate / 100);

    return {
      description: it.description,
      qty: it.qty,
      unitPrice: it.unitPrice,
      vatRate: rate,
      lineTotal: round2(net),
      vatAmount: round2(vat),
    };
  });

  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const vatAmount = round2(lines.reduce((s, l) => s + (l.vatAmount ?? 0), 0));
  const total = round2(subtotal + vatAmount);

  return { lines, subtotal, vatAmount, total };
}
