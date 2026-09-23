// Shows a price as Zambian kwacha, always with two decimal places.
//
// Anything that is not a number shows as ZMW 0.00 rather than "ZMW NaN".

export function formatZmwPrice(price) {
  const amount = Number(price);
  return `ZMW ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}