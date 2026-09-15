# Zamglam — User Manual

Zamglam is an online marketplace where Zambian clothing and footwear shops sell to
shoppers, and independent couriers deliver what is sold. This manual explains how to use
it, one role at a time.

There are four kinds of account:

| Account | What it is for |
| --- | --- |
| **Customer** | Browsing shops, ordering, tracking and confirming deliveries |
| **Shop** (seller) | Listing items, packing orders, handing parcels to couriers |
| **Courier** | Collecting parcels from shops and delivering them |
| **Administrator** | Approving shops and couriers, handling complaints, managing accounts |

---

## 1. Getting in

### Opening the site

Open **http://localhost:3000** on the computer running Zamglam.

To use it from a phone on the same Wi‑Fi, open `http://<that computer's IP>:3000` — the
address is printed in the terminal when the system starts (for example
`http://192.168.1.104:3000`). Everything on the phone works exactly as it does on the
computer; the menu collapses into the ☰ button at the top right.

### Creating an account

1. Click **Sign up**.
2. Choose what you are signing up as — shopper, shop, or courier.
3. Fill in the form and submit.

What happens next depends on the role:

- **Shoppers** can order straight away.
- **Shops** can sign in and list products straight away, but appear as *unverified* until
  an administrator has checked their paperwork. Upload your documents from
  **Dashboard → Verification**; a verified shop carries a badge that shoppers can see.
- **Couriers** cannot take any work until an administrator approves the sign‑up. Until
  then, going on duty is refused.

### Signing in

Click **Sign in** and enter your email and password. Sign‑in is limited after repeated
wrong passwords; if you see *"Too many failed sign‑in attempts"*, wait a few minutes.

If you see *"This account has been removed"*, an administrator has deleted the account.
It can be restored within 30 days — contact them.

### Demo accounts

The seeded demonstration database contains:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@zamglam.local | ADMIN123456 |
| Shop | mud@zamglam.local | MUD123456 |
| Shop | jets@zamglam.local | JETS123456 |
| Courier | mwansa@zamglamcourier.local | COURIER123456 |

Other seeded shops follow the same pattern (`bata@`, `pep@`, `mrprice@`,
`fashionsgalore@`), each with its own name in capitals followed by `123456`.

---

## 2. If you are shopping

### Finding something to buy

- **Collections** groups items by who they are for.
- **All products** lists everything, with filters for category and audience.
- Clicking a shop's name opens its storefront, showing only that shop's items.

Each card shows the price in kwacha, the shop selling it, and the shop's rating. A
**Verified** badge means an administrator has checked that shop's registration documents.

### Placing an order

1. Add items to your cart. You can mix items from several shops in one cart.
2. Open the **Shopping bag** and check the breakdown. Items from different shops travel as
   **separate parcels**, each with its own delivery fee, because each is collected from a
   different place. The cart shows the item total, the delivery total per parcel, and the
   overall total before you commit to anything.
3. Enter the delivery address and phone number, choose a payment method, and place the
   order.

> **Note on payment.** Payment is recorded but not actually taken — no mobile money or
> card processor is connected. Everything else about the order is real.

### Tracking it

Open **Dashboard → Orders**, then the order you want. Each parcel moves through its own stages:

| Stage | What it means |
| --- | --- |
| Order placed | The shop has your order |
| Shop is packing | The shop is preparing your items |
| Ready for pickup | The shop has released the parcel; a courier will collect it |
| Courier collecting | A courier has come for it; the shop must confirm the handover |
| Out for delivery | The shop confirmed the courier took the parcel |
| Delivered | The courier says they delivered it |
| Receipt confirmed | You confirmed it arrived |

An order containing several parcels shows the stage of each one, and the order as a whole
sits at whichever parcel is furthest behind.

**The courier's name and phone number appear only once the shop has confirmed the
handover.** Before that, nobody has actually taken your parcel, so there is nobody to
call.

If a shop reports that a courier never turned up, you will see that on the parcel, in
plain words, along with the fact that it has gone back into the pool for another courier.
Your order is not lost — it is waiting for someone else to collect it.

### Confirming delivery

When a parcel arrives, open the order and press **Confirm delivery**. Only you can do
this — neither the shop nor the courier can confirm on your behalf.

### Rating a shop, and reporting a problem

After a delivery you can leave the shop a star rating and a comment; the shop can reply.

If something went wrong, open the order and use **Report** to raise a complaint against
the shop or the courier on that order. You can only report someone you actually dealt
with, and only once per order. Three separate complaints against the same party raise a
flag for an administrator.

---

## 3. If you run a shop

### Setting up

1. Sign in and open **Dashboard**.
2. Create your storefront if you have not already — name, description and the town you
   trade from. The town matters: delivery is priced from where your shop is to where the
   customer is.
3. Open **Verification** and upload your registration documents. An administrator reviews
   them. Until then your shop shows as unverified.

### Listing an item

From **Products → Add product**, or from your own storefront page:

- Name, description, price in kwacha and the stock you hold.
- Who it is for, and the sizes you carry.
- **At least one photograph is required.** Up to six can be attached; the first is the
  one shoppers see on the card.

Editing a price never removes the photographs — you only need to attach images again if
you want to replace them.

### Working an order

Orders appear in **Dashboard → Orders**, and the bell in the header counts new ones. You
see only your own items, even when the customer bought from several shops in one order.

1. **Packing** — mark the parcel as being prepared.
2. **Ready for pickup** — this releases the parcel into the pool couriers can see. Do this
   only when the parcel is genuinely ready to be collected.
