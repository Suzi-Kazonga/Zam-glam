// The two sequence diagrams, the deployment diagram and the module dependencies.
const fs = require('fs');
const path = require('path');
const { node, edge, freeEdge, file, S } = require('./drawio.cjs');

const OUT = process.argv[2] || '.';

// Draws a set of lifelines and returns where each one's line sits horizontally.
function lifelines(cells, names, { y = 90, height = 620, width = 170, gap = 60 } = {}) {
  const at = {};
  names.forEach((name, i) => {
    const x = 60 + i * (width + gap);
    cells.push(node({ id: `ll_${i}`, value: name, x, y, w: width, h: height, style: S.lifeline }));
    at[name] = x + width / 2;
  });
  return at;
}

// --- 05: placing an order across several shops --------------------------------------
{
  const cells = [];
  cells.push(node({ id: 'title', value: 'Placing an order across several shops', x: 40, y: 10, w: 700, h: 30, style: S.title }));
  cells.push(node({
    id: 'sub',
    value: 'The basket is priced before anything is created, then written as one order and one parcel per shop, in a single transaction.',
    x: 40, y: 34, w: 1000, h: 20, style: S.caption,
  }));

  const at = lifelines(cells, ['Customer', 'Express API', 'Order model', 'MySQL'], { height: 660 });

  const msgs = [
    { y: 150, from: 'Customer', to: 'Express API', text: 'POST /api/orders/quote  (the basket)' },
    { y: 185, from: 'Express API', to: 'Order model', text: 'quoteForItems(items, location)' },
    { y: 220, from: 'Order model', to: 'MySQL', text: 'read each product’s price, stock and shop' },
    { y: 255, from: 'MySQL', to: 'Order model', text: 'rows', ret: true },
    { y: 300, from: 'Order model', to: 'Express API', text: 'one parcel per shop, each with its own delivery fee', ret: true },
    { y: 335, from: 'Express API', to: 'Customer', text: 'items total · delivery total · total', ret: true },

    { y: 400, from: 'Customer', to: 'Express API', text: 'POST /api/orders  (confirm)' },
    { y: 435, from: 'Express API', to: 'Order model', text: 'createForCustomer(...)' },
    { y: 470, from: 'Order model', to: 'MySQL', text: 'BEGIN' },
    { y: 500, from: 'Order model', to: 'MySQL', text: 'price the basket again, server-side' },
    { y: 530, from: 'Order model', to: 'MySQL', text: 'insert the order' },
    { y: 560, from: 'Order model', to: 'MySQL', text: 'insert its items  ·  take the stock off the shelf' },
    { y: 590, from: 'Order model', to: 'MySQL', text: 'insert ONE SHIPMENT PER SHOP' },
    { y: 620, from: 'Order model', to: 'MySQL', text: 'COMMIT' },
    { y: 655, from: 'Order model', to: 'Express API', text: 'order id', ret: true },
    { y: 685, from: 'Express API', to: 'Customer', text: '201  ·  { id, status: "placed" }', ret: true },
  ];

  msgs.forEach((m, i) => cells.push(freeEdge({
    id: `m${i}`, value: m.text,
    x1: at[m.from], y1: m.y, x2: at[m.to], y2: m.y,
    style: m.ret ? S.msgReturn : S.msg,
  })));

  cells.push(node({
    id: 'note-price',
    value: 'Prices are read from the database both times, never taken\n'
      + 'from the request — so a tampered basket changes nothing, and\n'
      + 'the customer is charged exactly what the quote showed.',
    x: 980, y: 260, w: 340, h: 70, style: S.note,
  }));
  cells.push(node({
    id: 'note-tx',
    value: 'All of it in one transaction. A failure half way cannot leave\n'
      + 'stock deducted for an order that does not exist.',
    x: 980, y: 500, w: 340, h: 55, style: S.note,
  }));
  cells.push(node({
    id: 'note-split',
    value: 'THIS is what makes the platform multi-vendor:\n'
      + 'three shops in one basket become three parcels,\n'
      + 'each collected from a different place, priced on\n'
      + 'its own distance, and delivered separately.',
    x: 980, y: 580, w: 340, h: 80, style: S.note + 'fillColor=#eef2ff;strokeColor=#4338ca;',
  }));

  fs.writeFileSync(path.join(OUT, '05-sequence-order.drawio'), file('Placing an order', cells));
  console.log('05-sequence-order.drawio    ' + msgs.length + ' messages');
}

