// Use case, architecture and site map.
//
// Layout here is deliberate rather than automatic: use cases sit in the column belonging to
// the actor who performs them, so the lines from actor to case stay short and rarely cross.
const fs = require('fs');
const path = require('path');
const { node, edge, file, header, roleLegend, S, roleBox, roleActor, roleUseCase } = require('./drawio.cjs');

const OUT = process.argv[2] || '.';

// ================= 01: use case =================
{
  const cells = [];
  const top = header(
    cells,
    'Use case diagram',
    'Four actors. The proposal promised interfaces for customers and store owners; couriers and an administrator were needed to make delivery and trust work.',
    { width: 1200 },
  );

  const UC_W = 230;
  const UC_H = 62;
  const UC_GAP = 26;
  const COL_LEFT = 340;      // the customer / shop / courier column
  const COL_RIGHT = 700;     // shared cases, and the administrator's

  // The boundary is drawn first so everything sits on top of it.
  const boundaryTop = top;
  const boundaryHeight = 1180;
  cells.push(node({
    id: 'boundary',
    value: 'Zamglam',
    x: 300, y: boundaryTop, w: 700, h: boundaryHeight,
    style: S.groupClear + 'align=center;spacingLeft=0;fontSize=15;',
  }));

  // Each actor gets a band of the boundary, with their cases stacked inside it.
  const bands = [
    {
      role: 'customer',
      actor: { id: 'aCustomer', label: 'Customer', x: 120, y: top + 120 },
      column: COL_LEFT,
      start: top + 40,
      cases: [
        ['uBrowse', 'Browse the catalogue'],
        ['uBasket', 'Fill a basket'],
        ['uOrder', 'Place an order'],
        ['uTrack', 'Track an order'],
        ['uRate', 'Rate a shop after delivery'],
      ],
    },
    {
      role: 'shop',
      actor: { id: 'aShop', label: 'Shop\n(vendor)', x: 120, y: top + 560 },
      column: COL_LEFT,
      start: top + 490,
      cases: [
        ['uList', 'List and edit products'],
        ['uDocs', 'Submit registration documents'],
        ['uPack', 'Pack and release a parcel'],
        ['uReply', 'Reply to a rating'],
      ],
    },
    {
      role: 'courier',
      actor: { id: 'aCourier', label: 'Courier', x: 120, y: top + 950 },
      column: COL_LEFT,
      start: top + 880,
      cases: [
        ['uDuty', 'Go on and off duty'],
        ['uPool', 'See parcels waiting'],
        ['uPickup', 'Request a pickup'],
        ['uDeliver', 'Mark a parcel delivered'],
      ],
    },
  ];

  const placed = {};
  bands.forEach((band) => {
    cells.push(node({ id: band.actor.id, value: band.actor.label, x: band.actor.x, y: band.actor.y, w: 44, h: 78, style: roleActor(band.role) }));
    band.cases.forEach(([id, label], i) => {
      const y = band.start + i * (UC_H + UC_GAP);
      placed[id] = y;
      cells.push(node({ id, value: label, x: band.column, y, w: UC_W, h: UC_H, style: roleUseCase(band.role) }));
      cells.push(edge({ id: `l_${id}`, source: band.actor.id, target: id, style: S.link }));
    });
  });

  // The administrator, on the other side, so their lines never cross anybody else's.
  cells.push(node({ id: 'aAdmin', value: 'Administrator', x: 1060, y: top + 440, w: 44, h: 78, style: roleActor('admin') }));
  const adminCases = [
    ['uVerify', 'Verify a shop'],
    ['uApprove', 'Approve a courier'],
    ['uComplaints', 'Review complaints'],
    ['uSuspend', 'Suspend or reinstate an account'],
    ['uAccounts', 'Edit, delete or restore an account'],
    ['uStats', 'See platform figures'],
  ];
  adminCases.forEach(([id, label], i) => {
    const y = top + 300 + i * (UC_H + UC_GAP);
    cells.push(node({ id, value: label, x: COL_RIGHT, y, w: UC_W, h: UC_H, style: roleUseCase('admin') }));
    cells.push(edge({ id: `l_${id}`, source: 'aAdmin', target: id, style: S.link }));
  });

  // Cases more than one actor performs, in their own colour so the sharing is visible.
  const shared = [
    { id: 'uSignIn', label: 'Register and sign in', y: top + 60, actors: ['aCustomer', 'aShop', 'aCourier', 'aAdmin'] },
    { id: 'uConfirm', label: 'Confirm or deny a handover', y: top + 880, actors: ['aShop', 'aCourier'] },
    { id: 'uReport', label: 'Report another party on an order', y: top + 1000, actors: ['aCustomer', 'aShop', 'aCourier'] },
  ];
  shared.forEach((c) => {
    cells.push(node({ id: c.id, value: c.label, x: COL_RIGHT, y: c.y, w: UC_W, h: UC_H, style: S.boxWarn + 'rounded=1;arcSize=50;' }));
    c.actors.forEach((a, i) => cells.push(edge({ id: `l_${c.id}_${i}`, source: a, target: c.id, style: S.link })));
  });

  cells.push(node({
    id: 'ucNote',
    value: 'Confirming a handover joins two actors on purpose.\n\n'
      + 'The courier asks for the parcel and the shop answers. Neither can complete it '
      + 'alone — which is the whole point, and the project’s answer to logistics being '
      + '"organized manually between sellers and courier services".',
    x: 1060, y: top + 860, w: 320, h: 140, style: S.noteKey,
  }));
  cells.push(node({
    id: 'ucLegend',
    value: 'Amber cases are performed by more than one kind of account.\n\n'
      + 'Every other colour is the one the application itself uses: customer indigo, '
      + 'shop purple, courier emerald, administrator slate.',
    x: 1060, y: top + 60, w: 320, h: 110, style: S.note,
  }));

  fs.writeFileSync(
    path.join(OUT, '01-use-case.drawio'),
    file('Use cases', cells, { width: 1460, height: boundaryTop + boundaryHeight + 80 }),
  );
  console.log(`01-use-case.drawio             4 actors, ${Object.keys(placed).length + adminCases.length + shared.length} use cases`);
}

