// Shared Layer - Utils
// This directory contains pure helper functions (e.g. date formatters, currency formatting, text helpers).

export const formatCurrency = (amount: number, locale = 'vi-VN', currency = 'VND'): string => {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};
