import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, initializeDatabase } from './config/db.js';
import Product from './models/Product.js';
import { resolveCategoryId } from './utils/accounts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imageDirectory = path.resolve(__dirname, '../uploads/clothes');

// File order follows the attached IMG_6325.JPG through IMG_6368.JPG collection.
const garments = [
  ['IMG_6325.JPG', 'Brown Pinstripe Fitted Shirt', 'Shirts', 340, 'women', 'A fitted short-sleeve button shirt with fine pinstripes.'],
  ['IMG_6326.JPG', 'Sand Asymmetric Ribbed Top', 'Tops', 280, 'women', 'A soft ribbed top with an asymmetric neckline.'],
  ['IMG_6327.JPG', 'Denim Button Vest', 'Tops', 420, 'women', 'A light-blue denim vest with a button front.'],
  ['IMG_6328.JPG', 'Light Wash Wrap Denim Skirt', 'Skirts', 480, 'women', 'A long light-wash denim skirt with a wrap front.'],
  ['IMG_6329.JPG', 'Black Column Maxi Dress', 'Dresses', 620, 'women', 'A clean black column dress with a floor-length silhouette.'],
  ['IMG_6330.JPG', 'Wine Sleeveless Maxi Dress', 'Dresses', 680, 'women', 'A rich wine-red sleeveless dress with a long fitted shape.'],
  ['IMG_6331.JPG', 'Espresso Draped Mini Dress', 'Dresses', 520, 'women', 'A dark-brown asymmetric mini dress with soft draping.'],
  ['IMG_6332.JPG', 'Black Ruched Midi Skirt', 'Skirts', 420, 'women', 'A black fitted midi skirt with gathered detailing.'],
  ['IMG_6333.JPG', 'Brown Plaid Ruffle Maxi Skirt', 'Skirts', 520, 'women', 'A flowing brown plaid skirt with layered ruffles.'],
  ['IMG_6334.JPG', 'Black Tiered Mini Skirt', 'Skirts', 380, 'women', 'A black tiered mini skirt with a gathered hem.'],
  ['IMG_6335.JPG', 'Blue Stripe Wrap Blouse', 'Shirts', 360, 'women', 'A blue-and-white striped wrap blouse with a waist tie.'],
  ['IMG_6336.JPG', 'Black Zip Front Romper', 'Jumpsuits', 490, 'women', 'A black ribbed short romper with a front zip.'],
  ['IMG_6337.JPG', 'Chambray Vest Trouser Set', 'Sets', 780, 'women', 'A coordinated light denim vest and trouser set.'],
  ['IMG_6338.JPG', 'White Polka Dot Slip Maxi Dress', 'Dresses', 650, 'women', 'A white spaghetti-strap maxi dress with dark polka dots.'],
  ['IMG_6339.JPG', 'Navy Polka Dot Halter Mini Dress', 'Dresses', 530, 'women', 'A navy halter mini dress with a white dot print.'],
  ['IMG_6340.JPG', 'Dark Wash Wide Leg Jeans', 'Pants', 650, 'women', 'Dark indigo high-rise jeans with a relaxed wide leg.'],
  ['IMG_6341.JPG', 'Light Wash Wide Leg Jeans', 'Pants', 620, 'women', 'Light-blue high-rise jeans with a wide leg.'],
  ['IMG_6342.JPG', 'Mid Wash Straight Jeans', 'Pants', 620, 'women', 'Classic mid-blue denim jeans with a straight cut.'],
  ['IMG_6343.JPG', 'Black Flare Trousers', 'Pants', 520, 'women', 'Black high-rise trousers with a flared leg.'],
  ['IMG_6344.JPG', 'Black Faux Leather Wide Leg Trousers', 'Pants', 680, 'women', 'Statement black faux-leather trousers with a wide leg.'],
  ['IMG_6345.JPG', 'Black Stripe Crewneck Tee', 'Shirts', 260, 'unisex', 'A white crewneck tee with fine black horizontal stripes.'],
  ['IMG_6346.JPG', 'White Eyelet Peplum Top', 'Tops', 340, 'women', 'A white eyelet top with a softly flared peplum hem.'],
  ['IMG_6347.JPG', 'Pink Lily Print Top', 'Tops', 360, 'women', 'A white fitted top with a large pink lily print.'],
  ['IMG_6348.JPG', 'White Sleeveless Fitted Top', 'Tops', 280, 'women', 'A simple white sleeveless top with a close fit.'],
  ['IMG_6349.JPG', 'Cinnamon Bell Sleeve Crop Blouse', 'Shirts', 430, 'women', 'A warm-brown cropped blouse with dramatic bell sleeves.'],
  ['IMG_6350.JPG', 'Denim Pocket Mini Dress', 'Dresses', 650, 'women', 'A dark-blue denim mini dress with front pockets.'],
  ['IMG_6351.JPG', 'Dark Denim Cropped Shirt', 'Shirts', 520, 'women', 'A structured cropped denim shirt with short sleeves.'],
  ['IMG_6352.JPG', 'Cocoa Collared Maxi Dress', 'Dresses', 640, 'women', 'A fitted cocoa-brown maxi dress with a contrast collar.'],
  ['IMG_6353.JPG', 'Ivory Halter Slit Gown', 'Dresses', 780, 'women', 'An ivory halter gown with a front slit.'],
  ['IMG_6354.JPG', 'Mocha Ruched Long Sleeve Dress', 'Dresses', 640, 'women', 'A mocha fitted dress with long sleeves and waist ruching.'],
  ['IMG_6355.JPG', 'Ivory Pinstripe Two Piece Set', 'Sets', 850, 'women', 'A coordinated ivory pinstripe top and wide-leg trouser set.'],
  ['IMG_6356.JPG', 'Black Side Slit Midi Skirt', 'Skirts', 430, 'women', 'A simple black midi skirt with a side slit.'],
  ['IMG_6357.JPG', 'Ivory Floral Maxi Dress', 'Dresses', 760, 'women', 'A light floral maxi dress with a soft flowing skirt.'],
  ['IMG_6358.JPG', 'Caramel Stripe Polo Romper', 'Jumpsuits', 460, 'women', 'A short-sleeve collared romper with caramel stripes.'],
  ['IMG_6359.JPG', 'Monochrome Stripe Halter Romper', 'Jumpsuits', 490, 'women', 'A black-and-white striped halter romper.'],
  ['IMG_6360.JPG', 'Cream Lace Wrap Mini Skirt', 'Skirts', 360, 'women', 'A cream wrap mini skirt with a lace-trimmed drape.'],
  ['IMG_6361.JPG', 'Cocoa Ruched Two Piece Set', 'Sets', 820, 'women', 'A coordinated cocoa top and long skirt with side ties.'],
  ['IMG_6362.JPG', 'Burgundy Ruched Two Piece Set', 'Sets', 820, 'women', 'A coordinated burgundy top and long skirt with side ties.'],
  ['IMG_6363.JPG', 'Black Ribbed Two Piece Set', 'Sets', 740, 'women', 'A black ribbed asymmetric top and matching long skirt.'],
  ['IMG_6364.JPG', 'Taupe Ribbed Two Piece Set', 'Sets', 740, 'women', 'A taupe ribbed asymmetric top and matching long skirt.'],
  ['IMG_6365.JPG', 'Ivory Stripe Wide Leg Set', 'Sets', 780, 'women', 'An ivory striped top and matching wide-leg trousers.'],
  ['IMG_6366.JPG', 'Cream Lounge Co Ord Set', 'Sets', 700, 'women', 'A soft cream top and wide-leg trouser lounge set.'],
  ['IMG_6367.JPG', 'Vintage Graphic Cotton Tee', 'Shirts', 320, 'unisex', 'A relaxed cream tee with a vintage-inspired graphic.'],
  ['IMG_6368.JPG', 'White Polka Dot Halter Dress', 'Dresses', 580, 'women', 'A white halter dress with a dark polka-dot print.'],
];

