// Diluted share count (Loop 11): the treasury-stock method and if-converted. Backs `tsm_dilution`.
// Share counts in millions, prices in £.

export type OptionGrant = { count: number; strike: number };

export type TsmInput = {
  basicShares: number;
  options: OptionGrant[];
  sharePrice: number;
};

export type TsmResult = {
  dilutedShares: number;
  netNewShares: number;
  /** Only the grants that are in the money — out-of-the-money options are ignored entirely. */
  inTheMoney: OptionGrant[];
  /** Cash the company receives on exercise. */
  proceeds: number;
  /** Shares it buys back with those proceeds at the market price. */
  sharesRepurchased: number;
};

/**
 * Treasury-stock method: in-the-money options are exercised, the strike proceeds buy shares back
 * at the market price, and only the net new shares dilute. Out-of-the-money options add nothing —
 * that is the point candidates miss.
 */
export function treasuryStockMethod(i: TsmInput): TsmResult {
  const inTheMoney = i.options.filter((o) => o.strike < i.sharePrice && o.count > 0);
  const exercised = inTheMoney.reduce((s, o) => s + o.count, 0);
  const proceeds = inTheMoney.reduce((s, o) => s + o.count * o.strike, 0);
  const sharesRepurchased = i.sharePrice === 0 ? 0 : proceeds / i.sharePrice;
  const netNewShares = exercised - sharesRepurchased;
  return {
    dilutedShares: i.basicShares + netNewShares,
    netNewShares,
    inTheMoney,
    proceeds,
    sharesRepurchased,
  };
}

export type ConvertibleInput = {
  basicShares: number;
  convertible: { principal: number; conversionPrice: number };
  sharePrice: number;
};

export type ConvertibleResult = {
  dilutedShares: number;
  newShares: number;
  /** True when the share price is above the conversion price, so conversion is the live case. */
  converts: boolean;
};

/**
 * If-converted: when the share price clears the conversion price, the convertible becomes equity
 * (principal ÷ conversion price new shares) and its debt leaves the bridge. Below it, treat the
 * instrument as debt instead.
 */
export function ifConverted(i: ConvertibleInput): ConvertibleResult {
  const converts = i.sharePrice > i.convertible.conversionPrice && i.convertible.conversionPrice > 0;
  const newShares = converts ? i.convertible.principal / i.convertible.conversionPrice : 0;
  return { dilutedShares: i.basicShares + newShares, newShares, converts };
}

/** Equity value from a diluted count — the line that follows every TSM answer. */
export function equityValue(sharePrice: number, dilutedShares: number): number {
  return sharePrice * dilutedShares;
}
