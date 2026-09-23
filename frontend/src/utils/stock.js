// How many of something can be bought, or null when that is not known.
//
// Number(null) and Number('') are both 0, which would mark an item with no stock figure as
// sold out. Only a real number counts as a limit; anything else means "no limit known",
// and the server still checks stock when the order is placed.
export function stockLimit(stock) {
  if (stock === null || stock === undefined || stock === '') return null;
  const value = Number(stock);
  return Number.isFinite(value) ? Math.max(0, value) : null;
}