// ================= 02: architecture =================
{
  const cells = [];
  const top = header(
    cells,
    'System architecture',
    'The layered design the proposal described, as built. The proposal’s four modules are shaded; two more were added as the work went on.',
    { width: 1200 },
  );

  const PAGE_W = 1240;
  const BAND_X = 60;
  const BAND_W = 1120;

  // Boxes are children of their layer, so a layer and its contents can never drift apart.
  let y = top;

  // --- interface layer ---
  cells.push(node({ id: 'L1', value: 'User interface layer   —   React + Vite + Tailwind', x: BAND_X, y, w: BAND_W, h: 132, style: S.group }));
  [['Customer pages', 'customer'], ['Shop dashboard', 'shop'], ['Courier dashboard', 'courier'], ['Admin console', 'admin']]
    .forEach(([label, role], i) => {
      cells.push(node({ id: `ui${i}`, value: label, x: 28 + i * 268, y: 48, w: 240, h: 62, style: roleBox(role), parent: 'L1' }));
    });
  y += 132;

  cells.push(node({
    id: 'httpNote',
    value: 'HTTP  ·  a relative /api, proxied to the backend — which is what makes the same build work from a phone',
    x: BAND_X + 20, y: y + 12, w: 700, h: 20, style: S.caption,
  }));
  y += 46;

  // --- api layer ---
  cells.push(node({ id: 'L2', value: 'API layer   —   Express', x: BAND_X, y, w: BAND_W, h: 132, style: S.group }));
  const api = [
    ['routes', 'Routes\nwhat URL reaches what', S.box],
    ['mw', 'Middleware\nauth · role · suspension\nrate limit · uploads', S.boxWarn],
    ['ctrl', 'Controllers\nrequest in, status code out', S.box],
    ['err', 'Error handling', S.box],
  ];
  api.forEach(([id, label, style], i) => {
    cells.push(node({ id, value: label, x: 28 + i * 268, y: 48, w: 240, h: 62, style, parent: 'L2' }));
  });
  y += 132 + 46;

  // --- domain modules ---
  cells.push(node({ id: 'L3', value: 'Domain modules   —   the rules, in models/', x: BAND_X, y, w: BAND_W, h: 230, style: S.group }));
  const modules = [
    ['mVendor', 'Vendor management\nregistration · storefronts\nverification', true, 0, 0],
    ['mCatalogue', 'Product catalogue\nlistings · photos · stock\ncategories', true, 1, 0],
    ['mCourier', 'Courier &amp; delivery\npool · handover · shifts\ntracking · escalation', true, 2, 0],
    ['mUI', 'User interface layer\n(the band above)', true, 3, 0],
    ['mOrders', 'Orders\none parcel per shop\npricing · stock', false, 0, 1],
    ['mTrust', 'Trust &amp; moderation\nratings · complaints\nsuspension', false, 1, 1],
    ['mAdmin', 'Administration\nfigures · approvals\naccount lifecycle', false, 2, 1],
  ];
  modules.forEach(([id, label, proposed, col, rowIndex]) => {
    cells.push(node({
      id, value: label,
      x: 28 + col * 268, y: 48 + rowIndex * 88, w: 240, h: 76,
      style: proposed ? S.boxAccent : S.box,
      parent: 'L3',
    }));
  });
  cells.push(node({
    id: 'moduleLegend',
    value: 'Shaded  =  named in the proposal’s methodology\nPlain   =  added during development',
    x: 828, y: 140, w: 270, h: 60, style: S.caption, parent: 'L3',
  }));
  y += 230 + 46;

  // --- services and data, side by side ---
  cells.push(node({ id: 'L4', value: 'Supporting services', x: BAND_X, y, w: 540, h: 128, style: S.group }));
  cells.push(node({ id: 'svcPlaces', value: 'Place lookup\nZambian towns and\nLusaka neighbourhoods', x: 28, y: 46, w: 230, h: 62, style: S.box, parent: 'L4' }));
  cells.push(node({ id: 'svcCourier', value: 'Delivery pricing\npluggable provider', x: 282, y: 46, w: 230, h: 62, style: S.box, parent: 'L4' }));

  cells.push(node({ id: 'L5', value: 'Data', x: BAND_X + 580, y, w: 540, h: 128, style: S.group }));
  cells.push(node({ id: 'db', value: 'MySQL / MariaDB\n18 tables · schema created and\nmigrated by the application', x: 28, y: 46, w: 280, h: 62, style: S.boxAccent, parent: 'L5' }));
  cells.push(node({ id: 'uploads', value: 'uploads/\nphotos and documents', x: 332, y: 46, w: 180, h: 62, style: S.box, parent: 'L5' }));

  cells.push(edge({ id: 'a1', source: 'L1', target: 'L2', style: S.flow + 'exitX=0.5;exitY=1;entryX=0.5;entryY=0;' }));
  cells.push(edge({ id: 'a2', source: 'L2', target: 'L3', style: S.flow + 'exitX=0.5;exitY=1;entryX=0.5;entryY=0;' }));
  cells.push(edge({ id: 'a3', source: 'L3', target: 'L4', style: S.flow + 'exitX=0.25;exitY=1;entryX=0.5;entryY=0;' }));
  cells.push(edge({ id: 'a4', source: 'L3', target: 'L5', style: S.flow + 'exitX=0.75;exitY=1;entryX=0.5;entryY=0;' }));

  cells.push(node({
    id: 'archNote',
    value: 'The rules live in the domain modules, not the controllers, so they hold whichever '
      + 'route, test or script reaches them. Controllers do HTTP and nothing else — there is '
      + 'no SQL in any of them.',
    x: BAND_X, y: y + 148, w: 560, h: 70, style: S.note,
  }));

  fs.writeFileSync(
    path.join(OUT, '02-architecture.drawio'),
    file('Architecture', cells, { width: PAGE_W, height: y + 260 }),
  );
  console.log('02-architecture.drawio         5 bands, 7 domain modules');
}

