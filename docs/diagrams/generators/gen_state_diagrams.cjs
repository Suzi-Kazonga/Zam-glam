// The two state diagrams.
//
// 07 is built from TRACK_ORDER in backend/src/models/Order.js, so the parcel statuses shown
// are the ones the code actually uses. If a status is ever added or removed, regenerating
// this picks it up rather than leaving the diagram quietly wrong.
const fs = require('fs');
const path = require('path');
const { node, edge, file, S } = require('./drawio.cjs');

const OUT = process.argv[2] || '.';
const ORDER_MODEL = process.argv[3] || '../backend/src/models/Order.js';

// --- 07: the life of a parcel -------------------------------------------------------
{
  const source = fs.readFileSync(ORDER_MODEL, 'utf8');
  const match = source.match(/const TRACK_ORDER = \[([^\]]+)\]/);
  if (!match) throw new Error('Could not find TRACK_ORDER in ' + ORDER_MODEL);
  const statuses = match[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);

  // Who causes each move, and what it is called in the interface.
  const CAUSE = {
    processing: ['the shop', 'Start packing'],
    shipped: ['the shop', 'Hand to courier — enters the pool'],
    pickup_requested: ['a courier', 'Request pickup — claims it'],
    picked_up: ['the shop', 'Picked up — confirms the handover'],
    delivered: ['the courier', 'Delivered'],
  };

  const cells = [];
  cells.push(node({ id: 'title', value: 'The life of a parcel', x: 40, y: 10, w: 600, h: 30, style: S.title }));
  cells.push(node({
    id: 'sub',
    value: 'One shop’s items within an order. Generated from TRACK_ORDER in models/Order.js.',
    x: 40, y: 34, w: 800, h: 20, style: S.caption,
  }));

  cells.push(node({ id: 'start', value: '', x: 60, y: 118, w: 24, h: 24, style: S.stateStart }));

  const x0 = 130;
  const gap = 175;
  statuses.forEach((status, i) => {
    cells.push(node({
      id: `s_${status}`,
      value: status,
      x: x0 + i * gap, y: 100, w: 145, h: 60,
      style: ['pickup_requested', 'picked_up'].includes(status) ? S.state + 'fillColor=#eef2ff;strokeColor=#4338ca;' : S.state,
    }));
  });

  cells.push(edge({ id: 'e_start', value: 'customer places the order', source: 'start', target: `s_${statuses[0]}`, style: S.arrowLabel }));

  for (let i = 1; i < statuses.length; i += 1) {
    const [who, label] = CAUSE[statuses[i]] || ['', ''];
    cells.push(edge({
      id: `e_${i}`,
      value: `${label}\n(${who})`,
      source: `s_${statuses[i - 1]}`,
      target: `s_${statuses[i]}`,
      style: S.arrowLabel,
    }));
  }

  cells.push(node({ id: 'end', value: '', x: x0 + statuses.length * gap + 10, y: 118, w: 24, h: 24, style: S.stateEnd }));
  cells.push(edge({ id: 'e_end', source: `s_${statuses[statuses.length - 1]}`, target: 'end', style: S.arrow }));

  // The branch that makes the handover two-sided.
  cells.push(edge({
    id: 'e_deny',
    value: 'Not picked up — the shop says the courier never came.\nThe parcel returns to the pool and the customer is told why.',
    source: 's_pickup_requested',
    target: 's_shipped',
    style: S.arrowLabel + 'strokeColor=#c2410c;fontColor=#c2410c;dashed=1;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;',
    points: [{ x: x0 + 3.5 * gap, y: 300 }, { x: x0 + 2.5 * gap, y: 300 }],
  }));

  cells.push(node({
    id: 'cancel',
    value: 'cancelled',
    x: x0, y: 400, w: 145, h: 60,
    style: S.state + 'fillColor=#fef2f2;strokeColor=#b91c1c;',
  }));
  cells.push(edge({
    id: 'e_cancel',
    value: 'the shop cancels — stock goes back on the shelf.\nRefused once a courier has collected it.',
    source: 's_placed', target: 'cancel', style: S.arrowLabel + 'strokeColor=#b91c1c;fontColor=#b91c1c;',
  }));

  cells.push(node({
    id: 'note-escalate',
    value: 'Escalation: a parcel left in the pool for an hour is assigned\n'
      + 'automatically to the on-duty courier carrying the fewest.\n'
      + 'Assignment is not collection — that courier still requests it,\n'
      + 'and the shop still confirms.',
    x: 520, y: 400, w: 330, h: 90, style: S.note,
  }));

  cells.push(node({
    id: 'note-gate',
    value: 'The courier’s name and number reach the customer only\n'
      + 'at picked_up. Before the shop confirms, nobody has\n'
      + 'actually taken the parcel.',
    x: 880, y: 400, w: 320, h: 80, style: S.note,
  }));

  fs.writeFileSync(path.join(OUT, '07-state-parcel.drawio'), file('Parcel states', cells));
  console.log('07-state-parcel.drawio      ' + statuses.length + ' statuses read from the code');
}

