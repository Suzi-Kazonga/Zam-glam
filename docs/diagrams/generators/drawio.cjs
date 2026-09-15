// Helpers for writing draw.io (.drawio) files.
//
// A .drawio file is XML: an mxGraphModel holding cells. Vertices are boxes, edges are the
// arrows between them. Writing that by hand is painful, so these build the XML and each
// diagram is described as data instead.
//
// Layout is calculated, not eyeballed — column stacking works out its own heights, so
// adding a column to a table can never push one box on top of another.
//
// COLOURS MATCH THE RUNNING APPLICATION. The palette below is the same one the interface
// uses (frontend/src/utils/roleTheme.js), so a customer is indigo in the app and indigo on
// every diagram, a shop is purple, a courier emerald and an administrator slate. Somebody
// who has used Zamglam can read these without a legend.

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// The exact values behind the Tailwind classes the interface uses.
const C = {
  // customer
  indigo600: '#4f46e5', indigo700: '#4338ca', indigo100: '#e0e7ff', indigo50: '#eef2ff',
  // shop / seller
  purple700: '#7e22ce', purple800: '#6b21a8', purple100: '#f3e8ff', purple50: '#faf5ff',
  // courier
  emerald600: '#059669', emerald700: '#047857', emerald800: '#065f46', emerald100: '#d1fae5', emerald50: '#ecfdf5',
  // administrator, and everything neutral
  slate900: '#0f172a', slate800: '#1e293b', slate700: '#334155', slate600: '#475569',
  slate500: '#64748b', slate400: '#94a3b8', slate300: '#cbd5e1', slate200: '#e2e8f0',
  slate100: '#f1f5f9', slate50: '#f8fafc',
  // refused, suspended, deleted
  rose600: '#e11d48', rose700: '#be123c', rose800: '#9f1239', rose200: '#fecdd3', rose100: '#ffe4e6', rose50: '#fff1f2',
  // waiting on somebody
  amber700: '#b45309', amber800: '#92400e', amber900: '#78350f', amber200: '#fde68a', amber100: '#fef3c7', amber50: '#fffbeb',
  white: '#ffffff',
};

// The four roles, exactly as the interface colours them.
const ROLE = {
  customer: { fill: C.indigo50, stroke: C.indigo600, text: C.indigo700, solid: C.indigo600 },
  shop: { fill: C.purple50, stroke: C.purple700, text: C.purple800, solid: C.purple700 },
  courier: { fill: C.emerald50, stroke: C.emerald700, text: C.emerald800, solid: C.emerald700 },
  admin: { fill: C.slate100, stroke: C.slate900, text: C.slate900, solid: C.slate900 },
};

// A box in a role's colours.
const roleBox = (role, extra = '') => {
  const r = ROLE[role];
  return `rounded=0;whiteSpace=wrap;html=1;fillColor=${r.fill};strokeColor=${r.stroke};fontColor=${r.text};fontSize=12;verticalAlign=middle;${extra}`;
};
const roleSolid = (role, extra = '') => {
  const r = ROLE[role];
  return `rounded=0;whiteSpace=wrap;html=1;fillColor=${r.solid};strokeColor=${r.solid};fontColor=${C.white};fontSize=12;fontStyle=1;verticalAlign=middle;${extra}`;
};
const roleState = (role, extra = '') => {
  const r = ROLE[role];
  return `rounded=1;arcSize=30;whiteSpace=wrap;html=1;fillColor=${r.fill};strokeColor=${r.stroke};fontColor=${r.text};fontSize=12;${extra}`;
};
const roleActor = (role) => {
  const r = ROLE[role];
  return `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=${r.solid};strokeColor=${r.solid};fontColor=${r.text};fontSize=12;fontStyle=1;`;
};
const roleUseCase = (role) => {
  const r = ROLE[role];
  return `ellipse;whiteSpace=wrap;html=1;fillColor=${r.fill};strokeColor=${r.stroke};fontColor=${r.text};fontSize=12;`;
};
const roleLifeline = (role) => {
  const r = ROLE[role];
  return `shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=${r.fill};strokeColor=${r.stroke};fontColor=${r.text};fontSize=13;fontStyle=1;`;
};
const roleTable = (role) => {
  const r = ROLE[role];
  return `swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=0;resizeParentMax=0;html=1;fillColor=${r.solid};strokeColor=${r.stroke};swimlaneFillColor=${C.white};fontSize=13;fontColor=${C.white};`;
};
const roleMsg = (role) => {
  const r = ROLE[role];
  return `html=1;endArrow=block;endFill=1;strokeColor=${r.stroke};fontColor=${r.text};fontSize=11;verticalAlign=bottom;align=center;labelBackgroundColor=${C.white};`;
};

function node({ id, value, x, y, w = 160, h = 40, style = '', parent = '1' }) {
  return `        <mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="${parent}">
          <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" />
        </mxCell>`;
}

