export function formatZmwPrice(price) {
  const amount = Number(price);
  return `ZMW ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}