3. A courier presses *Pick up*, which asks you to confirm the handover. You will see the
   request on the parcel, with the courier's name.
4. When the rider is standing in front of you and you have handed the parcel over, press
   **Picked up**. That, and only that, is what records the parcel as collected and
   releases the courier's details to the customer.
5. If the courier never came, press **Not picked up** and say briefly why. The parcel goes
   straight back into the pool for another courier, and the customer is told what
   happened.

You cannot mark a parcel delivered. Delivery is the courier's to record and the
customer's to confirm.

### Complaints about you

You can report a customer or a courier from an order you were part of, in the same way
they can report you. If three separate complaints are raised against your shop, an
administrator is asked to look at it, and may suspend the shop. A suspended shop can sign
in and see a notice explaining why, but cannot list items or take orders until it is
reinstated.

---

## 4. If you deliver

### Before you can work

A new courier account waits for an administrator to approve it. Until then you can sign
in, but going on duty is refused.

### Going on duty

Open **Dashboard** and switch yourself **on duty**. Only couriers on duty are shown
parcels waiting for collection, and only they are given parcels automatically.

You cannot go off duty while you are still carrying a parcel — deliver it, or hand it
back, first.

### Taking a parcel

1. **Available** lists what shops have released, with the shop, the destination
   and the delivery fee.
2. Press **Request pickup** on one. It is yours to collect from that moment, and
   disappears from every other courier's list, so two riders never travel for the same
   parcel.
3. Go to the shop. **The shop confirms the handover** when they physically give you the
   parcel. Until they do, the parcel is not recorded as collected and the customer cannot
   see your details.
4. If the shop reports that you did not arrive, the parcel returns to the pool and you no
   longer hold it.

A parcel nobody has collected within an hour is assigned automatically to an on‑duty
courier with the fewest parcels in hand, so nothing sits in the pool forever. Being
assigned a parcel is not the same as collecting it: you still press *Request pickup* and
the shop still confirms.

### Delivering

When you hand the parcel to the customer, mark it **Delivered**. The customer then
confirms they received it. You can only do this for parcels you actually collected.

You can report a customer or a shop from an order you worked on, and they can report you.
Three complaints raise a flag with an administrator; a suspended courier is taken off duty
and cannot go back on until reinstated.

---

## 5. If you administer the marketplace

Sign in as an administrator and open **/admin/dashboard**.

### The dashboard

- **Subscribers** — how many shops, shoppers, couriers and administrators exist. Each
  figure opens the accounts behind it.
- **Awaiting approval** — shops that have submitted documents and courier sign‑ups waiting
  for a decision. The badge in the header carries the same count.
- **Activity** — orders, products, storefronts and reviews.
- **Newest accounts** — the most recent shops and shoppers.

Everything here is read from the database. Any action you take changes the real account.

### Approving people

- **Verification** lists shops with the documents they uploaded. Approve or reject each.
  A verified shop carries a badge shoppers can see.
- A courier sign‑up is approved or rejected from **Couriers**. An approved courier can go
  on duty; rejecting one takes them off duty immediately.

### Complaints

**Reports** lists every party with open complaints against them, worst first, with the
reasons given. Anything at three or more is flagged. From there you can read the
individual complaints and suspend or reinstate the account.

A suspended account can still sign in, and sees a notice saying it is suspended and why,
but cannot order, list items or take deliveries. Reinstating clears the complaints so an
old grudge does not immediately re‑flag someone you have just cleared.

### Managing accounts

From **Shops**, **Customers** or **Couriers** you can, for each account:

- **Edit** its contact details.
- **Suspend** or **reinstate** it.
- **Delete** it.

Deleting is reversible. The account is greyed out in the list, with the number of days
left to change your mind (30 by default). During that time it cannot sign in, a deleted
shop's products leave the catalogue, and a deleted courier is taken off duty. Pressing
**Restore** undoes all of it. Once the window closes the account is removed permanently —
except where order history still refers to it, which is kept rather than destroyed.

### Deliveries

**Deliveries** shows every parcel a shop has released that no courier has collected, and
how long each has been waiting — useful for spotting a shop that releases parcels too
early, or a town with nobody on duty.

---

## 6. If something goes wrong

| What you see | What it means |
| --- | --- |
| "Too many failed sign‑in attempts" | Repeated wrong passwords from your address. Wait a few minutes. |
| "This account has been removed" | An administrator deleted it. It can be restored for 30 days. |
| "Your account has been suspended" | Complaints were upheld. The notice gives the reason; contact the administrator. |
| "Go on duty before requesting parcels" | A courier must be on duty to take work. |
| "Another courier is already collecting this parcel" | Somebody asked for it first. Take a different one. |
| "This parcel has not been released by the shop yet" | The shop has not finished packing it. |
| "Not enough stock" | The shop sold out while the item sat in your cart. |
| "At least one product image is required" | A listing needs a photograph. |
| The page has no data on a phone | The phone must be on the same Wi‑Fi as the computer running Zamglam, and must use that computer's address, not `localhost`. |

---

## 7. What Zamglam does not do

Stated plainly so nobody expects otherwise:

- **No money moves.** Payment methods are recorded; nothing is charged. Connecting mobile
  money or a card processor is future work.
- **Distances are approximate.** Delivery is priced by matching the typed address against
  a table of Zambian towns and Lusaka neighbourhoods and measuring between the two points.
  An unrecognised address falls back to central Lusaka, and a quote built that way is
  marked as an estimate. A proper geocoder would replace it.
- **Deliveries are carried by Zamglam's own couriers.** The code can speak to an outside
  courier company, but no commercial agreement exists, so the platform runs on its own
  riders.
