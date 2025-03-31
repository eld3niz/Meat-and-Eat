# Meat-and-Eat: Product Development Plan (Social Dining Concept)

**Version:** 1.0
**Date:** 2025-03-31
**Prepared For:** Meat-and-Eat Development Team
**Project Goal:** Develop the "Meat-and-Eat" website, a platform enabling users (particularly travelers) to find others nearby for shared meals, fostering connection and combating loneliness, with a clear distinction from dating platforms. The platform will feature user profiles, meal invitations/requests, location integration, communication tools, and safety features, built using React, TypeScript, Vite, Supabase, Leaflet, and Tailwind CSS.

---

## Phase 1: Project Setup & Foundation (Review & Verify)

**Goal:** Ensure the core project structure, dependencies, environment configuration, and basic frontend layout are correctly set up based on the previous rebuild effort or initialize if starting fresh.
**Estimated Effort:** Very Small (Assuming previous setup is mostly valid)

**Steps:**

1.  **Verify Project Initialization:** Confirm Vite React + TypeScript project exists and is configured (`package.json`, `vite.config.ts`, `tsconfig.json`). If not, initialize using `npm create vite@latest meat-and-eat --template react-ts`.
2.  **Verify Core Dependencies:** Check if necessary dependencies are installed (`react`, `react-dom`, `@supabase/supabase-js`, `leaflet`, `react-leaflet`, `tailwindcss`, etc.). Install/update as needed using `npm install`.
3.  **Verify Tailwind CSS Configuration:** Ensure `tailwind.config.js`, `postcss.config.js`, and `src/index.css` are correctly configured.
4.  **Verify Vite Configuration:** Check path aliases (`@/*`) in `vite.config.ts` and `tsconfig.json`.
5.  **Verify Environment Variables:** Ensure `.env` and `.env.example` exist with placeholders for Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Add `.env` to `.gitignore`.
6.  **Verify Supabase Client Utility:** Check `src/utils/supabaseClient.ts` for correct initialization.
7.  **Verify Basic App Structure:** Review `src/main.tsx` and `src/App.tsx` for basic rendering and layout structure (Header, Content, Footer).
8.  **Verify Git Repository:** Ensure the project is a Git repository with an initial commit history.
9.  **Run Development Server:** Execute `npm run dev` to confirm the basic application runs without errors.
10. **Commit Baseline:** If changes were made, commit: `git add . && git commit -m "Chore: Verify and establish project baseline"`

---

## Phase 2: Supabase Backend Schema & Security (Core Concept)

**Goal:** Define and implement the Supabase database schema tailored to the social dining concept, configure authentication, and establish robust Row Level Security (RLS) policies focusing on user privacy and safety.
**Estimated Effort:** Large

**Steps:**

