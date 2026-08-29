const STORAGE_KEY = 'zamglam_seller_products';

function readProducts() {
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

function writeProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  return products;
}

export function getLocalProducts() {
  return readProducts();
}

export function getLocalSellerProducts(sellerEmail) {
  const products = readProducts();
  if (!sellerEmail) return products;
  return products.filter((product) => product.sellerEmail === sellerEmail);
}

export function upsertLocalProduct(product) {
  const products = readProducts();
  const nextProduct = {
    ...product,
    id: product.id || `local-${Date.now()}`,
    images: product.images?.length ? product.images : (product.image_url ? [product.image_url] : []),
    image_url: product.image_url || product.images?.[0] || '',
    createdAt: product.createdAt || new Date().toISOString(),
  };
  const index = products.findIndex((item) => String(item.id) === String(nextProduct.id));
  if (index >= 0) products[index] = { ...products[index], ...nextProduct };
  else products.unshift(nextProduct);
  return writeProducts(products);
}

export function deleteLocalProduct(id) {
  return writeProducts(readProducts().filter((product) => String(product.id) !== String(id)));
}

export function ensureDemoSellerProducts(sellerEmail) {
  const products = readProducts();
  if (products.some((product) => product.sellerEmail === sellerEmail)) return products;

  return writeProducts([
    {
      id: 'local-mud-shirt',
      name: 'Mud Denim Shirt',
      description: 'A store favourite from the Mud collection.',
      price: 380,
      stock: 8,
      category: 'clothes',
      image_url: '/images/products/mud-shirt.jpg',
      images: ['/images/products/mud-shirt.jpg'],
      sellerEmail,
      sellerName: 'Mud',
      store_name: 'Mud',
      createdAt: '2026-08-01',
    },
    {
      id: 'local-mud-shoes',
      name: 'Mud Canvas Shoes',
      description: 'Everyday shoes ready for Lusaka streets.',
      price: 480,
      stock: 5,
      category: 'shoes',
      image_url: '/images/products/mud-shoes.jpg',
      images: ['/images/products/mud-shoes.jpg'],
      sellerEmail,
      sellerName: 'Mud',
      store_name: 'Mud',
      createdAt: '2026-08-08',
    },
    ...products,
  ]);
}
