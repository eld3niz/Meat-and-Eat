# Meat-and-Eat: Product Development Plan (Rebuild)

**Version:** 1.0
**Date:** 2025-03-29
**Prepared For:** LLM Development Team / Future Developers
**Project Goal:** Rebuild the "Meat-and-Eat" directory website, a platform showcasing locations (likely restaurants/food places) on an interactive map, with user authentication and data sourced from Supabase.

---

## Phase 1: Project Setup & Foundation

**Goal:** Establish the core project structure, dependencies, environment configuration, and basic frontend layout.

**Estimated Effort:** Small

**Steps:**

1.  **Initialize Project:**
    *   Use Vite to scaffold a new React + TypeScript project.
        ```bash
        npm create vite@latest meat-and-eat-rebuild --template react-ts
        cd meat-and-eat-rebuild
        ```
    *   Initialize Git repository: `git init && git add . && git commit -m "Initial commit"`

2.  **Install Core Dependencies:**
    *   Install necessary runtime dependencies identified in the original `package.json`.
        ```bash
        npm install react react-dom @supabase/supabase-js leaflet react-leaflet leaflet.markercluster
        ```
    *   Install necessary development dependencies.
        ```bash
        npm install --save-dev typescript @types/react @types/react-dom @types/leaflet @types/leaflet.markercluster @vitejs/plugin-react eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks eslint-plugin-react-refresh tailwindcss postcss autoprefixer vite
        ```

3.  **Configure Tailwind CSS:**
    *   Initialize Tailwind: `npx tailwindcss init -p`
    *   Configure `tailwind.config.js`: Update the `content` array to include paths to all template files (`./index.html`, `./src/**/*.{js,ts,jsx,tsx}`).
        ```javascript
        // tailwind.config.js
        /** @type {import('tailwindcss').Config} */
        export default {
          content: [
            "./index.html",
            "./src/**/*.{js,ts,jsx,tsx}",
          ],
          theme: {
            extend: {},
          },
          plugins: [],
        }
        ```
    *   Configure `postcss.config.js` (usually generated correctly by init).
    *   Import Tailwind directives into `src/index.css`:
        ```css
        /* src/index.css */
        @tailwind base;
        @tailwind components;
        @tailwind utilities;

        /* Add custom base styles if needed, e.g., for scroll behavior */
        body:not(.allow-scroll) {
          overflow: hidden;
        }
        ```

4.  **Configure Vite:**
    *   Update `vite.config.ts` to include the React plugin and the `@` alias for `src`.
        ```typescript
        // vite.config.ts
        import { defineConfig } from 'vite'
        import react from '@vitejs/plugin-react'
        import path from 'path'

        export default defineConfig({
          plugins: [react()],
          resolve: {
            alias: {
              '@': path.resolve(__dirname, './src'),
            },
          },
        })
        ```
    *   Update `tsconfig.json` to include the path alias for TypeScript recognition:
        ```json
        // tsconfig.json (add/update paths under compilerOptions)
        {
          "compilerOptions": {
            // ... other options
            "baseUrl": ".",
            "paths": {
              "@/*": ["src/*"]
            }
          },
          // ... include/exclude
        }
        ```

