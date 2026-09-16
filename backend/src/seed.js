import { pool, initializeDatabase } from './config/db.js';
import User from './models/User.js';
import Store from './models/Store.js';
import Product from './models/Product.js';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // The seed may well be the first thing run after cloning, so make sure the schema
    // exists rather than failing on 'Unknown database'.
    await initializeDatabase();

    // Create sample categories
    const categoriesQuery = `
      INSERT IGNORE INTO categories (id, name, description) VALUES 
      (1, 'Shirts', 'T-shirts and casual tops'),
      (2, 'Dresses', 'Various dress styles'),
      (3, 'Pants', 'Trousers and jeans'),
      (4, 'Shoes', 'Footwear collection'),
      (5, 'Jackets', 'Outerwear and jackets'),
      (6, 'Accessories', 'Bags, belts, and more')
    `;
    await pool.query(categoriesQuery);
    console.log('✅ Categories seeded');

    // Create sample sellers
    const sellers = [
      { name: 'Mud', email: 'mud@zamglam.local', password: 'MUD123456' },
      { name: 'Jets', email: 'jets@zamglam.local', password: 'JETS123456' },
      { name: 'Bata', email: 'bata@zamglam.local', password: 'BATA123456' },
      { name: 'Pep', email: 'pep@zamglam.local', password: 'PEP123456' },
      { name: 'Mr Price Zambia', email: 'mrprice@zamglam.local', password: 'MRPRICE123456' },
      { name: 'Fashions Galore', email: 'fashionsgalore@zamglam.local', password: 'FASHION123456' },
    ];

    const sellerIds = [];
    for (const seller of sellers) {
      try {
        const existingUser = await User.findByEmail(seller.email);
        if (!existingUser) {
          const userId = await User.create({
            name: seller.name,
            email: seller.email,
            password: seller.password,
            role: 'seller',
            // Without this the shop is filed as "Mud's store" while its storefront is
            // called "Mud", and the admin console shows the two different names.
            shop_name: seller.name,
            phone: '+260-' + Math.random().toString().slice(2, 11),
          });
          sellerIds.push(userId);
          console.log(`✅ Created seller: ${seller.name}`);
        } else {
          sellerIds.push(existingUser.id);
        }
      } catch (error) {
        console.log(`⚠️  Seller ${seller.email} already exists`);
      }
    }

    // Create stores for sellers
    const storeData = [
      {
        seller_id: null,
        name: 'Mud',
        location: 'Lusaka, Zambia',
        open_hours: { open: '09:00', close: '18:00' },
      },
      {
        seller_id: null,
        name: 'Jets',
        location: 'Lusaka, Zambia',
        open_hours: { open: '08:00', close: '19:00' },
      },
      {
        seller_id: null,
        name: 'Bata',
        location: 'Lusaka, Zambia',
        open_hours: { open: '10:00', close: '20:00' },
      },
      { seller_id: null, name: 'Pep', location: 'Lusaka, Zambia', open_hours: { open: '08:00', close: '18:00' } },
      { seller_id: null, name: 'Mr Price Zambia', location: 'Lusaka, Zambia', open_hours: { open: '09:00', close: '19:00' } },
      { seller_id: null, name: 'Fashions Galore', location: 'Lusaka, Zambia', open_hours: { open: '09:00', close: '18:00' } },
    ];

    // sellers rows either link to a users row via user_id, or hold the login directly, in
    // which case User.create already returned the sellers.id itself (see User.js).
    const [sellerUserIdColumn] = await pool.query(
      `SELECT COUNT(*) AS count FROM information_schema.columns
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sellers' AND COLUMN_NAME = 'user_id'`,
    );
    const sellersLinkToUsers = Number(sellerUserIdColumn[0]?.count || 0) > 0;

    for (let index = 0; index < sellerIds.length; index += 1) {
      if (sellersLinkToUsers) {
        const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [sellerIds[index]]);
        storeData[index].seller_id = sellerRows[0]?.id;
      } else {
        storeData[index].seller_id = sellerIds[index];
      }
    }

    const storeIds = [];
    for (const store of storeData) {
      try {
        const existingStore = await Store.findBySellerId(store.seller_id);
        if (!existingStore) {
          const storeId = await Store.create({
            seller_id: store.seller_id,
            name: store.name,
            description: `Official ${store.name} store`,
            logo_url: `/images/logos/${store.name === 'Mr Price Zambia' ? 'mrprice' : store.name.toLowerCase().replaceAll(' ', '')}.png`,
            location: store.location,
            open_hours: store.open_hours,
          });
          storeIds.push(storeId);
          console.log(`✅ Created store: ${store.name}`);
        } else {
            await Store.update(existingStore.id, {
              logo_url: `/images/logos/${store.name === 'Mr Price Zambia' ? 'mrprice' : store.name.toLowerCase().replaceAll(' ', '')}.png`,
            });
          storeIds.push(existingStore.id);
        }
      } catch (error) {
        console.log(`⚠️  Store for seller ${store.seller_id} already exists`);
      }
    }

    // Seed sample products
    const products = [
      // Mud Store products
      {
        store_id: storeIds[0],
        category_id: 3,
        name: 'Classic Denim Pants',
        description: 'Everyday denim with a comfortable straight fit.',
        price: 350,
        stock: 50,
        audience: 'unisex',
        sizes: ['S', 'M', 'L', 'XL'],
      },
      {
        store_id: storeIds[0],
        category_id: 1,
        name: 'Casual Cotton Shirt',
        description: 'Soft cotton shirt for easy everyday dressing.',
        price: 250,
        stock: 30,
        audience: 'women',
        sizes: ['XS', 'S', 'M', 'L'],
      },
      {
        store_id: storeIds[0], category_id: 4, name: 'Leather Shoes', description: 'Polished leather shoes for work and weekends.', price: 600, stock: 25, audience: 'unisex', sizes: ['6', '7', '8', '9', '10']
      },
      // Jets Store products
      {
        store_id: storeIds[1],
        category_id: 3,
        name: 'Slim Fit Pants',
        description: 'Clean slim-fit pants with everyday stretch.',
        price: 400,
        stock: 40,
        audience: 'men',
        sizes: ['28', '30', '32', '34', '36'],
      },
      {
        store_id: storeIds[1],
        category_id: 1,
        name: 'Formal White Shirt',
        description: 'Crisp white shirt for formal occasions.',
        price: 300,
        stock: 25,
        audience: 'unisex',
        sizes: ['S', 'M', 'L', 'XL'],
      },
      {
        store_id: storeIds[1], category_id: 4, name: 'Sneakers', description: 'Lightweight sneakers for daily movement.', price: 500, stock: 25, audience: 'unisex', sizes: ['6', '7', '8', '9', '10']
      },
      // Bata Store products
      {
        store_id: storeIds[2],
        category_id: 3, name: 'Comfort Fit Pants', description: 'Comfort-first pants for long days.', price: 280, stock: 30, audience: 'unisex', sizes: ['S', 'M', 'L', 'XL']
      },
      { store_id: storeIds[2], category_id: 1, name: 'Printed T-Shirt', description: 'A bright printed cotton tee.', price: 200, stock: 35, audience: 'unisex', sizes: ['S', 'M', 'L', 'XL'] },
      { store_id: storeIds[2], category_id: 4, name: 'School Shoes', description: 'Durable school shoes built for every term.', price: 450, stock: 30, audience: 'kids', sizes: ['1', '2', '3', '4', '5'] },
      { store_id: storeIds[3], category_id: 3, name: 'Kids Pants', description: 'Play-ready pants with a comfortable fit.', price: 150, stock: 40, audience: 'kids', sizes: ['2', '4', '6', '8', '10'] },
      { store_id: storeIds[3], category_id: 1, name: 'Graphic Tee', description: 'A fun graphic tee for everyday outfits.', price: 180, stock: 40, audience: 'kids', sizes: ['2', '4', '6', '8', '10'] },
      { store_id: storeIds[3], category_id: 4, name: 'Sandals', description: 'Lightweight sandals for sunny days.', price: 220, stock: 30, audience: 'kids', sizes: ['1', '2', '3', '4', '5'] },
      { store_id: storeIds[4], category_id: 3, name: 'Jogger Pants', description: 'Relaxed joggers with a polished finish.', price: 320, stock: 30, audience: 'unisex', sizes: ['S', 'M', 'L', 'XL'] },
      { store_id: storeIds[4], category_id: 1, name: 'Casual Shirt', description: 'An easy shirt for weekday layering.', price: 270, stock: 30, audience: 'unisex', sizes: ['S', 'M', 'L', 'XL'] },
      { store_id: storeIds[4], category_id: 4, name: 'Canvas Shoes', description: 'Versatile canvas shoes for daily wear.', price: 350, stock: 30, audience: 'unisex', sizes: ['6', '7', '8', '9', '10'] },
      { store_id: storeIds[5], category_id: 3, name: 'Designer Pants', description: 'Tailored statement pants from a local edit.', price: 500, stock: 20, audience: 'women', sizes: ['S', 'M', 'L', 'XL'] },
      { store_id: storeIds[5], category_id: 1, name: 'Silk Shirt', description: 'A softly draped silk shirt for occasion dressing.', price: 450, stock: 20, audience: 'women', sizes: ['S', 'M', 'L', 'XL'] },
      { store_id: storeIds[5], category_id: 4, name: 'Luxury Shoes', description: 'Polished shoes for elevated evenings.', price: 800, stock: 15, audience: 'women', sizes: ['6', '7', '8', '9', '10'] },
    ];

    for (const product of products) {
      try {
        // Sellers and stores are guarded above; products need the same guard or a second
        // seed run silently doubles the whole catalogue.
        const [existingProduct] = await pool.query(
          'SELECT id FROM products WHERE name = ? AND store_id = ? LIMIT 1',
          [product.name, product.store_id],
        );
        if (existingProduct[0]) {
          console.log(`↷ Product already exists: ${product.name}`);
          continue;
        }

        const storeIndex = storeIds.indexOf(product.store_id);
        const imageFiles = {
          'Classic Denim Pants': 'mud-denim.jpg', 'Casual Cotton Shirt': 'mud-shirt.jpg', 'Leather Shoes': 'mud-shoes.jpg',
          'Slim Fit Pants': 'jets-pants.jpg', 'Formal White Shirt': 'jets-shirt.jpg', Sneakers: 'jets-sneakers.jpg',
          'Comfort Fit Pants': 'bata-pants.jpg', 'Printed T-Shirt': 'bata-tshirt.jpg', 'School Shoes': 'bata-schoolshoes.jpg',
          'Kids Pants': 'pep-kidspants.jpg', 'Graphic Tee': 'pep-graphictee.jpg', Sandals: 'pep-sandals.jpg',
          'Jogger Pants': 'mrprice-joggers.jpg', 'Casual Shirt': 'mrprice-shirt.jpg', 'Canvas Shoes': 'mrprice-canvas.jpg',
          'Designer Pants': 'fg-designerpants.jpg', 'Silk Shirt': 'fg-silkshirt.jpg', 'Luxury Shoes': 'fg-luxuryshoes.jpg',
        };
        product.seller_id = storeData[storeIndex].seller_id;
        product.image_url = `/images/products/${imageFiles[product.name]}`;
        await Product.create(product);
        console.log(`✅ Created product: ${product.name}`);
      } catch (error) {
        console.log(`⚠️  Product ${product.name} creation failed:`, error.message);
      }
    }

    // The demo shops are pre-verified so the storefront shows the verified state out of
    // the box. Sellers who register themselves start as 'pending' and go through the
    // admin review queue.
    for (const seller of sellers) {
      if (sellersLinkToUsers) {
        await pool.query(
          "UPDATE sellers s JOIN users u ON u.id = s.user_id SET s.verification_status = 'verified', s.verified_at = CURRENT_TIMESTAMP WHERE u.email = ?",
          [seller.email],
        );
      } else {
        await pool.query(
          "UPDATE sellers SET verification_status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE email = ?",
          [seller.email],
        );
      }
    }
    console.log('✅ Demo sellers marked verified');

    // Create sample couriers. Orders are auto-assigned to one of these at checkout, and
    // only the assigned courier can mark that parcel delivered.
    const couriers = [
      { name: 'Mwansa Phiri', email: 'mwansa@zamglamcourier.local', password: 'COURIER123456', phone: '+260-970-111-001' },
      { name: 'Thandiwe Zulu', email: 'thandiwe@zamglamcourier.local', password: 'COURIER123456', phone: '+260-970-111-002' },
      { name: 'Joseph Banda', email: 'joseph@zamglamcourier.local', password: 'COURIER123456', phone: '+260-970-111-003' },
    ];

    for (const courier of couriers) {
      try {
        const existing = await User.findByEmail(courier.email);
        if (!existing) {
          await User.create({ ...courier, role: 'courier' });
          console.log(`✅ Created courier: ${courier.name}`);
        }
        // Demo couriers start on duty so the pickup pool is visible out of the box.
        await pool.query('UPDATE couriers SET on_shift = 1 WHERE email = ?', [courier.email]);
      } catch (error) {
        console.log(`⚠️  Courier ${courier.email} creation failed:`, error.message);
      }
    }

    // Create the admin who reviews vendor verification.
    try {
      const adminEmail = 'admin@zamglam.local';
      if (!(await User.findByEmail(adminEmail))) {
        await User.create({ name: 'Zamglam Admin', email: adminEmail, password: 'ADMIN123456', role: 'admin' });
        console.log('✅ Created admin account');
      }
    } catch (error) {
      console.log('⚠️  Admin creation failed:', error.message);
    }

    // Create sample customer
    try {
      const customerEmail = 'customer@zamglam.local';
      const existingCustomer = await User.findByEmail(customerEmail);
      if (!existingCustomer) {
        await User.create({
          name: 'John Doe',
          email: customerEmail,
          password: 'CUSTOMER123456',
          phone: '+260-123456789',
          role: 'customer',
        });
        console.log('✅ Created sample customer');
      }
    } catch (error) {
      console.log('⚠️  Customer already exists');
    }

    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
