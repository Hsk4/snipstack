# SnipStack Feature Branches - Progress Documentation

## Overview
This document tracks all feature branches in the SnipStack repository, detailing the specific changes and affected files for each branch compared to the main branch.

---

## Branch: `feature/clerk-auth`
**Purpose:** Implements Clerk authentication integration for user authentication and session management.

**Files Modified:** 21 files  
**Changes:** 85 insertions, 1589 deletions

### Affected Files & Changes:

#### Authentication Routes
- **`app/(auth)/sign-in/[[...sign-in]]/page.tsx`** (19 lines changed)
  - Removed: React Suspense wrapper with fallback loading UI
  - Removed: Unused import (`Suspense` from 'react')
  - Changed: Function name from `SignInPage()` to `Page()`
  - Changed: Direct `<SignIn />` component without Suspense wrapper
  - Formatting: Removed unnecessary semicolons

- **`app/(auth)/sign-up/[[...sign-up]]/page.tsx`** (19 lines changed)
  - Removed: React Suspense wrapper with fallback loading UI
  - Removed: Unused import (`Suspense` from 'react')
  - Changed: Function name from `SignUpPage()` to `Page()`
  - Changed: Direct `<SignUp />` component without Suspense wrapper
  - Formatting: Removed unnecessary semicolons

#### Layout & Navigation
- **`app/layout.tsx`** (102 lines changed)
  - Added: ClerkProvider wrapper integration
  - Added: Clerk UI components (`SignInButton`, `SignUpButton`, `UserButton`, `SignedIn`, `SignedOut`)
  - Added: Header navigation bar with authentication buttons
  - Added: Modal-based authentication flow for sign-in and sign-up
  - Added: User button for signed-in users
  - Modified: Root layout structure to support Clerk authentication

#### Pages
- **`app/page.tsx`** (10 lines changed)
  - Minor styling and layout adjustments to homepage

- **`app/dashboard/page.tsx`** (55 lines deleted)
  - Removed: Complete dashboard implementation (planned for re-implementation with Clerk)

- **`app/dashboard/new/page.tsx`** (213 lines deleted)
  - Removed: New snippet creation form
  - Removed: Form logic for creating code snippets

#### Server Actions & Database
- **`app/actions/snippet.ts`** (123 lines deleted)
  - Removed: All CRUD operations for snippets:
    - `createSnippet()` - CREATE
    - `getUserSnippets()` - READ all
    - `getSnippetById()` - READ single
    - `deleteSnippet()` - DELETE
  - Removed: MySQL integration and queries
  - Removed: Type definitions for database rows
  - Removed: User authorization logic via Clerk

- **`lib/db.ts`** (71 lines deleted)
  - Removed: MySQL connection pool setup
  - Removed: Database initialization
  - Removed: Database utility functions

- **`lib/sql/init.sql`** (13 lines deleted)
  - Removed: SQL schema for snippets table

#### UI Components
- **`components/SnippetCard.tsx`** (97 lines deleted)
  - Removed: Snippet display component
  - Removed: Copy, delete, and editing functionality

- **`components/SnippetFilter.tsx`** (67 lines deleted)
  - Removed: Filtering and search component

- **`components/ui/button.tsx`** (57 lines deleted)
- **`components/ui/card.tsx`** (102 lines deleted)
- **`components/ui/input.tsx`** (18 lines deleted)
- **`components/ui/textarea.tsx`** (17 lines deleted)
  - Removed: UI component library files

#### Configuration & Dependencies
- **`components.json`** (25 lines deleted)
  - Removed: Component configuration

- **`package.json`** (11 lines changed)
  - Updated: Dependencies
  - Added: Clerk dependencies (`@clerk/nextjs`, etc.)

- **`bun.lock`** (503 lines changed)
  - Updated: Lock file with new dependencies

- **`app/globals.css`** (132 lines changed)
  - Reduced: Global styles (many removed)

- **`lib/higlight.ts`** (19 lines deleted)
  - Removed: Code highlighting utility

- **`lib/utils.ts`** (1 line deleted)
  - Minor cleanup

---

## Branch: `feature/mysql`
**Purpose:** Implements MySQL database integration for persistent snippet storage.

**Files Modified:** 17 files  
**Changes:** 44 insertions, 1341 deletions

### Affected Files & Changes:

#### Database & ORM
- **`lib/db.ts`** (74 lines changed)
  - Added/Modified: MySQL connection pool setup using `mysql2/promise`
  - Added: Database initialization function
  - Added: Connection pooling configuration

