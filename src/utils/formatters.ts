/**
 * Para tutarlarında hassasiyet kaybını önlemek için 2 basamaklı kuruş yuvarlaması
 */
export function roundAmount(value: number): number {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Sayıyı Türk Lirası para birimi formatına çevirir (Örn: ₺1.250,50)
 */
export function formatCurrency(amount: number): string {
  let rounded = roundAmount(amount);
  if (rounded === 0 || Object.is(rounded, -0)) {
    rounded = 0;
  }
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/**
 * String veya Date nesnesini yerel saat dilimine göre Date nesnesine çevirir.
 * YYYY-MM-DD stringleri UTC midnight sapmasını önlemek için yerel saat diliminde ayrıştırılır.
 */
function parseLocalDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  if (typeof dateInput === 'string') {
    const ymdMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      return new Date(year, month, day);
    }
    return new Date(dateInput);
  }
  return new Date(NaN);
}

/**
 * ISO tarih string veya Date nesnesini kullanıcı dostu Türkçe tarihe çevirir
 * @example formatDate('2026-09-21') => '21 Eylül 2026'
 */
export function formatDate(dateInput: string | Date): string {
  const date = parseLocalDate(dateInput);
  if (isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Kısa tarih formatı (Örn: 21 Eyl)
 */
export function formatShortDate(dateInput: string | Date): string {
  const date = parseLocalDate(dateInput);
  if (isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

/**
 * Yıl ve Ayı iki basamaklı string formatına çevirir (Örn: year=2026, month=9 => '2026-09')
 */
export function formatYearMonth(year: number, month: number): string {
  const paddedMonth = month.toString().padStart(2, '0');
  return `${year}-${paddedMonth}`;
}

