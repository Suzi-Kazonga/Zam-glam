// The two sequence diagrams, the deployment diagram and the module dependencies.
//
// Sequence layout is done arithmetically: lifelines are spaced wide enough for the longest
// message label, and each message is given its own row, so nothing overlaps whatever the
// wording ends up being.
const fs = require('fs');
const path = require('path');
const { node, edge, freeEdge, file, header, S, roleLifeline } = require('./drawio.cjs');

const OUT = process.argv[2] || '.';

// Draws lifelines and hands back the x of each one's centre line.
function lifelines(cells, names, { y, height, width = 200, gap = 150, roles = {} }) {
  const at = {};
  names.forEach((name, i) => {
    const x = 70 + i * (width + gap);
    // Each participant takes the colour the application gives that role.
    const style = roles[name] ? roleLifeline(roles[name]) : S.lifeline;
    cells.push(node({ id: `ll_${i}`, value: name, x, y, w: width, h: height, style }));
    at[name] = x + width / 2;
  });
  at.__rightEdge = 70 + (names.length - 1) * (width + gap) + width;
  return at;
}

// One message per row, so labels can never land on top of one another.
function messages(cells, at, list, { startY, step = 46, prefix = 'm' }) {
  list.forEach((m, i) => {
    const y = startY + i * step;
    const self = m.from === m.to;
    cells.push(freeEdge({
      id: `${prefix}${i}`,
      value: m.text,
      x1: at[m.from],
      y1: y,
      x2: self ? at[m.to] + 90 : at[m.to],
      y2: y,
      style: m.style || (m.back ? S.msgBack : S.msg),
    }));
  });
  return startY + list.length * step;
}

// ================= 05: placing an order across several shops =================
{
  const cells = [];
  const top = header(
    cells,
    'Placing an order across several shops',
    'The basket is priced before anything is created, then written as one order and one parcel per shop — all inside a single transaction.',
    { width: 1200 },
  );

  const LIFELINE_TOP = top + 20;
  const LIFELINE_HEIGHT = 740;
  const at = lifelines(cells, ['Customer', 'Express API', 'Order model', 'MySQL'], {
    y: LIFELINE_TOP, height: LIFELINE_HEIGHT,
    roles: { Customer: 'customer' },
  });

  // Phase one: what will this cost?
  cells.push(node({
    id: 'phase1',
    value: '1.  Price the basket — nothing is created yet',
    x: 70, y: LIFELINE_TOP + 66, w: 420, h: 24, style: S.heading,
  }));
  let y = messages(cells, at, [
    { from: 'Customer', to: 'Express API', text: 'POST /api/orders/quote   (the basket)' },
    { from: 'Express API', to: 'Order model', text: 'quoteForItems(items, location)' },
    { from: 'Order model', to: 'MySQL', text: 'read each product’s price, stock and shop' },
    { from: 'MySQL', to: 'Order model', text: 'rows', back: true },
    { from: 'Order model', to: 'Order model', text: 'group by shop, price delivery for each' },
    { from: 'Order model', to: 'Express API', text: 'one parcel per shop, each with its own fee', back: true },
    { from: 'Express API', to: 'Customer', text: 'items total  ·  delivery total  ·  total', back: true },
  ], { startY: LIFELINE_TOP + 110, prefix: 'q' });

  // Phase two: place it.
  y += 30;
  cells.push(node({
    id: 'phase2',
    value: '2.  Place the order — all of it, or none of it',
    x: 70, y: y - 26, w: 420, h: 24, style: S.heading,
  }));
  y = messages(cells, at, [
    { from: 'Customer', to: 'Express API', text: 'POST /api/orders   (confirm)' },
    { from: 'Express API', to: 'Order model', text: 'createForCustomer(...)' },
    { from: 'Order model', to: 'MySQL', text: 'BEGIN' },
    { from: 'Order model', to: 'MySQL', text: 'price the basket again, server-side' },
    { from: 'Order model', to: 'MySQL', text: 'insert the order' },
    { from: 'Order model', to: 'MySQL', text: 'insert its items  ·  take the stock off the shelf' },
    { from: 'Order model', to: 'MySQL', text: 'insert ONE SHIPMENT PER SHOP' },
    { from: 'Order model', to: 'MySQL', text: 'COMMIT' },
    { from: 'Order model', to: 'Express API', text: 'the new order id', back: true },
    { from: 'Express API', to: 'Customer', text: '201   { id, status: "placed" }', back: true },
  ], { startY: y + 20, prefix: 'p' });

  const asideX = at.__rightEdge + 90;
  cells.push(node({
    id: 'notePrice',
    value: 'Priced twice, from the database both times\n\n'
      + 'Prices are never taken from the request, so a tampered basket changes nothing — '
      + 'and the customer is charged exactly what the quote showed them.',
    x: asideX, y: LIFELINE_TOP + 110, w: 320, h: 120, style: S.note,
  }));
  cells.push(node({
    id: 'noteTx',
    value: 'One transaction\n\n'
      + 'Stock, the order, its items and its parcels are written together or not at all. '
      + 'A failure half way cannot leave stock deducted for an order that does not exist.',
    x: asideX, y: LIFELINE_TOP + 270, w: 320, h: 120, style: S.note,
  }));
  cells.push(node({
    id: 'noteSplit',
    value: 'This is what makes it multi-vendor\n\n'
      + 'Three shops in one basket become three parcels — each collected from a different '
      + 'place, priced on its own distance, and delivered separately.\n\n'
      + 'One delivery fee and one status would have been a fiction.',
    x: asideX, y: LIFELINE_TOP + 430, w: 320, h: 160, style: S.noteKey,
  }));

  fs.writeFileSync(
    path.join(OUT, '05-sequence-order.drawio'),
    file('Placing an order', cells, { width: asideX + 400, height: LIFELINE_TOP + LIFELINE_HEIGHT + 80 }),
  );
  console.log('05-sequence-order.drawio       17 messages in two phases');
}

