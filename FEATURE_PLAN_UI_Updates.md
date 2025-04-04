# Feature Plan: UI Updates (Signup Flow, User Table, Sidebar Filters)

This plan outlines the steps to implement the requested UI updates.

**Phase 1: Planning & Confirmation** (Completed)

1.  **Review Code:** Analyzed `MultiStepRegisterForm.tsx`, `UserTable.tsx`, `Sidebar.tsx`.
2.  **Clarify Requirements:** Confirmed signup slide order ([3, 4, 5, 1, 2]) and filter design (Multi-select Toggle Buttons).
3.  **Propose Plan:** Outlined implementation steps.
4.  **Confirm Plan:** Received user approval.

**Phase 2: Implementation (Requires switching to Code mode)**

1.  **Task 1: Reorder Signup Slides**
    *   **File:** `src/components/Auth/MultiStepRegisterForm.tsx`
    *   **Action:** Modify the `renderSlide` function's `switch` statement.
    *   **Details:** Change the `case` order to match the desired sequence [3, 4, 5, 1, 2]:
        *   `case 0:` -> `RegisterSlide3` (Languages/Cuisines/City)
        *   `case 1:` -> `RegisterSlideNew1` (Local Status/Budget)
        *   `case 2:` -> `RegisterSlideNew2` (Bio)
        *   `case 3:` -> `RegisterSlide1` (Email/Password)
        *   `case 4:` -> `RegisterSlide2` (Name/Age)
    *   **Action:** Update `prevSlide`, `nextSlide`, and `handleSubmit` props passed to each slide component within the `switch` statement for correct navigation.

2.  **Task 2: Adjust User Table Layout**
    *   **File:** `src/components/UI/UserTable.tsx`
    *   **Action:** Modify the table structure (`<thead>` and `<tbody>`).
    *   **Details:**
        *   In `<thead>`: Remove the second `<th>` (Distance). Keep only the first `<th>` (Name/User). Remove distance sorting capability from header.
        *   In `<tbody>`: For each `<tr>`, remove the second `<td>`. Modify the first `<td>` to contain Name, Bio (conditional), and Distance (conditional) vertically stacked with appropriate styling.

3.  **Task 3: Redesign Sidebar Filters (Using Toggle Buttons)**
    *   **File:** `src/components/UI/Sidebar.tsx`
    *   **Action:** Replace checkbox sections with styled button groups supporting multi-select.
    *   **Details:**
        *   **Local Status Filter:** Replace checkboxes with styled "pill" buttons. Ensure `onClick` toggles selection state (`selectedLocalStatuses`) and visual appearance.
        *   **Budget Filter:** Replace checkboxes with styled buttons displaying icons (💰, 💰💰, 💰💰💰). Ensure `onClick` toggles selection state (`selectedBudgets`) and visual appearance.

**Phase 3: Review & Completion**

1.  **Test Changes:** Verify the signup flow, user table layout, and filter functionality/appearance after implementation.
2.  **Present Result:** Show the completed modifications.