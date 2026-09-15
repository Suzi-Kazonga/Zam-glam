// The two database diagrams, built FROM THE LIVE DATABASE so neither can drift from what
// the application actually creates:
//
//   04-database-schema.drawio   every table, column, type and key, with its foreign keys
//   03-er-diagram.drawio        the entities and how they relate, without column detail
//
// Needs mysql2, so run it from backend/ — see the README beside this file.
const fs = require('fs');
const path = require('path');
// The database driver lives in backend/node_modules, and Node looks for modules beside the
// script rather than beside the working directory — so it is resolved from there explicitly.
// That way this runs from its own folder with no copying about.
const { createRequire } = require('module');
const backendRequire = createRequire(path.join(__dirname, '../../../backend/package.json'));
const mysql = backendRequire('mysql2/promise');
const { node, row, edge, file, column, header, S, roleTable, roleBox } = require('./drawio.cjs');

const OUT = process.argv[2] || '.';
const DB = process.argv[3] || 'zamglam_db_test';

// Kept only so databases built by earlier versions keep working. Drawn faded, so nobody
// mistakes them for part of the current design.
const LEGACY = new Set(['users', 'courier']);

// The tables the whole system turns on. Drawn in the accent colour.
const CENTRAL = new Set(['orders', 'shipments']);

// Account tables take the colour the application gives that role, so somebody who has used
// Zamglam recognises them without consulting a legend.
const ROLE_TABLE = { customers: 'customer', sellers: 'shop', couriers: 'courier', admins: 'admin' };

// Which column each table belongs in, in the order they should stack.
const COLUMNS = [
  { title: 'Accounts', tables: ['customers', 'sellers', 'couriers', 'admins', 'users'] },
  { title: 'The catalogue', tables: ['stores', 'products', 'categories', 'documents'] },
  { title: 'Orders and parcels', tables: ['orders', 'order_items', 'shipments', 'order_status_history'] },
  { title: 'Baskets, money and trust', tables: ['cart', 'payments', 'reviews', 'reports', 'courier'] },
];

// Foreign keys, as the application maintains them. `note` marks the two that carry the
// design rather than just joining two rows together.
const FOREIGN_KEYS = [
  ['customers', 'orders', 'places'],
  ['customers', 'cart', ''],
  ['customers', 'reviews', ''],
  ['sellers', 'stores', 'runs'],
  ['sellers', 'products', 'sells'],
  ['sellers', 'documents', ''],
  ['sellers', 'shipments', 'packs'],
  ['sellers', 'reviews', ''],
  ['couriers', 'shipments', 'carries'],
  ['categories', 'products', ''],
  ['stores', 'products', ''],
  ['products', 'order_items', ''],
  ['products', 'cart', ''],
  ['orders', 'order_items', 'contains'],
  ['orders', 'shipments', 'splits into', true],
  ['orders', 'order_status_history', 'tracked by'],
  ['orders', 'payments', ''],
  ['orders', 'reports', ''],
];

const TABLE_WIDTH = 290;
const ROW_HEIGHT = 19;
const TITLE_HEIGHT = 28;
const COLUMN_GAP = 130;   // room for the relationship lines to run between columns
const TABLE_GAP = 45;

function fieldStyle(col) {
  if (col.Key === 'PRI') return S.fieldPk;
  if (col.Key === 'MUL') return S.fieldFk;
  return S.field;
}