// ================= 06: the two-party handover =================
{
  const cells = [];
  const top = header(
    cells,
    'The handover: a courier collects a parcel',
    'It takes both sides. The courier asks for the parcel; the shop says whether the handover actually happened. Neither can complete it alone.',
    { width: 1200 },
  );

  const LIFELINE_TOP = top + 20;
  const LIFELINE_HEIGHT = 860;
  const at = lifelines(cells, ['Shop', 'Zamglam', 'Courier', 'Customer'], {
    y: LIFELINE_TOP, height: LIFELINE_HEIGHT,
    roles: { Shop: 'shop', Courier: 'courier', Customer: 'customer' },
  });

  cells.push(node({
    id: 'phaseMain',
    value: '1.  Into the pool, and claimed',
    x: 70, y: LIFELINE_TOP + 66, w: 420, h: 24, style: S.heading,
  }));
  let y = messages(cells, at, [
    { from: 'Shop', to: 'Zamglam', text: 'mark the parcel shipped  —  it enters the pool' },
    { from: 'Zamglam', to: 'Courier', text: 'appears in every on-duty courier’s list', back: true },
    { from: 'Courier', to: 'Zamglam', text: 'request pickup' },
    { from: 'Zamglam', to: 'Zamglam', text: 'claim it — one conditional update, first to ask wins' },
    { from: 'Zamglam', to: 'Courier', text: 'yours to collect', back: true },
    { from: 'Zamglam', to: 'Shop', text: 'notification: "<name> is collecting order #N"', back: true },
    { from: 'Zamglam', to: 'Customer', text: 'tracking: a courier is collecting it', back: true },
    { from: 'Courier', to: 'Shop', text: 'arrives at the counter   (in person)' },
  ], { startY: LIFELINE_TOP + 110, prefix: 'h' });

  // The two answers the shop can give, each in its own framed block.
  const altTop = y + 24;
  const altHeight = 300;
  cells.push(node({
    id: 'altFrame',
    value: '2.  alt   —   the shop answers',
    x: 60, y: altTop, w: at.__rightEdge - 20, h: altHeight,
    style: S.groupClear + 'fontSize=14;',
  }));

  cells.push(node({
    id: 'altYes',
    value: '[ the courier really took it ]',
    x: 80, y: altTop + 36, w: 300, h: 22,
    style: S.caption + 'fontStyle=2;fontColor=#047857;fontSize=12;',
  }));
  messages(cells, at, [
    { from: 'Shop', to: 'Zamglam', text: 'confirm the handover', style: S.msgGood },
    { from: 'Zamglam', to: 'Customer', text: 'the courier’s name and number are released', style: S.msgGood },
    { from: 'Zamglam', to: 'Courier', text: 'now out for delivery', style: S.msgGood },
  ], { startY: altTop + 88, prefix: 'hy' });

  const divideY = altTop + 180;
  cells.push(freeEdge({
    id: 'altDivide',
    x1: 62, y1: divideY, x2: at.__rightEdge + 38, y2: divideY,
    style: 'html=1;endArrow=none;dashed=1;strokeColor=#94a3b8;',
  }));
  cells.push(node({
    id: 'altNo',
    value: '[ the courier never came ]',
    x: 80, y: divideY + 8, w: 300, h: 22,
    style: S.caption + 'fontStyle=2;fontColor=#c2410c;fontSize=12;',
  }));
  messages(cells, at, [
    { from: 'Shop', to: 'Zamglam', text: 'not picked up   (+ a reason)', style: S.msgBad },
    { from: 'Zamglam', to: 'Courier', text: 'the parcel leaves your list', style: S.msgBad },
    { from: 'Zamglam', to: 'Customer', text: 'tracking: why it is still waiting', style: S.msgBad },
  ], { startY: divideY + 58, prefix: 'hn' });

  cells.push(node({
    id: 'backToPool',
    value: '↲  back into the pool for another courier',
    x: at[ 'Zamglam' ] - 150, y: altTop + altHeight - 34, w: 340, h: 24,
    style: S.caption + 'fontColor=#9a3412;fontStyle=1;fontSize=12;align=center;',
  }));

  const asideX = at.__rightEdge + 90;
  cells.push(node({
    id: 'noteWhy',
    value: 'Why it takes two parties\n\n'
      + 'A courier pressing "collected" is only their word for it. Until the shop confirms, '
      + 'nobody has actually taken the parcel — so it is not treated as collected, and the '
      + 'customer is given nobody’s number.\n\n'
      + 'This is the project’s answer to the problem statement: logistics "organized '
      + 'manually between sellers and courier services".',
    x: asideX, y: LIFELINE_TOP + 110, w: 340, h: 190, style: S.noteKey,
  }));
  cells.push(node({
    id: 'noteRace',
    value: 'Two couriers cannot both win\n\n'
      + 'Claiming is a single conditional UPDATE. The second courier changes no rows and '
      + 'is told somebody got there first, so nobody travels for a parcel that is gone.',
    x: asideX, y: LIFELINE_TOP + 330, w: 340, h: 130, style: S.note,
  }));
  cells.push(node({
    id: 'noteException',
    value: 'One exception to the gating\n\n'
      + 'The shop being asked to confirm sees the courier’s name from the moment they ask — '
      + 'it is being asked to verify that this person took the parcel, which it cannot do '
      + 'against an anonymous claim.',
    x: asideX, y: LIFELINE_TOP + 490, w: 340, h: 150, style: S.note,
  }));

  fs.writeFileSync(
    path.join(OUT, '06-sequence-handover.drawio'),
    file('The handover', cells, { width: asideX + 420, height: LIFELINE_TOP + LIFELINE_HEIGHT + 80 }),
  );
  console.log('06-sequence-handover.drawio    14 messages, both answers framed');
}

