# Plan: Implement User Profile Popup

**Goal:** Modify the existing `src/components/Auth/UserProfile.tsx` component to display user profile information matching the provided sketch layout within a popup view. This view should use placeholders for missing data (origin country, rating) and be designed for the logged-in user initially, with potential future use for other profiles. The layout must fit without scrolling.

**Target Component:** `src/components/Auth/UserProfile.tsx`

**Implementation Steps:**

1.  **Component Signature & Data Fetching:**
    *   Keep using `useAuth` for the logged-in user's ID for now. Design should allow for an optional `userId` prop later.
    *   Ensure `fetchProfile` selects: `name`, `age`, `languages`, `cuisines`, `is_local`, `budget`, `bio`, `avatar_url`.
    *   Use placeholders for `origin_country` (German flag 🇩🇪) and `rating` (static text/stars).

2.  **Refactor JSX for View Mode (`!editMode`):**
    *   Remove the existing content within the `!editMode` conditional rendering block.
    *   Replace it with a new structure using `div`s and Tailwind CSS classes.

3.  **Implement Layout Sections (using Tailwind CSS):**
    *   **Top Row (flex):**
        *   *Left:* Avatar (`AvatarUpload` or `img`), static Rating below.
        *   *Right:* `div` with Name + 🇩🇪 Flag, Age, Status (Text + 🏠/✈️), Budget (💰 Emojis).
    *   **Separator 1:** `<hr>` or styled `div`.
    *   **Bio Section:** Display `profile.bio` or fallback text.
    *   **Separator 2:** `<hr>` or styled `div`.
    *   **Details Section:**
        *   "🗣️ **Speaks:**" + joined languages or fallback.
        *   "🍜 **Likes:**" + joined cuisines or fallback.
    *   **Separator 3:** `<hr>` or styled `div`.
    *   **Buttons Section (flex):**
        *   Visually styled placeholder buttons: "💬 Chat" and "🤝 Meet Me".

4.  **Placeholders & Data Mapping:**
    *   **Origin Country:** Static German flag 🇩🇪 next to the name.
    *   **Rating:** Static "★★★★☆ (4.5/5)" below the avatar.
    *   **Status:** Map `profile.is_local` ('local'/'traveler'/null) to "Status: Local 🏠" / "Status: Traveler ✈️" / "Status: Not specified".
    *   **Budget:** Map `profile.budget` (1/2/3/null) to "Budget: 💰" / "Budget: 💰💰" / "Budget: 💰💰💰" / "Budget: Not specified".
    *   Handle `null`/empty values gracefully for all fields.

5.  **Styling:**
    *   Use Tailwind CSS extensively for layout, typography, borders, and button styling to match the sketch and prevent scrolling.

**Conceptual Layout (Mermaid):**

```mermaid
graph TD
    subgraph ProfilePopupView
        direction TB
        subgraph TopSection [Top Section: flex]
            direction LR
            subgraph AvatarColumn [Avatar Column]
                Avatar[Profile Pic]
                Rating[Rating: ★★★★☆ (Placeholder)]
            end
            subgraph InfoColumn [Info Column: flex-grow]
                direction TB
                NameFlag[Name + 🇩🇪 (Placeholder Flag)]
                Age[Age]
                Status[Status: Text + Icon 🏠/✈️]
                Budget[Budget: 💰 Emojis]
            end
            AvatarColumn --- InfoColumn
        end

        Separator1(--- Visual Separator ---)

        subgraph BioSection [Bio Section]
            BioText["User Bio..."]
        end

        Separator2(--- Visual Separator ---)

        subgraph DetailsSection [Details Section]
            direction TB
            Speaks[🗣️ Speaks: Lang1, Lang2]
            Likes[🍜 Likes: Cuisine1, Cuisine2]
        end

        Separator3(--- Visual Separator ---)

        subgraph ActionsSection [Actions Section: flex]
            direction LR
            ChatBtn[Button: 💬 Chat (Placeholder)]
            MeetBtn[Button: 🤝 Meet Me (Placeholder)]
        end

        TopSection --> Separator1 --> BioSection --> Separator2 --> DetailsSection --> Separator3 --> ActionsSection;
    end
```

**Next Step:** Switch to "Code" mode to implement these changes.