# Saldin - AI Development Rules

This document outlines the technical stack and development guidelines for the Saldin application.

## Tech Stack

- **Framework**: React 18 with Vite for fast development and bundling.
- **Language**: TypeScript for type safety and better developer experience.
- **Styling**: Tailwind CSS for utility-first styling and responsive design.
- **UI Components**: shadcn/ui (built on Radix UI) for accessible, unstyled components.
- **Backend & Auth**: Supabase for database, authentication, and real-time features.
- **State Management**: TanStack Query (React Query) for server state and data fetching.
- **Routing**: React Router DOM for client-side navigation.
- **Animations**: Framer Motion for smooth transitions and interactive elements.
- **Forms**: React Hook Form combined with Zod for schema validation.
- **Icons**: Lucide React for a consistent and lightweight icon set.

## Library Usage Rules

### 1. UI & Styling
- **Rule**: Always use **Tailwind CSS** for custom styling. Avoid inline styles or CSS modules.
- **Rule**: Use **shadcn/ui** components located in `src/components/ui/` as the foundation for all UI elements.
- **Rule**: For icons, exclusively use **Lucide React**.

### 2. Data Fetching & State
- **Rule**: Use **TanStack Query** hooks (located in `src/hooks/`) for all database interactions. Do not use `useEffect` for data fetching.
- **Rule**: Use the **Supabase client** (`src/lib/backendClient.ts`) within hooks to interact with the backend.

### 3. Forms & Validation
- **Rule**: Use **React Hook Form** for managing form state.
- **Rule**: Use **Zod** for defining validation schemas.

### 4. Navigation
- **Rule**: Use **React Router** hooks (`useNavigate`, `useParams`, `useLocation`) for navigation and URL state.
- **Rule**: Define all routes in `src/App.tsx`.

### 5. Dates & Currency
- **Rule**: Use **date-fns** for all date manipulation and formatting.
- **Rule**: Use the utility functions in `src/lib/currency.ts` for parsing and formatting BRL currency values to ensure consistency.

### 6. Notifications
- **Rule**: Use **Sonner** (via `toast`) for user feedback and notifications.

### 7. Animations
- **Rule**: Use **Framer Motion** for page transitions and complex component animations. Use the custom `FadeIn` component in `src/components/ui/motion.tsx` for standard entry animations.