export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(value / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

export function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

export function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), max); }

export function generateUUID() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2); }