5.  **Environment Variables Setup:**
    *   Create a `.env` file in the project root.
    *   Add placeholders for Supabase credentials:
        ```
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    *   Add `.env` to `.gitignore`.
    *   Create a `.env.example` file mirroring `.env` without actual keys for repository documentation.

6.  **Create Supabase Client Utility:**
    *   Create `src/utils/supabaseClient.ts`.
    *   Implement the Supabase client initialization logic, reading from environment variables (`import.meta.env`).
        ```typescript
        // src/utils/supabaseClient.ts
        import { createClient } from '@supabase/supabase-js';

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase URL and Anon Key must be set in environment variables');
          // Consider a more user-friendly error display in production
        }

        export const supabase = createClient(supabaseUrl, supabaseAnonKey);
        ```

7.  **Basic App Structure (`src/main.tsx`, `src/App.tsx`):**
    *   Set up `src/main.tsx` to render the `App` component into the root DOM element. Include `React.StrictMode`.
        ```typescript
        // src/main.tsx
        import React from 'react'
        import ReactDOM from 'react-dom/client'
        import App from './App.tsx'
        import './index.css' // Ensure Tailwind styles are imported

        ReactDOM.createRoot(document.getElementById('root')!).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
        )
        ```
    *   Create a basic `src/App.tsx` component with placeholders for Header, Content, and Footer. Include initial setup for context providers (to be implemented later).
        ```typescript
        // src/App.tsx
        import React from 'react';
        // Placeholder imports - Implement these components later
        // import Header from '@/components/Layout/Header';
        // import Footer from '@/components/Layout/Footer';
        // import WorldMap from '@/components/Map/WorldMap';
        // import { AuthProvider } from '@/context/AuthContext';
        // import { ModalProvider } from '@/contexts/ModalContext';

        function App() {
          // Basic structure
          return (
            // <AuthProvider> // Add later
            //   <ModalProvider> // Add later
                <div className="app flex flex-col min-h-screen">
                  {/* <Header /> */}
                  <main className="content flex-grow">
                    {/* Placeholder for map or page content */}
                    {/* <WorldMap /> */}
                     <h1 className="text-center text-2xl p-4">Meat-and-Eat Coming Soon</h1>
                  </main>
                  {/* <Footer /> */}
                  {/* <AuthModalPortal /> // Add later */}
                </div>
            //   </ModalProvider>
            // </AuthProvider>
          );
        }

        export default App;
        ```

8.  **Basic Layout Components (`src/components/Layout/`):**
    *   Create placeholder components for `Header.tsx`, `Footer.tsx`, and potentially a `Layout.tsx` wrapper if needed (though `App.tsx` seems to handle the main layout). Style minimally with Tailwind for structure.

9.  **Initial Commit & Verification:**
    *   Run `npm run dev` to ensure the basic app structure renders without errors.
    *   Commit the foundational setup: `git add . && git commit -m "Feat: Setup project structure, dependencies, and basic layout"`

---

## Phase 2: Supabase Backend Setup

**Goal:** Define the database schema in Supabase, configure authentication, and set up Row Level Security (RLS) policies.

**Estimated Effort:** Medium (Requires understanding the original data model)

**Steps:**

1.  **Define Database Schema:**
    *   **Identify Tables:** Analyze the original codebase (data fetching logic in hooks/components, type definitions in `src/types/`) or inspect the existing Supabase project to determine the required tables (e.g., `locations`, `users`, `profiles`, `categories`, `comments`).
    *   **Define Columns & Types:** Specify columns, data types (e.g., `text`, `uuid`, `timestampz`, `geometry` or `point` for coordinates), constraints (e.g., `NOT NULL`, `UNIQUE`), and foreign key relationships.
    *   **Example `locations` Table (Inferred):**
        *   `id`: `uuid` (Primary Key)
        *   `created_at`: `timestampz` (Default `now()`)
        *   `name`: `text`
        *   `description`: `text`
        *   `latitude`: `numeric` or `float8`
        *   `longitude`: `numeric` or `float8`
        *   `address`: `text` (Optional)
        *   `category`: `text` or `uuid` (Foreign Key to `categories` table)
        *   `image_url`: `text` (Optional)
        *   `added_by`: `uuid` (Foreign Key to `auth.users`)
        *   *(Potentially use PostGIS extension for `location`: `geometry(Point, 4326)`)*
    *   **Create Tables:** Use the Supabase SQL editor or GUI to create the tables and relationships. Enable the PostGIS extension if using geometry types.

2.  **Configure Supabase Authentication:**
    *   **Enable Providers:** Choose and enable authentication providers (e.g., Email/Password, Google, etc.) in the Supabase dashboard (Authentication -> Providers).
    *   **User Metadata/Profiles:** Decide if additional user profile information (beyond `auth.users`) is needed. If so, create a `profiles` table linked to `auth.users` (often via a trigger on user creation).
        *   **Example `profiles` Table:**
            *   `id`: `uuid` (Primary Key, Foreign Key to `auth.users.id`)
            *   `updated_at`: `timestampz`
            *   `username`: `text` (Unique)
            *   `full_name`: `text`
            *   `avatar_url`: `text`
    *   **Setup Email Templates:** Customize email templates for confirmation, password reset, etc. (Authentication -> Templates).

3.  **Implement Row Level Security (RLS):**
    *   **Enable RLS:** Enable RLS for all tables containing sensitive or user-specific data.
    *   **Define Policies:** Create policies based on application requirements:
        *   **Public Read Access:** Allow anyone to read `locations` data? (`CREATE POLICY "Public read access for locations" ON locations FOR SELECT USING (true);`)
        *   **Authenticated Write Access:** Allow only logged-in users to add new locations? (`CREATE POLICY "Allow authenticated users to insert locations" ON locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');`)
        *   **Ownership-Based Access:** Allow users to update/delete only their *own* locations/profile? (`CREATE POLICY "Allow users to manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);`)
    *   **Test Policies:** Thoroughly test RLS policies using different user roles (anonymous, authenticated).

4.  **Database Functions/Triggers (Optional):**
    *   Identify if any database functions (e.g., for searching/filtering based on distance) or triggers (e.g., creating a profile on user signup) were used in the original project or are desired for the rebuild. Implement them using SQL or PL/pgSQL.

5.  **Documentation:**
    *   Document the database schema, relationships, and RLS policies in the project's README or a dedicated documentation file.

---

## Phase 3: Core Frontend Structure (Context, Routing, Layout)

**Goal:** Implement the main application layout, routing logic, and essential context providers (Authentication, Modals).

**Estimated Effort:** Medium

**Steps:**

1.  **Implement Layout Components:**
    *   Develop `src/components/Layout/Header.tsx`: Include branding/logo, navigation links (Map, About, Impressum, Datenschutz), and authentication controls (Login/Register button or User Profile display). Use Tailwind CSS for styling.
    *   Develop `src/components/Layout/Footer.tsx`: Include copyright information and links (About, Impressum, Datenschutz). Style with Tailwind CSS.
    *   Refine `src/App.tsx` to integrate the actual `Header` and `Footer` components.

2.  **Implement Context Providers:**
    *   **Authentication Context (`src/context/AuthContext.tsx`):**
        *   Create the context using `React.createContext`.
        *   Implement the `AuthProvider` component.
        *   Manage authentication state (e.g., `user`, `session`, `loading`).
        *   Use Supabase `auth.onAuthStateChange` listener to automatically update the state when the user logs in, logs out, or the session refreshes.
        *   Provide functions for login, logout, signup (these might call Supabase functions directly or trigger UI modals).
        *   Expose the context value (state and functions) via the provider.
        *   Create a custom hook `useAuth()` for easy consumption of the context.
    *   **Modal Context (`src/contexts/ModalContext.tsx`):**
        *   Create the context.
        *   Implement the `ModalProvider` component.
        *   Manage modal state (e.g., `isModalOpen`, `modalContent`, `modalType`).
        *   Provide functions to `openModal(type, content)` and `closeModal`.
        *   Expose the context value.
        *   Create a custom hook `useModal()` for easy consumption.

3.  **Integrate Context Providers in `App.tsx`:**
    *   Wrap the main `div` in `src/App.tsx` with `AuthProvider` and `ModalProvider`. Ensure `AuthProvider` is outside `ModalProvider` if modals need auth context.

4.  **Implement Basic Routing Logic in `App.tsx`:**
    *   Refine the `useEffect` hook that listens to `window.location.pathname` and `popstate` events.
    *   Use the `currentPage` state to conditionally render the `WorldMap` component or the static page components (`AboutPage`, `DatenschutzPage`, `ImpressumPage`).
    *   Ensure navigation links in the `Header` update the URL correctly (e.g., using standard `<a>` tags initially, or potentially a simple client-side routing helper if needed later).
    *   Implement the body scroll lock logic based on `currentPage` as seen in the original `App.tsx`.