// --- 06: the two-party handover ------------------------------------------------------
{
  const cells = [];
  cells.push(node({ id: 'title', value: 'The handover: a courier collects a parcel', x: 40, y: 10, w: 700, h: 30, style: S.title }));
  cells.push(node({
    id: 'sub',
    value: 'It takes both sides. The courier asks for the parcel; the shop says whether the handover actually happened.',
    x: 40, y: 34, w: 1000, h: 20, style: S.caption,
  }));

  const at = lifelines(cells, ['Shop', 'Zamglam', 'Courier', 'Customer'], { height: 700 });

  const main = [
    { y: 140, from: 'Shop', to: 'Zamglam', text: 'mark the parcel shipped — it enters the pool' },
    { y: 175, from: 'Zamglam', to: 'Courier', text: 'appears in every on-duty courier’s list', ret: true },
    { y: 215, from: 'Courier', to: 'Zamglam', text: 'request pickup' },
    { y: 250, from: 'Zamglam', to: 'Zamglam', text: 'claim it — first to ask wins' },
    { y: 290, from: 'Zamglam', to: 'Courier', text: 'yours to collect', ret: true },
    { y: 325, from: 'Zamglam', to: 'Shop', text: 'notification: "<name> is collecting order #N"', ret: true },
    { y: 360, from: 'Zamglam', to: 'Customer', text: 'tracking: a courier is collecting it', ret: true },
    { y: 400, from: 'Courier', to: 'Shop', text: 'arrives at the counter  (in person)' },
  ];
  main.forEach((m, i) => cells.push(freeEdge({
    id: `h${i}`, value: m.text,
    x1: at[m.from], y1: m.y, x2: m.from === m.to ? at[m.to] + 70 : at[m.to], y2: m.y,
    style: (m.ret ? S.msgReturn : S.msg) + (m.from === m.to ? 'dashed=0;' : ''),
  })));

  // The two answers the shop can give.
  cells.push(node({ id: 'altBox', value: 'alt   the shop answers', x: 40, y: 430, w: 900, h: 290, style: S.layer + 'fillColor=none;strokeColor=#1f2937;dashed=1;' }));
  cells.push(node({ id: 'altYes', value: '[ the courier really took it ]', x: 60, y: 460, w: 260, h: 22, style: S.caption + 'fontStyle=2;fontColor=#047857;' }));

  const yes = [
    { y: 500, from: 'Shop', to: 'Zamglam', text: 'confirm the handover' },
    { y: 535, from: 'Zamglam', to: 'Customer', text: 'the courier’s name and number are released', ret: true },
    { y: 565, from: 'Zamglam', to: 'Courier', text: 'now out for delivery', ret: true },
  ];
  yes.forEach((m, i) => cells.push(freeEdge({
    id: `hy${i}`, value: m.text, x1: at[m.from], y1: m.y, x2: at[m.to], y2: m.y,
    style: (m.ret ? S.msgReturn : S.msg) + 'strokeColor=#047857;fontColor=#047857;',
  })));

  cells.push(freeEdge({ id: 'altDiv', x1: 45, y1: 595, x2: 935, y2: 595, style: 'html=1;endArrow=none;dashed=1;strokeColor=#1f2937;' }));
  cells.push(node({ id: 'altNo', value: '[ the courier never came ]', x: 60, y: 600, w: 260, h: 22, style: S.caption + 'fontStyle=2;fontColor=#c2410c;' }));

  const no = [
    { y: 640, from: 'Shop', to: 'Zamglam', text: 'not picked up  (+ a reason)' },
    { y: 670, from: 'Zamglam', to: 'Courier', text: 'the parcel leaves your list', ret: true },
    { y: 700, from: 'Zamglam', to: 'Customer', text: 'tracking: why it is still waiting', ret: true },
  ];
  no.forEach((m, i) => cells.push(freeEdge({
    id: `hn${i}`, value: m.text, x1: at[m.from], y1: m.y, x2: at[m.to], y2: m.y,
    style: (m.ret ? S.msgReturn : S.msg) + 'strokeColor=#c2410c;fontColor=#c2410c;',
  })));
  cells.push(node({
    id: 'backToPool',
    value: '→ back into the pool for another courier',
    x: 400, y: 725, w: 320, h: 24, style: S.caption + 'fontColor=#c2410c;fontStyle=1;',
  }));

  cells.push(node({
    id: 'note-gate',
    value: 'Why it takes two parties:\n\n'
      + 'A courier pressing "collected" is only their word for it.\n'
      + 'Until the shop confirms, nobody has actually taken the\n'
      + 'parcel — so it is not treated as collected, and the\n'
      + 'customer is not given anybody’s number.\n\n'
      + 'The one exception: the shop being asked to confirm sees\n'
      + 'the courier’s name from the moment they ask, because it\n'
      + 'is being asked to verify that this person took it.',
    x: 980, y: 140, w: 360, h: 170, style: S.note,
  }));
  cells.push(node({
    id: 'note-race',
    value: 'Claiming is a single conditional update, so two couriers\n'
      + 'racing for the same parcel cannot both win. The second\n'
      + 'is told somebody got there first.',
    x: 980, y: 330, w: 360, h: 60, style: S.note,
  }));

  fs.writeFileSync(path.join(OUT, '06-sequence-handover.drawio'), file('The handover', cells));
  console.log('06-sequence-handover.drawio ' + (main.length + yes.length + no.length) + ' messages, with both answers');
}

