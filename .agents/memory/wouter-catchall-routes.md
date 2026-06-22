---
name: Wouter catch-all route matching
description: Wouter's :rest* wildcard does not match the base path — always pair it with an explicit exact route
---

**Rule:** When using wouter path-based routing with `:rest*` (e.g. for Clerk's multi-step sign-in flow), always add an explicit exact route alongside the wildcard catch-all.

```tsx
<Route path="/sign-in" component={ClerkSignInPage} />      // exact match
<Route path="/sign-in/:rest*" component={ClerkSignInPage} /> // sub-paths
```

**Why:** Wouter's `:rest*` pattern matches zero-or-more SEGMENTS but requires at least the separator `/`. So `/sign-in/:rest*` matches `/sign-in/factor-one` but NOT `/sign-in` exactly. If you only register the wildcard route, navigating to `/sign-in` falls through to the `NotFound` catch-all and shows a 404.

**How to apply:** Any route that also needs to handle sub-paths (like Clerk's `routing="path"` components that render at `/sign-in`, `/sign-in/factor-one`, `/sign-in/sso-callback`, etc.) needs both the exact route and the wildcard.
