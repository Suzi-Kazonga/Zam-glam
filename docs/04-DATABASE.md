# 4. Database

Every table as the application actually creates it. The definitive version is
`backend/src/config/db.js`, which builds the schema and applies its own migrations on
startup — there is no SQL file to run by hand.

`database/schema.sql` and `Zamglam Database.sql` are separate hand-written designs of the
same system, kept as references. They use the older account layout, where every login is in
one `users` table, and they are missing tables the application needs (`reports`, and in one
case `shipments`). A database built from either **is** usable: starting the backend on it
adds what is missing and fills in the columns the application expects — including copying
each email onto the customer and seller rows, which is where the admin console reads it.
Both were checked this way, running the whole order journey end to end. Neither file is
needed for a new database: `initializeDatabase()` builds one on its own.

## How it fits together

```
customers ──< orders ──< order_items >── products >── sellers ──< stores
                 │                            │          │
                 ├──< shipments >── couriers  │          └──< documents
                 ├──< order_status_history    │
                 ├──< payments                └── categories
                 └──< reports
customers ──< cart >── products
customers ──< reviews >── sellers
```

An **order** is the purchase. A **shipment** is one shop's parcel within it. That is the
distinction the whole system turns on.

## Accounts

The four roles live in four tables. Each row holds its own login — email and a bcrypt hash.

### `customers`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INT PK | |
| `name` | VARCHAR(255) NOT NULL | |
| `email` | VARCHAR(255) NOT NULL | **unique** |
| `password` | VARCHAR(255) NOT NULL | bcrypt hash |
| `address`, `phone`, `city`, `location` | VARCHAR | `location` prices delivery |
| `created_at` | TIMESTAMP | |
| `account_status` | VARCHAR(20) DEFAULT `active` | `active` or `suspended` |
| `suspended_at`, `suspension_reason` | | Set together with a suspension |
| `deleted_at` | TIMESTAMP NULL | Non-null = soft deleted, inside its restore window |
| `terms_accepted_at` | TIMESTAMP NULL | When the terms were agreed to at sign-up. Empty for seeded demo accounts and any made before consent was asked for |

### `sellers`

As above, plus:

| Column | Notes |
| --- | --- |
| `shop_name` | What shoppers see |
| `verification_status` | `pending`, `verified` or `rejected` |
| `verified_at` | |

A seller and their storefront are separate: `sellers` is the account, `stores` is the shop
page.

### `couriers`

As `customers`, plus:

| Column | Notes |
| --- | --- |
| `approval_status` | `pending`, `approved` or `rejected`. New sign-ups start pending and inactive |
| `approved_at` | |
| `is_active` | Cleared when rejected, suspended or deleted |
| `on_shift` | On duty. Only on-duty couriers see the pool or receive escalations |
| `shift_changed_at` | |
| `vehicle` | |

### `admins`

`id`, `name`, `email`, `password`, `role_level` (default `manager`), `created_at`.

### `users` *(older databases only)*

A central login table with `role ENUM('admin','customer','seller','courier')`. On databases
built by earlier versions, `customers`/`sellers` link to it by `user_id` instead of holding
their own email. The code supports both — see `src/utils/accounts.js`.

## Catalogue

### `stores`

| Column | Notes |
| --- | --- |
| `id` | |
| `seller_id` | The account that owns it |
| `name`, `description`, `logo_url` | |
| `location` | Where a courier collects from, and what delivery is priced against |
| `open_hours` | |
| `status` | `open` by default |

### `products`

| Column | Notes |
| --- | --- |
| `seller_id` | NOT NULL, cascades on delete |
| `store_id`, `category_id` | |
| `name`, `description` | |
| `price` | DECIMAL(10,2), ZMW |
| `stock` | Reduced when an order is placed, restored if a parcel is cancelled |
| `image_url` | The first photo, for cards |
| `images` | JSON array of paths — **returned as text by MariaDB**, parsed by the model |
| `sizes` | JSON array, same caveat |
| `audience` | `women`, `men`, `kids`, `unisex` |

### `categories`

`id`, `name` (unique), `description`. Created on demand: a listing sends a category name
and it is looked up case-insensitively, or created.