5.  **Implement Static Page Components:**
    *   Create basic functional components for `src/components/Pages/AboutPage.tsx`, `src/components/Pages/DatenschutzPage.tsx`, `src/components/Pages/ImpressumPage.tsx`.
    *   Add placeholder content and basic Tailwind styling.

6.  **Type Definitions (`src/types/index.ts`):**
    *   Start defining core TypeScript types as they become apparent (e.g., `User`, `Session`, `Location`, `ModalType`). Create `src/types/index.ts` and export types from there.

7.  **Verification:**
    *   Run `npm run dev`.
    *   Test navigation between the map placeholder and static pages using header/footer links.
    *   Verify basic layout structure (Header, Content, Footer).
    *   Check browser console for any errors related to context providers or routing.
    *   Commit changes: `git add . && git commit -m "Feat: Implement core layout, routing, and context providers"`

---

## Phase 4: Authentication (Frontend Implementation)

**Goal:** Implement the user interface and logic for user registration, login, logout, and profile display, integrating with Supabase Auth and the `AuthContext`.

**Estimated Effort:** Large

**Steps:**

1.  **Create Authentication UI Components (`src/components/Auth/`):**
    *   **`AuthModal.tsx`:** A reusable modal component shell (using Headless UI or a simple custom implementation) to host login/register forms.
    *   **`AuthModalPortal.tsx`:** A component using `ReactDOM.createPortal` to render the `AuthModal` outside the main DOM hierarchy (likely appended to `document.body`), controlled by the `ModalContext`.
    *   **`LoginForm.tsx`:** Form with email/password fields, submit button, error display area, and potentially links for "Forgot Password?" and "Sign Up".
    *   **`RegisterForm.tsx` / `MultiStepRegisterForm.tsx`:** Based on the original structure, implement either a single registration form or a multi-step form (e.g., `RegisterSlide1.tsx`, `RegisterSlide2.tsx`, etc.) collecting necessary user details (email, password, username, profile info). Include input validation and error handling.
    *   **`UserProfile.tsx`:** A component (potentially shown in the Header or on a dedicated page) displaying logged-in user information (e.g., username, avatar) and a logout button.
    *   **`DotIndicator.tsx` (if multi-step):** Visual indicator for steps in the registration form.

2.  **Integrate Auth UI with Modal Context:**
    *   Modify `Header.tsx`: If the user is logged out (check `AuthContext`), show "Login/Register" buttons. Clicking these should call `openModal('auth', ...)` from `ModalContext`.
    *   Modify `AuthModalPortal.tsx`: Use `useModal()` to check if the modal should be open and what content (`LoginForm`, `RegisterForm`) to display inside `AuthModal.tsx`. Implement the `closeModal` functionality (e.g., on overlay click or close button).

3.  **Implement Auth Logic:**
    *   **Login:** In `LoginForm.tsx`, on submit, call a login function (e.g., from `AuthContext` or directly `supabase.auth.signInWithPassword`). Handle success (close modal, `AuthContext` updates state) and errors (display messages).
    *   **Registration:** In `RegisterForm.tsx` / `MultiStepRegisterForm.tsx`, on final submit, call a signup function (e.g., `supabase.auth.signUp`). Handle success (potentially show a "Check your email" message, close modal) and errors. If creating a `profiles` record, handle that after successful signup (potentially using a trigger or a separate function call).
    *   **Logout:** In `UserProfile.tsx` (or Header), add a logout button that calls a logout function (e.g., `supabase.auth.signOut`). Handle success (`AuthContext` updates) and errors.
    *   **Password Reset:** (Optional but recommended) Implement a "Forgot Password" flow using `supabase.auth.resetPasswordForEmail` and potentially a separate page/modal for entering the new password.

4.  **Conditional Rendering based on Auth State:**
    *   In `Header.tsx`, use `useAuth()` to check the user state. Display Login/Register buttons if logged out, or `UserProfile` component if logged in.
    *   Protect routes or features if necessary (though this app seems mostly public with optional login for adding/managing content).

5.  **Styling:**
    *   Apply Tailwind CSS consistently across all authentication components for a cohesive look and feel.

6.  **Verification:**
    *   Run `npm run dev`.
    *   Test the full login, registration (including email confirmation if enabled in Supabase), and logout flows.
    *   Verify error handling for incorrect credentials, existing users, etc.
    *   Check that the UI updates correctly based on authentication state (Header changes).
    *   Test modal opening and closing.
    *   Commit changes: `git add . && git commit -m "Feat: Implement authentication UI and logic"`

---

## Phase 5: Map Implementation (Leaflet, Data Fetching, Markers)

**Goal:** Display the interactive Leaflet map, fetch location data from Supabase, and render markers (potentially clustered) with popups.

**Estimated Effort:** Large

**Steps:**