#### Configuration & Dependencies
- **`package.json`** (10 lines changed)
  - Added: MySQL driver (`mysql2`)
  - Updated: Other dependencies

- **`bun.lock`** (482 lines changed)
  - Updated: Lock file with MySQL dependencies

#### Pages & Components (Removed)
- **`app/dashboard/new/page.tsx`** (213 lines deleted)
- **`app/dashboard/page.tsx`** (55 lines deleted)
- **`components/SnippetCard.tsx`** (97 lines deleted)
- **`components/SnippetFilter.tsx`** (67 lines deleted)

#### UI Components (Removed)
- **`components/ui/button.tsx`** (57 lines deleted)
- **`components/ui/card.tsx`** (102 lines deleted)
- **`components/ui/input.tsx`** (18 lines deleted)
- **`components/ui/textarea.tsx`** (17 lines deleted)

#### Styling & Config (Removed)
- **`app/globals.css`** (132 lines deleted)
- **`components.json`** (25 lines deleted)
- **`lib/higlight.ts`** (19 lines deleted)
- **`lib/utils.ts`** (1 line deleted)

---

## Branch: `feature/search-tag-filtering`
**Purpose:** Adds search functionality and tag-based filtering for snippets.

**Files Modified:** 1 file  
**Changes:** 24 insertions, 21 deletions

### Affected Files & Changes:

#### Component Updates
- **`components/SnippetCard.tsx`** (45 lines changed)
  - Added: Prism.js syntax highlighting library imports
  - Added: Support for multiple language syntax highlighting:
    - JavaScript, TypeScript, Python, SQL, Bash, JSON
  - Added: `useRef` hook for direct code element reference
  - Changed: Syntax highlighting mechanism from global `highlightCode()` to targeted `Prism.highlightElement(codeRef.current)`
  - Added: Language class mapping (`language-javascript`, `language-python`, etc.)
  - Simplified: Language class assignment to dynamic `language-${snippet.language.toLowerCase()}`
  - Added: Pre-formatted code block with proper Prism styling
  - Added: Prism theme (okaidia theme) for better code visibility
  - Enhanced: Code container styling with dark background (#272822)
  - Added: Comment annotations in JSX structure

---

## Branch: `feature/setup`
**Purpose:** Complete initial project setup including CI/CD, authentication, and database foundation.

**Files Modified:** 30 files  
**Changes:** 44 insertions, 1735 deletions

### Affected Files & Changes:

#### CI/CD Pipeline
- **`.github/workflows/ci.yml`** (32 lines deleted)
  - Removed: GitHub Actions CI workflow configuration

#### IDE Configuration (Removed)
- **`.idea/.gitignore`** (10 lines deleted)
- **`.idea/go.imports.xml`** (10 lines deleted)
- **`.idea/inspectionProfiles/Project_Default.xml`** (6 lines deleted)
- **`.idea/misc.xml`** (7 lines deleted)
- **`.idea/modules.xml`** (8 lines deleted)
- **`.idea/snippetvault.iml`** (9 lines deleted)
- **`.idea/vcs.xml`** (6 lines deleted)
  - Removed: IntelliJ IDEA project files

#### Authentication Routes (Removed)
- **`app/(auth)/sign-in/[[...sign-in]]/page.tsx`** (16 lines deleted)
- **`app/(auth)/sign-up/[[...sign-up]]/page.tsx`** (16 lines deleted)

#### Server Actions & Database (Removed)
- **`app/actions/snippet.ts`** (123 lines deleted)
- **`lib/db.ts`** (71 lines deleted)
- **`lib/sql/init.sql`** (13 lines deleted)

#### Pages & Components (Removed)
- **`app/dashboard/new/page.tsx`** (213 lines deleted)
- **`app/dashboard/page.tsx`** (55 lines deleted)
- **`components/SnippetCard.tsx`** (97 lines deleted)
- **`components/SnippetFilter.tsx`** (67 lines deleted)

#### UI Components (Removed)
- **`components/ui/button.tsx`** (57 lines deleted)
- **`components/ui/card.tsx`** (102 lines deleted)
- **`components/ui/input.tsx`** (18 lines deleted)
- **`components/ui/textarea.tsx`** (17 lines deleted)

#### Layout Updates
- **`app/layout.tsx`** (80 lines changed)
  - Modified: Root layout structure
  - Updated: Component imports and exports

#### Configuration & Dependencies
- **`app/page.tsx`** (10 lines changed)
- **`app/globals.css`** (132 lines changed)
- **`package.json`** (12 lines changed)
- **`components.json`** (25 lines deleted)
- **`bun.lock`** (528 lines changed)
- **`proxy.ts`** (19 lines deleted)
- **`lib/higlight.ts`** (19 lines deleted)
- **`lib/utils.ts`** (1 line deleted)

---

## Branch: `feature/syntax-highlighting`
**Purpose:** Implements code syntax highlighting using Prism.js.

**Files Modified:** 3 files  
**Changes:** 34 insertions, 102 deletions

### Affected Files & Changes:

#### Component Styling & Logic
- **`components/SnippetCard.tsx`** (67 lines changed)
  - Changed: Quote style from double to single quotes (formatting)
  - Added: Comment marker `// added in syntax highligthing branch`
  - Removed: Dependency array from `useEffect()` (line: `}, [snippet.code]` changed to `})`)
  - Added: Language map for Prism syntax highlighting support:
    - TypeScript, JavaScript, Python, SQL, Bash, JSON, HTML, CSS
  - Changed: Code block background from transparent to `bg-zinc-950`
  - Changed: Text color to `text-zinc-50`
  - Removed: Z-index from copy button (line changed from `z-10` to removed)
  - Simplified: Pre tag structure (removed className attributes)
  - Updated: String literals to single quotes throughout

- **`components/SnippetFilter.tsx`** (67 lines deleted)
  - Removed: Entire filter component

#### Utilities
- **`lib/higlight.ts`** (2 lines changed)
  - Modified: Highlighting implementation (details minimal in diff)

---

## Branch: `feature/ui-editor-highlighting`
**Purpose:** Enhanced UI for code editor with improved syntax highlighting display.

**Files Modified:** 3 files  
**Changes:** 14 insertions, 123 deletions

### Affected Files & Changes:

#### Component Refinements
- **`components/SnippetCard.tsx`** (51 lines changed)
  - Removed: `useRef` hook usage
  - Removed: Prism imports and language component imports
  - Removed: Prism theme import (`prism-okaidia.css`)
  - Removed: Language class mapping logic
  - Simplified: Code highlighting to basic implementation
  - Removed: Direct element references for highlighting
  - Changed: Code container styling
  - Reduced: Overall component complexity

- **`components/SnippetFilter.tsx`** (67 lines deleted)
  - Removed: Entire filter component

#### Utilities (Removed)
- **`lib/higlight.ts`** (19 lines deleted)
  - Removed: Code highlighting utility file entirely

---

## Summary Table

| Branch | Purpose | Key Files | Changes |
|--------|---------|-----------|---------|
| `feature/clerk-auth` | Clerk authentication integration | `app/layout.tsx`, auth pages, removed backend | 85 insertions, 1589 deletions |
| `feature/mysql` | MySQL database integration | `lib/db.ts`, `package.json` | 44 insertions, 1341 deletions |
| `feature/search-tag-filtering` | Search & tag filtering | `components/SnippetCard.tsx` | 24 insertions, 21 deletions |
| `feature/setup` | Complete initial setup | 30 files, CI/CD, IDE config | 44 insertions, 1735 deletions |
| `feature/syntax-highlighting` | Prism.js code highlighting | `components/SnippetCard.tsx`, `lib/higlight.ts` | 34 insertions, 102 deletions |
| `feature/ui-editor-highlighting` | Enhanced editor UI | `components/SnippetCard.tsx`, `lib/higlight.ts` | 14 insertions, 123 deletions |

---

## Key Observations

1. **Authentication First**: The `feature/clerk-auth` branch is a major refactor that removes backend CRUD operations, suggesting a shift to Clerk-managed authentication.

2. **Progressive Simplification**: Branches after `feature/setup` show incremental refinements rather than large structural changes.

3. **Component-Focused**: Later branches (`feature/search-tag-filtering`, `feature/syntax-highlighting`, `feature/ui-editor-highlighting`) primarily target `components/SnippetCard.tsx`.

4. **Removed Features**: Dashboard, database operations, and UI components were removed in some branches, suggesting a rebuild strategy or incomplete implementation path.

5. **Syntax Highlighting Evolution**: Multiple branches touch syntax highlighting, showing refinement from basic to advanced implementations with Prism.js.
