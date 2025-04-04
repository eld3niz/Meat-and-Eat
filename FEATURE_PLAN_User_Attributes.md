# Feature Plan: User Attributes (is_local, budget, bio)

This document outlines the plan to add `is_local`, `budget`, and `bio` attributes to user profiles, impacting the sign-up flow, database, filtering, and display components.

## Requirements

*   **New Attributes:**
    *   `is_local`: User's status (e.g., "Local", "Expat", "Tourist", "Other"). Dropdown selection.
    *   `budget`: User's spending openness (1-3 money emojis). Stored as `SMALLINT` (1, 2, or 3).
    *   `bio`: Short user biography (max 255 characters). Textarea input.
*   **Sign-up Flow:**
    *   Add two new slides *before* the existing ones.
    *   Slide 1: Collect `is_local` and `budget`.
    *   Slide 2: Collect `bio`.
    *   Fields are optional, but display text encouraging completion ("Filling this in leads to more meet up success").
    *   Adjust navigation (Next/Back buttons) and dot indicator.
*   **Filtering:**
    *   Add filters for `is_local` and `budget` to the sidebar.
    *   These filters should apply to the user list/map markers.
*   **Display:**
    *   Display the `bio` in the user list table (below the map) between the user's name and distance.
    *   Display the `bio` in the user info popup (when clicking a user marker).

## Implementation Plan

**Phase 1: Backend & Core Setup**

1.  **Database Schema Update (Supabase):**
    *   Add columns to `public.profiles`:
        *   `is_local TEXT NULL`
        *   `budget SMALLINT NULL CHECK (budget >= 1 AND budget <= 3)`
        *   `bio TEXT NULL CHECK (char_length(bio) <= 255)`
    *   **Action:** Prepare `ALTER TABLE` SQL statements.
2.  **Update Supabase Function (`get_snapped_map_users`):**
    *   Modify the function to `JOIN profiles p ON ul.user_id = p.id`.
    *   Add `p.is_local`, `p.budget`, `p.bio` to the `SELECT` list.
    *   Update the `RETURNS TABLE(...)` definition.
    *   **Action:** Prepare updated `CREATE OR REPLACE FUNCTION` statement.
3.  **Update Documentation (`supabase_sql_queries.md`):**
    *   Add the `ALTER TABLE` and updated `CREATE OR REPLACE FUNCTION` statements.
    *   **Action:** Prepare updated content for the file.
4.  **Update Frontend Type (`useMapData.ts`):**
    *   Modify the `MapUser` interface to include optional fields: `is_local?: string | null;`, `budget?: number | null;`, `bio?: string | null;`.
    *   **Action:** Prepare changes for `src/hooks/useMapData.ts`.

**Phase 2: Sign-up Flow Modification (`src/components/Auth/`)**

1.  **Create New Slide Components:**
    *   Create `RegisterSlideNew1.tsx` (for `is_local` dropdown, budget money emoji selector) with prompt text.
    *   Create `RegisterSlideNew2.tsx` (for `bio` textarea with char counter) with prompt text.
    *   **Action:** Prepare code for these components.
2.  **Update `MultiStepRegisterForm.tsx`:**
    *   Import new slides.
    *   Add `is_local: null`, `budget: null`, `bio: ''` to `formData` state.
    *   Update `DotIndicator` prop `totalSlides` to `5`.
    *   Reorder `renderSlide` cases (0: New1, 1: New2, 2: Orig1, 3: Orig2, 4: Orig3).
    *   Adjust `nextSlide`/`prevSlide` props for all slides.
    *   Add new fields to the `handleSubmit` Supabase `upsert` payload.
    *   **Action:** Prepare changes for `src/components/Auth/MultiStepRegisterForm.tsx`.

**Phase 3: Filtering Integration**

1.  **Update `useMapData.ts`:**
    *   Add `is_local: string[] | null` and `budget: number[] | null` to the `Filters` interface and state.
    *   Implement `filterByLocalStatus(statuses: string[] | null)` and `filterByBudget(budgets: number[] | null)` functions.
    *   Modify `filteredUsers` calculation to apply these filters (users should *not* be hidden if city filters are active).
    *   Update `resetFilters`.
    *   Return new filter states and functions.
    *   **Action:** Prepare changes for `src/hooks/useMapData.ts`.
2.  **Update `Sidebar.tsx`:**
    *   Add UI elements (e.g., checkboxes/multi-select) for `is_local` and `budget` filters.
    *   Add new props (`onLocalFilter`, `onBudgetFilter`, `currentLocalFilter`, `currentBudgetFilter`) to `SidebarProps`.
    *   Pass corresponding functions/state from `WorldMap.tsx`.
    *   Call new filter functions on UI interaction.
    *   **Action:** Prepare changes for `src/components/UI/Sidebar.tsx`.

**Phase 4: Display Integration**

1.  **Update `UserTable.tsx`:**
    *   Modify the rendering of the first `<td>` in each table row to display `user.name` and, below it (e.g., in a `<span>` or `<p>`), display `user.bio` if it exists.
    *   **Action:** Prepare changes for `src/components/UI/UserTable.tsx`.
2.  **Update `UserInfoPopup.tsx` (Verification):**
    *   Check `src/components/Map/UserInfoPopup.tsx` and update to display `bio` if necessary.
    *   **Action:** Use `read_file` to check, then prepare potential changes.

**Phase 5: Finalization**

1.  **Testing:** Thoroughly test sign-up, filtering, map display, user list, and popups.
2.  **Documentation:** This file serves as the primary plan document.

## Execution Flow Diagram

```mermaid
graph TD
    A[Start: User Request] --> B(Phase 1: Backend & Core);
    B --> B1(Update Profiles Table);
    B --> B2(Update get_snapped_map_users Func);
    B --> B3(Update supabase_sql_queries.md);
    B --> B4(Update MapUser Type in useMapData);
    B4 --> C(Phase 2: Sign-up Flow);
    C --> C1(Create RegisterSlideNew1);
    C --> C2(Create RegisterSlideNew2);
    C --> C3(Modify MultiStepRegisterForm);
    B4 --> D(Phase 3: Filtering);
    D --> D1(Update useMapData Filters/Logic);
    D --> D2(Update Sidebar UI/Props);
    B4 --> E(Phase 4: Display);
    E --> E1(Update UserTable Display);
    E --> E2(Update UserInfoPopup Display);
    C3 & D2 & E1 & E2 --> F(Phase 5: Finalization);
    F --> F1(Testing);
    F --> F2(Create Feature Plan MD);
    F2 --> G[End: Plan Complete];

    subgraph "Backend/Core"
        B1
        B2
        B3
        B4
    end

    subgraph "Sign-up UI"
        C1
        C2
        C3
    end

    subgraph "Filtering"
        D1
        D2
    end

    subgraph "Display"
        E1
        E2
    end