// Per-browser product click counts, used for the "Trending" sort and badge.
//
// This file used to also hold a localStorage store of seller products. That has been
// removed: products now live in MySQL via the API, because a product that existed only
// in the seller's browser was visible to shoppers but impossible to order (checkout
// resolves every product server-side).
const CLICK_STORAGE_KEY = 'zamglam_product_clicks';

function readClicks() {
  try {
    const stored = localStorage.getItem(CLICK_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function recordProductClick(id) {
  try {
    const clicks = readClicks();
    const key = String(id);
    clicks[key] = Number(clicks[key] || 0) + 1;
    localStorage.setItem(CLICK_STORAGE_KEY, JSON.stringify(clicks));
  } catch {
    // Click analytics are a nice-to-have; never break browsing over them.
  }
}

export function getProductClickCount(id) {
  return Number(readClicks()[String(id)] || 0);
}
