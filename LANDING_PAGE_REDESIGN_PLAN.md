# Landing Page Redesign Plan: Meet and Eat

**Objective:** Redesign the existing landing page (`src/components/Pages/AboutPage.tsx`) to be visually bold and engaging, incorporating parallax and scroll-triggered animations to enhance the user experience and convey the feeling of connection and discovery. The navigation link in the header should also be updated from "About" to "Home".

**Target Audience:** Travelers seeking social dining experiences to combat loneliness and connect with locals/other travelers.

---

## Phase 1: Planning & Design Concept

1.  **Goal:** Redesign `src/components/Pages/AboutPage.tsx` for a bold, engaging feel with parallax/scroll animations.
2.  **Visual Style:**
    *   **Typography:** Large, impactful sans-serif headlines; clear, readable body text.
    *   **Color Palette:** Vibrant, warm colors (inspired by food, cultures, destinations) contrasted with clean light backgrounds.
    *   **Imagery:** High-quality, emotionally resonant photos/illustrations of diverse people sharing meals.
    *   **Layout:** Asymmetrical layouts, overlapping elements, dynamic grids.
3.  **Animations & Interactivity:**
    *   **Parallax:** Apply to backgrounds/decorative elements (Hero, Gallery) for depth.
    *   **Scroll-Triggered Animations:** Fade/slide/scale elements into view on scroll (text, images, cards).
    *   **Hover Effects:** Subtle, engaging hover animations for buttons/cards (scaling, color transitions, icon movements).
4.  **Technology Recommendation:**
    *   **Framer Motion:** ([https://www.framer.com/motion/](https://www.framer.com/motion/)) for React integration, scroll animations, parallax, and transitions.

---

## Phase 2: Implementation Strategy

1.  **Component Refactoring (`AboutPage.tsx`):**
    *   Break down into smaller section components (e.g., `HeroSection`, `FeaturesSection`, `HowItWorksSection`, etc.).
2.  **Styling Enhancements (Tailwind CSS):**
    *   Update `tailwind.config.js` with the new color palette/custom styles if needed.
    *   Apply new styles to refactored components.
3.  **Animation Implementation (Framer Motion):**
    *   Install: `npm install framer-motion` / `yarn add framer-motion`.
    *   Wrap elements with `motion` components.
    *   Define animation variants (initial, animate, hover).
    *   Use hooks like `useScroll`, `useTransform` for parallax.
    *   Use props like `whileInView` for scroll triggers.
4.  **Header Link Update (`Header.tsx`):**
    *   Modify the `<a>` tag text for the `/about` link from "About" to "Home". Keep `href` and `onClick` as is.

---

## Phase 3: Testing & Refinement

1.  **Cross-Browser/Device Testing:** Ensure compatibility and smoothness.
2.  **Performance Check:** Optimize animations for performance.
3.  **User Feedback:** Gather feedback (if possible).

---

## Mermaid Diagram: High-Level Structure & Animation

```mermaid
graph TD
    A[AboutPage (Becomes Home Page View)] --> B(Header: Link "About" -> "Home");
    A --> C{Refactored Sections};
    C --> D[HeroSection];
    C --> E[FeaturesSection];
    C --> F[HowItWorksSection];
    C --> G[GallerySection];
    C --> H[TestimonialsSection];
    C --> I[FAQSection];
    C --> J[CTASection];

    subgraph Animations (Framer Motion)
        D -- Parallax Background & Text Fade-in --> K((Scroll/Load Trigger));
        E -- Staggered Card Slide-in --> L((Scroll Trigger));
        F -- Step Animations --> L;
        G -- Image Hover Effects & Parallax Layer --> M((Scroll/Hover Trigger));
        H -- Card Fade-in --> L;
        J -- Button/Text Animation --> K;
    end

    style K fill:#f9f,stroke:#333,stroke-width:2px
    style L fill:#ccf,stroke:#333,stroke-width:2px
    style M fill:#9cf,stroke:#333,stroke-width:2px
```

---

## Summary of Changes:

1.  Redesign `src/components/Pages/AboutPage.tsx` (bold, interactive style, Framer Motion animations).
2.  Refactor `AboutPage.tsx` into section components.
3.  Update styles (Tailwind CSS).
4.  Modify `src/components/Layout/Header.tsx` link text ("About" -> "Home").