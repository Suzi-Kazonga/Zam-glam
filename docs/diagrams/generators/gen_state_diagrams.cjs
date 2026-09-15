// The two state diagrams.
//
// 06 is built from TRACK_ORDER in backend/src/models/Order.js, so the statuses shown are
// the ones the code actually uses. Adding or removing one and regenerating keeps the
// picture true; editing the file by hand does not.
const fs = require('fs');
const path = require('path');
const { node, edge, file, header, S, roleState } = require('./drawio.cjs');

const OUT = process.argv[2] || '.';
const ORDER_MODEL = process.argv[3] || path.join(__dirname, '../../../backend/src/models/Order.js');

// ================= 06: the life of a parcel =================
{
  const source = fs.readFileSync(ORDER_MODEL, 'utf8');
  const match = source.match(/const TRACK_ORDER = \[([^\]]+)\]/);
  if (!match) throw new Error('Could not find TRACK_ORDER in ' + ORDER_MODEL);
  const statuses = match[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);

  // What the shop, courier or customer sees, and who does it.
  const STEP = {
    processing: { label: 'Start packing', who: 'the shop', role: 'shop' },
    shipped: { label: 'Hand to courier', who: 'the shop', role: 'shop', note: 'the parcel enters the pool' },
    pickup_requested: { label: 'Request pickup', who: 'a courier', role: 'courier', note: 'claims it — first to ask wins' },
    picked_up: { label: 'Picked up', who: 'the shop', role: 'shop', note: 'confirms the handover really happened' },
    delivered: { label: 'Delivered', who: 'the courier', role: 'courier' },
  };

  // 'placed' is the customer's doing; every state after it belongs to a shop or a courier,
  // so each is drawn in the colour of whoever put the parcel there.
  const STATE_ROLE = { placed: 'customer' };
  Object.entries(STEP).forEach(([status, step]) => { STATE_ROLE[status] = step.role; });

  const cells = [];
  const top = header(
    cells,
    'The life of a parcel',
    'One shop’s items within an order. The statuses are read from TRACK_ORDER in models/Order.js, so this cannot drift from the code.',
    { width: 1200 },
  );

  // Generous horizontal spacing: each state is 190 wide with 130 of clear air, which is
  // where the transition labels sit.
  const STATE_W = 190;
  const STATE_H = 64;
  const STRIDE = 320;
  const ROW_Y = top + 90;

  cells.push(node({ id: 'start', value: '', x: 60, y: ROW_Y + 20, w: 26, h: 26, style: S.stateStart }));

  statuses.forEach((status, i) => {
    const handover = ['pickup_requested', 'picked_up'].includes(status);
    cells.push(node({
      id: `s_${status}`,
      value: status,
      x: 140 + i * STRIDE,
      y: ROW_Y,
      w: STATE_W,
      h: STATE_H,
      // The two handover states are drawn heavier: they are the point of the diagram.
      style: roleState(STATE_ROLE[status] || 'customer', handover ? 'strokeWidth=3;fontStyle=1;' : ''),
    }));
  });

  const lastX = 140 + (statuses.length - 1) * STRIDE;
  cells.push(node({ id: 'end', value: '', x: lastX + STATE_W + 70, y: ROW_Y + 20, w: 26, h: 26, style: S.stateEnd }));

  cells.push(edge({
    id: 'e_start',
    value: 'the customer\nplaces the order',
    source: 'start',
    target: `s_${statuses[0]}`,
    style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;',
  }));

  // Transition labels alternate above and below the line, so two long ones never collide.
  statuses.slice(1).forEach((status, index) => {
    const step = STEP[status] || { label: '', who: '' };
    const above = index % 2 === 0;
    const text = `${step.label}\n(${step.who})${step.note ? `\n${step.note}` : ''}`;
    cells.push(edge({
      id: `e_${index}`,
      value: text,
      source: `s_${statuses[index]}`,
      target: `s_${status}`,
      style: S.flow + `exitX=1;exitY=0.5;entryX=0;entryY=0.5;verticalAlign=${above ? 'bottom' : 'top'};`,
    }));
  });

  cells.push(edge({
    id: 'e_end',
    source: `s_${statuses[statuses.length - 1]}`,
    target: 'end',
    style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;',
  }));

  // The branch that makes the handover two-sided. Routed well below the main row so it
  // crosses nothing, with its own channel.
  const DENY_Y = ROW_Y + 200;
  cells.push(edge({
    id: 'e_deny',
    value: 'Not picked up  —  the shop says the courier never came.\nThe parcel returns to the pool and the customer is told why.',
    source: 's_pickup_requested',
    target: 's_shipped',
    style: S.flow + 'strokeColor=#c2410c;fontColor=#9a3412;dashed=1;strokeWidth=2;'
      + 'exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;',
    points: [
      { x: 140 + 3 * STRIDE + STATE_W / 2, y: DENY_Y },
      { x: 140 + 2 * STRIDE + STATE_W / 2, y: DENY_Y },
    ],
  }));

  // Cancellation, well clear of everything else.
  const CANCEL_Y = ROW_Y + 330;
  cells.push(node({ id: 'cancel', value: 'cancelled', x: 140 + STRIDE, y: CANCEL_Y, w: STATE_W, h: STATE_H, style: S.stateBad }));
  cells.push(edge({
    id: 'e_cancel',
    value: 'the shop cancels\nstock goes back on the shelf',
    source: 's_placed',
    target: 'cancel',
    style: S.flow + 'strokeColor=#b91c1c;fontColor=#7f1d1d;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
    points: [{ x: 140 + STATE_W / 2, y: CANCEL_Y + STATE_H / 2 }],
  }));

  const noteY = CANCEL_Y - 20;
  cells.push(node({
    id: 'noteEscalate',
    value: 'Escalation\n\n'
      + 'A parcel left in the pool for an hour is assigned automatically to the on-duty '
      + 'courier carrying the fewest.\n\n'
      + 'Assignment is not collection — that courier still requests it, and the shop '
      + 'still confirms.',
    x: 140 + 2 * STRIDE, y: noteY, w: 330, h: 150, style: S.note,
  }));

  cells.push(node({
    id: 'noteGate',
    value: 'Why two parties\n\n'
      + 'A courier pressing "collected" is only their word for it. Until the shop confirms, '
      + 'nobody has actually taken the parcel.\n\n'
      + 'The courier’s name and number reach the customer at picked_up, and not before.',
    x: 140 + 3 * STRIDE + 60, y: noteY, w: 330, h: 150, style: S.noteKey,
  }));

  fs.writeFileSync(
    path.join(OUT, '06-state-parcel.drawio'),
    file('Parcel states', cells, { width: lastX + STATE_W + 200, height: CANCEL_Y + 220 }),
  );
  console.log(`06-state-parcel.drawio         ${statuses.length} statuses read from the code`);
}

