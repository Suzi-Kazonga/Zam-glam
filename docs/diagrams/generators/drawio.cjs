// Small helpers for writing draw.io (.drawio) files.
//
// A .drawio file is XML: an mxGraphModel holding cells. Vertices are boxes, edges are the
// arrows between them. Writing it by hand is painful, so these build the XML and the
// diagrams themselves are described as data.

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// A plain box.
function node({ id, value, x, y, w = 160, h = 40, style = '', parent = '1' }) {
  return `        <mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="${parent}">
          <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" />
        </mxCell>`;
}

// A box inside another box, positioned relative to it (used for table rows).
function child({ id, value, y, w, h = 22, style = '', parent }) {
  return `        <mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="${parent}">
          <mxGeometry y="${y}" width="${w}" height="${h}" as="geometry" />
        </mxCell>`;
}

// An arrow between two boxes.
function edge({ id, value = '', source, target, style = '', parent = '1', points = [] }) {
  const waypoints = points.length
    ? `\n            <Array as="points">${points.map((p) => `<mxPoint x="${p.x}" y="${p.y}" />`).join('')}</Array>`
    : '';
  return `        <mxCell id="${id}" value="${esc(value)}" style="${style}" edge="1" parent="${parent}" source="${source}" target="${target}">
          <mxGeometry relative="1" as="geometry">${waypoints}
          </mxGeometry>
        </mxCell>`;
}

// An arrow drawn between two fixed points, for sequence diagrams where the ends are
// positions on a lifeline rather than whole shapes.
function freeEdge({ id, value = '', x1, y1, x2, y2, style = '', parent = '1' }) {
  return `        <mxCell id="${id}" value="${esc(value)}" style="${style}" edge="1" parent="${parent}">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="${x1}" y="${y1}" as="sourcePoint" />
            <mxPoint x="${x2}" y="${y2}" as="targetPoint" />
          </mxGeometry>
        </mxCell>`;
}

// Wraps the cells into a complete file.
function file(name, cells) {
  return `<mxfile host="app.diagrams.net" agent="Zamglam diagram generator" type="device">
  <diagram name="${esc(name)}" id="${esc(name.replace(/[^A-Za-z0-9]/g, '-'))}">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="826" math="0" shadow="0">
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

// --- shared styles, so every diagram looks like it belongs to the same set ---
const S = {
  actor: 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#ffffff;strokeColor=#1f2937;',
  useCase: 'ellipse;whiteSpace=wrap;html=1;fillColor=#eef2ff;strokeColor=#4338ca;fontSize=11;',
  box: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#1f2937;fontSize=12;',
  boxAccent: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#eef2ff;strokeColor=#4338ca;fontSize=12;',
  boxWarn: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#fff7ed;strokeColor=#c2410c;fontSize=12;',
  boxMuted: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#f8fafc;strokeColor=#94a3b8;fontSize=11;fontColor=#475569;',
  layer: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;verticalAlign=top;align=left;spacingLeft=10;spacingTop=6;fontStyle=1;fontSize=12;',
  state: 'rounded=1;arcSize=40;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#1f2937;fontSize=11;',
  stateStart: 'ellipse;html=1;fillColor=#1f2937;strokeColor=#1f2937;',
  stateEnd: 'ellipse;shape=endState;html=1;fillColor=#1f2937;strokeColor=#1f2937;',
  table: 'swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;html=1;fillColor=#ffffff;strokeColor=#1f2937;swimlaneFillColor=#ffffff;fontSize=12;',
  tableAccent: 'swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;html=1;fillColor=#eef2ff;strokeColor=#4338ca;swimlaneFillColor=#ffffff;fontSize=12;',
  field: 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;html=1;fontSize=10;',
  fieldKey: 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;html=1;fontSize=10;fontStyle=1;',
  arrow: 'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;strokeColor=#1f2937;fontSize=10;',
  arrowLabel: 'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;strokeColor=#1f2937;fontSize=10;verticalAlign=bottom;',
  plain: 'edgeStyle=none;html=1;endArrow=none;strokeColor=#1f2937;',
  lifeline: 'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#ffffff;strokeColor=#1f2937;fontSize=11;',
  msg: 'html=1;endArrow=block;endFill=1;strokeColor=#1f2937;fontSize=10;verticalAlign=bottom;align=center;',
  msgReturn: 'html=1;endArrow=open;endFill=0;dashed=1;strokeColor=#64748b;fontSize=10;verticalAlign=bottom;align=center;fontColor=#475569;',
  note: 'shape=note;whiteSpace=wrap;html=1;size=14;fillColor=#fffbeb;strokeColor=#b45309;align=left;spacingLeft=6;fontSize=10;verticalAlign=top;',
  title: 'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=16;fontStyle=1;',
  caption: 'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontSize=11;fontColor=#475569;',
};

module.exports = { esc, node, child, edge, freeEdge, file, S };
