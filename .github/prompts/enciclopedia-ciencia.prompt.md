# Copilot Instructions - Enciclopédia da Ciência

## Project Overview
A Next.js 16 (Pages Router) scientific encyclopedia featuring 10 educational chapters with 209+ pages. Built with React 19, TypeScript, Three.js for 3D visualizations, and Tailwind CSS v4. Includes PWA support with offline capabilities.

## Architecture & Key Patterns

### Pages Router Structure
- **Pages**: `src/pages/` follows Next.js Pages Router (not App Router)
- **Chapter URLs**: `/capitulo/[slug]/[subcapitulo]` (e.g., `/capitulo/planeta-terra/vulcoes`)
- **Centralized Data**: All chapters/subcapitulos defined in `src/data/capitulos.ts`

### Component Organization
```
src/components/
├── content/     # 3D models (Atom3D, PlanetEarth3D, Vulcao3D, etc.)
├── layout/      # Header, Footer, Sidebar, Layout wrapper
└── ui/          # Reusable UI (ThemeToggle, ImageCarousel)
```

### Critical 3D Component Pattern
**Always use dynamic imports with SSR disabled for Three.js components:**
```tsx
const MyModel3D = dynamic(() => import('@/components/content/MyModel3D'), {
  ssr: false,
  loading: () => <div className="...">🌍 Carregando modelo...</div>
});
```
- **Why**: Three.js requires browser APIs (window, WebGL) unavailable during SSR
- **Examples**: See `src/pages/index.tsx`, `src/pages/capitulo/planeta-terra/index.tsx`

### Theme System (Dark/Light Mode)
- **Context**: `src/contexts/ThemeContext.tsx` manages theme state
- **Applied via**: `className="dark:..."` (Tailwind's class-based dark mode)
- **Config**: `tailwind.config.js` has `darkMode: 'class'`
- **Persistence**: Uses `localStorage` + system preference detection
- **Global Application**: `_app.tsx` wraps all pages in `<ThemeProvider>`

### Layout Wrapper
- **All pages** automatically wrapped by `Layout` component in `_app.tsx`
- **Skip layout**: Add `Component.noLayout = true` to page component
- **Dark mode classes**: Layout applies `bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors`

## Development Workflow

### Running the Project
```powershell
npm run dev       # Start dev server (uses Turbopack)
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint check
```

### Adding New Chapter Pages
1. Add subcapitulo to `src/data/capitulos.ts` under appropriate chapter
2. Create page: `src/pages/capitulo/[capitulo-slug]/[subcapitulo-slug].tsx`
3. Use existing pages as template (copy breadcrumb, hero, navigation sections)
4. For 3D content: Create component in `src/components/content/`, import dynamically

### PWA Configuration
- **Manifest**: `public/manifest.json`
- **Service Worker**: Registered in `_app.tsx` (production only)
- **Icons**: `public/icons/icon.svg`
- **Offline Assets**: Images in `public/images/`, textures in `public/textures/`

## Project-Specific Conventions

### Styling
- **Primary Framework**: Tailwind CSS v4 (uses `@tailwindcss/postcss`)
- **Custom Colors**: `backgroundDark`, `surfaceDark`, `textDark` in `tailwind.config.js`
- **Animations**: Custom `spin-slow`, `spin-slower`, `spin-slowest`, `spin-reverse` for 3D orbits
- **Gradients**: Each chapter has unique gradient defined in `capitulos.ts` (e.g., `from-green-500 to-emerald-600`)

### Navigation Pattern
**Standard page footer navigation** (copy from existing pages):
```tsx
<div className="flex justify-between items-center mt-12">
  {capituloAnterior && (
    <Link href={`/capitulo/${capituloAnterior.slug}`}>
      ← Anterior
    </Link>
  )}
  {proximoCapitulo && (
    <Link href={`/capitulo/${proximoCapitulo.slug}`}>
      Próximo →
    </Link>
  )}
</div>
```

### 3D Model Best Practices
- **Geometry Memoization**: Use `useMemo` for complex geometries (see `Vulcao3D.tsx`)
- **OrbitControls**: Standard for all interactive models
- **Loading States**: Always provide loading fallback with themed background
- **Tooltips**: Use `@react-three/drei`'s `<Html>` for 3D annotations

### Image Handling
- **Static Images**: `public/images/[chapter]/` organized by chapter
- **API Route**: `/api/planeta-img?name=` serves images from `public/images/sistema-solar/`
- **Carousel**: Use `ImageCarousel` component from `src/components/ui/`
- **Sketchfab Embeds**: Use iframe with responsive wrapper (see `vulcoes.tsx`)

### TypeScript Patterns
- **Chapter Data**: Import `Capitulo`, `Subcapitulo` types from `data/capitulos.ts`
- **Path Alias**: Use `@/*` for `src/*` imports (configured in `tsconfig.json`)
- **Strict Mode**: TypeScript strict mode enabled

## External Dependencies & Integrations

### Three.js Stack
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Helpers (OrbitControls, Html, Sphere, Trail, etc.)
- **Import Pattern**: Import specific components from drei, not entire library

### Sketchfab Integration
```tsx
<iframe
  title="Model Name"
  src="https://sketchfab.com/models/[id]/embed?autostart=1"
  allow="autoplay; fullscreen; xr spatial-tracking"
/>
```

### Search Functionality
- **Library**: Fuse.js for fuzzy search
- **Page**: `src/pages/buscar.tsx`
- **Searches**: Chapter titles and descriptions from `capitulos.ts`

## Common Gotchas

1. **Three.js Components Must Disable SSR**: Always use `dynamic(..., { ssr: false })`
2. **Dark Mode Classes Required**: Every new component needs `dark:` variants for colors/backgrounds
3. **Chapter Data is Single Source of Truth**: Don't hardcode chapter info—always import from `capitulos.ts`
4. **PWA Assets**: New images/models should consider offline usage (add to service worker cache strategy)
5. **Turbopack Dev Server**: Uses Next.js 16's Turbopack by default (`npm run dev`)

## Key Files Reference

- **Chapter Data**: `src/data/capitulos.ts` - All chapter/subcapitulo metadata
- **Main Layout**: `src/components/layout/Layout.tsx` - Global wrapper with dark mode
- **Theme Logic**: `src/contexts/ThemeContext.tsx` - Theme state management
- **App Entry**: `src/pages/_app.tsx` - Service Worker registration, ThemeProvider
- **Config**: `tailwind.config.js` - Custom colors, animations, dark mode setup
- **Example 3D Page**: `src/pages/capitulo/planeta-terra/vulcoes.tsx` - Shows dual 3D models pattern

## Content Guidelines

- **Portuguese Language**: All content is in Brazilian Portuguese
- **Educational Tone**: Scientific but accessible to general audience
- **Visual-First**: Each page should have imagery (3D models, infographics, or photos)
- **Breadcrumbs**: Maintain `Início > Sumário > [Capitulo] > [Subcapitulo]` pattern
- **Version Tracking**: Update `CHANGELOG.md` when adding new features/pages
