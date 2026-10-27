export const coachVatOptions = [
  { category: 1, rate: 24, label: '24%' },
  { category: 2, rate: 13, label: '13%' },
  { category: 3, rate: 6, label: '6%' },
  { category: 4, rate: 17, label: '17%' },
  { category: 5, rate: 9, label: '9%' },
  { category: 6, rate: 4, label: '4%' },
  { category: 7, rate: 0, label: 'Απαλλαγή ΦΠΑ' },
  { category: 8, rate: 0, label: 'Άνευ ΦΠΑ' },
] as const;

export function calculateCoachReceiptTax(gross: number, category: number, exemption?: number | null) {
  const option = coachVatOptions.find(item => item.category === category);
  if (!option || !Number.isFinite(gross) || gross <= 0) throw new Error('Invalid receipt tax data');
  if (category === 7 && (!exemption || !Number.isInteger(exemption) || exemption < 1)) throw new Error('Exemption reason required');
  const total = Math.round(gross * 100);
  const net = Math.round(total / (1 + option.rate / 100));
  return { gross: total / 100, net: net / 100, vat: (total - net) / 100, rate: option.rate, invoiceType: '11.2' as const };
}

export function isValidGreekAfm(value: string) {
  if (!/^\d{9}$/.test(value) || /^0{9}$/.test(value)) return false;
  const sum = [...value.slice(0, 8)].reduce((total, digit, index) => total + Number(digit) * 2 ** (8 - index), 0);
  return (sum % 11) % 10 === Number(value[8]);
}