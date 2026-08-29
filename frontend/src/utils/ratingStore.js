const STORAGE_KEY = 'zamglam_seller_ratings';

function readRatings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function writeRatings(ratings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  return ratings;
}

export function getRatings() {
  return readRatings();
}

export function getSellerRatings(sellerName) {
  const name = String(sellerName || '').toLowerCase();
  return readRatings().filter((rating) => String(rating.sellerName || '').toLowerCase() === name);
}

export function getSellerScore(sellerName) {
  const ratings = getSellerRatings(sellerName);
  if (!ratings.length) return { average: 0, count: 0 };
  const average = ratings.reduce((total, rating) => total + Number(rating.stars || 0), 0) / ratings.length;
  return { average: Number(average.toFixed(1)), count: ratings.length };
}

export function findRating(orderId, sellerName, customerEmail) {
  return readRatings().find((rating) => (
    rating.orderId === orderId
    && rating.sellerName === sellerName
    && rating.customerEmail === customerEmail
  ));
}

export function replyToRating(id, reply) {
  return writeRatings(readRatings().map((rating) => (
    rating.id === id ? { ...rating, reply, repliedAt: new Date().toISOString().slice(0, 10) } : rating
  )));
}

export function saveRating({ orderId, sellerName, customerEmail, customerName, stars, comment, productName }) {
  const ratings = readRatings().filter((rating) => !(
    rating.orderId === orderId
    && rating.sellerName === sellerName
    && rating.customerEmail === customerEmail
  ));
  ratings.unshift({
    id: `rate-${Date.now()}`,
    orderId,
    sellerName,
    customerEmail: customerEmail || 'guest',
    customerName: customerName || 'Zamglam shopper',
    stars: Number(stars),
    comment: comment || '',
    productName,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  return writeRatings(ratings);
}
