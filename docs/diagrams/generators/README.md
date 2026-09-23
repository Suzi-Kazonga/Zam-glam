# Diagram generators

The scripts that build the diagrams in the folder above. Three of the seven are generated
from the system itself rather than drawn by hand, so they cannot drift out of date:

| Script | Builds | Reads from |
| --- | --- | --- |
| `gen_db_diagrams.cjs` | `03-er-diagram`, `04-database-schema` | the live database |
| `gen_state_diagrams.cjs` | `06-state-parcel`, `07-state-account` | `TRACK_ORDER` in `models/Order.js` |
| `gen_diagrams_a.cjs` | `01-use-case`, `02-architecture` | hand-described |
| `gen_diagrams_b.cjs` | `05-sequence-handover` | hand-described |

`drawio.cjs` holds the shared helpers and the styles, so every diagram looks like it belongs
to the same set.

## Re-running them

All four run from the project root. MySQL must be running for the first one; it finds the
database driver in `backend/` by itself.

```powershell
node docs\diagrams\generators\gen_db_diagrams.cjs docs\diagrams zamglam_db_test
node docs\diagrams\generators\gen_state_diagrams.cjs docs\diagrams
node docs\diagrams\generators\gen_diagrams_a.cjs docs\diagrams
node docs\diagrams\generators\gen_diagrams_b.cjs docs\diagrams
```

Pass `zamglam_db` instead if you would rather draw the development database than the test
one. They hold the same schema.

**Anything you edit by hand will be overwritten** if you regenerate. For the three generated
diagrams, change the generator instead. The other four are yours to edit directly.