// ================= 07: the life of an account =================
{
  const cells = [];
  const top = header(
    cells,
    'The life of an account',
    'Registration, vetting, and everything an administrator can do afterwards. Shops and couriers are vetted differently; suspension and deletion apply to all three.',
    { width: 1200 },
  );

  const W = 210;
  const H = 66;
  const COL = [80, 380, 680, 980];

  // --- a shop ---
  const shopY = top + 40;
  cells.push(node({ id: 'shopBand', value: 'A shop  —  verification', x: 60, y: shopY - 34, w: 1120, h: 190, style: S.groupClear }));
  cells.push(node({ id: 'shopStart', value: '', x: COL[0] - 40, y: shopY + 60, w: 26, h: 26, style: S.stateStart }));
  cells.push(node({ id: 'shopPending', value: 'pending\ncan sell, shows as unverified', x: COL[0], y: shopY + 40, w: W, h: H, style: S.stateWaiting }));
  cells.push(node({ id: 'shopVerified', value: 'verified\ncarries the badge shoppers see', x: COL[1], y: shopY, w: W, h: H, style: roleState('shop', 'strokeWidth=3;fontStyle=1;') }));
  cells.push(node({ id: 'shopRejected', value: 'rejected', x: COL[1], y: shopY + 100, w: W, h: 48, style: S.stateBad }));

  cells.push(edge({ id: 'se1', value: 'registers', source: 'shopStart', target: 'shopPending', style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));
  cells.push(edge({ id: 'se2', value: 'admin accepts\nthe documents', source: 'shopPending', target: 'shopVerified', style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));
  cells.push(edge({ id: 'se3', value: 'admin rejects them', source: 'shopPending', target: 'shopRejected', style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));
  cells.push(edge({
    id: 'se4', value: 'submits fresh paperwork',
    source: 'shopRejected', target: 'shopPending',
    style: S.flow + 'dashed=1;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;',
    points: [{ x: COL[1] + W / 2, y: shopY + 170 }, { x: COL[0] + W / 2, y: shopY + 170 }],
  }));
  cells.push(node({
    id: 'shopNote',
    value: 'The proposal’s first stated problem: shoppers cannot tell a checked seller from an unchecked one.',
    x: COL[2], y: shopY + 40, w: 300, h: 60, style: S.note,
  }));

  // --- a courier ---
  const cY = top + 250;
  cells.push(node({ id: 'courierBand', value: 'A courier  —  approval and duty', x: 60, y: cY - 34, w: 1120, h: 190, style: S.groupClear }));
  cells.push(node({ id: 'cStart', value: '', x: COL[0] - 40, y: cY + 60, w: 26, h: 26, style: S.stateStart }));
  cells.push(node({ id: 'cPending', value: 'pending\ncannot take any work', x: COL[0], y: cY + 40, w: W, h: H, style: S.stateWaiting }));
  cells.push(node({ id: 'cApproved', value: 'approved', x: COL[1], y: cY, w: W, h: 48, style: roleState('courier') }));
  cells.push(node({ id: 'cRejected', value: 'rejected\ntaken off duty', x: COL[1], y: cY + 95, w: W, h: 55, style: S.stateBad }));
  cells.push(node({ id: 'cDuty', value: 'on duty\nsees the parcel pool', x: COL[2], y: cY - 5, w: W, h: H, style: roleState('courier', 'strokeWidth=3;fontStyle=1;') }));

  cells.push(edge({ id: 'ce1', value: 'registers', source: 'cStart', target: 'cPending', style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));
  cells.push(edge({ id: 'ce2', value: 'admin approves', source: 'cPending', target: 'cApproved', style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));
  cells.push(edge({ id: 'ce3', value: 'admin rejects', source: 'cPending', target: 'cRejected', style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));
  cells.push(edge({ id: 'ce4', value: 'clocks on', source: 'cApproved', target: 'cDuty', style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));
  cells.push(node({
    id: 'dutyNote',
    value: 'Cannot clock off while answerable for a parcel — it would be stranded, out of the pool and held by somebody who has gone home.',
    x: COL[3] - 40, y: cY, w: 300, h: 70, style: S.note,
  }));

  // --- any account ---
  const aY = top + 470;
  cells.push(node({ id: 'anyBand', value: 'Any account, once it exists  —  moderation', x: 60, y: aY - 34, w: 1120, h: 260, style: S.groupClear }));
  cells.push(node({ id: 'aActive', value: 'active', x: COL[0], y: aY + 60, w: W, h: 55, style: roleState('courier', 'fontStyle=1;') }));
  cells.push(node({ id: 'aSuspended', value: 'suspended\ncan sign in and read,\ncannot act', x: COL[1], y: aY, w: W, h: 76, style: S.stateWaiting }));
  cells.push(node({ id: 'aDeleted', value: 'deleted\n30-day restore window:\ncannot sign in,\nproducts hidden', x: COL[1], y: aY + 130, w: W, h: 88, style: S.stateBad }));
  cells.push(node({ id: 'aPurged', value: '', x: COL[2] + 60, y: aY + 160, w: 26, h: 26, style: S.stateEnd }));

  cells.push(edge({ id: 'ae1', value: 'three upheld complaints,\nor an admin decision', source: 'aActive', target: 'aSuspended', style: S.flow + 'exitX=1;exitY=0.3;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;' }));
  cells.push(edge({
    id: 'ae2', value: 'reinstated\nopen complaints cleared',
    source: 'aSuspended', target: 'aActive',
    style: S.flow + 'dashed=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;',
    points: [{ x: COL[1] + W / 2, y: aY - 20 }, { x: COL[0] + W / 2, y: aY - 20 }],
  }));
  cells.push(edge({ id: 'ae3', value: 'admin deletes', source: 'aActive', target: 'aDeleted', style: S.flow + 'exitX=1;exitY=0.7;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;' }));
  cells.push(edge({
    id: 'ae4', value: 'restored',
    source: 'aDeleted', target: 'aActive',
    style: S.flow + 'dashed=1;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;',
    points: [{ x: COL[1] + W / 2, y: aY + 240 }, { x: COL[0] + W / 2, y: aY + 240 }],
  }));
  cells.push(edge({ id: 'ae5', value: 'the window closes\nremoved for good', source: 'aDeleted', target: 'aPurged', style: S.flow + 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;' }));

  cells.push(node({
    id: 'purgeNote',
    value: 'A row that order history still points at is kept rather than destroyed, so an order never refers to an account that is gone.',
    x: COL[3] - 40, y: aY + 130, w: 300, h: 70, style: S.note,
  }));
  cells.push(node({
    id: 'suspendNote',
    value: 'A suspended account can still file a complaint — being suspended does not silence somebody with a genuine grievance about whoever got them suspended.',
    x: COL[3] - 40, y: aY, w: 300, h: 85, style: S.note,
  }));

  fs.writeFileSync(
    path.join(OUT, '07-state-account.drawio'),
    file('Account states', cells, { width: 1500, height: aY + 320 }),
  );
  console.log('07-state-account.drawio        three bands: verification, approval, moderation');
}
