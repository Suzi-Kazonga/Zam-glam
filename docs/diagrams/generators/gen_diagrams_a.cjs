// Use case, architecture and site map.
const fs = require('fs');
const path = require('path');
const { node, edge, file, S } = require('./drawio.cjs');

const OUT = process.argv[2] || '.';

// --- 01: use case ------------------------------------------------------------------
{
  const cells = [];
  cells.push(node({ id: 'title', value: 'Use case diagram', x: 40, y: 10, w: 600, h: 30, style: S.title }));
  cells.push(node({
    id: 'sub',
    value: 'Four actors. The proposal named customers and store owners; couriers and an administrator were needed to make delivery and trust work.',
    x: 40, y: 34, w: 1000, h: 20, style: S.caption,
  }));

  // The system boundary.
  cells.push(node({ id: 'boundary', value: 'Zamglam', x: 280, y: 80, w: 560, h: 940, style: S.layer + 'align=center;spacingLeft=0;fillColor=#fbfdff;' }));

  const actors = [
    { id: 'aCustomer', label: 'Customer', x: 80, y: 180 },
    { id: 'aShop', label: 'Shop\n(vendor)', x: 80, y: 480 },
    { id: 'aCourier', label: 'Courier', x: 80, y: 760 },
    { id: 'aAdmin', label: 'Administrator', x: 900, y: 480 },
  ];
  actors.forEach((a) => cells.push(node({ id: a.id, value: a.label, x: a.x, y: a.y, w: 40, h: 70, style: S.actor })));

  const cases = [
    // customer
    { id: 'uBrowse', label: 'Browse the catalogue', x: 330, y: 120, actors: ['aCustomer'] },
    { id: 'uBasket', label: 'Fill a basket', x: 330, y: 185, actors: ['aCustomer'] },
    { id: 'uOrder', label: 'Place an order', x: 330, y: 250, actors: ['aCustomer'] },
    { id: 'uTrack', label: 'Track an order', x: 330, y: 315, actors: ['aCustomer'] },
    { id: 'uRate', label: 'Rate a shop', x: 330, y: 380, actors: ['aCustomer'] },
    // shop
    { id: 'uList', label: 'List and edit products', x: 330, y: 470, actors: ['aShop'] },
    { id: 'uDocs', label: 'Submit registration\ndocuments', x: 330, y: 535, actors: ['aShop'] },
    { id: 'uPack', label: 'Pack and release\na parcel', x: 330, y: 605, actors: ['aShop'] },
    { id: 'uConfirm', label: 'Confirm or deny\na handover', x: 330, y: 675, actors: ['aShop', 'aCourier'] },
    { id: 'uReply', label: 'Reply to a rating', x: 330, y: 745, actors: ['aShop'] },
    // courier
    { id: 'uDuty', label: 'Go on and off duty', x: 330, y: 810, actors: ['aCourier'] },
    { id: 'uPool', label: 'See parcels waiting', x: 330, y: 875, actors: ['aCourier'] },
    { id: 'uPickup', label: 'Request a pickup', x: 330, y: 940, actors: ['aCourier'] },
    { id: 'uDeliver', label: 'Mark delivered', x: 585, y: 875, actors: ['aCourier'] },
    // shared
    { id: 'uReport', label: 'Report another party\non an order', x: 585, y: 740, actors: ['aCustomer', 'aShop', 'aCourier'] },
    { id: 'uSignIn', label: 'Register and sign in', x: 585, y: 120, actors: ['aCustomer', 'aShop', 'aCourier', 'aAdmin'] },
    // admin
    { id: 'uVerify', label: 'Verify a shop', x: 585, y: 250, actors: ['aAdmin'] },
    { id: 'uApprove', label: 'Approve a courier', x: 585, y: 315, actors: ['aAdmin'] },
    { id: 'uComplaints', label: 'Review complaints', x: 585, y: 380, actors: ['aAdmin'] },
    { id: 'uSuspend', label: 'Suspend or reinstate\nan account', x: 585, y: 445, actors: ['aAdmin'] },
    { id: 'uAccounts', label: 'Edit, delete or restore\nan account', x: 585, y: 520, actors: ['aAdmin'] },
    { id: 'uStats', label: 'See platform figures', x: 585, y: 600, actors: ['aAdmin'] },
  ];

  cases.forEach((c) => cells.push(node({
    id: c.id, value: c.label, x: c.x, y: c.y, w: 200, h: 55, style: S.useCase, parent: '1',
  })));

  let n = 0;
  cases.forEach((c) => c.actors.forEach((a) => {
    cells.push(edge({ id: `uc${n += 1}`, source: a, target: c.id, style: S.plain }));
  }));

  cells.push(node({
    id: 'note-uc',
    value: 'Confirming a handover is joined to two actors on purpose:\n'
      + 'the courier asks for the parcel and the shop answers.\n'
      + 'Neither can complete it alone — which is the point.',
    x: 900, y: 660, w: 300, h: 80, style: S.note,
  }));

  fs.writeFileSync(path.join(OUT, '01-use-case.drawio'), file('Use cases', cells));
  console.log('01-use-case.drawio          4 actors, ' + cases.length + ' use cases');
}

