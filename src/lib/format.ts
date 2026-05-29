export const fmtInt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n || 0));

export const fmtCompact = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n || 0);

export const fmtPct = (n: number, digits = 0) =>
  `${((Number.isFinite(n) ? n : 0) * 100).toFixed(digits)}%`;

export const fmtWeeks = (n: number) =>
  `${(Number.isFinite(n) ? n : 0).toFixed(1)}w`;