function sizesFor(category) {
  if (category === 'Pants') return ['26', '28', '30', '32', '34', '36'];
  return ['XS', 'S', 'M', 'L', 'XL'];
}

async function seedClothes() {
  await initializeDatabase();
  if (new Set(garments.map(([filename]) => filename)).size !== garments.length) {
    throw new Error('The garment manifest contains duplicate image filenames.');
  }

  const [stores] = await pool.query(
    `SELECT store.id AS store_id, store.name AS store_name, store.seller_id,
       COUNT(product.id) AS product_count
     FROM stores store
     LEFT JOIN products product ON product.store_id = store.id
     WHERE store.status = 'open'
     GROUP BY store.id, store.name, store.seller_id
     ORDER BY store.id`,
  );
  if (!stores.length) throw new Error('No open stores are available for the clothing seed.');

  let inserted = 0;
  let skipped = 0;
  let reassigned = 0;

  for (const [index, [filename, name, category, price, audience, description]] of garments.entries()) {
    const absoluteImage = path.join(imageDirectory, filename);
    if (!existsSync(absoluteImage)) throw new Error(`Missing clothing image: ${absoluteImage}`);

    const imageUrl = `/uploads/clothes/${filename}`;
    const store = stores[index % stores.length];
    const [existingByImage] = await pool.query(
      'SELECT id, store_id, image_url, name FROM products WHERE image_url = ? LIMIT 1',
      [imageUrl],
    );
    if (existingByImage.length) {
      const existingProduct = existingByImage[0];
      if (existingProduct.name !== name) throw new Error(`Image is already used by another product: ${filename}`);
      if (Number(existingProduct.store_id) !== Number(store.store_id)) {
        await pool.query('UPDATE products SET store_id = ?, seller_id = ? WHERE id = ?', [store.store_id, store.seller_id, existingProduct.id]);
        reassigned += 1;
      }
      skipped += 1;
      continue;
    }

    const [nameConflict] = await pool.query('SELECT id FROM products WHERE name = ? LIMIT 1', [name]);
    if (nameConflict.length) throw new Error(`Product name already exists with another image: ${name}`);
    const categoryId = await resolveCategoryId(category);
    await Product.create({
      seller_id: store.seller_id,
      store_id: store.store_id,
      category_id: categoryId,
      name,
      description,
      price,
      stock: 10,
      image_url: imageUrl,
      audience,
      sizes: sizesFor(category),
      images: [imageUrl],
    });

    inserted += 1;
    console.log(`Added ${name} to ${store.store_name}`);
  }

  const [totals] = await pool.query(
    `SELECT store.id AS store_id, store.name AS store_name, COUNT(product.id) AS product_count,
       SUM(CASE WHEN product.image_url LIKE '/uploads/clothes/%' THEN 1 ELSE 0 END) AS supplied_clothes
     FROM stores store
     LEFT JOIN products product ON product.store_id = store.id
     WHERE store.status = 'open'
     GROUP BY store.id, store.name
     ORDER BY store.id`,
  );
  console.log(`Clothing seed complete: ${inserted} added, ${skipped} already present, ${reassigned} reassigned.`);
  console.log(`Open-store inventory totals: ${JSON.stringify(totals)}`);
}

seedClothes()
  .catch((error) => {
    console.error('Clothing seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