// A row inside a table shape: stacked automatically, so only its height matters.
function row({ id, value, y, w, h = 20, style = '', parent }) {
  return `        <mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="${parent}">
          <mxGeometry y="${y}" width="${w}" height="${h}" as="geometry" />
        </mxCell>`;
}

function edge({ id, value = '', source, target, style = '', parent = '1', points = [] }) {
  const waypoints = points.length
    ? `
            <Array as="points">${points.map((p) => `<mxPoint x="${p.x}" y="${p.y}" />`).join('')}</Array>`
    : '';
  return `        <mxCell id="${id}" value="${esc(value)}" style="${style}" edge="1" parent="${parent}" source="${source}" target="${target}">
          <mxGeometry relative="1" as="geometry">${waypoints}
          </mxGeometry>
        </mxCell>`;
}

function freeEdge({ id, value = '', x1, y1, x2, y2, style = '', parent = '1' }) {
  return `        <mxCell id="${id}" value="${esc(value)}" style="${style}" edge="1" parent="${parent}">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="${x1}" y="${y1}" as="sourcePoint" />
            <mxPoint x="${x2}" y="${y2}" as="targetPoint" />
          </mxGeometry>
        </mxCell>`;
}

function file(name, cells, { width = 1600, height = 1200 } = {}) {
  return `<mxfile host="app.diagrams.net" agent="Zamglam diagram generator" type="device">
  <diagram name="${esc(name)}" id="${esc(name.replace(/[^A-Za-z0-9]/g, '-'))}">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${width}" pageHeight="${height}" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
${cells.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;
}

// Stacks boxes down a column, working out each y from the heights above it.
function column({ x, top = 0, gap = 40 }) {
  let y = top;
  return {
    place(height) { const at = y; y += height + gap; return at; },
    get bottom() { return y - gap; },
    x,
  };
}

const S = {
  // neutral building blocks
  box: `rounded=0;whiteSpace=wrap;html=1;fillColor=${C.white};strokeColor=${C.slate700};fontColor=${C.slate900};fontSize=12;verticalAlign=middle;`,
  boxMuted: `rounded=0;whiteSpace=wrap;html=1;fillColor=${C.slate50};strokeColor=${C.slate400};fontSize=11;fontColor=${C.slate600};verticalAlign=middle;`,
  boxWarn: `rounded=0;whiteSpace=wrap;html=1;fillColor=${C.amber50};strokeColor=${C.amber700};fontColor=${C.amber900};fontSize=12;verticalAlign=middle;`,
  boxBad: `rounded=0;whiteSpace=wrap;html=1;fillColor=${C.rose50};strokeColor=${C.rose600};fontColor=${C.rose800};fontSize=12;verticalAlign=middle;`,

  group: `rounded=0;whiteSpace=wrap;html=1;fillColor=${C.slate50};strokeColor=${C.slate300};verticalAlign=top;align=left;spacingLeft=14;spacingTop=8;fontStyle=1;fontSize=13;fontColor=${C.slate700};container=1;collapsible=0;`,
  groupClear: `rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=${C.slate400};dashed=1;verticalAlign=top;align=left;spacingLeft=14;spacingTop=8;fontStyle=1;fontSize=13;fontColor=${C.slate600};container=1;collapsible=0;`,

  state: `rounded=1;arcSize=30;whiteSpace=wrap;html=1;fillColor=${C.white};strokeColor=${C.slate700};fontColor=${C.slate900};fontSize=12;`,
  stateWaiting: `rounded=1;arcSize=30;whiteSpace=wrap;html=1;fillColor=${C.amber50};strokeColor=${C.amber700};fontColor=${C.amber900};fontSize=12;`,
  stateBad: `rounded=1;arcSize=30;whiteSpace=wrap;html=1;fillColor=${C.rose50};strokeColor=${C.rose600};fontColor=${C.rose800};fontSize=12;`,
  stateStart: `ellipse;html=1;fillColor=${C.slate900};strokeColor=${C.slate900};`,
  stateEnd: `ellipse;shape=endState;html=1;fillColor=${C.slate900};strokeColor=${C.slate900};`,

  table: `swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=0;resizeParentMax=0;html=1;fillColor=${C.white};strokeColor=${C.slate700};swimlaneFillColor=${C.white};fontSize=13;fontColor=${C.slate900};`,
  tableKey: `swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=0;resizeParentMax=0;html=1;fillColor=${C.indigo600};strokeColor=${C.indigo700};swimlaneFillColor=${C.white};fontSize=13;fontColor=${C.white};`,
  tableLegacy: `swimlane;fontStyle=3;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=0;resizeParentMax=0;html=1;fillColor=${C.slate200};strokeColor=${C.slate400};swimlaneFillColor=${C.slate50};fontSize=12;fontColor=${C.slate600};opacity=70;`,
  field: `text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=8;html=1;fontSize=11;fontColor=${C.slate700};`,
  fieldPk: `text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=8;html=1;fontSize=11;fontStyle=1;fontColor=${C.slate900};`,
  fieldFk: `text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=8;html=1;fontSize=11;fontColor=${C.indigo700};`,

  rel: `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeColor=${C.slate500};fontSize=11;fontColor=${C.slate600};labelBackgroundColor=${C.white};spacing=4;jumpStyle=arc;jumpSize=8;`,
  relKey: `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeColor=${C.indigo600};strokeWidth=2;fontSize=11;fontStyle=1;fontColor=${C.indigo700};labelBackgroundColor=${C.white};spacing=4;jumpStyle=arc;jumpSize=8;`,
  fk: `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;endFill=0;strokeColor=${C.slate400};fontSize=10;fontColor=${C.slate600};labelBackgroundColor=${C.white};jumpStyle=arc;jumpSize=8;`,
  flow: `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeColor=${C.slate700};fontSize=11;fontColor=${C.slate700};labelBackgroundColor=${C.white};spacing=6;`,
  flowBad: `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeColor=${C.rose600};fontSize=11;fontColor=${C.rose800};labelBackgroundColor=${C.white};spacing=6;`,
  link: `edgeStyle=none;html=1;endArrow=none;strokeColor=${C.slate400};`,

  lifeline: `shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=${C.white};strokeColor=${C.slate700};fontSize=13;fontStyle=1;`,
  msg: `html=1;endArrow=block;endFill=1;strokeColor=${C.slate700};fontSize=11;verticalAlign=bottom;align=center;labelBackgroundColor=${C.white};`,
  msgBack: `html=1;endArrow=open;endFill=0;dashed=1;strokeColor=${C.slate500};fontSize=11;verticalAlign=bottom;align=center;fontColor=${C.slate600};labelBackgroundColor=${C.white};`,
  msgGood: `html=1;endArrow=block;endFill=1;strokeColor=${C.emerald700};fontSize=11;verticalAlign=bottom;align=center;fontColor=${C.emerald800};labelBackgroundColor=${C.white};`,
  msgBad: `html=1;endArrow=block;endFill=1;strokeColor=${C.rose600};fontSize=11;verticalAlign=bottom;align=center;fontColor=${C.rose800};labelBackgroundColor=${C.white};`,

  note: `shape=note;whiteSpace=wrap;html=1;size=16;fillColor=${C.amber50};strokeColor=${C.amber700};align=left;spacingLeft=10;spacingTop=4;fontSize=11;verticalAlign=top;fontColor=${C.amber900};`,
  noteKey: `shape=note;whiteSpace=wrap;html=1;size=16;fillColor=${C.indigo50};strokeColor=${C.indigo600};align=left;spacingLeft=10;spacingTop=4;fontSize=11;verticalAlign=top;fontColor=${C.indigo700};`,
  noteBad: `shape=note;whiteSpace=wrap;html=1;size=16;fillColor=${C.rose50};strokeColor=${C.rose600};align=left;spacingLeft=10;spacingTop=4;fontSize=11;verticalAlign=top;fontColor=${C.rose800};`,

  title: `text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=20;fontStyle=1;fontColor=${C.slate900};`,
  subtitle: `text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=12;fontColor=${C.slate600};`,
  heading: `text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=14;fontStyle=1;fontColor=${C.slate900};`,
  caption: `text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontSize=11;fontColor=${C.slate600};`,
};

function header(cells, title, subtitle, { x = 60, y = 30, width = 1100 } = {}) {
  cells.push(node({ id: 'diagramTitle', value: title, x, y, w: width, h: 32, style: S.title }));
  cells.push(node({ id: 'diagramSubtitle', value: subtitle, x, y: y + 34, w: width, h: 18, style: S.subtitle }));
  return y + 80;
}

// The colour key, so a reader who has not used the application still knows what the
// colours mean. Dropped into the corner of every diagram that uses more than one role.
function roleLegend(cells, { x, y, roles = ['customer', 'shop', 'courier', 'admin'] }) {
  const LABEL = { customer: 'Customer', shop: 'Shop (vendor)', courier: 'Courier', admin: 'Administrator' };
  cells.push(node({ id: 'legendHeading', value: 'Colours, as in the app', x, y, w: 260, h: 22, style: S.heading }));
  roles.forEach((role, i) => {
    cells.push(node({
      id: `legendRole${i}`,
      value: LABEL[role],
      x, y: y + 30 + i * 32, w: 260, h: 26,
      style: roleBox(role, 'align=left;spacingLeft=10;'),
    }));
  });
  return y + 30 + roles.length * 32;
}

module.exports = {
  esc, node, row, edge, freeEdge, file, column, header, roleLegend,
  S, C, ROLE, roleBox, roleSolid, roleState, roleActor, roleUseCase, roleLifeline, roleTable, roleMsg,
};