// --- 08: the life of an account -----------------------------------------------------
{
  const cells = [];
  cells.push(node({ id: 'title', value: 'The life of an account', x: 40, y: 10, w: 600, h: 30, style: S.title }));
  cells.push(node({
    id: 'sub',
    value: 'Registration, vetting, and what an administrator can do afterwards. Shops and couriers are vetted differently; suspension and deletion apply to all three.',
    x: 40, y: 34, w: 1000, h: 20, style: S.caption,
  }));

  // Vetting a shop.
  cells.push(node({ id: 'shopTitle', value: 'A shop', x: 40, y: 80, w: 200, h: 24, style: S.caption + 'fontStyle=1;fontSize=13;fontColor=#1f2937;' }));
  cells.push(node({ id: 'shopStart', value: '', x: 60, y: 130, w: 24, h: 24, style: S.stateStart }));
  cells.push(node({ id: 'shopPending', value: 'pending\n(can sell, shows unverified)', x: 130, y: 112, w: 175, h: 60, style: S.state }));
  cells.push(node({ id: 'shopVerified', value: 'verified\n(carries the badge)', x: 380, y: 60, w: 165, h: 55, style: S.state + 'fillColor=#ecfdf5;strokeColor=#047857;' }));
  cells.push(node({ id: 'shopRejected', value: 'rejected', x: 380, y: 170, w: 165, h: 45, style: S.state + 'fillColor=#fef2f2;strokeColor=#b91c1c;' }));
  cells.push(edge({ id: 'se1', value: 'registers', source: 'shopStart', target: 'shopPending', style: S.arrowLabel }));
  cells.push(edge({ id: 'se2', value: 'admin accepts the documents', source: 'shopPending', target: 'shopVerified', style: S.arrowLabel }));
  cells.push(edge({ id: 'se3', value: 'admin rejects them', source: 'shopPending', target: 'shopRejected', style: S.arrowLabel }));
  cells.push(edge({ id: 'se4', value: 'submits fresh paperwork', source: 'shopRejected', target: 'shopPending', style: S.arrowLabel + 'dashed=1;' }));

  // Vetting a courier.
  cells.push(node({ id: 'cTitle', value: 'A courier', x: 40, y: 270, w: 200, h: 24, style: S.caption + 'fontStyle=1;fontSize=13;fontColor=#1f2937;' }));
  cells.push(node({ id: 'cStart', value: '', x: 60, y: 320, w: 24, h: 24, style: S.stateStart }));
  cells.push(node({ id: 'cPending', value: 'pending\n(cannot take any work)', x: 130, y: 302, w: 175, h: 60, style: S.state }));
  cells.push(node({ id: 'cApproved', value: 'approved', x: 380, y: 270, w: 165, h: 45, style: S.state + 'fillColor=#ecfdf5;strokeColor=#047857;' }));
  cells.push(node({ id: 'cRejected', value: 'rejected\n(taken off duty)', x: 380, y: 350, w: 165, h: 50, style: S.state + 'fillColor=#fef2f2;strokeColor=#b91c1c;' }));
  cells.push(node({ id: 'cDuty', value: 'on duty\n(sees the parcel pool)', x: 620, y: 262, w: 175, h: 55, style: S.state + 'fillColor=#eef2ff;strokeColor=#4338ca;' }));
  cells.push(edge({ id: 'ce1', value: 'registers', source: 'cStart', target: 'cPending', style: S.arrowLabel }));
  cells.push(edge({ id: 'ce2', value: 'admin approves', source: 'cPending', target: 'cApproved', style: S.arrowLabel }));
  cells.push(edge({ id: 'ce3', value: 'admin rejects', source: 'cPending', target: 'cRejected', style: S.arrowLabel }));
  cells.push(edge({ id: 'ce4', value: 'clocks on / off', source: 'cApproved', target: 'cDuty', style: S.arrowLabel }));
  cells.push(node({
    id: 'note-duty',
    value: 'Cannot clock off while answerable\nfor a parcel — it would be stranded,\nout of the pool and held by somebody\nwho has gone home.',
    x: 840, y: 250, w: 250, h: 80, style: S.note,
  }));

  // What an administrator can do to any account.
  cells.push(node({ id: 'aTitle', value: 'Any account, once it exists', x: 40, y: 450, w: 300, h: 24, style: S.caption + 'fontStyle=1;fontSize=13;fontColor=#1f2937;' }));
  cells.push(node({ id: 'aActive', value: 'active', x: 130, y: 500, w: 150, h: 50, style: S.state + 'fillColor=#ecfdf5;strokeColor=#047857;' }));
  cells.push(node({ id: 'aSuspended', value: 'suspended\n(can sign in and read,\ncannot act)', x: 370, y: 490, w: 185, h: 70, style: S.state + 'fillColor=#fff7ed;strokeColor=#c2410c;' }));
  cells.push(node({ id: 'aDeleted', value: 'deleted\n(30-day restore window:\ncannot sign in, products hidden)', x: 370, y: 620, w: 235, h: 75, style: S.state + 'fillColor=#fef2f2;strokeColor=#b91c1c;' }));
  cells.push(node({ id: 'aPurged', value: '', x: 700, y: 645, w: 24, h: 24, style: S.stateEnd }));

  cells.push(edge({ id: 'ae1', value: 'three upheld complaints,\nor an admin decision', source: 'aActive', target: 'aSuspended', style: S.arrowLabel }));
  cells.push(edge({ id: 'ae2', value: 'reinstated — open complaints cleared', source: 'aSuspended', target: 'aActive', style: S.arrowLabel + 'dashed=1;' }));
  cells.push(edge({ id: 'ae3', value: 'admin deletes', source: 'aActive', target: 'aDeleted', style: S.arrowLabel }));
  cells.push(edge({ id: 'ae4', value: 'restored', source: 'aDeleted', target: 'aActive', style: S.arrowLabel + 'dashed=1;' }));
  cells.push(edge({ id: 'ae5', value: 'window closes — removed for good', source: 'aDeleted', target: 'aPurged', style: S.arrowLabel }));

  cells.push(node({
    id: 'note-purge',
    value: 'A row that order history still points at is kept\n'
      + 'rather than destroyed, so an order never refers\n'
      + 'to an account that is gone.',
    x: 700, y: 700, w: 300, h: 70, style: S.note,
  }));

  fs.writeFileSync(path.join(OUT, '08-state-account.drawio'), file('Account states', cells));
  console.log('08-state-account.drawio     shop vetting, courier vetting, suspension and deletion');
}
