// Shared Layer - Utils
// This directory contains pure helper functions (e.g. date formatters, currency formatting, text helpers).

export const formatCurrency = (amount: number, locale = 'en-US', currency = 'VND'): string => {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};

export const resolveMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5282/api";
  const rootUrl = baseUrl.replace(/\/api\/?$/, '');
  return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};
