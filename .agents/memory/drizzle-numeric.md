---
name: Drizzle numeric fields
description: Postgres numeric columns require String() on insert and Number() on output
---

Drizzle ORM's `numeric` column type maps to JavaScript strings, not numbers, because Postgres NUMERIC can have arbitrary precision.

**Rule:** 
- On INSERT: `price: String(parsedData.price)` 
- On SELECT output to API response: `price: Number(row.price)`

**Why:** Drizzle returns `numeric` columns as strings to preserve precision. If you pass a JS number directly to an insert, TypeScript will complain (type mismatch). If you return the raw string to the API client, the client receives a string instead of a number and type-checks fail.

**How to apply:** Every route handler that reads or writes a `numeric` column must do this conversion. Affected columns in Estate Hub: `price` (properties), `purchase_price` (ownerships), `total_amount`/`paid_amount` (payments), `amount` (installments).
