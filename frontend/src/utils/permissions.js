// Couriers work the delivery side of the marketplace: they browse the catalogue and check
// prices, but they do not buy. Keeping this in one place stops the rule drifting between
// the product card, the product page, the deals banner and the cart.
export function canShop(user) {
  return user?.role !== 'courier';
}

export const NO_SHOPPING_MESSAGE = 'Courier accounts can browse the catalogue and check prices, but cannot place orders.';
