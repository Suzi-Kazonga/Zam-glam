# 9. Diagrams

Eleven diagrams in [diagrams/](diagrams), as `.drawio` files.

## Opening and editing them

Install the **Draw.io Integration** extension for VS Code (`hediet.vscode-drawio`), then
click any `.drawio` file — it opens in a full editor inside VS Code, not as XML.

They also open at [app.diagrams.net](https://app.diagrams.net) if you prefer the browser, or
in the desktop draw.io application.

**To put one in the report:** with the file open, `Ctrl+Shift+P` →
*Drawio: Export as PNG* (or SVG, or PDF). Use **SVG or PDF** if you can — they stay sharp
when the examiner zooms in. PNG at high resolution is the fallback for Word.

## What each one shows, and which objective it evidences

| File | Shows | Objective |
| --- | --- | --- |
| [01-use-case](diagrams/01-use-case.drawio) | Four actors and 22 use cases inside the system boundary | 1, 3 |
| [02-architecture](diagrams/02-architecture.drawio) | The layered design, with the proposal's four modules marked | 1 |
| [03-er-diagram](diagrams/03-er-diagram.drawio) | Entities and how they relate, without column detail | 1 |
| [04-database-schema](diagrams/04-database-schema.drawio) | Every table, column, type and key | 1 |
| [05-sequence-order](diagrams/05-sequence-order.drawio) | Placing an order across several shops, and the split into parcels | 1 |
| [06-sequence-handover](diagrams/06-sequence-handover.drawio) | The two-party handover, with both answers the shop can give | 2 |
| [07-state-parcel](diagrams/07-state-parcel.drawio) | The life of a parcel, including the denial loop and escalation | 2 |
| [08-state-account](diagrams/08-state-account.drawio) | Shop verification, courier approval, suspension, soft delete | 1, 4 |
| [09-site-map](diagrams/09-site-map.drawio) | What each kind of account can reach | 3 |
| [10-deployment](diagrams/10-deployment.drawio) | Hosting, and where TLS is applied | 4 |
| [11-module-dependencies](diagrams/11-module-dependencies.drawio) | How the backend fits together | 1 |

**If you only use four**, use 04, 06, 08 and 02 — between them they carry all four
objectives, and 06 is the one that explains what makes this project more than a catalogue
with a checkout.

## Three of them are generated from the system, not drawn by hand

This matters: it means they cannot quietly drift out of date the way a hand-drawn diagram
does the moment somebody adds a column.

- **04-database-schema** and **03-er-diagram** were built by reading the **live database** —
  every table, column, type and key comes from `SHOW FULL COLUMNS`, not from anybody's
  memory of the schema.
- **07-state-parcel** was built by reading `TRACK_ORDER` in `backend/src/models/Order.js`,
  so the parcel statuses shown are the ones the code actually uses.

If the schema or the statuses change, regenerate rather than edit. The generators are kept
with this documentation; ask if you need them re-run.

**The other eight are hand-laid** and will need editing by hand if the system changes.

## Notation

Standard UML where UML has a notation for it: use case, sequence, state machine, deployment.
The ER diagram uses crow's-foot-style labelled relationships rather than Chen notation.
The schema diagram is a physical table diagram, which is not UML at all.

**Check this with your supervisor before finalising.** If the department expects a specific
notation — Chen ER diagrams, or data flow diagrams in Gane–Sarson — these give you the
right *content* quickly, and redrawing them in the required notation is much easier than
working out what should be on them.

## Two things deliberately not drawn

**A UML class diagram.** The backend is modules of functions over SQL, not an object model
with inheritance and associations. A class diagram would show boxes and relationships the
code does not have, and an examiner reading the source would see that. `11-module-dependencies`
is the honest equivalent, and shows the layering the proposal's methodology promised.

**Data flow diagrams.** Only worth producing if your department requires structured-analysis
notation. Ask before spending the effort.

## Notes left on the diagrams themselves

Several carry a yellow note explaining a decision rather than just labelling a box — why
the handover needs both parties, why prices are read twice, what happens to a deleted
account that order history still points at. Those are the parts an examiner is most likely
to ask about in the presentation, so the answer is on the picture.

One note is a warning rather than an explanation: **10-deployment** states on its face that
the container stack is defined but has never been run, because Docker is not installed on
the development machine. Do not quietly remove that.
