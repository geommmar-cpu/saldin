# Moving App Root to /app

## Status: ✅ Completed

### Changes Implemented

1.  **Updated Routes (`src/App.tsx`)**:
    - `Route path="/"`: Now renders the `Landing` page (public).
    - `Route path="/app"`: Now renders the `Home` page (protected).
    - `Route path="/auth"`: Remains unchanged.
    - `Route path="/onboarding"`: Remains unchanged.

2.  **Updated Route Guards (`src/components/auth/RouteGuards.tsx`)**:
    - `PublicRoute`: Changed redirect for authenticated users from `/` to `/app`.

3.  **Updated Navigation (`src/components/BottomNav.tsx`)**:
    - Changed "Início" link path from `/` to `/app`.
    - Changed "Voltar ao Início" button action to navigate to `/app`.

4.  **Updated Sidebar (`src/components/layout/AppLayout.tsx`)**:
    - Changed "Início" menu item path from `/` to `/app`.

### Verification

1.  **Unauthenticated User**: Accessing `http://localhost:8080/` should show the new Landing Page.
2.  **Authenticated User**:
    - Accessing `http://localhost:8080/` should redirect to `/app` (Home).
    - Accessing `http://localhost:8080/app` should show the dashboard.
    - Clicking "Início" in the sidebar or bottom nav should go to `/app`.