1.  **Create Map Components (`src/components/Map/`):**
    *   **`MapComponent.tsx` (or `WorldMap.tsx`):** The main container for the Leaflet map.
        *   Use `react-leaflet` components (`MapContainer`, `TileLayer`).
        *   Set initial view (center, zoom).
        *   Configure `TileLayer` (e.g., OpenStreetMap).
    *   **`Markers.tsx`:** Responsible for fetching location data and rendering markers.
        *   Fetch data from the Supabase `locations` table (or equivalent) inside a `useEffect` hook. Handle loading and error states.
        *   Use `react-leaflet`'s `Marker` component to display individual locations.
    *   **`MarkerCluster.tsx`:** (If using clustering) Wrap the marker rendering logic with `leaflet.markercluster`. Requires integrating the `leaflet.markercluster` library with `react-leaflet` (often involves a custom component or hook).
    *   **`InfoPopup.tsx`:** Component defining the content structure for the popup shown when a marker is clicked (using `react-leaflet`'s `Popup` component). Display location details (name, description, etc.).
    *   **`UserLocationMarker.tsx`:** (Optional) Component to display the user's current location on the map using the browser's Geolocation API.
    *   **`CityMarkerIcon.tsx` / Custom Icons:** Define custom Leaflet icons if needed (as suggested by `fixLeafletIconPath` utility).
    *   **`ResponsiveInfoDisplay.tsx`:** (If needed) A component to display information related to the selected marker, potentially outside the map for better responsiveness on smaller screens.

2.  **Data Fetching (`useMapData.ts` or within components):**
    *   Implement the logic to fetch location data from Supabase.
        ```typescript
        // Example fetch within Markers.tsx
        import { supabase } from '@/utils/supabaseClient';
        import { Location } from '@/types'; // Assuming Location type defined
        // ...
        const [locations, setLocations] = useState<Location[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          const fetchLocations = async () => {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
              .from('locations') // Use your actual table name
              .select('*'); // Select specific columns needed

            if (error) {
              console.error('Error fetching locations:', error);
              setError(error.message);
            } else {
              setLocations(data || []);
            }
            setLoading(false);
          };
          fetchLocations();
        }, []);
        ```
    *   Define the `Location` type in `src/types/index.ts` based on the Supabase table structure.
    *   Consider creating a custom hook `useMapData()` to encapsulate data fetching, filtering, and state management logic.

3.  **Integrate Map into `App.tsx`:**
    *   Replace the placeholder content in `App.tsx` with the main `WorldMap` (or `MapComponent`) when `currentPage` is 'map'.

4.  **Leaflet CSS and Icon Fix:**
    *   Import Leaflet's CSS: `import 'leaflet/dist/leaflet.css';` (usually in `main.tsx` or `App.tsx`).
    *   Import MarkerCluster CSS if used: `import 'leaflet.markercluster/dist/MarkerCluster.css';` and `import 'leaflet.markercluster/dist/MarkerCluster.Default.css';`.
    *   Implement `src/utils/mapUtils.ts` with the `fixLeafletIconPath` function to correctly resolve default icon paths, especially when using bundlers like Vite.
        ```typescript
        // src/utils/mapUtils.ts
        import L from 'leaflet';
        import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
        import iconUrl from 'leaflet/dist/images/marker-icon.png';
        import shadowUrl from 'leaflet/dist/images/shadow.png';

        export const fixLeafletIconPath = () => {
          delete (L.Icon.Default.prototype as any)._getIconUrl; // Type assertion needed
          L.Icon.Default.mergeOptions({
            iconRetinaUrl,
            iconUrl,
            shadowUrl,
          });
        };
        ```
    *   Call `fixLeafletIconPath()` once in `App.tsx`'s `useEffect`.

5.  **Verification:**
    *   Run `npm run dev`.
    *   Verify the map displays correctly with the chosen tile layer.
    *   Check if location data is fetched from Supabase and markers are rendered.
    *   Test marker clustering if implemented.
    *   Test marker popups, ensuring data is displayed correctly.
    *   Test user location functionality if implemented.
    *   Check for console errors related to Leaflet or data fetching.
    *   Commit changes: `git add . && git commit -m "Feat: Implement Leaflet map, data fetching, and markers"`

---

## Phase 6: UI Components (Search, Filter, Display)

**Goal:** Implement UI elements for searching, filtering locations (by city, radius), and displaying information/statistics, integrating them with the map state and data.

**Estimated Effort:** Large

**Steps:**

1.  **State Management for Filters:**
    *   Decide where the filter state (search query, selected city, radius value, etc.) will live. Options:
        *   Lift state up to the parent component (`WorldMap.tsx` or a similar container).
        *   Use React Context if state needs to be shared across deeply nested components without prop drilling.
        *   (Less likely for this scale) Use a dedicated state management library (Zustand, Redux Toolkit).
    *   *Assumption for this plan:* State will be managed within the main map container component (`WorldMap.tsx`) and passed down as props to UI components. Callbacks will be passed down to update the state.

2.  **Implement Search Component (`src/components/UI/SearchBar.tsx`):**
    *   Create a controlled input field for text search.
    *   Accept `value` and `onChange` props from the parent to manage the search query state.
    *   Potentially include debouncing for the input to avoid excessive filtering/API calls on every keystroke.
    *   Style with Tailwind CSS.

3.  **Implement Filter Components (`src/components/UI/CityFilter.tsx`, `src/components/Controls/RadiusSlider.tsx`):**
    *   **`CityFilter.tsx`:**
        *   Likely a dropdown (`<select>`) or a list of buttons/tags.
        *   Populate with a list of available cities (potentially fetched from Supabase or using a predefined list like `src/data/cities.ts`).
        *   Accept `selectedCity` and `onCityChange` props.
    *   **`RadiusSlider.tsx`:**
        *   An input of type `range`.
        *   Requires user's current location to be meaningful (integrate with `UserLocationMarker.tsx` or Geolocation API).
        *   Accept `value`, `onChange`, `min`, `max`, `step` props.
        *   Display the current radius value.
    *   Style components with Tailwind CSS.

4.  **Implement Display Components (`src/components/UI/Sidebar.tsx`, `src/components/UI/CityTable.tsx`, `src/components/UI/CityStats.tsx`, `src/components/UI/InfoCard.tsx`):**
    *   **`Sidebar.tsx`:**
        *   A container component, likely positioned absolutely or fixed on the screen.
        *   Host other UI components like `SearchBar`, `CityFilter`, `RadiusSlider`, `CityTable`, `CityStats`.
        *   Manage its own open/closed state for mobile responsiveness if needed.
    *   **`CityTable.tsx` / `InfoCard.tsx`:**
        *   Display a list or grid of filtered locations based on the current search/filter criteria.
        *   Accept the filtered `locations` array as a prop.
        *   Each item in the list/table (`InfoCard`) should display key location details (name, category, address).
        *   Clicking an item might pan/zoom the map to the corresponding marker and open its popup.
    *   **`CityStats.tsx`:**
        *   Display statistics based on the current view or filters (e.g., "Showing X locations in City Y", total locations).
        *   Accept necessary data (filtered locations count, total count, selected city) as props.
    *   Style components with Tailwind CSS.

5.  **Integrate UI Components with Map/Data:**
    *   Place the `Sidebar` (or individual UI components) within the main map container (`WorldMap.tsx` or `App.tsx`).
    *   Pass filter state and update callbacks from the map container down to the UI components.
    *   Modify the data fetching logic (`useMapData` or within `Markers.tsx`) to accept filter parameters (search query, city, radius, user coordinates).
    *   Re-fetch data or filter the existing data client-side whenever filter state changes.
        *   *Decision Point:* Client-side vs. Server-side filtering. For a large dataset, server-side filtering (adding `.ilike()`, `.eq()`, `.st_distance()` etc., to the Supabase query) is more efficient. For smaller datasets, client-side filtering might suffice initially. Assume server-side filtering for scalability.
    *   Update the `Markers` component to only render markers that match the current filters.
    *   Implement the interaction where clicking a location in the `CityTable`/`InfoCard` interacts with the map (panning, zooming, opening popup). This might involve accessing the Leaflet map instance.

6.  **Refine Types (`src/types/index.ts`):**
    *   Add or update types for filter state, city data, etc.

7.  **Verification:**
    *   Run `npm run dev`.
    *   Test the `SearchBar`: ensure typing updates the query and filters map markers/list results (after debouncing).
    *   Test `CityFilter`: ensure selecting a city updates the map/list.
    *   Test `RadiusSlider`: ensure changing the radius filters locations based on distance from the user's location (requires geolocation to be working).
    *   Verify that `CityStats` updates correctly based on filters.
    *   Verify that clicking items in `CityTable`/`InfoCard` interacts correctly with the map.
    *   Check responsiveness and layout of the `Sidebar` and other UI elements.
    *   Commit changes: `git add . && git commit -m "Feat: Implement UI components for search, filter, and display"`

---

## Phase 7: User Interaction & Features (Comments, Adding Locations)

**Goal:** Enable authenticated users to contribute content, such as adding comments to locations or submitting new locations to the directory.

**Estimated Effort:** Medium-Large (Depends on complexity of 'Add Location' form/validation)

**Steps:**

1.  **Refine Database Schema & RLS (Supabase):**
    *   **Comments Table:**
        *   Define/Confirm a `comments` table (e.g., `id` (uuid, pk), `created_at` (timestampz), `location_id` (uuid, fk to locations.id), `user_id` (uuid, fk to auth.users.id), `comment_text` (text)).
        *   **RLS:**
            *   Allow public read access: `CREATE POLICY "Public read access for comments" ON comments FOR SELECT USING (true);`
            *   Allow authenticated users to insert: `CREATE POLICY "Allow authenticated users to insert comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');`
            *   Allow users to delete their own comments: `CREATE POLICY "Allow users to delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);`
            *   (Optional) Allow users to update their own comments.
    *   **Locations Table (for Adding):**
        *   Ensure the `locations` table has an `added_by` column (uuid, fk to auth.users.id).
        *   **RLS:**
            *   Confirm/Add policy for authenticated inserts: `CREATE POLICY "Allow authenticated users to insert locations" ON locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');`
            *   (Optional) Policies for users to update/delete their *own* added locations.

2.  **Implement Commenting Feature (`src/components/Comments/`):**
    *   **`CommentList.tsx`:**
        *   Accepts `locationId` as a prop.
        *   Fetches comments for that `locationId` from the `comments` table (potentially joining with `profiles` to get usernames) using `supabase`.
        *   Displays comments (text, author username, timestamp). Include loading/error states.
        *   Include delete button for comments belonging to the current user (check `auth.uid() === comment.user_id`).
    *   **`CommentForm.tsx`:**
        *   A simple form with a textarea and submit button.
        *   Accepts `locationId` as a prop.
        *   Uses `useAuth()` to check if the user is logged in. If not, hide the form or show a "Login to comment" message.
        *   On submit, inserts the new comment into the `comments` table using `supabase.from('comments').insert({ location_id: locationId, user_id: user.id, comment_text: text })`.
        *   Handle success (clear form, potentially refresh `CommentList` optimistically or via callback) and errors.
    *   **Integration:**
        *   Render `CommentList` and `CommentForm` within the location detail view (e.g., inside `InfoPopup.tsx` or `ResponsiveInfoDisplay.tsx`).

3.  **Implement "Add Location" Feature (Optional, but common):**
    *   **Trigger UI:** Add a button/link (e.g., "Add New Place") visible only to authenticated users (use `useAuth()`). Place it in the `Header` or `Sidebar`. Clicking it should open the `AddLocationForm` (likely via the `ModalContext`).
    *   **`AddLocationForm.tsx`:**
        *   A form component (potentially multi-step) to collect location details: name, description, address, category, coordinates.
        *   **Coordinate Input:** Allow users to either type coordinates or click on the map to set the location (requires map interaction logic).
        *   **Image Upload:** (If applicable) Use `supabase.storage` to handle image uploads.
        *   Include input validation.
        *   On submit, gather all data and insert into the `locations` table using `supabase.from('locations').insert({...data, added_by: user.id})`.
        *   Handle success (close modal, show message, refresh map data) and errors.
    *   **Integration:**
        *   Use `ModalContext` to display the `AddLocationForm` in a modal.

4.  **Refine User Profile (`src/components/User/UserProfile.tsx`):**
    *   (Optional) Enhance the user profile view (if it's more than just a logout button) to show user's added locations or comments.

5.  **Verification:**
    *   Run `npm run dev`.
    *   **Comments:**
        *   Log in and add comments to locations. Verify they appear correctly.
        *   Verify comments are visible when logged out (public read).
        *   Verify the comment form is hidden/disabled when logged out.
        *   Verify you can delete your own comments but not others'.
    *   **Add Location:**
        *   Verify the "Add New Place" button appears only when logged in.
        *   Test opening the form modal.
        *   Test submitting the form with valid/invalid data.
        *   Verify coordinate input (manual and map click).
        *   Verify the new location appears on the map after successful submission.
        *   Check Supabase tables (`comments`, `locations`) to confirm data integrity and `user_id`/`added_by` fields are set correctly.
        *   Test RLS by trying to perform actions without logging in or as a different user.
    *   Commit changes: `git add . && git commit -m "Feat: Implement commenting and add location features"`

---

## Phase 8: Styling Refinements & Responsiveness

**Goal:** Polish the overall visual appearance using Tailwind CSS, ensure a consistent design language, and make the application fully responsive across common device sizes (mobile, tablet, desktop).

**Estimated Effort:** Medium

**Steps:**

1.  **Review Design Consistency:**
    *   Audit all components (`Header`, `Footer`, `Sidebar`, `Map Popups`, `Modals`, `Forms`, `Buttons`, `InfoCards`, etc.).
    *   Ensure consistent use of colors, typography (font sizes, weights), spacing (padding, margins), borders, and shadows as defined (or implicitly defined) by the Tailwind configuration and overall design aesthetic.
    *   Refactor common styles into reusable CSS classes (using Tailwind's `@apply` in `src/index.css` if necessary, though prefer utility classes) or dedicated UI components (e.g., a `<Button>` component).

2.  **Implement Responsive Layouts:**
    *   **Mobile-First Approach:** Design or adapt components primarily for mobile screens first, then use Tailwind's responsive modifiers (e.g., `md:`, `lg:`) to adjust layouts for larger screens.
    *   **Header:** Ensure navigation links and auth controls stack or collapse appropriately (e.g., into a hamburger menu) on small screens.
    *   **Sidebar/Filters:**
        *   On mobile, the sidebar might be hidden by default and toggled via a button.
        *   Alternatively, filters/search could be placed in a modal or a collapsible section at the top/bottom of the screen.
        *   Ensure filter controls (`SearchBar`, `CityFilter`, `RadiusSlider`) are usable on touch devices.
    *   **Map Area:** The map itself might take up full width/height on mobile, with UI elements overlaid or accessible via toggles.
    *   **Data Display (`CityTable`/`InfoCard`):** Ensure tables don't overflow horizontally on small screens (consider card layouts or horizontal scrolling with indication). InfoCards should stack nicely.
    *   **Modals:** Ensure modals are centered and sized appropriately, with scrollable content if necessary, on all screen sizes.

3.  **Refine Component-Specific Styles:**
    *   **Map Popups:** Ensure popups are styled clearly and don't obscure too much of the map, especially on smaller screens.
    *   **Forms:** Improve visual feedback for input validation (error states, focus rings). Ensure labels and inputs are well-aligned and readable.
    *   **Loading/Empty States:** Add or refine visual indicators (spinners, skeletons, messages) for components during data fetching or when no data matches filters. Ensure these states are also styled consistently.
    *   **Transitions/Animations:** Add subtle transitions (e.g., for hover states, modal appearance, sidebar sliding) using Tailwind's transition utilities to enhance user experience.

4.  **Cross-Browser/Device Testing:**
    *   Use browser developer tools (responsive design mode) to simulate different viewport sizes (common mobile phones, tablets, desktops).
    *   Test on actual physical devices if possible.
    *   Test in major browsers (Chrome, Firefox, Safari, Edge) to catch any rendering inconsistencies.

5.  **Accessibility (A11y) Check:**
    *   Review semantic HTML usage (e.g., using `<button>`, `<nav>`, `<main>`, `<aside>`).
    *   Ensure sufficient color contrast.
    *   Check keyboard navigation and focus states for interactive elements (buttons, links, form inputs).
    *   Add appropriate ARIA attributes where necessary, especially for custom components or dynamic content changes.

6.  **Code Cleanup:**
    *   Remove unused CSS classes.
    *   Ensure consistent formatting (run linters/formatters).

7.  **Verification:**
    *   Visually inspect the application on multiple screen sizes and browsers.
    *   Confirm layout adjustments work as expected.
    *   Verify interactive elements are usable on touch devices.
    *   Perform basic accessibility checks (keyboard navigation, contrast).
    *   Commit changes: `git add . && git commit -m "Style: Refine UI, implement responsiveness, and improve accessibility"`

---

## Phase 9: Testing

**Goal:** Verify the application's functionality, identify bugs, and ensure stability through automated and manual testing procedures.

**Estimated Effort:** Medium-Large (Depending on desired coverage)

**Steps:**

1.  **Define Testing Strategy & Setup Tools:**
    *   **Strategy:** Aim for a balanced testing pyramid: numerous unit tests, fewer integration tests, and a select set of critical E2E tests.
    *   **Tools:**
        *   **Unit/Integration:** Choose Vitest (recommended due to Vite integration) or Jest. Use React Testing Library (`@testing-library/react`) for rendering components and simulating user interactions in a virtual DOM.
        *   **E2E:** Choose Playwright (recommended for its features and speed) or Cypress.
    *   **Setup:**
        *   Install testing libraries: `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test` (adjust based on choices).
        *   Configure Vitest/Jest (e.g., `vitest.config.ts` or `jest.config.js`), including setting up the test environment (e.g., `jsdom`).
        *   Configure Playwright/Cypress (e.g., `playwright.config.ts`).
        *   Add test scripts to `package.json`:
            ```json
            "scripts": {
              // ... other scripts
              "test": "vitest",
              "test:ui": "vitest --ui", // Optional: Vitest UI
              "test:e2e": "playwright test",
              "coverage": "vitest run --coverage" // Optional
            },
            ```

2.  **Implement Unit Tests:**
    *   **Target:** Individual, isolated functions and simple components.
    *   **Examples:**
        *   Utility functions (`src/utils/mapUtils.ts`, data transformation functions).
        *   Simple UI components (e.g., `Button`, `InfoCard` - verify rendering based on props).
        *   Custom hooks' internal logic (if complex and testable in isolation).
    *   **Mocks:** Mock external dependencies like `supabase`, Leaflet map instances, or browser APIs (`navigator.geolocation`) using Vitest/Jest mocking capabilities (`vi.mock`, `jest.mock`).
    *   **Location:** Place test files alongside the source files (e.g., `Button.test.tsx` next to `Button.tsx`) or in a dedicated `__tests__` directory.

3.  **Implement Integration Tests:**
    *   **Target:** Interactions between multiple components, context, and mocked services.
    *   **Examples:**
        *   **Authentication Flow:** Render `App` (or relevant parts) with mocked `AuthProvider`. Simulate clicks on Login button -> Verify modal appears -> Fill form -> Simulate submit -> Verify mocked `supabase.auth.signInWithPassword` was called with correct arguments -> Verify context state updates.
        *   **Filtering:** Render the map container with filter components. Simulate changing filter values -> Verify state updates -> Verify mocked data fetching function is called with new filter parameters.
        *   **Map Popups:** Render the map with markers. Simulate clicking a marker -> Verify the `Popup` component renders with the correct location data.
    *   **Tools:** Use React Testing Library's `render`, `screen`, `fireEvent`, `waitFor`.

4.  **Implement End-to-End (E2E) Tests:**
    *   **Target:** Critical user flows through the entire application in a real browser.
    *   **Setup:** May require a separate test database instance in Supabase seeded with test data. Configure E2E tests to point to this instance via environment variables.
    *   **Examples:**
        *   **Login & Comment:** Navigate to site -> Click Login -> Fill credentials -> Submit -> Verify successful login (e.g., header changes) -> Find a location marker -> Click marker -> Type comment -> Submit comment -> Verify comment appears -> Logout.
        *   **Filtering & Navigation:** Navigate to site -> Apply city filter -> Apply search term -> Verify map/list updates -> Click location in list -> Verify map pans/zooms -> Click 'About' link -> Verify About page loads.
        *   **Responsiveness:** (Optional) Use Playwright/Cypress viewport commands to test layout on different screen sizes.
    *   **Tools:** Use Playwright/Cypress commands to navigate, interact with elements (selectors), and make assertions about the UI state.

5.  **Manual & Exploratory Testing:**
    *   Repeat cross-browser and cross-device testing (from Phase 8) focusing on functionality.
    *   Test edge cases: invalid inputs, slow network conditions (use browser dev tools), unexpected user actions.
    *   Test error handling: Ensure backend errors (simulated or real) are handled gracefully in the UI.
    *   Test accessibility manually (keyboard navigation, screen reader compatibility).
    *   Perform usability testing: Is the app easy and intuitive to use?

6.  **Review & Refactor:**
    *   Review test code for clarity and maintainability.
    *   Analyze test coverage reports (if generated) and add tests for critical uncovered areas.
    *   Fix bugs identified during any testing phase.

7.  **Verification:**
    *   Ensure all automated tests (unit, integration, E2E) pass consistently.
    *   Confirm major bugs found during manual testing are resolved.
    *   Document how to run the different test suites in the README.
    *   Commit test files and any bug fixes: `git add . && git commit -m "Test: Add unit, integration, and E2E tests; fix bugs"`

---

## Phase 10: Build & Deployment

**Goal:** Prepare the application for production, build the optimized static assets, and deploy it to a suitable hosting platform.

**Estimated Effort:** Small-Medium (Depending on hosting choice and CI/CD setup)

**Steps:**

1.  **Production Environment Configuration:**
    *   **Supabase Keys:** Ensure the `.env` file used for the production build (or environment variables in the deployment environment) contains the **production** Supabase URL and Anon Key, NOT development keys.
    *   **Security:** Double-check that the `.env` file itself is NOT committed to Git and is listed in `.gitignore`. Production keys should be securely managed by the hosting platform's environment variable settings.

2.  **Run Production Build:**
    *   Execute the build script defined in `package.json`:
        ```bash
        npm run build
        ```
    *   This command (typically `tsc && vite build`) will:
        *   Run TypeScript checks (`tsc`).
        *   Use Vite to bundle JavaScript/CSS, optimize assets (minification, code splitting, tree shaking), and generate static files in the `dist/` directory (or as configured in `vite.config.ts`).

3.  **Choose Hosting Platform:**
    *   Select a platform suitable for hosting static sites (like this Vite/React app). Common choices:
        *   **Vercel:** Excellent DX, integrates well with Git, free tier available.
        *   **Netlify:** Similar to Vercel, strong focus on Jamstack, free tier available.
        *   **Cloudflare Pages:** Global CDN, generous free tier.
        *   **GitHub Pages:** Free hosting directly from a GitHub repository (good for simple projects).
        *   **AWS S3 + CloudFront / Google Cloud Storage + CDN:** More manual setup but highly scalable.
    *   *Assumption:* Using Vercel or Netlify due to ease of use.

4.  **Deploy Application:**
    *   **Method 1: Manual Upload (Simple):**
        *   Upload the contents of the `dist/` directory to the chosen hosting provider via their web UI or CLI tool.
    *   **Method 2: Git Integration / CI/CD (Recommended):**
        *   Connect your Git repository (GitHub, GitLab, Bitbucket) to the hosting platform (Vercel/Netlify).
        *   Configure the build settings on the platform:
            *   **Build Command:** `npm run build`
            *   **Publish Directory:** `dist`
            *   **Node.js Version:** Specify if needed.
        *   Configure **Environment Variables** on the platform for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using your production keys.
        *   Pushing to the main branch (or a specified production branch) will automatically trigger a build and deployment.

5.  **Configure Domain Name (Optional):**
    *   If using a custom domain, follow the hosting provider's instructions to add the domain and configure DNS records (usually CNAME or A records) with your domain registrar.

6.  **Post-Deployment Verification:**
    *   Access the live application URL provided by the hosting platform (or your custom domain).
    *   Perform critical path testing on the live site:
        *   Map loads correctly.
        *   Data is fetched from production Supabase.
        *   Authentication works (Login, Register, Logout).
        *   Filtering/Search functions correctly.
        *   Static pages are accessible.
        *   Check browser console for any errors.
        *   Test responsiveness on different devices/browsers again.

7.  **Documentation:**
    *   Update the project's README with deployment instructions and the live URL.

8.  **Commit Final Changes:**
    *   Commit any configuration files related to deployment (e.g., `vercel.json`, `netlify.toml` if used). `git add . && git commit -m "Build: Configure and deploy application"`

---

## Phase 11: Optimizations, Considerations & Future Enhancements

**Goal:** Identify areas for performance improvement, potential refactoring, security hardening, and future feature development to ensure the long-term health and success of the application.

**Areas to Consider:**

1.  **Performance Optimization:**
    *   **Data Fetching:**
        *   **Pagination:** If the number of locations grows large, implement pagination for Supabase queries (`.range(from, to)`) instead of fetching all locations at once. Update the UI (list/table) to handle loading more data.
        *   **Map Bounds Loading:** Fetch only the markers visible within the current map viewport bounds. Re-fetch when the map view changes significantly (pan/zoom). This requires passing map bounds to the Supabase query (potentially using PostGIS functions like `ST_MakeEnvelope` and `ST_Intersects`).
        *   **Selective Loading:** Only `select()` the specific columns needed from Supabase tables to reduce data transfer.
        *   **Caching:** Implement client-side caching for frequently accessed, less dynamic data (e.g., categories, city lists) using `localStorage` or state management libraries with persistence. Consider server-side caching if using Edge Functions.
    *   **Rendering:**
        *   **Memoization:** Use `React.memo` for components that re-render unnecessarily. Apply `useMemo` and `useCallback` judiciously to prevent expensive calculations or unnecessary function recreations passed as props. Be mindful of profiling before over-optimizing.
        *   **Virtualization:** For potentially very long lists/tables (`CityTable`), consider using virtualization libraries (e.g., `react-window`, `react-virtualized`) to render only the visible items.
    *   **Bundle Size:**
        *   Regularly analyze the production bundle size (e.g., using `vite-plugin-visualizer`). Identify large dependencies or chunks and explore alternatives or code-splitting strategies if needed (though Vite handles splitting well by default).
    *   **Image Optimization:** Ensure images uploaded (e.g., for locations) are appropriately sized and compressed. Use modern formats (WebP). Implement lazy loading for images in lists/cards. Consider using Supabase Storage transformations.
    *   **Debounce/Throttle:** Ensure expensive operations triggered by user input (search, radius slider changes) are debounced or throttled to limit the frequency of data fetching or re-rendering.

2.  **Scalability:**
    *   **Database Indexing:** Ensure appropriate indexes are created on Supabase tables for columns frequently used in `WHERE` clauses, `JOIN` conditions, or `ORDER BY` clauses (e.g., `location_id` in `comments`, `category` in `locations`, potentially spatial indexes if using PostGIS).
    *   **RLS Policy Efficiency:** Review RLS policies to ensure they don't cause performance bottlenecks on large tables. Avoid complex subqueries within policies if possible.
    *   **Supabase Edge Functions:** For complex backend logic, data validation, or integrations that shouldn't run client-side, consider using Supabase Edge Functions (Deno-based serverless functions).
    *   **Load Testing:** If high traffic is anticipated, perform load testing (e.g., using k6) against the Supabase backend and potentially the frontend hosting to identify bottlenecks.

3.  **Code Quality & Maintainability:**
    *   **TypeScript Strictness:** Enable stricter TypeScript compiler options (`strict: true` in `tsconfig.json`) for better type safety. Define clear types for all data structures (`src/types/index.ts`).
    *   **Modularity:** Keep components focused and reusable. Break down large components. Ensure clear separation of concerns (UI, state management, data fetching).
    *   **Dependency Management:** Regularly update dependencies (`npm update`) and address breaking changes or security vulnerabilities (`npm audit`).
    *   **Code Style:** Enforce consistent code style using ESLint and Prettier. Integrate checks into CI/CD pipelines.
    *   **Documentation:** Maintain clear code comments for complex logic. Keep the README updated with setup, development, testing, and deployment instructions. Document the database schema and RLS policies.

4.  **Potential Feature Enhancements / Changes:**
    *   **Advanced Filtering/Sorting:** Add options to filter by category, opening hours, ratings, etc. Allow sorting results by distance, name, date added.
    *   **User Ratings/Reviews:** Implement a rating system alongside comments.
    *   **Real-time Updates:** Use Supabase Realtime subscriptions to show new locations or comments appearing without requiring a manual refresh.
    *   **Offline Support / PWA:** Leverage the existing `public/sw.js` (Service Worker) to implement Progressive Web App features like offline data caching (e.g., for visited locations) or installability.
    *   **Improved Map Interactions:** Add features like drawing search areas on the map, getting directions (integrating with external APIs), or different map layer options.
    *   **Admin Panel/Moderation:** Create a separate interface (or protected routes) for administrators to manage locations, users, and comments.
    *   **Internationalization (i18n):** Abstract text strings into resource files to support multiple languages (libraries like `i18next` or `react-intl`). Note: The original code has German text.
    *   **Routing Library:** Replace the custom `window.location.pathname` routing with a standard library like `react-router-dom` for more robust handling of nested routes, route parameters, and programmatic navigation.

5.  **Security Considerations:**
    *   **RLS Thoroughness:** Continuously review and test RLS policies to ensure they correctly enforce data access rules, especially as new features are added.
    *   **Input Validation:** Sanitize and validate all user input on the client-side and *especially* server-side (if using Edge Functions) to prevent injection attacks (XSS, SQL injection - though Supabase client libraries help prevent SQLi).
    *   **Rate Limiting:** If abuse (e.g., excessive commenting, location adding) is a concern, implement rate limiting (potentially via Edge Functions or an API gateway).
    *   **Environment Variable Security:** Ensure production keys/secrets are never exposed in client-side code and are managed securely in the deployment environment.

6.  **UX/UI Improvements:**
    *   **Loading States:** Implement more granular or skeleton loading states for a smoother perceived performance.
    *   **Error Handling:** Provide user-friendly error messages and potential recovery actions for both client-side and server-side errors.
    *   **Accessibility (A11y):** Conduct thorough accessibility audits and address issues beyond the basics covered in Phase 8.

---
