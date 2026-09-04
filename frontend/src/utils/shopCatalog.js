import pepClothes from '../data/pep/clothes.json';
import pepShoes from '../data/pep/shoes.json';
import jetsClothes from '../data/jets/clothes.json';
import jetsShoes from '../data/jets/shoes.json';
import bataClothes from '../data/bata/clothes.json';
import bataShoes from '../data/bata/shoes.json';
import mudClothes from '../data/mud/clothes.json';
import mudShoes from '../data/mud/shoes.json';
import mrpriceClothes from '../data/mrprice/clothes.json';
import mrpriceShoes from '../data/mrprice/shoes.json';
import fashionsClothes from '../data/fashionsgalore/clothes.json';
import fashionsShoes from '../data/fashionsgalore/shoes.json';
// Note: seller products live in MySQL and arrive through the API. Nothing here may add
// products that the backend does not know about — a shopper could add them to the cart
// and checkout would then fail with "Product <id> not found".

const fallbackCatalog = [
  ...mudClothes,
  ...mudShoes,
  ...jetsClothes,
  ...jetsShoes,
  ...bataClothes,
  ...bataShoes,
  ...pepClothes,
  ...pepShoes,
  ...mrpriceClothes,
  ...mrpriceShoes,
  ...fashionsClothes,
  ...fashionsShoes,
];

// These sample products exist only in the frontend bundle, so they cannot be ordered.
// They are shown only when the backend returns nothing (e.g. it is not running), and are
// flagged unavailable so the UI can stop anyone trying to buy one.
export function getFallbackCatalog() {
  return fallbackCatalog.map((product) => ({
    ...product,
    sellerName: product.store_name,
    unavailable: true,
  }));
}

export function mergeShopProducts(remote = []) {
  const remoteItems = Array.isArray(remote) ? remote : [];
  return remoteItems.length ? remoteItems : getFallbackCatalog();
}

export function findShopProduct(id, remote = []) {
  return mergeShopProducts(remote).find((product) => String(product.id) === String(id)) || null;
}

