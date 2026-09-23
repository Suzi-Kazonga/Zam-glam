// The handover sequence — the diagram that explains what makes this project more than a
// catalogue with a checkout.
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

// ================= 05: the two-party handover =================
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
    path.join(OUT, '05-sequence-handover.drawio'),
    file('The handover', cells, { width: asideX + 420, height: LIFELINE_TOP + LIFELINE_HEIGHT + 80 }),
  );
  console.log('05-sequence-handover.drawio    14 messages, both answers framed');
}
