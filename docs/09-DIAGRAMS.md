# 9. Diagrams

Seven diagrams in [diagrams/](diagrams), as `.drawio` files. Every one earns its place in
the report; nothing here is decoration.

## Opening and editing them

Install the **Draw.io Integration** extension for VS Code (`hediet.vscode-drawio`), then
click any `.drawio` file — it opens in a full editor inside VS Code, not as XML.

They also open at [app.diagrams.net](https://app.diagrams.net), or in the desktop draw.io
application.

**To put one in the report:** with the file open, `Ctrl+Shift+P` → *Drawio: Export as PNG*
(or SVG, or PDF). Use **SVG or PDF** where you can — they stay sharp when the examiner
zooms in. High-resolution PNG is the fallback for Word.

## The set

| File | Shows | Objective |
| --- | --- | --- |
| [01-use-case](diagrams/01-use-case.drawio) | Four actors and 22 use cases inside the system boundary | 1, 3 |
| [02-architecture](diagrams/02-architecture.drawio) | The layered design, with the proposal's four modules shaded | 1 |
| [03-er-diagram](diagrams/03-er-diagram.drawio) | The entities and how they relate | 1 |
| [04-database-schema](diagrams/04-database-schema.drawio) | Every table, column, type, key and foreign key | 1 |
| [05-sequence-handover](diagrams/05-sequence-handover.drawio) | The two-party handover, with both answers the shop can give | 2 |
| [06-state-parcel](diagrams/06-state-parcel.drawio) | The life of a parcel, including the denial loop and escalation | 2 |
| [07-state-account](diagrams/07-state-account.drawio) | Shop verification, courier approval, suspension, soft delete | 1, 4 |

### Where each belongs

**In the report body:** 01, 02, 03, 05, 06. Five diagrams covering all four objectives.

**In an appendix:** 04. The full schema is too dense for a body page — 18 tables with every
column — but it is exactly what an appendix is for, and a marker checking your design
against your code will go straight to it.

**Either:** 07, depending on how much room you give objective 4. It is the best visual
evidence you have for that objective, since verification, approval, suspension and soft
delete are all real, tested behaviour.

### If you present only one

**05-sequence-handover.** It is the diagram that explains what makes this project more than
a catalogue with a checkout, and it answers your own problem statement directly: logistics
"organized manually between sellers and courier services".

## Four were deleted, deliberately

A site map, an order-placement sequence, a deployment diagram and a module dependency
diagram were drawn and then removed. They were supporting material rather than evidence:

- the **site map** was really a list, and the use case diagram covers objective 3 better;
- the **order sequence** repeated what the ER diagram and architecture already say about
  the parcel split, and the handover is the stronger sequence;
- the **deployment diagram** showed where TLS terminates on a container stack that has
  never been run, which a marker who reads the caveat would rightly discount;
- the **module dependency diagram** interests a developer more than an examiner, and the
  architecture diagram already shows the layering.

They are in the git history if you ever want them back.

## Three are generated from the system, not drawn by hand

This matters: they cannot quietly drift out of date the way a hand-drawn diagram does the
moment somebody adds a column.

- **04-database-schema** and **03-er-diagram** are built by reading the **live database** —
  every table, column, type and key comes from `SHOW FULL COLUMNS`, not from anybody's
  memory of the schema.
- **06-state-parcel** is built by reading `TRACK_ORDER` in `backend/src/models/Order.js`,
  so the statuses shown are the ones the code actually uses.

If the schema or the statuses change, regenerate rather than edit — see
[diagrams/generators/](diagrams/generators/README.md). **The other four are hand-laid** and
are yours to edit freely.

## The colours mean something

Every diagram uses the palette the interface itself uses, from
`frontend/src/utils/roleTheme.js`:

| | Role | Where you have seen it |
| --- | --- | --- |
| Indigo | **Customer** | The shopper header and buttons |
| Purple | **Shop** (vendor) | The seller dashboard |
| Emerald | **Courier** | The courier dashboard |
| Slate | **Administrator** | The admin console |

Amber means waiting on somebody — a shop not yet verified, a courier not yet approved, a
handover not yet confirmed. Rose means refused, suspended, deleted or cancelled.

So a reader who has used Zamglam recognises what they are looking at without a legend, and
a reader who has not can hold a diagram beside a screenshot.

## Notation

Standard UML where UML has a notation for it: use case, sequence, state machine. The ER
diagram uses labelled relationships rather than Chen notation, and the schema diagram is a
physical table diagram, which is not UML at all.

**Check this with your supervisor before finalising.** If the department expects a specific
notation — Chen ER diagrams, or data flow diagrams in Gane–Sarson — these give you the
right *content* quickly, and redrawing them is much easier than working out what should be
on them in the first place.

## Deliberately not drawn

**A UML class diagram.** The backend is modules of functions over SQL, not an object model
with inheritance and associations. A class diagram would show relationships the code does
not have, and an examiner reading the source would see that.

**Data flow diagrams.** Only worth producing if your department requires structured-analysis
notation. Ask before spending the effort.

## The notes on the diagrams

Several carry a note explaining a decision rather than just labelling a box — why the
handover needs both parties, why a deleted account that order history still points at is
kept rather than destroyed, what escalation does and does not do. Those are the parts an
examiner is most likely to ask about in the presentation, so the answer is already on the
picture.