// --- 10: deployment ------------------------------------------------------------------
{
  const cells = [];
  cells.push(node({ id: 'title', value: 'Deployment', x: 40, y: 10, w: 600, h: 30, style: S.title }));
  cells.push(node({
    id: 'sub',
    value: 'How the pieces are hosted, and where the encryption the proposal commits to is applied.',
    x: 40, y: 34, w: 900, h: 20, style: S.caption,
  }));

  cells.push(node({ id: 'phone', value: 'Phone\n(browser)', x: 60, y: 130, w: 130, h: 70, style: S.box }));
  cells.push(node({ id: 'laptop', value: 'Computer\n(browser)', x: 60, y: 230, w: 130, h: 70, style: S.box }));

  cells.push(node({ id: 'host', value: 'Server  /  development machine', x: 280, y: 100, w: 700, h: 400, style: S.layer }));

  cells.push(node({ id: 'nginx', value: 'nginx\nserves the built React files\nproxies /api to the backend\nTLS terminates here', x: 320, y: 150, w: 260, h: 100, style: S.boxWarn }));
  cells.push(node({ id: 'api', value: 'Express\nnode server.js  ·  port 5000\n· the API\n· the hourly sweep', x: 320, y: 290, w: 260, h: 100, style: S.boxAccent }));
  cells.push(node({ id: 'mysql', value: 'MySQL / MariaDB\nport 3306\nschema created and migrated\nby the application', x: 640, y: 290, w: 280, h: 100, style: S.boxAccent }));
  cells.push(node({ id: 'files', value: 'uploads/\nproduct photos and\nregistration documents\n(a mounted volume)', x: 640, y: 150, w: 280, h: 100, style: S.box }));

  cells.push(edge({ id: 'd1', value: 'HTTPS', source: 'phone', target: 'nginx', style: S.arrowLabel + 'strokeColor=#c2410c;fontColor=#c2410c;fontStyle=1;' }));
  cells.push(edge({ id: 'd2', value: 'HTTPS', source: 'laptop', target: 'nginx', style: S.arrowLabel + 'strokeColor=#c2410c;fontColor=#c2410c;fontStyle=1;' }));
  cells.push(edge({ id: 'd3', value: '/api  (inside the host)', source: 'nginx', target: 'api', style: S.arrowLabel }));
  cells.push(edge({ id: 'd4', value: 'SQL', source: 'api', target: 'mysql', style: S.arrowLabel }));
  cells.push(edge({ id: 'd5', value: 'reads and writes', source: 'api', target: 'files', style: S.arrowLabel }));

  cells.push(node({
    id: 'note-tls',
    value: 'Objective 4 and the proposal’s ethical section commit to HTTPS/SSL.\n'
      + 'That is applied here, at nginx. Running the project locally for\n'
      + 'marking uses plain HTTP on localhost, where there is no network\n'
      + 'to intercept.',
    x: 1010, y: 130, w: 350, h: 90, style: S.note,
  }));
  cells.push(node({
    id: 'note-docker',
    value: 'docker-compose.yml defines all of this as containers on one\n'
      + 'network, plus phpMyAdmin and the optional Flask courier service.\n\n'
      + 'Honest caveat: Docker is not installed on the development\n'
      + 'machine, so the container stack is defined but has not been run\n'
      + 'end to end. The tested way to run it is in docs/01-SETUP.md.',
    x: 1010, y: 250, w: 350, h: 120, style: S.note + 'fillColor=#fef2f2;strokeColor=#b91c1c;',
  }));
  cells.push(node({
    id: 'note-relative',
    value: 'The browser calls a relative /api, never an absolute address —\n'
      + 'which is exactly why the same build works from a phone.',
    x: 280, y: 520, w: 480, h: 50, style: S.note,
  }));

  fs.writeFileSync(path.join(OUT, '10-deployment.drawio'), file('Deployment', cells));
  console.log('10-deployment.drawio        hosts, TLS boundary and the Docker caveat');
}

