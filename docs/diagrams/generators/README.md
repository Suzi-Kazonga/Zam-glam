# Diagram generators

The scripts that build the diagrams in the folder above. Three of the eleven are generated
from the system itself rather than drawn by hand, so they cannot drift out of date:

| Script | Builds | Reads from |
| --- | --- | --- |
| `gen_db_diagrams.cjs` | `03-er-diagram`, `04-database-schema` | the live database |
| `gen_state_diagrams.cjs` | `07-state-parcel`, `08-state-account` | `TRACK_ORDER` in `models/Order.js` |
| `gen_diagrams_a.cjs` | `01-use-case`, `02-architecture`, `09-site-map` | hand-described |
| `gen_diagrams_b.cjs` | `05`, `06`, `10`, `11` | hand-described |

`drawio.cjs` holds the shared helpers and the styles, so every diagram looks like it belongs
to the same set.

## Re-running them

The database ones need `mysql2`, so run them from `backend/`:

```powershell
cd backend
copy ..\docs\diagrams\generators\drawio.cjs .
node ..\docs\diagrams\generators\gen_db_diagrams.cjs ..\docs\diagrams zamglam_db_test
del drawio.cjs
```

The others have no dependencies:

```powershell
cd docs\diagrams\generators
node gen_state_diagrams.cjs .. ..\..\..\backend\src\models\Order.js
node gen_diagrams_a.cjs ..
node gen_diagrams_b.cjs ..
```

**Anything you edit by hand in the .drawio files will be overwritten** if you regenerate.
For the four generated diagrams, change the generator instead. The other seven are yours to
edit directly — nothing regenerates them unless you ask.