// ================= 10: deployment =================
{
  const cells = [];
  const top = header(
    cells,
    'Deployment',
    'How the pieces are hosted, and where the encryption the proposal commits to is applied.',
    { width: 1100 },
  );

  cells.push(node({ id: 'clients', value: 'Clients', x: 60, y: top, w: 220, h: 250, style: S.group }));
  cells.push(node({ id: 'phone', value: 'Phone\nbrowser', x: 30, y: 50, w: 160, h: 80, style: S.box, parent: 'clients' }));
  cells.push(node({ id: 'laptop', value: 'Computer\nbrowser', x: 30, y: 150, w: 160, h: 80, style: S.box, parent: 'clients' }));

  cells.push(node({ id: 'host', value: 'Server   —   one host, or one Docker network', x: 400, y: top, w: 720, h: 400, style: S.group }));
  cells.push(node({ id: 'nginx', value: 'nginx\nserves the built React files\nproxies /api to the backend\nTLS terminates here', x: 40, y: 60, w: 290, h: 110, style: S.boxWarn, parent: 'host' }));
  cells.push(node({ id: 'files', value: 'uploads/\nproduct photos and\nregistration documents\n(a mounted volume)', x: 380, y: 60, w: 290, h: 110, style: S.box, parent: 'host' }));
  cells.push(node({ id: 'api', value: 'Express\nnode server.js  ·  port 5000\nthe API, and the hourly sweep', x: 40, y: 240, w: 290, h: 110, style: S.boxAccent, parent: 'host' }));
  cells.push(node({ id: 'mysql', value: 'MySQL / MariaDB\nport 3306\nschema created and migrated\nby the application', x: 380, y: 240, w: 290, h: 110, style: S.boxAccent, parent: 'host' }));

  cells.push(edge({ id: 'd1', value: 'HTTPS', source: 'phone', target: 'nginx', style: S.flow + 'strokeColor=#c2410c;fontColor=#9a3412;fontStyle=1;strokeWidth=2;exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));
  cells.push(edge({ id: 'd2', value: 'HTTPS', source: 'laptop', target: 'nginx', style: S.flow + 'strokeColor=#c2410c;fontColor=#9a3412;fontStyle=1;strokeWidth=2;exitX=1;exitY=0.5;entryX=0;entryY=0.8;' }));
  cells.push(edge({ id: 'd3', value: '/api', source: 'nginx', target: 'api', style: S.flow + 'exitX=0.5;exitY=1;entryX=0.5;entryY=0;' }));
  cells.push(edge({ id: 'd4', value: 'SQL', source: 'api', target: 'mysql', style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));
  cells.push(edge({ id: 'd5', value: 'reads and writes', source: 'api', target: 'files', style: S.flow + 'exitX=1;exitY=0.2;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;' }));

  const asideX = 1180;
  cells.push(node({
    id: 'noteTls',
    value: 'Objective 4, and the proposal’s ethical section, commit to HTTPS and SSL.\n\n'
      + 'That is applied here, at nginx. Running the project locally for marking uses plain '
      + 'HTTP on localhost, where there is no network to intercept.',
    x: asideX, y: top, w: 340, h: 140, style: S.note,
  }));
  cells.push(node({
    id: 'noteDocker',
    value: 'Honest caveat\n\n'
      + 'docker-compose.yml defines all of this as containers, plus phpMyAdmin and the '
      + 'optional Flask courier service.\n\n'
      + 'Docker is not installed on the development machine, so the container stack is '
      + 'defined but has never been run end to end. The tested way to run Zamglam is in '
      + 'docs/01-SETUP.md.',
    x: asideX, y: top + 170, w: 340, h: 210, style: S.noteBad,
  }));
  cells.push(node({
    id: 'noteRelative',
    value: 'The browser calls a relative /api, never an absolute address — which is exactly '
      + 'why the same build works from a phone.',
    x: 400, y: top + 430, w: 500, h: 55, style: S.note,
  }));

  fs.writeFileSync(
    path.join(OUT, '10-deployment.drawio'),
    file('Deployment', cells, { width: asideX + 420, height: top + 540 }),
  );
  console.log('10-deployment.drawio           hosts, the TLS boundary and the Docker caveat');
}

// ================= 11: module dependencies =================
{
  const cells = [];
  const top = header(
    cells,
    'How the backend fits together',
    'A dependency diagram rather than a UML class diagram: the backend is modules of functions over SQL, not an object model with inheritance.',
    { width: 1200 },
  );

  const W = 260;
  const H = 74;
  const LEFT = 80;
  const MID = 420;
  const RIGHT = 760;
  const ROW = 120;

  const boxes = [
    ['server', 'server.js\nlistens  ·  runs the sweep', LEFT, top, S.box],
    ['app', 'app.js\nthe Express application\nno port, no timers', LEFT, top + ROW, S.boxAccent],
    ['routes', 'routes/\nwhat URL reaches what', LEFT, top + 2 * ROW, S.box],
    ['controllers', 'controllers/\nrequest in, status code out', LEFT, top + 3 * ROW, S.box],
    ['models', 'models/\nthe rules, and all the SQL', LEFT, top + 4 * ROW, S.boxAccent],
    ['config', 'config/db.js\nthe pool, the schema,\nthe migrations', LEFT, top + 5 * ROW, S.boxAccent],

    ['middleware', 'middleware/\nauth · role · suspension\nrate limit · uploads · errors', MID, top + 2 * ROW, S.boxWarn],
    ['utils', 'utils/accounts.js\nturns a signed-in user into\ntheir profile id', MID, top + 3 * ROW, S.box],
    ['services', 'services/\ndelivery pricing · place lookup\n(no database)', MID, top + 4 * ROW, S.box],

    ['tests', 'tests/\ndrive app.js directly through\nsupertest — the real routes', RIGHT, top + ROW, S.boxMuted],
  ];
  boxes.forEach(([id, label, x, y, style]) => cells.push(node({ id, value: label, x, y, w: W, h: H, style })));

  const down = 'exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;';
  const across = 'exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;';

  const deps = [
    ['server', 'app', '', down],
    ['app', 'routes', '', down],
    ['routes', 'controllers', '', down],
    ['controllers', 'models', '', down],
    ['models', 'config', '', down],
    ['routes', 'middleware', '', across],
    ['controllers', 'utils', '', across],
    ['models', 'services', '', across],
    ['tests', 'app', 'drives the real app', 'exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;'],
  ];
  deps.forEach(([from, to, label, ports], i) => cells.push(edge({
    id: `dep${i}`, value: label, source: from, target: to, style: S.flow + ports,
  })));

  cells.push(node({
    id: 'noteDirection',
    value: 'Dependencies only ever point downwards\n\n'
      + 'No model imports a controller, and no controller contains SQL — which is what keeps '
      + 'a rule in one place rather than repeated once per route.',
    x: RIGHT, y: top + 3 * ROW, w: 340, h: 120, style: S.note,
  }));
  cells.push(node({
    id: 'noteClass',
    value: 'Why not a class diagram\n\n'
      + 'The models are collections of functions over SQL. Drawing them as UML classes with '
      + 'associations and inheritance would show relationships the code does not have — '
      + 'which an examiner reading the source would notice.',
    x: RIGHT, y: top + 4 * ROW + 40, w: 340, h: 150, style: S.noteKey,
  }));

  fs.writeFileSync(
    path.join(OUT, '11-module-dependencies.drawio'),
    file('Module dependencies', cells, { width: RIGHT + 420, height: top + 6 * ROW + 80 }),
  );
  console.log('11-module-dependencies.drawio  10 modules, dependencies pointing one way');
}
