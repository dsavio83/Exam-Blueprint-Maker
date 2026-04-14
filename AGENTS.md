# Repository Guidelines

## Project Structure & Module Organization
This is a React application built with **Vite** and **TypeScript**, focused on managing exam blueprints and curriculum.
- **`components/`**: Modularized admin management components (e.g., `AdminCurriculumManager`, `AdminDashboard`, `AdminPortal`) and UI views.
- **`services/db.ts`**: Core data service, likely handling client-side persistence.
- **`App.tsx`**: Main application entry point and routing logic.
- **`types.ts`**: Centralized TypeScript interface and type definitions.
- **Alias**: The `@` prefix is used to reference the project root (e.g., `import { ... } from '@/types'`). Note that `@` resolves to the root folder `.`, not `src/`.

## Build, Test, and Development Commands
- **Install dependencies**: `npm install`
- **Start development server**: `npm run dev` (Runs on port 3000 by default)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`

## Coding Style & Naming Conventions
- **Language**: TypeScript (Note: `strict` mode is not enabled in `tsconfig.json`).
- **Framework**: React 19 using functional components and hooks.
- **Styling**: Uses **Tailwind CSS** classes directly in components.
- **Environment**: Requires `GEMINI_API_KEY` in `.env.local` for AI-related features.

## Testing Guidelines
No automated testing framework is currently configured in this project. Manual verification of UI components and data persistence in `db.ts` is required.

## Commit & Pull Request Guidelines
Commit messages follow a concise **Conventional Commits** style:
- **`feat: ...`**: For new features (e.g., `feat: add admin management modules`)
- **`fix: ...`**: For bug fixes
- **`refactor: ...`**: For code restructuring
- **`docs: ...`**: For documentation changes