// --- 11: module dependencies ----------------------------------------------------------
{
  const cells = [];
  cells.push(node({ id: 'title', value: 'How the backend fits together', x: 40, y: 10, w: 700, h: 30, style: S.title }));
  cells.push(node({
    id: 'sub',
    value: 'A dependency diagram rather than a UML class diagram: the backend is modules of functions over SQL, not an object model with inheritance.',
    x: 40, y: 34, w: 1000, h: 20, style: S.caption,
  }));

  const boxes = [
    { id: 'server', label: 'server.js\nlistens  ·  runs the sweep', x: 60, y: 100, w: 240, h: 60, style: S.box },
    { id: 'app', label: 'app.js\nthe Express application\n(no port, no timers)', x: 60, y: 200, w: 240, h: 70, style: S.boxAccent },
    { id: 'routes', label: 'routes/\nwhat URL reaches what', x: 60, y: 310, w: 240, h: 55, style: S.box },
    { id: 'middleware', label: 'middleware/\nauth · role · suspension\nrate limit · uploads · errors', x: 370, y: 310, w: 240, h: 70, style: S.boxWarn },
    { id: 'controllers', label: 'controllers/\nrequest in, status code out', x: 60, y: 410, w: 240, h: 55, style: S.box },
    { id: 'models', label: 'models/\nthe rules, and all the SQL', x: 60, y: 510, w: 240, h: 55, style: S.boxAccent },
    { id: 'services', label: 'services/\ndelivery pricing · place lookup\n(no database)', x: 370, y: 505, w: 240, h: 70, style: S.box },
    { id: 'utils', label: 'utils/accounts.js\nturns a signed-in user into\ntheir profile id', x: 370, y: 410, w: 240, h: 70, style: S.box },
    { id: 'config', label: 'config/db.js\nthe pool, the schema,\nthe migrations', x: 60, y: 610, w: 240, h: 70, style: S.boxAccent },
    { id: 'tests', label: 'tests/\ndrive app.js directly through\nsupertest — the real routes', x: 660, y: 200, w: 260, h: 70, style: S.boxMuted },
  ];
  boxes.forEach((b) => cells.push(node(b)));

  const deps = [
    ['server', 'app', ''], ['app', 'routes', ''], ['app', 'middleware', ''],
    ['routes', 'middleware', ''], ['routes', 'controllers', ''],
    ['controllers', 'models', ''], ['controllers', 'utils', ''],
    ['models', 'config', ''], ['models', 'services', ''], ['models', 'utils', ''],
    ['middleware', 'models', 'suspension asks for standing'],
    ['tests', 'app', ''],
    ['server', 'models', 'the sweep'],
  ];
  deps.forEach(([from, to, label], i) => cells.push(edge({
    id: `dep${i}`, value: label, source: from, target: to, style: S.arrowLabel,
  })));

  cells.push(node({
    id: 'note-dir',
    value: 'Dependencies only ever point downwards.\n'
      + 'No model imports a controller, and no controller\n'
      + 'contains SQL — which is what keeps a rule in one\n'
      + 'place rather than repeated per route.',
    x: 660, y: 410, w: 330, h: 80, style: S.note,
  }));
  cells.push(node({
    id: 'note-class',
    value: 'Why this rather than a class diagram:\n\n'
      + 'The models are collections of static functions over SQL.\n'
      + 'Drawing them as UML classes with associations would show\n'
      + 'relationships the code does not have.',
    x: 660, y: 520, w: 330, h: 95, style: S.note,
  }));

  fs.writeFileSync(path.join(OUT, '11-module-dependencies.drawio'), file('Module dependencies', cells));
  console.log('11-module-dependencies.drawio  ' + boxes.length + ' modules');
}