function fieldLabel(col) {
  const marker = col.Key === 'PRI' ? 'PK' : col.Key === 'MUL' ? 'FK' : col.Key === 'UNI' ? 'UQ' : '  ';
  const type = col.Type.replace(/\(\d+(,\d+)?\)/, '').replace('unsigned', '').trim();
  const optional = col.Null === 'YES' ? '  ?' : '';
  return `${marker} ${col.Field} ${type}${optional}`;
}

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: DB,
  });

  const [tableRows] = await connection.query('SHOW TABLES');
  const present = new Set(tableRows.map((r) => Object.values(r)[0]));

  const columns = {};
  for (const table of present) {
    const [cols] = await connection.query(`SHOW FULL COLUMNS FROM \`${table}\``);
    columns[table] = cols;
  }
  await connection.end();

  // ================= 04: the physical schema =================
  {
    const cells = [];
    const top = header(
      cells,
      'Zamglam — database schema',
      'Every table the application creates, with its columns, types and keys. Read from the running database, so it cannot drift from what is really there.',
      { width: 1300 },
    );

    const placed = {};
    let widest = 0;

    COLUMNS.forEach((group, index) => {
      const x = 60 + index * (TABLE_WIDTH + COLUMN_GAP);
      widest = x + TABLE_WIDTH;
      const col = column({ x, top: top + 34, gap: TABLE_GAP });

      cells.push(node({
        id: `colTitle${index}`,
        value: group.title,
        x, y: top, w: TABLE_WIDTH, h: 24,
        style: S.heading,
      }));

      group.tables.filter((t) => present.has(t)).forEach((table) => {
        const cols = columns[table];
        const height = TITLE_HEIGHT + cols.length * ROW_HEIGHT;
        const y = col.place(height);
        placed[table] = { x, y, height };

        const legacy = LEGACY.has(table);
        cells.push(node({
          id: table,
          value: legacy ? `${table}  —  legacy` : table,
          x, y, w: TABLE_WIDTH, h: height,
          style: legacy ? S.tableLegacy
            : ROLE_TABLE[table] ? roleTable(ROLE_TABLE[table])
              : CENTRAL.has(table) ? S.tableKey : S.table,
        }));

        cols.forEach((col_, i) => {
          cells.push(row({
            id: `${table}__${col_.Field}`,
            value: fieldLabel(col_),
            y: TITLE_HEIGHT + i * ROW_HEIGHT,
            w: TABLE_WIDTH,
            h: ROW_HEIGHT,
            style: fieldStyle(col_),
            parent: table,
          }));
        });
      });
    });

    // Relationship lines, leaving the right edge and entering the left, so they run in the
    // gaps between columns rather than across the tables.
    FOREIGN_KEYS.forEach(([from, to, label, key], i) => {
      if (!placed[from] || !placed[to]) return;
      const sameColumn = placed[from].x === placed[to].x;
      const rightToLeft = placed[to].x > placed[from].x;

      const ports = sameColumn
        ? 'exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;'
        : rightToLeft
          ? 'exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;'
          : 'exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;';

      cells.push(edge({
        id: `fk${i}`,
        value: label,
        source: from,
        target: to,
        style: (key ? S.relKey : S.fk) + ports,
      }));
    });

    // Legend and notes, to the right of everything.
    const asideX = widest + 90;
    cells.push(node({ id: 'legendTitle', value: 'How to read it', x: asideX, y: top, w: 320, h: 24, style: S.heading }));
    const legend = [
      ['PK', 'primary key', S.fieldPk],
      ['FK', 'foreign key — points at another table', S.fieldFk],
      ['UQ', 'must be unique', S.field],
      ['?', 'may be empty', S.field],
    ];
    legend.forEach(([marker, meaning, style], i) => {
      cells.push(node({
        id: `legend${i}`,
        value: `${marker} ${meaning}`,
        x: asideX, y: top + 34 + i * 24, w: 320, h: 22,
        style: style + 'align=left;',
      }));
    });

    cells.push(node({
      id: 'legendBoxes',
      value: 'Indigo tables are where the design lives: an ORDER is what somebody bought, '
        + 'and a SHIPMENT is one shop’s parcel within it.\n\n'
        + 'Faded tables are kept only so databases built by earlier versions keep working. '
        + 'A current database does not use them — logins live on the account rows themselves, '
        + 'and parcels live in shipments.',
      x: asideX, y: top + 150, w: 320, h: 150, style: S.noteKey,
    }));

    cells.push(node({
      id: 'noteGenerated',
      value: 'Generated from the live database.\n\n'
        + 'If the schema changes, run the generator again rather than editing this file — '
        + 'a hand-drawn schema is wrong the moment somebody adds a column.',
      x: asideX, y: top + 320, w: 320, h: 115, style: S.note,
    }));

    const pageWidth = asideX + 400;
    const pageHeight = Math.max(...Object.values(placed).map((p) => p.y + p.height)) + 120;

    fs.writeFileSync(
      path.join(OUT, '04-database-schema.drawio'),
      file('Database schema', cells, { width: pageWidth, height: pageHeight }),
    );
    console.log(`04-database-schema.drawio      ${Object.keys(placed).length} tables, ${FOREIGN_KEYS.length} relationships`);
  }

  // ================= 03: the entity relationships =================
  {
    const cells = [];
    const top = header(
      cells,
      'Zamglam — entity relationship diagram',
      'The same tables without the column detail, arranged so the relationships can be followed. An ORDER is what a customer bought; a SHIPMENT is one shop’s parcel within it.',
      { width: 1300 },
    );

    // Laid out left to right in the order things happen: who is involved, what they buy,
    // what that becomes, and what follows afterwards.
    const W = 210;
    const H = 62;
    const COL_X = [60, 380, 700, 1020, 1340];

    const entities = {
      customers: { x: COL_X[0], y: top + 40, label: 'customers', sub: 'shoppers' },
      sellers: { x: COL_X[0], y: top + 200, label: 'sellers', sub: 'shop accounts' },
      couriers: { x: COL_X[0], y: top + 360, label: 'couriers', sub: 'riders' },
      admins: { x: COL_X[0], y: top + 520, label: 'admins', sub: 'moderators' },

      cart: { x: COL_X[1], y: top + 40, label: 'cart', sub: 'a saved basket' },
      stores: { x: COL_X[1], y: top + 200, label: 'stores', sub: 'storefronts' },
      documents: { x: COL_X[1], y: top + 360, label: 'documents', sub: 'for verification' },
      categories: { x: COL_X[1], y: top + 520, label: 'categories', sub: '' },

      orders: { x: COL_X[2], y: top + 40, label: 'orders', sub: 'what was bought', key: true },
      products: { x: COL_X[2], y: top + 280, label: 'products', sub: 'what shops sell' },
      reviews: { x: COL_X[2], y: top + 440, label: 'reviews', sub: 'ratings and replies' },
      reports: { x: COL_X[2], y: top + 600, label: 'reports', sub: 'complaints' },

      shipments: { x: COL_X[3], y: top + 40, label: 'shipments', sub: 'ONE PARCEL PER SHOP', key: true },
      order_items: { x: COL_X[3], y: top + 200, label: 'order_items', sub: 'the lines of an order' },
      order_status_history: { x: COL_X[3], y: top + 360, label: 'order_status_history', sub: 'the tracking' },
      payments: { x: COL_X[3], y: top + 520, label: 'payments', sub: 'recorded, never charged' },
    };

    Object.entries(entities).forEach(([id, e]) => {
      if (!columns[id]) return;
      const count = columns[id].length;
      cells.push(node({
        id,
        value: `<b>${e.label}</b>${e.sub ? `<br/><font style="font-size:10px;color:#64748b">${e.sub}</font>` : ''}`
          + `<br/><font style="font-size:9px;color:#94a3b8">${count} columns</font>`,
        x: e.x, y: e.y, w: W, h: H,
        style: e.key ? roleBox('customer', 'strokeWidth=3;fontStyle=1;align=center;')
          : ROLE_TABLE[id] ? roleBox(ROLE_TABLE[id], 'align=center;')
            : S.box,
      }));
    });

    const relationships = [
      ['customers', 'orders', 'places', true],
      ['customers', 'cart', 'fills'],
      ['customers', 'reviews', 'writes'],
      ['orders', 'shipments', 'splits into one per shop', true],
      ['orders', 'order_items', 'contains'],
      ['orders', 'order_status_history', 'tracked by'],
      ['orders', 'payments', 'paid by'],
      ['orders', 'reports', 'complained about on'],
      ['sellers', 'stores', 'runs'],
      ['sellers', 'documents', 'submits'],
      ['sellers', 'shipments', 'packs', true],
      ['sellers', 'reviews', 'rated by'],
      ['couriers', 'shipments', 'carries', true],
      ['stores', 'products', 'displays'],
      ['categories', 'products', 'groups'],
      ['products', 'order_items', 'ordered as'],
      ['products', 'cart', 'held in'],
    ];

    relationships.forEach(([from, to, label, key], i) => {
      if (!entities[from] || !entities[to]) return;
      const forward = entities[to].x > entities[from].x;
      const ports = forward
        ? 'exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;'
        : 'exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;';
      cells.push(edge({
        id: `er${i}`,
        value: label,
        source: from,
        target: to,
        style: (key ? S.relKey : S.rel) + ports,
      }));
    });

    cells.push(node({
      id: 'erNote',
      value: 'The relationship the whole platform rests on:\n\n'
        + 'one ORDER splits into one SHIPMENT per shop.\n\n'
        + 'Three shops in one basket become three parcels, each collected from a '
        + 'different place, priced on its own distance and delivered separately. '
        + 'That is what makes this multi-vendor rather than one shop with several owners.',
      x: COL_X[4], y: top + 40, w: 300, h: 190, style: S.noteKey,
    }));

    cells.push(node({
      id: 'erNote2',
      value: 'Not shown: the legacy users and courier tables, which exist only so '
        + 'older databases keep working. See the schema diagram.',
      x: COL_X[4], y: top + 260, w: 300, h: 80, style: S.note,
    }));

    fs.writeFileSync(
      path.join(OUT, '03-er-diagram.drawio'),
      file('ER diagram', cells, { width: COL_X[4] + 400, height: top + 760 }),
    );
    console.log(`03-er-diagram.drawio           ${Object.keys(entities).length} entities, ${relationships.length} relationships`);
  }
})();
