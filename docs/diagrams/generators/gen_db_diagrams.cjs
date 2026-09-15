// Builds the two database diagrams FROM THE LIVE DATABASE, so neither can drift from what
// the application actually creates:
//
//   04-database-schema.drawio  every table, every column, its type and its keys
//   03-er-diagram.drawio       the entities and how they relate, without the column detail
//
// Run from backend/ so the database config resolves.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { node, child, edge, file, S } = require('./drawio.cjs');

const OUT = process.argv[2] || '.';
const DB = process.argv[3] || 'zamglam_db_test';

// Tables the application no longer writes to, drawn faded so a reader is not misled into
// thinking they are part of the current design.
const LEGACY = new Set(['users', 'courier']);

// Where each table sits on the page. Grouped by what it is for, left to right.
const LAYOUT = {
  customers:            { x: 40,   y: 60,  group: 'accounts' },
  sellers:              { x: 40,   y: 330, group: 'accounts' },
  couriers:             { x: 40,   y: 660, group: 'accounts' },
  admins:               { x: 40,   y: 980, group: 'accounts' },
  users:                { x: 40,   y: 1180, group: 'legacy' },

  stores:               { x: 340,  y: 330, group: 'catalogue' },
  products:             { x: 340,  y: 560, group: 'catalogue' },
  categories:           { x: 340,  y: 900, group: 'catalogue' },
  documents:            { x: 340,  y: 60,  group: 'catalogue' },

  orders:               { x: 660,  y: 60,  group: 'orders' },
  order_items:          { x: 660,  y: 400, group: 'orders' },
  shipments:            { x: 660,  y: 620, group: 'orders' },
  order_status_history: { x: 660,  y: 1000, group: 'orders' },
  payments:             { x: 660,  y: 1230, group: 'orders' },
  cart:                 { x: 980,  y: 60,  group: 'orders' },
  courier:              { x: 980,  y: 1230, group: 'legacy' },

  reviews:              { x: 980,  y: 280, group: 'trust' },
  reports:              { x: 980,  y: 560, group: 'trust' },
};

// Relationships. Drawn from the foreign keys the schema declares, plus the ones the
// application maintains in code without a database-level constraint (noted as such).
const RELATIONSHIPS = [
  ['customers', 'orders', '1', 'places'],
  ['orders', 'order_items', 'N', 'contains'],
  ['products', 'order_items', 'N', 'ordered as'],
  ['orders', 'shipments', 'N', 'splits into'],
  ['sellers', 'shipments', 'N', 'packs'],
  ['couriers', 'shipments', 'N', 'carries'],
  ['orders', 'order_status_history', 'N', 'tracked by'],
  ['orders', 'payments', '1', 'paid by'],
  ['sellers', 'stores', '1', 'runs'],
  ['sellers', 'products', 'N', 'sells'],
  ['stores', 'products', 'N', 'displays'],
  ['categories', 'products', 'N', 'groups'],
  ['sellers', 'documents', 'N', 'submits'],
  ['customers', 'cart', 'N', 'fills'],
  ['products', 'cart', 'N', 'held in'],
  ['customers', 'reviews', 'N', 'writes'],
  ['sellers', 'reviews', 'N', 'rated by'],
  ['orders', 'reports', 'N', 'complained about on'],
];