// --- 02: architecture ---------------------------------------------------------------
{
  const cells = [];
  cells.push(node({ id: 'title', value: 'System architecture', x: 40, y: 10, w: 600, h: 30, style: S.title }));
  cells.push(node({
    id: 'sub',
    value: 'The layered design the proposal described, as built. The proposal’s four modules are marked; two more were added as the work went on.',
    x: 40, y: 34, w: 1000, h: 20, style: S.caption,
  }));

  // Presentation
  cells.push(node({ id: 'L1', value: 'User interface layer   —   React + Vite + Tailwind', x: 60, y: 90, w: 1040, h: 130, style: S.layer }));
  ['Customer pages', 'Shop dashboard', 'Courier dashboard', 'Admin console'].forEach((label, i) => {
    cells.push(node({ id: `ui${i}`, value: label, x: 90 + i * 250, y: 135, w: 215, h: 60, style: S.box }));
  });

  cells.push(node({ id: 'httpNote', value: 'HTTP  ·  a relative /api, so the same build works from a phone', x: 60, y: 235, w: 500, h: 20, style: S.caption }));

  // API
  cells.push(node({ id: 'L2', value: 'API layer   —   Express', x: 60, y: 265, w: 1040, h: 120, style: S.layer }));
  cells.push(node({ id: 'routes', value: 'Routes\n(what URL reaches what)', x: 90, y: 310, w: 230, h: 60, style: S.box }));
  cells.push(node({ id: 'mw', value: 'Middleware\nauth · role · suspension ·\nrate limit · uploads', x: 340, y: 310, w: 250, h: 60, style: S.boxWarn }));
  cells.push(node({ id: 'ctrl', value: 'Controllers\n(request in, status code out)', x: 610, y: 310, w: 230, h: 60, style: S.box }));
  cells.push(node({ id: 'err', value: 'Error handling', x: 860, y: 310, w: 210, h: 60, style: S.box }));

  // Domain modules
  cells.push(node({ id: 'L3', value: 'Domain modules   —   the rules, in models/', x: 60, y: 405, w: 1040, h: 210, style: S.layer }));
  const modules = [
    { id: 'mVendor', label: 'Vendor management\nregistration · storefronts ·\nverification', proposal: true, x: 90, y: 450 },
    { id: 'mCatalogue', label: 'Product catalogue\nlistings · photos · stock ·\ncategories', proposal: true, x: 350, y: 450 },
    { id: 'mCourier', label: 'Courier & delivery\npool · handover · shifts ·\ntracking · escalation', proposal: true, x: 610, y: 450 },
    { id: 'mOrders', label: 'Orders\none parcel per shop ·\npricing · stock', proposal: false, x: 870, y: 450 },
    { id: 'mTrust', label: 'Trust & moderation\nratings · complaints ·\nsuspension', proposal: false, x: 90, y: 545 },
    { id: 'mAdmin', label: 'Administration\nfigures · approvals ·\naccount lifecycle', proposal: false, x: 350, y: 545 },
  ];
  modules.forEach((m) => cells.push(node({
    id: m.id, value: m.label, x: m.x, y: m.y, w: 240, h: m.y === 450 ? 85 : 60,
    style: m.proposal ? S.boxAccent : S.box,
  })));
  cells.push(node({
    id: 'legend',
    value: 'Shaded = named in the proposal’s methodology.\nUnshaded = added during development.',
    x: 610, y: 545, w: 300, h: 50, style: S.caption,
  }));

  // Services and data
  cells.push(node({ id: 'L4', value: 'Supporting services', x: 60, y: 635, w: 500, h: 110, style: S.layer }));
  cells.push(node({ id: 'svcPlaces', value: 'Place lookup\n(Zambian towns and\nLusaka areas)', x: 90, y: 678, w: 200, h: 55, style: S.box }));
  cells.push(node({ id: 'svcCourier', value: 'Delivery pricing\n(pluggable provider)', x: 310, y: 678, w: 220, h: 55, style: S.box }));

  cells.push(node({ id: 'L5', value: 'Data', x: 600, y: 635, w: 500, h: 110, style: S.layer }));
  cells.push(node({ id: 'db', value: 'MySQL / MariaDB\n18 tables · schema created and\nmigrated by the application', x: 630, y: 673, w: 280, h: 62, style: S.boxAccent }));
  cells.push(node({ id: 'uploads', value: 'uploads/\nproduct photos,\ndocuments', x: 930, y: 673, w: 150, h: 62, style: S.box }));

  cells.push(edge({ id: 'a1', source: 'L1', target: 'L2', style: S.arrow }));
  cells.push(edge({ id: 'a2', source: 'L2', target: 'L3', style: S.arrow }));
  cells.push(edge({ id: 'a3', source: 'L3', target: 'L5', style: S.arrow }));
  cells.push(edge({ id: 'a4', source: 'L3', target: 'L4', style: S.arrow }));

  cells.push(node({
    id: 'note-arch',
    value: 'The rules live in the domain modules, not the controllers,\n'
      + 'so they hold whichever route, test or script reaches them.\n'
      + 'Controllers do HTTP and nothing else; there is no SQL in them.',
    x: 60, y: 765, w: 420, h: 70, style: S.note,
  }));

  fs.writeFileSync(path.join(OUT, '02-architecture.drawio'), file('Architecture', cells));
  console.log('02-architecture.drawio      5 layers, ' + modules.length + ' domain modules');
}