### `documents`

A shop's registration paperwork for verification: `seller_id`, `type`, `url`,
`doc_number`, `status`, `review_note`.

## Orders

### `orders`

| Column | Notes |
| --- | --- |
| `customer_id` | |
| `items_total` | Goods only |
| `delivery_total` | Every parcel's fee added up |
| `total_price` | The two together — what was charged |
| `status` | A **rollup** of the parcels: whichever is least far along |
| `address`, `location`, `phone` | Where it goes |
| `payment_method` | `airtel_money`, `mtn_momo`, `card`, or null. **Recorded, never charged** |

### `order_items`

`order_id`, `product_id`, `quantity`, and `price` — the price **at the time of the order**,
so later price changes never rewrite what somebody paid.

### `shipments` — the parcels

One row per shop per order. `UNIQUE (order_id, seller_id)`.

| Column | Notes |
| --- | --- |
| `order_id`, `seller_id` | Which order, which shop |
| `status` | `placed` → `processing` → `shipped` → `pickup_requested` → `picked_up` → `delivered`, or `cancelled` |
| `courier_id` | Null while unclaimed; cleared again if the shop denies the handover |
| `driver_name`, `driver_phone` | Copied when claimed, and gated on the way out |
| `price` | This parcel's delivery fee |
| `distance`, `direction` | How it was priced |
| `released_at` | When the shop put it in the pool — the clock escalation watches |
| `escalated_at` | Set if it was auto-assigned after sitting unclaimed |

### `order_status_history`

The tracking a customer reads: `order_id`, `shipment_id`, `status`, `note`, `created_at`.
The `note` is where a shop's "the rider never arrived" ends up.

### `payments`

`order_id`, `method`, `amount`, `status`, `transaction_ref`. Written, but no gateway is
connected — see [08-PROJECT_STATUS.md](08-PROJECT_STATUS.md).

### `courier` *(legacy, singular)*

An older one-row-per-order courier record, kept up to date alongside `shipments` so nothing
built against it breaks. New work should use `shipments`.

### `cart`

A server-side basket: `customer_id`, `product_id`, `quantity`, with
`UNIQUE (customer_id, product_id)` so adding an item again adds to its quantity instead of
duplicating the row.

## Trust and moderation

### `reviews`

`seller_id`, `customer_id`, `order_id`, `rating`, `comment`, `reply`, `replied_at`, with
`UNIQUE (customer_id, order_id, seller_id)` — one rating per customer per shop per order,
and rating again updates it.

### `reports`

| Column | Notes |
| --- | --- |
| `order_id` | The order both parties were on |
| `reporter_role`, `reporter_id` | Who complained |
| `reported_role`, `reported_id` | About whom |
| `reason`, `details` | |
| `status` | `open` by default; cleared when an account is reinstated |

`UNIQUE (order_id, reporter_role, reporter_id, reported_role, reported_id)` — you cannot
report the same party twice for the same order. **Three open reports** against one party
flag them for an administrator.

## Migrations

`initializeDatabase()` runs on every startup and is safe to run repeatedly:

1. `CREATE DATABASE IF NOT EXISTS` — so a fresh clone needs no setup.
2. `CREATE TABLE IF NOT EXISTS` for every table.
3. `addColumnIfMissing` for every column added since — it checks
   `information_schema` first, so it never fails on a database that already has it.
4. Data repairs, each written to be harmless on a database that does not need them —
   backfilling `released_at`, approving couriers that predate `approval_status`, folding
   the retired `confirmed` status into `delivered`, copying logins onto the account rows on
   the older layout.

**Foreign-key types follow what they point at.** A key and the id it references must be the
exact same type, or MariaDB refuses to create the table (`errno 150`). Databases built by
this file use `INT`; ones built from the two SQL files above use `INT UNSIGNED`. So each
key column asks `idTypeOf(table)` what the id it points at actually is, rather than assuming
— which is what lets a new table join onto a database somebody else built.

Adding a column means adding one `addColumnIfMissing` line. Nobody has to run anything by
hand, and an old database catches up the next time it starts.