// ================= 09: site map =================
{
  const cells = [];
  const top = header(
    cells,
    'What each kind of account can reach',
    'Objective 3 asked for interfaces for customers and store owners. Four were built.',
    { width: 1100 },
  );

  const COL_W = 270;
  const COL_GAP = 40;
  const ITEM_H = 40;
  const ITEM_GAP = 10;

  const columns = [
    {
      id: 'c1', title: 'Customer', role: 'customer',
      pages: ['Home  /', 'Collections', 'All products', 'One product', 'A storefront',
        'Basket and checkout', '› My dashboard', '› Track an order', 'My account'],
    },
    {
      id: 'c2', title: 'Shop  (vendor)', role: 'shop',
      pages: ['Home  /  — own stock', '› Dashboard · Products', '› Dashboard · Orders',
        '› Dashboard · Verification', '› Dashboard · Ratings', '› Dashboard · Figures',
        'My storefront', 'My account'],
    },
    {
      id: 'c3', title: 'Courier', role: 'courier',
      pages: ['Home  /  — parcels waiting', '› Dashboard · Available', '› Dashboard · Out for delivery',
        '› Dashboard · Completed', '› Dashboard · Shops', 'Track a parcel', 'My account'],
    },
    {
      id: 'c4', title: 'Administrator', role: 'admin',
      pages: ['› Console · Subscribers', '› Console · Verification queue', '› Console · Complaints',
        '› Console · Unclaimed parcels', 'Customers', 'Shops', 'Couriers'],
    },
  ];

  let deepest = 0;
  columns.forEach((col, index) => {
    const x = 60 + index * (COL_W + COL_GAP);
    cells.push(node({ id: col.id, value: col.title, x, y: top, w: COL_W, h: 44, style: roleBox(col.role, 'fontStyle=1;fontSize=14;') }));
    col.pages.forEach((page, i) => {
      const nested = page.startsWith('›');
      const y = top + 62 + i * (ITEM_H + ITEM_GAP);
      deepest = Math.max(deepest, y + ITEM_H);
      cells.push(node({
        id: `${col.id}p${i}`,
        value: nested ? page.slice(2) : page,
        x: x + (nested ? 22 : 0), y, w: COL_W - (nested ? 22 : 0), h: ITEM_H,
        style: nested ? S.boxMuted : roleBox(col.role, 'fillColor=#ffffff;'),
      }));
    });
  });

  const sharedY = deepest + 70;
  cells.push(node({ id: 'sharedTitle', value: 'Open to everybody, signed in or not', x: 60, y: sharedY, w: 500, h: 26, style: S.heading }));
  ['Sign in', 'Sign up  —  choose a role', 'About  ·  Contact  ·  Policies'].forEach((p, i) => {
    cells.push(node({ id: `sh${i}`, value: p, x: 60 + i * (COL_W + COL_GAP), y: sharedY + 36, w: COL_W, h: ITEM_H, style: S.box }));
  });

  cells.push(node({
    id: 'mapNote',
    value: 'Indented entries are sections within a dashboard rather than separate pages.\n\n'
      + 'Every dashboard reflows for a phone: the section list becomes a drawer, and the '
      + 'tables scroll sideways rather than the page.',
    x: 60 + 4 * (COL_W + COL_GAP), y: top, w: 300, h: 120, style: S.note,
  }));

  fs.writeFileSync(
    path.join(OUT, '09-site-map.drawio'),
    file('Site map by role', cells, { width: 60 + 5 * (COL_W + COL_GAP) + 60, height: sharedY + 140 }),
  );
  console.log('09-site-map.drawio             4 roles');
}
