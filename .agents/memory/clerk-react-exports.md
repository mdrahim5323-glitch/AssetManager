---
name: Clerk React exports
description: The Replit-managed Clerk React package exports Show, not SignedIn/SignedOut
---

The `@clerk/react` package in this Replit-managed Clerk setup does NOT export `SignedIn` or `SignedOut` components.

**Rule:** Use `<Show when="signed-in">` and `<Show when="signed-out">` for conditional rendering based on auth state.

**Why:** The Replit-managed Clerk tenant uses a version of `@clerk/react` that exposes `Show` for conditional rendering rather than the named `SignedIn`/`SignedOut` components. Using `SignedIn`/`SignedOut` causes a runtime `SyntaxError: module does not provide export named 'SignedIn'`.

**How to apply:** Any time you need to conditionally render based on auth state in client components, import `Show` from `@clerk/react` and use `<Show when="signed-in">` or `<Show when="signed-out">`.

Available exports that work:
- `Show` (conditional rendering)
- `ClerkProvider`
- `SignIn`, `SignUp` (page components)
- `RedirectToSignIn`, `RedirectToSignUp`
- `useClerk`, `useUser`, `useSignIn`, `useSignUp`
- `UserButton`, `UserProfile`, `UserAvatar`
- `ClerkLoading`, `ClerkLoaded`, `ClerkFailed`, `ClerkDegraded`
