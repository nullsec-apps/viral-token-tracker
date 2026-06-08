# viral-token-tracker
Fix runtime crash: the app imported `zustand` (not installed) and the shadcn `toggle-group` component (missing), so the page never mounted. Added a dependency-free zustand-compatible store shim wired 
