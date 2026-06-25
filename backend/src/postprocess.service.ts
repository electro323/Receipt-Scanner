export function enrichReceiptData(data: any, rawText: string) {
  data.vendor ??= {};
  data.transaction ??= {};
  data.totals ??= {};
  data.payment ??= {};
  data.items ??= [];

  data.vendor.name ??= '';
  data.vendor.address ??= '';
  data.vendor.phone ??= '';

  data.transaction.date ??= '';
  data.transaction.time ??= '';
  data.transaction.receipt_number ??= '';
  data.transaction.currency ??= '';

  data.totals.subtotal ??= 0;
  data.totals.tax ??= 0;
  data.totals.discounts ??= [];
  data.totals.total ??= 0;

  data.payment.method ??= '';
  data.payment.amount ??= 0;

  data.items = data.items.map((item: any) => {
    const price =
      Number(
        String(item.price || item.unit_price || item.total_price || 0)
          .replace('$', '')
          .replace('Rs.', '')
          .replace('₹', '')
          .trim(),
      ) || 0;

    return {
      name: item.name || item.description || '',
      quantity: Number(item.quantity) || 1,
      unit_price: price,
      total_price: price,
      category: item.category || '',
    };
  });

  const dateMatch = rawText.match(/\d{2}[\/-]\d{2}[\/-]\d{4}/);
  if (!data.transaction.date && dateMatch) {
    data.transaction.date = dateMatch[0];
  }

  const timeMatch = rawText.match(/\d{2}:\d{2}\s?(AM|PM)?/i);
  if (!data.transaction.time && timeMatch) {
    data.transaction.time = timeMatch[0];
  }

  const receiptMatch = rawText.match(/REC#(\d+)|No[:\s]*([0-9]+)/i);
  if (!data.transaction.receipt_number && receiptMatch) {
    data.transaction.receipt_number = receiptMatch[1] || receiptMatch[2];
  }

  const subtotalMatch = rawText.match(/SUBTOTAL\s*\$?(\d+\.\d+)/i);
  if ((!data.totals.subtotal || data.totals.subtotal === 0) && subtotalMatch) {
    data.totals.subtotal = Number(subtotalMatch[1]);
  }

  const taxMatch = rawText.match(/TAX.*?\$?(\d+\.\d+)/i);
  if ((!data.totals.tax || data.totals.tax === 0) && taxMatch) {
    data.totals.tax = Number(taxMatch[1]);
  }

  const totalMatch = rawText.match(
    /TOTAL[;:\s]*Rs\.?\s*([0-9]+)[,.]([0-9]{2})|TOTAL\s*\$?(\d+\.\d+)/i,
  );

  if (totalMatch) {
    data.totals.total = totalMatch[3]
      ? Number(totalMatch[3])
      : Number(`${totalMatch[1]}.${totalMatch[2]}`);
  }

  if (/VISA/i.test(rawText)) data.payment.method = 'VISA';
  else if (/MASTERCARD/i.test(rawText)) data.payment.method = 'MASTERCARD';
  else if (/AMEX/i.test(rawText)) data.payment.method = 'AMEX';
  else if (/UPI/i.test(rawText)) data.payment.method = 'UPI';
  else if (/CASH/i.test(rawText)) data.payment.method = 'CASH';

  if (data.totals.total) {
    data.payment.amount = data.totals.total;
  }

  if (!data.transaction.currency) {
    if (rawText.includes('$')) data.transaction.currency = 'USD';
    else if (/Rs\.?|₹/i.test(rawText)) data.transaction.currency = 'INR';
  }

  const orderedReceipt = {
    vendor: data.vendor,

    transaction: data.transaction,

    items: data.items,

    totals: data.totals,

    payment: data.payment,

    raw_text: rawText,
  };

  return orderedReceipt;
}