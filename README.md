This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out [the Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Integrated Design System Studio

The admin console now includes **Design System Studio** (`/admin`, sidebar item).

### Included in this integration
- Live global design-token editing for the application's CSS variables, radius, font scale and content width.
- Per-page token overrides for Home, Dashboard, Quizzes, Quiz runner, History, Leaderboard, Resources and Admin.
- Independent desktop, tablet and mobile token override sets (desktop default, tablet 768–1023px, mobile up to 767px).
- Reusable CSS component recipes (`studio-button`, `studio-card`, `studio-input`) with editable declarations.
- Asset library with Supabase Storage uploads when configured, plus browser-local fallback.
- Drag-and-drop page section blueprint editor with reorder/add/remove controls.
- Local browser cache and shared Supabase configuration persistence.

### Supabase setup required for shared publishing
Apply `supabase/migrations/202611160001_design_studio.sql` in the Supabase SQL Editor. It creates the shared design configuration row policy and public asset bucket policies. Without the migration, the studio still works in the current browser using local storage, but changes will not synchronize to other users/devices. The existing `profiles.role = 'admin'` convention and the two admin email allowlist entries are used by the migration policies.

### Important implementation boundary
The current application pages are hand-authored React/JSX, not generated from a page-builder schema. The section drag-and-drop editor therefore saves an editable page-structure blueprint; it does **not** rearrange existing JSX sections on the live page yet. Likewise, component recipes emit reusable CSS classes, but existing bespoke components must be migrated to those classes (or registered as studio blocks) before every instance can be visually reconfigured from the studio. This integration establishes the live token engine, responsive overrides, admin workflow, persistence contract and asset library without risking a wholesale rewrite of the working app. A subsequent page-renderer migration is needed for true arbitrary structural composition and per-instance component props editing.