1.  **Define Core Tables:**
    *   **`profiles`:** Linked 1:1 with `auth.users`.
        *   `id` (uuid, pk, fk to `auth.users.id`)
        *   `created_at` (timestampz)
        *   `updated_at` (timestampz)
        *   `username` (text, unique, not null)
        *   `full_name` (text)
        *   `avatar_url` (text)
        *   `bio` (text, optional - short intro)
        *   `interests` (text[], optional - tags for matching)
        *   `travel_status` (enum: 'local', 'traveling', 'unspecified', optional)
        *   `dietary_preferences` (text[], optional)
        *   `is_verified` (boolean, default false - for potential future verification)
        *   `last_seen_online` (timestampz, optional)
        *   `location` (geometry(Point, 4326), optional, nullable - user's general location, requires PostGIS)
    *   **`meal_offers`:** Represents a user's invitation or desire to meet.
        *   `id` (uuid, pk)
        *   `created_at` (timestampz)
        *   `updated_at` (timestampz)
        *   `creator_user_id` (uuid, fk to `auth.users.id`, not null)
        *   `proposed_time` (timestampz, not null)
        *   `duration_minutes` (integer, optional, default 60)
        *   `location_name` (text, suggestion, e.g., "Cafe Central")
        *   `location_address` (text, optional)
        *   `location_coords` (geometry(Point, 4326), optional - if specific place chosen, requires PostGIS)
        *   `description` (text, optional - e.g., "Grabbing lunch, anyone welcome!")
        *   `max_attendees` (integer, default 2, min 2)
        *   `status` (enum: 'open', 'full', 'cancelled', 'completed', default 'open')
        *   `privacy_level` (enum: 'public', 'friends_only', default 'public' - future enhancement)
    *   **`meal_requests`:** Users requesting to join an offer.
        *   `id` (uuid, pk)
        *   `created_at` (timestampz)
        *   `meal_offer_id` (uuid, fk to `meal_offers.id`, not null)
        *   `requester_user_id` (uuid, fk to `auth.users.id`, not null)
        *   `status` (enum: 'pending', 'accepted', 'rejected', 'cancelled_by_requester', default 'pending')
        *   `message` (text, optional - short note with request)
    *   **`meal_attendees`:** Tracks accepted participants for an offer.
        *   `meal_offer_id` (uuid, fk to `meal_offers.id`, not null)
        *   `user_id` (uuid, fk to `auth.users.id`, not null)
        *   `joined_at` (timestampz)
        *   Primary Key: (`meal_offer_id`, `user_id`)
    *   **`messages`:** For direct communication between confirmed attendees.
        *   `id` (uuid, pk)
        *   `created_at` (timestampz)
        *   `meal_offer_id` (uuid, fk to `meal_offers.id`, not null) // Context for the chat
        *   `sender_user_id` (uuid, fk to `auth.users.id`, not null)
        *   `content` (text, not null)
    *   **`blocks`:** Users blocking other users.
        *   `blocker_user_id` (uuid, fk to `auth.users.id`, not null)
        *   `blocked_user_id` (uuid, fk to `auth.users.id`, not null)
        *   `created_at` (timestampz)
        *   Primary Key: (`blocker_user_id`, `blocked_user_id`)
    *   **`reports`:** Users reporting offers or other users.
        *   `id` (uuid, pk)
        *   `created_at` (timestampz)
        *   `reporter_user_id` (uuid, fk to `auth.users.id`, not null)
        *   `reported_user_id` (uuid, fk to `auth.users.id`, optional)
        *   `reported_meal_offer_id` (uuid, fk to `meal_offers.id`, optional)
        *   `reason` (text, not null)
        *   `status` (enum: 'submitted', 'reviewed', 'action_taken', default 'submitted')

2.  **Enable PostGIS Extension:** Required for `geometry` types. Enable via Supabase dashboard (Database -> Extensions).

3.  **Configure Authentication:** Set up providers (Email/Password minimum, consider Google/Apple for ease). Customize email templates.

4.  **Implement Row Level Security (RLS) - CRITICAL:**
    *   **Enable RLS on ALL tables.**
    *   **`profiles`:**
        *   Allow users to read limited profile data of others (username, avatar, bio, interests, travel_status), *excluding* sensitive info like `last_seen_online` or precise `location` unless explicitly shared/friended (future).
        *   Allow users to update their *own* profile (`auth.uid() = id`).
        *   Block users from seeing profiles of users who have blocked them, or whom they have blocked.
    *   **`meal_offers`:**
        *   Allow authenticated users to insert offers.
        *   Allow users to update/cancel their *own* offers (`auth.uid() = creator_user_id`).
        *   Allow authenticated users to read 'open' offers, potentially filtering out offers from blocked users.
        *   Allow attendees to read details of offers they are part of.
    *   **`meal_requests`:**
        *   Allow authenticated users to insert requests for 'open' offers (not their own).
        *   Allow offer creators to read requests for their offers.
        *   Allow requesters to read/cancel their *own* requests.
        *   Allow offer creators to update the status ('accepted'/'rejected') of requests for their offers.
    *   **`meal_attendees`:**
        *   Data likely managed via triggers/functions upon request acceptance.
        *   Allow attendees of a meal to see other attendees.
    *   **`messages`:**
        *   Allow only confirmed attendees of a specific `meal_offer_id` to read/write messages for that offer.
    *   **`blocks`:**
        *   Allow authenticated users to insert/delete their *own* blocks.
    *   **`reports`:**
        *   Allow authenticated users to insert reports.
        *   Restrict read access (likely admin only).

5.  **Database Functions/Triggers:**
    *   Trigger to create a `profile` row when a new user signs up in `auth.users`.
    *   Trigger/Function to add creator to `meal_attendees` when an offer is created.
    *   Trigger/Function to add requester to `meal_attendees` when a `meal_request` status changes to 'accepted'. Check `max_attendees`.
    *   Trigger/Function to update `meal_offers.status` to 'full' when `count(meal_attendees)` reaches `max_attendees`.
    *   (Optional) Function for spatial queries (e.g., find offers within X distance of user's location). `st_dwithin`.

6.  **Seed Data (Optional):** Create sample users and meal offers for development/testing.

7.  **Documentation:** Document the schema, relationships, RLS policies, and triggers.

---

## Phase 3: Core Frontend Structure (Context, Routing, Layout)

**Goal:** Implement the main application layout, basic routing, and essential context providers (Authentication, Modals, potentially User Profile data).
**Estimated Effort:** Medium

**Steps:**

1.  **Implement Layout Components:** Develop/Refine `Header.tsx` (Logo, Nav: Find Meals, Create Offer, Profile/Login), `Footer.tsx` (About, Safety, Terms). Use Tailwind.

2.  **Implement Context Providers:**
    *   **`AuthContext.tsx`:** Manage user session, login/logout/signup functions (as before).
    *   **`ProfileContext.tsx` (New):** Fetch and provide the logged-in user's full profile data (`profiles` table) once authenticated. Provide function to update profile.
    *   **`ModalContext.tsx`:** Manage modal states (for login, offer creation, request details, etc.).

3.  **Integrate Context Providers:** Wrap `App.tsx` content with providers (`AuthProvider` -> `ProfileProvider` -> `ModalProvider`).

4.  **Implement Basic Routing:**
    *   Use `react-router-dom` (recommended over manual `window.location`): `npm install react-router-dom`.
    *   Define routes in `App.tsx` or a dedicated `Routes.tsx`:
        *   `/`: Main feed/map view (e.g., `MealOffersPage`)
        *   `/offer/create`: `CreateOfferPage`
        *   `/offer/:offerId`: `OfferDetailPage`
        *   `/profile/:userId`: `ProfilePage`
        *   `/profile/me`: `MyProfilePage` (redirects or renders user's own profile)
        *   `/chat/:offerId`: `ChatPage`
        *   `/login`, `/register`: (Handled by Auth modal flow or dedicated pages)
        *   `/about`, `/safety`, `/terms`: Static pages
    *   Create placeholder components for these pages (`src/pages/`).

5.  **Implement Static Pages:** Create basic `AboutPage`, `SafetyPage`, `TermsPage` components.

6.  **Type Definitions:** Define core types (`Profile`, `MealOffer`, `MealRequest`, etc.) in `src/types/index.ts`.

7.  **Verification:** Test navigation between pages, basic layout rendering, context availability (check React DevTools).

---

## Phase 4: Authentication & Profile Management

**Goal:** Implement UI and logic for user registration (including profile setup), login, logout, and viewing/editing user profiles.
**Estimated Effort:** Large

**Steps:**

1.  **Authentication UI:** Implement `AuthModal.tsx`, `AuthModalPortal.tsx`, `LoginForm.tsx`, `RegisterForm.tsx` (as before, but registration might need profile fields or lead to onboarding).

2.  **Onboarding/Profile Creation:** After signup, guide users to complete their profile (`username`, `bio`, `interests`, etc.). This could be part of registration or a separate step. Create `src/components/Onboarding/ProfileSetupForm.tsx`.

3.  **Profile Viewing (`src/pages/ProfilePage.tsx`, `src/components/Profile/`):**
    *   Fetch profile data based on `userId` route parameter using Supabase.
    *   Display profile information (avatar, username, bio, interests, travel status).
    *   Handle cases for viewing own profile vs. others'.
    *   Include Block/Report buttons (visible when viewing others' profiles).

4.  **Profile Editing (`src/pages/MyProfilePage.tsx` or modal):**
    *   Fetch current user's profile data from `ProfileContext`.
    *   Provide a form (`EditProfileForm.tsx`) to update editable fields.
    *   Call Supabase `update` function on the `profiles` table. Update `ProfileContext` on success.

5.  **Integrate Auth UI:** Link Login/Register buttons in `Header` to `ModalContext`. Conditionally render Profile link/Logout vs. Login/Register based on `AuthContext`.

6.  **Implement Auth Logic:** Connect forms to Supabase `auth` functions (`signInWithPassword`, `signUp`, `signOut`) and profile update functions. Handle errors and success states.

7.  **Verification:** Test signup (including profile completion), login, logout, viewing profiles (own and others), editing profile, blocking/reporting (UI interaction).

---

## Phase 5: Meal Offer Creation & Discovery

**Goal:** Allow users to create meal offers and discover existing offers from others, potentially via a map and/or list view.
**Estimated Effort:** Large

**Steps:**

1.  **Create Offer Form (`src/pages/CreateOfferPage.tsx`, `src/components/Offers/OfferForm.tsx`):**
    *   Form fields for `proposed_time` (datetime picker), `duration`, `location_name`, `location_address`, `description`, `max_attendees`.
    *   **Location Input:** Allow text input for name/address. Optionally integrate a map (`react-leaflet`) for users to pick a specific point (`location_coords`). Consider using a geocoding service (e.g., Nominatim via Leaflet plugin, or a dedicated API) to get coords from address.
    *   Input validation.
    *   On submit, insert data into `meal_offers` table using Supabase. Redirect to offer detail page or feed on success.

2.  **Offer Discovery View (`src/pages/MealOffersPage.tsx`):**
    *   **Layout:** Decide on primary discovery method: Map-centric, List-centric, or Hybrid.
    *   **Data Fetching:** Fetch 'open' `meal_offers` from Supabase. Filter out offers from blocked users. Potentially filter by proximity if user shares location (use PostGIS `st_dwithin`).
    *   **Filtering/Sorting:** Implement UI controls (e.g., in a sidebar or header) to filter offers by date/time range, interests (matching creator's interests), travel status. Allow sorting (e.g., by time, distance).
    *   **Map View (`src/components/Map/OffersMap.tsx`):**
        *   Use `react-leaflet`. Display markers for `meal_offers` based on `location_coords` (if available) or a fallback general area.
        *   Marker popups showing brief offer details (time, creator username, description snippet). Clicking popup could navigate to `OfferDetailPage`.
        *   (Optional) Display user's approximate location if shared.
    *   **List View (`src/components/Offers/OfferList.tsx`, `OfferCard.tsx`):**
        *   Display offers as cards with key details (creator avatar/username, time, location name, description, attendees count).
        *   Clicking a card navigates to `OfferDetailPage`.

3.  **Offer Detail View (`src/pages/OfferDetailPage.tsx`):**
    *   Fetch detailed data for a specific `meal_offer_id`, including creator profile info and list of accepted attendees (usernames/avatars).
    *   Display all offer details.
    *   Show controls based on user status:
        *   **Non-creator, not requested:** Show "Request to Join" button.
        *   **Non-creator, requested:** Show "Request Pending" / "Cancel Request".
        *   **Non-creator, accepted:** Show "View Chat" / "Leave Meal".
        *   **Creator:** Show "Manage Requests", "Edit Offer", "Cancel Offer", "View Chat".

4.  **Verification:** Test creating offers (with/without specific location), discovering offers on map/list, filtering/sorting, viewing offer details.

---

## Phase 6: Joining Requests & Communication

**Goal:** Implement the workflow for users to request joining meal offers, for creators to manage requests, and for confirmed attendees to communicate.
**Estimated Effort:** Large

**Steps:**

1.  **Request to Join:**
    *   On `OfferDetailPage`, the "Request to Join" button opens a modal (`RequestJoinModal.tsx`).
    *   Modal allows adding an optional message.
    *   On submit, insert into `meal_requests` table (status 'pending'). Update UI to show "Request Pending".

2.  **Manage Requests (Offer Creator View):**
    *   On `OfferDetailPage`, creator sees a list of pending requests (`src/components/Requests/RequestList.tsx`).
    *   Each request shows requester's username/avatar and message.
    *   Buttons to "Accept" or "Reject".
    *   Clicking "Accept": Updates `meal_requests` status to 'accepted'. Trigger/function adds user to `meal_attendees`. Check `max_attendees`. Update UI.
    *   Clicking "Reject": Updates `meal_requests` status to 'rejected'. Update UI.

3.  **Notifications (Basic):**
    *   Implement a simple notification system (e.g., a bell icon in the header) to inform users about:
        *   New requests received (for creators).
        *   Request accepted/rejected (for requesters).
        *   New messages in chats.
    *   This might involve polling or Supabase Realtime subscriptions on relevant tables.

4.  **Chat Implementation (`src/pages/ChatPage.tsx`, `src/components/Chat/`):**
    *   Accessible only to confirmed attendees of a specific `meal_offer_id`.
    *   Fetch messages for the `offerId` from `messages` table.
    *   Display messages (`MessageList.tsx`, `MessageItem.tsx`).
    *   Input field (`MessageInput.tsx`) to send new messages (insert into `messages` table).
    *   Use Supabase Realtime subscriptions on the `messages` table (filtered by `meal_offer_id`) to show new messages instantly.

5.  **Verification:** Test requesting to join, cancelling requests, accepting/rejecting requests, checking attendee list updates, sending/receiving chat messages in real-time. Test notification indicators.

---

## Phase 7: Safety Features & Moderation UI

**Goal:** Implement essential safety features like blocking and reporting, and basic UI elements for moderation feedback.
**Estimated Effort:** Medium

**Steps:**

1.  **Blocking:**
    *   Add "Block User" button on `ProfilePage` (when viewing others).
    *   On click, confirm action, then insert into `blocks` table.
    *   Update UI immediately (e.g., change button to "Unblock").
    *   Backend Logic (RLS): Ensure blocked users cannot see each other's profiles, offers, or send requests/messages to each other.

2.  **Unblocking:**
    *   Provide an "Unblock" button/mechanism (e.g., on profile page or a dedicated "Blocked Users" settings page).
    *   On click, delete the corresponding row from `blocks` table.

3.  **Reporting:**
    *   Add "Report User" button on `ProfilePage`.
    *   Add "Report Offer" button on `OfferDetailPage`.
    *   On click, open a modal (`ReportModal.tsx`) asking for a reason (dropdown/textarea).
    *   On submit, insert into `reports` table. Show confirmation message.

4.  **Moderation Considerations (Future):**
    *   This plan focuses on user-facing features. A separate admin interface would be needed for reviewing reports and taking action (Phase 11).

5.  **Safety Guidelines Page:** Ensure the static `SafetyPage.tsx` contains clear community guidelines and advice for meeting strangers safely.

6.  **Verification:** Test blocking a user (verify profile/offers disappear), unblocking, reporting a user, reporting an offer. Check Supabase tables (`blocks`, `reports`).

---

## Phase 8: Styling Refinements & Responsiveness

**Goal:** Polish the UI/UX, ensure design consistency reflecting a friendly and safe environment, and guarantee responsiveness across devices.
**Estimated Effort:** Medium

**Steps:**

1.  **Review Design Consistency:** Audit all components for consistent use of Tailwind utilities (colors, typography, spacing) aligned with the "friendly, non-dating" vibe. Refactor styles as needed.
2.  **Implement Responsive Layouts:** Adapt all pages and components (Header, Footer, Offer Feed/Map, Profile, Chat, Forms, Modals) for mobile, tablet, and desktop using Tailwind's responsive modifiers. Pay special attention to map usability and form inputs on mobile.
3.  **Refine Component Styles:** Polish map markers/popups, chat interface, profile layouts, offer cards, loading states, error messages. Add subtle transitions.
4.  **Cross-Browser/Device Testing:** Test thoroughly using browser dev tools and physical devices.
5.  **Accessibility (A11y) Check:** Review semantic HTML, color contrast, keyboard navigation, focus states, ARIA attributes.

6.  **Verification:** Visually inspect on multiple screen sizes/browsers. Test usability on touch devices. Perform accessibility checks.

---

## Phase 9: Testing

**Goal:** Ensure application stability, functionality, and security through comprehensive testing.
**Estimated Effort:** Large

**Steps:**

1.  **Setup Testing Tools:** Configure Vitest/Jest + React Testing Library for unit/integration tests, and Playwright/Cypress for E2E tests. Add scripts to `package.json`.
2.  **Unit Tests:** Test utility functions, simple UI components, custom hooks' logic. Mock dependencies (Supabase, Leaflet).
3.  **Integration Tests:** Test interactions between components:
    *   Auth flow (signup -> profile complete -> login -> logout).
    *   Offer creation flow (fill form -> submit -> verify data).
    *   Discovery & Filtering (apply filters -> verify results update).
    *   Request flow (request -> creator accepts/rejects -> verify state changes).
    *   Chat (send/receive messages - mock Realtime).
4.  **E2E Tests (Critical Flows):**
    *   User A signs up, creates profile, creates an offer.
    *   User B signs up, creates profile, finds User A's offer, requests to join.
    *   User A accepts User B's request.
    *   User A and B chat within the offer context.
    *   User B blocks User A; verify interactions are blocked.
    *   User A reports User B's profile.
5.  **Manual & Exploratory Testing:** Test edge cases, error handling, usability, accessibility, cross-browser/device compatibility. Focus on safety feature interactions.
6.  **Security Testing:** Manually test RLS policies by attempting unauthorized actions using browser dev tools or API clients against Supabase.
7.  **Review & Refactor:** Analyze test coverage, improve tests, fix identified bugs.

8.  **Verification:** Ensure all tests pass. Document testing procedures.

---

## Phase 10: Build & Deployment

**Goal:** Prepare and deploy the application to a production environment.
**Estimated Effort:** Small-Medium

**Steps:**

1.  **Production Environment Config:** Set up production Supabase keys securely via hosting provider environment variables. Ensure `.env` is in `.gitignore`.
2.  **Run Production Build:** `npm run build`.
3.  **Choose Hosting Platform:** Vercel, Netlify, Cloudflare Pages recommended.
4.  **Deploy Application:** Use Git integration (recommended) or manual upload of `dist/` directory. Configure build command (`npm run build`), publish directory (`dist`), and environment variables on the platform.
5.  **Configure Domain Name (Optional).**
6.  **Post-Deployment Verification:** Test critical paths on the live site (signup, login, create offer, request join, chat, block/report). Check console for errors.

7.  **Documentation:** Update README with deployment info and live URL.

---

## Phase 11: Optimizations, Considerations & Future Enhancements

**Goal:** Identify areas for improvement regarding performance, scalability, security, and potential future features.

**Areas to Consider:**

1.  **Performance:** Map bounds loading for offers, pagination for offer lists/chats, database indexing (esp. on `user_id`, `meal_offer_id`, spatial indexes), bundle size analysis, image optimization, WebSocket tuning for Realtime chat.
2.  **Scalability:** RLS efficiency review, potential use of Supabase Edge Functions for complex logic (e.g., matching algorithms, custom notifications), load testing.
3.  **Code Quality:** Stricter TypeScript, modularity, dependency updates, code style enforcement, documentation.
4.  **Feature Enhancements:**
    *   **Advanced Matching:** Filter users/offers by more specific criteria (shared interests, dietary needs).
    *   **User Verification:** Implement email/phone verification (`is_verified` flag).
    *   **Friend System:** Allow users to connect as "friends" for different privacy levels (`privacy_level` on offers).
    *   **Group Chat:** Allow multi-user chat for offers with >2 attendees.
    *   **Calendar Integration:** Option to add accepted meals to user's calendar (.ics export).
    *   **Push Notifications:** Implement web push notifications for requests/messages.
    *   **Admin/Moderation Panel:** Dedicated interface to review reports, manage users/content.
    *   **Rating/Review System:** Allow attendees to rate the meal experience (carefully consider implications).
    *   **Recurring Offers:** Allow creating offers that repeat.
5.  **Security:** Ongoing RLS review, input validation (client & server-side if using Edge Functions), rate limiting, dependency security audits.
6.  **UX/UI:** Improved loading/empty states, enhanced error handling, accessibility audit, user feedback mechanisms.

---

## User Flow Diagram (Simplified)

```mermaid
graph LR
    A[User (Traveler/Local)] --> B{Browse/Search Meal Offers};
    B -- Map/List --> C[View Offer Details];
    B -- Filter/Sort --> B;
    A --> D[Create Meal Offer];
    D --> C;
    C -- Request --> E{Request to Join};
    E --> F[Offer Creator Notified];
    F --> G{Manage Requests};
    G -- Accept --> H[User Notified & Added];
    G -- Reject --> I[User Notified];
    H --> J[Access Offer Chat];
    J --> K[Coordinate Meetup];
    K --> L[Meet & Eat!];
    C --> M[View Creator Profile];
    M --> N[Block/Report User];
    A --> O[Manage Own Profile];

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style H fill:#ccf,stroke:#333,stroke-width:2px
    style I fill:#fcc,stroke:#333,stroke-width:2px
    style L fill:#cfc,stroke:#333,stroke-width:4px