function fieldLabel(col) {
  const key = col.Key === 'PRI' ? 'PK  ' : col.Key === 'MUL' ? 'FK  ' : col.Key === 'UNI' ? 'UQ  ' : '      ';
  const type = col.Type.replace(/\(\d+\)/, '').replace('unsigned', '').trim();
  const nullable = col.Null === 'NO' ? '' : '  ·  null';
  return `${key}${col.Field}   ${type}${nullable}`;
}

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: DB,
  });

  const [tableRows] = await connection.query('SHOW TABLES');
  const tables = tableRows.map((r) => Object.values(r)[0]).filter((t) => LAYOUT[t]);

  const columns = {};
  for (const table of tables) {
    const [cols] = await connection.query(`SHOW FULL COLUMNS FROM \`${table}\``);
    columns[table] = cols;
  }
  await connection.end();

  // ---------- 04: the full physical schema ----------
  {
    const cells = [];
    cells.push(node({ id: 'title', value: 'Zamglam — database schema', x: 40, y: 10, w: 600, h: 30, style: S.title }));
    cells.push(node({
      id: 'sub',
      value: 'Every table the application creates, with its columns, types and keys. Generated from the running database.',
      x: 40, y: 34, w: 900, h: 20, style: S.caption,
    }));

    for (const table of tables) {
      const place = LAYOUT[table];
      const cols = columns[table];
      const width = 260;
      const height = 26 + cols.length * 18;
      const legacy = LEGACY.has(table);

      cells.push(node({
        id: table,
        value: legacy ? `${table}   (legacy)` : table,
        x: place.x, y: place.y, w: width, h: height,
        style: legacy ? S.table + 'opacity=50;' : (place.group === 'orders' ? S.tableAccent : S.table),
      }));

      cols.forEach((col, i) => {
        cells.push(child({
          id: `${table}__${col.Field}`,
          value: fieldLabel(col),
          y: 26 + i * 18,
          w: width,
          h: 18,
          style: col.Key === 'PRI' ? S.fieldKey : S.field,
          parent: table,
        }));
      });
    }

    cells.push(node({
      id: 'note-legacy',
      value: 'Faded tables are kept only so databases built by earlier versions keep working.\n'
        + 'A current database does not use them: logins live on the account rows themselves,\n'
        + 'and parcels live in shipments.',
      x: 980, y: 1000, w: 300, h: 90, style: S.note,
    }));

    fs.writeFileSync(path.join(OUT, '04-database-schema.drawio'), file('Database schema', cells));
    console.log('04-database-schema.drawio   ' + tables.length + ' tables');
  }

  // ---------- 03: the entity relationships ----------
  {
    const cells = [];
    cells.push(node({ id: 'title', value: 'Zamglam — entity relationship diagram', x: 40, y: 10, w: 600, h: 30, style: S.title }));
    cells.push(node({
      id: 'sub',
      value: 'How the entities relate. An ORDER is what a customer bought; a SHIPMENT is one shop’s parcel within it.',
      x: 40, y: 34, w: 900, h: 20, style: S.caption,
    }));

    // A compact layout for the conceptual view: entity boxes only, no columns.
    const ER = {
      customers: { x: 60, y: 120 }, orders: { x: 340, y: 120 }, order_items: { x: 620, y: 60 },
      products: { x: 620, y: 260 }, shipments: { x: 340, y: 300 }, couriers: { x: 60, y: 300 },
      sellers: { x: 620, y: 440 }, stores: { x: 900, y: 440 }, categories: { x: 900, y: 260 },
      documents: { x: 900, y: 560 }, cart: { x: 60, y: 460 }, reviews: { x: 340, y: 560 },
      reports: { x: 60, y: 620 }, order_status_history: { x: 340, y: 440 }, payments: { x: 340, y: 660 },
    };

    for (const [table, place] of Object.entries(ER)) {
      if (!columns[table]) continue;
      const pk = columns[table].filter((c) => c.Key === 'PRI').map((c) => c.Field);
      const count = columns[table].length;
      cells.push(node({
        id: table,
        value: `<b>${table}</b><br/><font style="font-size:10px;color:#475569">${count} columns · key ${pk.join(', ') || 'id'}</font>`,
        x: place.x, y: place.y, w: 200, h: 50,
        style: ['orders', 'shipments'].includes(table) ? S.boxAccent : S.box,
      }));
    }

    RELATIONSHIPS.forEach(([from, to, cardinality, label], i) => {
      if (!ER[from] || !ER[to]) return;
      cells.push(edge({
        id: `r${i}`,
        value: `${label}  (1:${cardinality})`,
        source: from,
        target: to,
        style: S.arrowLabel,
      }));
    });

    cells.push(node({
      id: 'note-er',
      value: 'The relationship that matters most:\n'
        + 'one order splits into one shipment per shop.\n'
        + 'That is what makes the platform multi-vendor\n'
        + 'rather than a single shop with several owners.',
      x: 900, y: 120, w: 240, h: 90, style: S.note,
    }));

    fs.writeFileSync(path.join(OUT, '03-er-diagram.drawio'), file('ER diagram', cells));
    console.log('03-er-diagram.drawio        ' + Object.keys(ER).length + ' entities, ' + RELATIONSHIPS.length + ' relationships');
  }
})();
