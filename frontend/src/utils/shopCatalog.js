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
import { getLocalProducts } from './productStore';

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

export function getFallbackCatalog() {
  return fallbackCatalog.map((product) => ({ ...product, sellerName: product.store_name }));
}

export function mergeShopProducts(remote = []) {
  const local = getLocalProducts();
  const remoteItems = Array.isArray(remote) ? remote : [];
  const base = remoteItems.length ? remoteItems : getFallbackCatalog();
  const localIds = new Set(local.map((product) => String(product.id)));
  return [...local, ...base.filter((product) => !localIds.has(String(product.id)))];
}

export function findShopProduct(id, remote = []) {
  return mergeShopProducts(remote).find((product) => String(product.id) === String(id)) || null;
}

export function getStoreLocalProducts(storeName) {
  const name = String(storeName || '').toLowerCase();
  return getLocalProducts().filter((product) => String(product.store_name || product.sellerName || '').toLowerCase() === name);
}