// --- 09: site map -------------------------------------------------------------------
{
  const cells = [];
  cells.push(node({ id: 'title', value: 'What each kind of account can reach', x: 40, y: 10, w: 700, h: 30, style: S.title }));
  cells.push(node({
    id: 'sub',
    value: 'Objective 3 asked for interfaces for customers and store owners. Four were built.',
    x: 40, y: 34, w: 900, h: 20, style: S.caption,
  }));

  const columns = [
    {
      id: 'c1', title: 'Customer', x: 40,
      pages: ['Home  /', 'Collections  /collections', 'All products  /products', 'One product  /product/:id',
        'A storefront  /stores/:id', 'Basket and checkout  /cart', 'My dashboard  /customer/dashboard',
        'Track an order  /orders/:id', 'My account  /account'],
    },
    {
      id: 'c2', title: 'Shop (vendor)', x: 330,
      pages: ['Home  /  (own stock)', 'My dashboard  /seller/dashboard', '· Products', '· Orders and handover',
        '· Verification', '· Ratings', '· Figures', 'My storefront  /stores/:id', 'My account  /account'],
    },
    {
      id: 'c3', title: 'Courier', x: 620,
      pages: ['Home  /  (parcels waiting)', 'My dashboard  /courier/dashboard', '· Available to collect',
        '· Out for delivery', '· Completed', '· Shops I collect from', 'Track a parcel  /orders/:id', 'My account  /account'],
    },
    {
      id: 'c4', title: 'Administrator', x: 910,
      pages: ['Console  /admin/dashboard', '· Subscribers and activity', '· Verification queue',
        '· Complaints queue', '· Unclaimed parcels', 'Customers  /admin/users/customers',
        'Shops  /admin/users/sellers', 'Couriers  /admin/users/couriers'],
    },
  ];

  columns.forEach((col) => {
    cells.push(node({ id: col.id, value: col.title, x: col.x, y: 90, w: 250, h: 40, style: S.boxAccent + 'fontStyle=1;' }));
    col.pages.forEach((page, i) => {
      const nested = page.startsWith('·');
      cells.push(node({
        id: `${col.id}p${i}`, value: page,
        x: col.x + (nested ? 20 : 0), y: 145 + i * 46, w: nested ? 230 : 250, h: 38,
        style: nested ? S.boxMuted : S.box,
      }));
    });
  });

  cells.push(node({ id: 'shared', value: 'Open to everybody, signed in or not', x: 40, y: 570, w: 400, h: 24, style: S.caption + 'fontStyle=1;fontSize=13;fontColor=#1f2937;' }));
  ['Sign in  /login', 'Sign up  /signup  (choose a role)', 'About  ·  Contact  ·  Policies'].forEach((p, i) => {
    cells.push(node({ id: `sh${i}`, value: p, x: 40 + i * 290, y: 605, w: 270, h: 40, style: S.box }));
  });

  fs.writeFileSync(path.join(OUT, '09-site-map.drawio'), file('Site map by role', cells));
  console.log('09-site-map.drawio          4 roles');
}
