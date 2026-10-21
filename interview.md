# ShopSphere Frontend — React Interview Preparation

> **How to use this guide:** Be ready to explain the code that exists, then discuss trade-offs and a sensible next step. Do not claim that a library or feature is implemented just because it appears in `package.json`.

## 1. Executive summary

### Project purpose

ShopSphere is a client-side e-commerce storefront and admin console built with React 18, TypeScript, Vite, and React Router 6. Customers can browse/search/filter products, register and sign in, manage a cart and wishlist, check out with a saved delivery address and payment choice, and track orders. Admins can manage products/categories and move orders through allowed statuses.

The UI copy and sample catalog labels lean toward fashion/apparel, while several page descriptions still mention hardware. Describe it accurately in an interview as an e-commerce frontend, and note the content inconsistency as polish work rather than a domain distinction.

### Architecture

- **Entry/build:** `src/main.tsx` mounts the app inside `React.StrictMode`; Vite provides development server, proxy, and production bundling.
- **Composition/routing:** `src/App.tsx` nests theme, auth, cart, and wishlist providers around a `BrowserRouter`. Routes are grouped into a customer storefront layout and a separate admin console. Page modules use `React.lazy` and a shared `Suspense` fallback.
- **Shared state:** Four focused React Context providers own session, cart, wishlist, and theme behavior. Page-local state handles transient UI such as loading/errors, filters, modal visibility, and form values.
- **Backend boundary:** `src/api/` contains typed Axios service functions and shared DTO/domain interfaces. `axiosClient.ts` centralizes the base URL, bearer-token attachment, and normalized errors.
- **Presentation:** Reusable UI pieces live in `src/components/`; pages compose these with utility formatting and Tailwind/CSS design tokens.

### Typical customer flow

1. Browse the home page or `/products`; catalogue query parameters represent search, category, price range, stock, sort, and page.
2. Open `/products/:id`, inspect details/reviews, select quantity, then add to cart or wishlist. Guests are sent to login with a return destination.
3. Sign in. The session is stored in `localStorage`, restored on app startup, and an expiry timer logs out the user.
4. Review cart; quantity changes are optimistic and roll back on API failure. Checkout requires available items and a delivery address.
5. Create an order with the selected address/payment method; on success refresh cart state and navigate to `/orders/:orderId`.
6. Track status or cancel eligible orders; a customer can review a product after the backend permits it.

### Key features

- Public catalogue, URL-synced filters, debounced keyword search, sort, and server pagination.
- Customer/admin/guest route behavior and role-aware navigation.
- Session restore and timed auto-logout.
- Cart quantity optimistic update/rollback; wishlist optimistic add/remove.
- Address collection, checkout, error-specific payment/order responses, and order tracking.
- Product reviews and admin CRUD/order status management.
- Light/dark theme persistence, loading skeletons, empty/error states, toasts, and responsive layouts.

## 2. Folder structure

| Path | Why it exists | Interview angle |
|---|---|---|
| `src/` | Application source | How do responsibilities flow from entry to route to data layer? |
| `src/main.tsx` | React DOM entry point; imports global tokens and enables Strict Mode | What does Strict Mode do in development? Why use `createRoot`? |
| `src/App.tsx` | Provider composition, lazy page imports, route tree and fallbacks | How are route guards and code splitting organized? |
| `src/api/` | Axios client, per-domain endpoint modules, DTOs, and shared response types | Why keep HTTP details outside components? How are errors normalized? |
| `src/components/` | Reusable layouts, cards, guards, stepper, modals, states, and small controls | What belongs in a shared component versus a page? |
| `src/context/` | Auth, cart, wishlist, and theme providers with hooks | Why Context here; how would you limit context-driven renders? |
| `src/pages/` | Route-level storefront and admin screens | How does a page coordinate UI state and API state? |
| `src/styles/` | CSS custom-property theme tokens and Tailwind base imports | How does the theme flow into utility classes? |
| `src/utils/` | Reusable formatting functions for currency and dates | Why centralize formatting? How would locale support evolve? |
| `diagrams/` | SVG/PNG architecture, data-flow, use-case, and domain diagrams | Which diagram best communicates a cross-layer workflow? |
| Root config/docs | Vite, TypeScript, Tailwind/PostCSS, requirements/API contract and service docs | How do dev proxy and production API base URL differ? |

## 3. Component and page analysis

### App shell and shared components

| Component | Purpose / props | State, hooks, and APIs | Likely question → concise answer |
|---|---|---|---|
| `App` | Provider tree and route declarations; no props | `lazy`, `Suspense`, Router components; no direct API | **Why lazy pages?** Split route code into chunks and fetch a page chunk when needed; the suspense fallback covers loading. |
| `Layout` | Storefront header, outlet, footer, toaster | `useLocation`, `useEffect` scroll-to-top; no API | **Why an Outlet?** It renders matched child routes inside a shared shell without duplicating layout. |
| `AdminLayout` | Admin sidebar/header around `children: ReactNode` | `useAuth`, location/navigation, scroll effect; logout uses auth context | **Why separate layout?** Admin navigation and visual hierarchy differ from storefront and are applied only to admin routes. |
| `Header` | Global nav/search, cart/wishlist indicators and profile actions; no props | Search/dropdown state; refs for click-away and Ctrl/Cmd+K; `useAuth`, `useCart`, `useWishlist`; logout via context | **Why use refs?** To focus the search input and test outside-click containment without rerendering on every ref update. |
| `ProtectedRoute` | Renders `children` for signed-in users | Auth/loading context and current location; no API | **How does it preserve destination?** Redirect includes the current path/query in router state so login can return afterward. |
| `AdminRoute` | Requires authenticated admin role | Auth context, loading and location | **Is this security?** It is a UX gate only; backend endpoints must independently authorize every request. |
| `GuestRoute` | Redirects signed-in users away from login/register | Auth state and location state | **Why wait for loading?** Avoid redirecting before a persisted session has been restored. |
| `ProductCard` | Shows product information; prop: `product: Product` | Local image fallback/adding state; auth/cart/wishlist hooks; cart and wishlist APIs through contexts | **How are guest actions handled?** Add/wishlist actions navigate to login with the current path; stock checks prevent adding unavailable items. |
| `ConfirmModal` | Reusable accessible confirmation; props include open/title/message/labels/variant/loading/callbacks | `useRef`, keyboard effect; no API | **What accessibility behavior exists?** Dialog role, modal semantics, labelled title, Escape-to-close. A focus trap/restore would be a useful enhancement. |
| `QuantityStepper` | Controlled quantity input; `value`, optional min/max/disabled, `onChange` | No local state or API | **Why controlled?** The parent remains the source of truth and can apply stock limits or persist changes. |
| `OrderStepper` / `OrderStatusBadge` | Presentational order status progress and badge; status prop | No local state/API; maps enum status to UI | **Where should transitions be enforced?** Both UI and, authoritatively, the backend. |
| `StarRating` | Static or interactive star rating; rating/max/interactive/size/onChange props | No local state/API | **How does interaction work?** It reports a selected rating through a callback; the owning form stores it. |
| `EmptyState`, `ErrorState`, `Skeletons` | Shared empty, retryable-error and loading presentations | Props only; no API | **Why standardize?** Consistent async states reduce duplicated markup and improve UX consistency. |
| `ThemeToggle` | Theme switch button | `useTheme`; provider persists preference | **Where is theme applied?** Provider updates root dataset/class; CSS variables switch token values. |
| `Footer` | Footer links and newsletter-like UI | Controlled email state; success toast only; no subscription API call | **Is the subscribe form integrated?** No; it is currently a client-side acknowledgement/demo interaction. |

### Pages

| Page | Purpose and important props | State/hooks/API interactions | Interview questions and model answers |
|---|---|---|---|
| `Home` | Landing page with featured/entry paths; no props | Local product/category/loading/error state; `Promise.all` loads categories and eight newest products; composes cards/skeletons | **Why `Promise.all`?** The two independent startup requests run concurrently, and the page currently handles either request failing through one shared error state. |
| `Catalogue` | Search/filter/sort/paginate products; no props | URL query state plus local input/loading/error/data/categories; `useSearchParams`, `useEffect`, `useMemo`; category/product APIs; 400 ms keyword debounce | **Why URL-backed filters?** Shareable, reloadable, navigable state. **What is the fetch lifecycle?** Query params drive an effect; it sets loading/error, calls the API, then renders skeleton/error/empty/results. |
| `ProductDetail` | Product detail, gallery, cart/wishlist and review actions; product ID from route | Product and review data/loading/errors, quantity, image, review form/edit/delete state; `useParams`, `useMemo`, effects; products/reviews APIs plus cart/wishlist contexts | **Why load product and reviews separately?** They have independent loading/error states and can succeed/fail independently. **What is memoized?** Rating distribution derived from review data. |
| `Login` | Sign-in page; no props | Email/password/error/submitting local state; auth context login; location state for email/return path; routes by customer/admin role | **What happens after login?** Admin goes to `/admin/products`; customer returns to prior route or `/`. |
| `Register` | Customer account creation; no props | Controlled fields, field errors, submitting; password checklist via `useMemo`; users API; 409 and server field errors mapped to UI | **How is validation implemented?** Browser required/type constraints plus explicit client checks; server remains authoritative. It does not use Zod/RHF in current component. |
| `Cart` | Cart item review, remove/clear, quantity changes; no props | Context cart/loading and local confirmation state; cart API via context | **Where does optimistic behavior live?** In CartContext, so all cart consumers see the same update and rollback. |
| `Wishlist` | View/remove saved products and move one to cart; no props | Wishlist context plus item-removal/moving state; wishlist/cart APIs via context | **Why refresh cart after move?** Keep global cart badge and cart page consistent with server state. |
| `Checkout` | Select address/payment and create order; no props | Addresses, selected address/payment, inline address form/errors, submission state; users/orders APIs and cart context | **How are failure responses handled?** 402 payment failure stays on page; 400 offers cart correction; 503 offers retry; other errors show a general banner. |
| `Orders` | Customer order history with pagination; no props | Page/data/loading/error; orders API | **What does `last` mean?** Server-provided pagination signal used to disable Next. |
| `OrderDetail` | Single order, progress, cancel flow; `orderId` from route | Order/loading/error/cancel modal/submitting state; orders API | **When can a customer cancel?** UI allows PENDING or CONFIRMED; backend must check actual eligibility. |
| `AdminProducts` | Product and category CRUD; no props | Tab, paginated/search products, categories, form/modal/delete/loading/error state; `useCallback`; products/categories APIs | **Why keep numeric inputs as strings?** Native input values are strings; parse and validate at submit before building a typed DTO. |
| `AdminOrders` | Paginated admin orders and status update confirmation; no props | Page/data/loading/error/update target; `useCallback`; orders API | **How are valid transitions represented?** A status-to-next-status map controls UI options; server should validate transitions too. |

### Contexts and public hooks

- **`AuthContext`:** `session`, derived role/auth flags, startup `loading`, `login`, `logout`, `updateFirstName`. Restores a JSON session from `localStorage`, checks expiry, schedules auto-logout with a ref-held timer, and exposes `useAuth`.
- **`CartContext`:** cart, count, loading, refresh and mutation methods. Loads for customers, handles quantity optimistically, rolls back on failure, and exposes `useCart`.
- **`WishlistContext`:** server wishlist plus a `Set<number>` for quick optimistic membership checks; add/remove failures revert the set. `moveToCart` removes from wishlist and refreshes cart. Exposes `useWishlist`.
- **`ThemeContext`:** reads saved preference or system preference, applies root theme attributes/classes, persists changes, exposes `useTheme`.
- The custom hooks throw when their context is absent. This fails fast and gives a clearer provider-wiring error than returning a fabricated default.

## 4. React topics evidenced by the code

| Topic | What this project actually does | Why / alternatives / likely interview answer |
|---|---|---|
| `useState` | Form fields, modal visibility, remote data/loading/error state, card image/add state | Appropriate for local or provider state. Use a reducer when a form/state machine has many coupled transitions. |
| `useEffect` | Initial data loads, session restore, timers, title/scroll updates, subscriptions/listeners, theme DOM sync | Effects synchronize React with external systems. Include complete dependencies and cleanup timers/listeners. Prefer event handlers for user-triggered effects. |
| `useMemo` | Password-rule checks, selected category lookup, rating distribution | Memoizes derived calculations only when helpful; it is not required for correctness. Simple calculations may be clearer without it. |
| `useCallback` | Stable cart refresh/wishlist methods and admin loaders used by effects/consumers | Stabilizes function identity when it matters. It does not automatically make the function faster; stable deps and memoized consumers are needed to observe render benefits. |
| Context API | Auth, cart, wishlist, theme | Simple built-in shared state with no extra dependency. Trade-off: consumers can rerender when provider `value` identity changes. Split contexts, memoize values, or move high-frequency state to a store if profiling supports it. |
| Redux / Zustand | **Not used** | Don’t claim it. Could be introduced for complex cross-feature workflows, middleware/devtools, or selective subscriptions; Context currently matches app scale. |
| React Query / TanStack Query | **Not used** | The pages manually own server data and loading/error states. Query caching, deduplication, invalidation, retries and background refresh are potential improvements; manual effects are the current implementation. |
| Routing | React Router DOM v6, `BrowserRouter`, nested routes, `Outlet`, params, search params, state and redirects | Clean route-level rendering; use `Link`/`navigate` for SPA navigation. Guard components handle UX and destination continuity. |
| Lazy loading | `React.lazy(() => import(...))` for each route page; one `Suspense` fallback | Reduces initial route bundle by chunking pages. Consider route-level error boundaries for failed chunk loads and measure chunk sizes. |
| Error boundaries | **No React error boundary found** | Axios errors are caught as async errors; they are not render errors. Add an error boundary around route/layout segments for render exceptions and a recovery UI. |
| Forms | Controlled React inputs and submit handlers in Register/Login/Checkout/admin pages | Direct state is explicit and fine for current forms. `react-hook-form` and `zod` dependencies exist but are not used in the inspected `src` code. |
| Validation | Inline regex/length/range checks, native `required`/input types, API field errors | Keep client validation for fast feedback, but backend validation is authoritative. Zod schema can centralize reusable rules and type inference; RHF can reduce rerenders for large forms. |
| Reconciliation / keys | List renders generally use IDs (`product.id`, `orderId`, `itemId`) | Stable keys let React preserve item identity; avoid array indexes if a list can reorder or delete. |
| Strict Mode | `main.tsx` wraps the app in `React.StrictMode` | Development checks may expose non-idempotent effects by rerunning setup/cleanup. It does not double-run production rendering the same way. |

## 5. 100 project-specific interview questions

### Easy (1–35)

1. **What is ShopSphere?** — A React/TypeScript e-commerce frontend with customer shopping flows and a role-protected admin console.
2. **Which build tool is used?** — Vite, with `@vitejs/plugin-react`.
3. **Which React version is declared?** — React 18.3.
4. **What mounts the React app?** — `src/main.tsx` calls `createRoot` on the `#root` element.
5. **Why is the app wrapped in StrictMode?** — To surface unsafe patterns and effect lifecycle issues during development.
6. **Which router is used?** — React Router DOM v6.
7. **Where are routes declared?** — In `src/App.tsx`.
8. **What does `Outlet` do here?** — Renders nested storefront routes inside the shared `Layout`.
9. **Name four shared contexts.** — Auth, cart, wishlist, and theme.
10. **Where are endpoint calls organized?** — Domain modules in `src/api/`.
11. **What does `axiosClient` centralize?** — Base URL, request authorization, and response error normalization.
12. **What type describes a product?** — `Product` in `src/api/types.ts`.
13. **How does a product detail page get its ID?** — `useParams()` reads the `:id` route segment.
14. **How does the catalogue preserve search filters?** — In URL query parameters via `useSearchParams`.
15. **What page size does the catalogue request?** — 12 products.
16. **How is catalogue keyword input debounced?** — A 400 ms timeout in an effect, cleared on dependency change/unmount.
17. **How do users see data loading?** — Skeletons/spinners and explicit loading state.
18. **How does the app render an empty result?** — Reusable `EmptyState`.
19. **How are retryable page errors presented?** — `ErrorState` receives a message and retry handler.
20. **How is currency formatted?** — `Intl.NumberFormat` using `en-IN` and INR.
21. **How is a date formatted?** — `formatDate` parses the value and builds a local display string.
22. **What roles are modeled?** — `CUSTOMER` and `ADMIN`.
23. **What does `ProtectedRoute` guard?** — Authentication-required customer routes.
24. **What does `AdminRoute` add?** — A role check after authentication/loading.
25. **What is a guest-only route?** — Login/register redirect authenticated users away.
26. **Where does the theme preference persist?** — `localStorage` under `shopsphere.theme`.
27. **What does `ProductCard` receive?** — A single typed `product` prop.
28. **What does `QuantityStepper` receive?** — A controlled value, bounds/disabled flags, and `onChange`.
29. **What API is called to fetch product detail?** — `productsApi.getProductById(id)`.
30. **Where is the cart badge count sourced?** — `CartContext.itemCount`.
31. **Where does the wishlist heart look up membership?** — A `Set<number>` in `WishlistContext`.
32. **Does the footer subscription call a server?** — No; it currently shows a success toast and clears the field.
33. **What style system is configured?** — Tailwind CSS with CSS custom-property tokens.
34. **Where is Vite’s local API proxy configured?** — `vite.config.ts`, for `/api`, defaulting to `localhost:8080`.
35. **What are common page states?** — Data, loading, error, empty, plus transient form/modal state.

### Medium (36–75)

36. **Why separate API modules from pages?** — Reuse endpoint logic, centralize transport details, and keep UI components focused on rendering/workflow.
37. **How does login construct a session?** — It maps the API response into a typed session and computes `expiresAt` from `expiresIn`.
38. **How is session restoration performed?** — Auth provider reads/parses local storage on mount, validates expiry, updates state, and clears loading.
39. **How does auto-logout work?** — A timeout scheduled for `expiresAt` clears stored session/state and redirects to login.
40. **Why store the timer in a ref?** — Timer ID is mutable lifecycle data that should persist without causing renders.
41. **What happens on non-login 401 responses?** — The Axios interceptor clears the saved session, shows an expiry message, redirects to login, and rejects a normalized error.
42. **Why skip 401 global logout for the login endpoint?** — Invalid credentials should be shown as a login error, not treated as an expired authenticated session.
43. **What does the request interceptor do?** — Reads the session and adds its token as a bearer authorization header.
44. **How are network errors normalized?** — No-response errors are rejected with a typed error and a server-reachability message.
45. **How is role-based post-login navigation decided?** — Admins navigate to `/admin/products`; customers return to the preserved `from` path or `/`.
46. **How does a guest continue to the page they requested?** — Protected routes place the path in navigation state; login consumes that state.
47. **Why use URL parameters for catalogue filters?** — They survive refresh, are linkable, and integrate naturally with browser navigation.
48. **Why separate keyword input from keyword query state?** — Local input can update immediately while URL/API updates are debounced.
49. **How does pagination reset when filters change?** — Filter update handlers set `page: 0`.
50. **What does `useMemo` do in Catalogue?** — Derives the selected category from loaded categories and category ID.
51. **What happens if category fetch fails in Catalogue?** — The current categories effect silently catches; a more robust design would expose an error or retry, not hide it.
52. **How is the password checklist derived?** — `useMemo` evaluates length, upper/lowercase, digit, and special-character rules when password changes.
53. **How are registration server conflicts handled?** — A 409 is mapped to an email field error; server field errors are displayed; other errors toast.
54. **What validation is used for phone number?** — Digits-only controlled input and exactly ten digits on submit.
55. **What client-side rules apply to checkout pincode?** — Exactly six digits; server still validates the address.
56. **How does checkout prevent invalid cart progression?** — It redirects empty carts and carts with unavailable items back to cart.
57. **How does checkout preselect an address?** — It prefers the default address, otherwise the first returned address.
58. **How does checkout place an order?** — Sends `addressId` and payment method to `ordersApi.createOrder`.
59. **What does the UI do after order success?** — Refreshes cart context and navigates to the new order detail route.
60. **What does a 402 mean in this checkout implementation?** — Simulated payment failure; show a banner and keep checkout visible.
61. **How does cart quantity update feel immediate?** — The context computes optimistic items/subtotal/count before awaiting the server.
62. **How does cart quantity failure recover?** — Restores the previous items and displays an error toast.
63. **How is wishlist membership represented?** — As a numeric `Set`, supporting constant-time `has` checks for product IDs.
64. **Why keep wishlist optimistic IDs separate from fetched wishlist?** — For immediate heart feedback while network mutation is pending.
65. **What happens if adding a wishlist item returns 409?** — API helper fetches and returns the current wishlist.
66. **How do product reviews get refreshed after mutation?** — Successful create/update/delete calls `loadReviews()` again.
67. **What is the review permission model in UI?** — Customer checks gate review creation; API 403 and 409 responses explain backend eligibility/duplicate cases.
68. **How are admin order transitions constrained in the UI?** — `STATUS_TRANSITIONS` maps each status to allowed next statuses.
69. **Why confirm admin order updates?** — The page captures target order/new status, then performs mutation only after confirmation.
70. **How are admin products/categories edited?** — Forms are populated from selected records, parsed into typed DTOs, then sent via create/update APIs.
71. **What is controlled form state?** — React state drives the input value; events update state; the DOM is not the source of truth.
72. **Are React Hook Form and Zod used?** — They are dependencies, but the inspected app uses controlled fields/manual validation rather than those libraries.
73. **Is React Query used?** — No; pages/context perform fetches manually.
74. **What does `React.lazy` accomplish?** — Defers loading page components until their import is requested.
75. **What does `Suspense` provide here?** — A shared visual fallback while a lazy page chunk is loading.

### Hard (76–100)

76. **Why might provider consumers rerender unnecessarily?** — Provider values are object literals recreated on renders; Context compares values by identity. Split/memoize values or profile before optimizing.
77. **How would you prevent stale responses when users type quickly in search?** — Cancel Axios requests with `AbortController`/signal or track request IDs; ensure only the latest response commits.
78. **What is a StrictMode issue to check in initial loading effects?** — In development, setup can run again; requests should tolerate duplicate starts and clean up subscriptions/timers.
79. **What is a race in optimistic cart updates?** — Multiple concurrent updates can resolve out of order or roll back over newer state. Serialize per item or reconcile by mutation ID/server response.
80. **What correctness concern exists in cart rollback?** — It snapshots the whole prior cart; a concurrent update may be overwritten. Use functional state updates and mutation-aware rollback.
81. **What could be improved about auth error synchronization?** — The Axios interceptor removes local storage, but AuthContext state is not directly cleared there. Centralize session expiry notification so UI state and storage remain aligned.
82. **Why is localStorage token storage a trade-off?** — It survives reloads but JavaScript can read it, so XSS can expose it. Consider HttpOnly secure cookies with CSRF protections when backend architecture supports them.
83. **Can client route guards secure admin APIs?** — No. They only improve navigation/UX; backend must authenticate and authorize each resource/action.
84. **How do you distinguish a React error boundary from an Axios catch?** — Boundaries catch render/lifecycle descendant exceptions; promise rejections need explicit catches or query error state.
85. **How would you add a route-level error boundary?** — Implement a class boundary or router errorElement, wrap route segments, log/report errors, and offer retry/navigation.
86. **How would React Query improve this app?** — Query keys for product filters, cart, wishlist, and orders; automatic caching/deduplication; mutation invalidation; background refresh and consistent loading/error state.
87. **What query key suits catalogue filters?** — A stable key such as `['products', normalizedFilters]`, with normalized primitive values and page included.
88. **How would you handle stale product detail when route ID changes quickly?** — Abort prior request or guard commit with request identity; reset loading/error and avoid writing old product data for the new ID.
89. **Why is `useMemo` not automatically a performance win?** — It adds dependency bookkeeping and complexity; for cheap checks it may cost more than recomputing. Measure and memoize expensive derivations or referential dependencies.
90. **When is `useCallback` useful here?** — When a stable callback is a meaningful dependency or passed to a memoized child; otherwise it is unnecessary ceremony.
91. **How could product grids scale to many thousands of items?** — Keep server pagination, tune page size, virtualize rows/cards, use responsive image sizing and lazy images, and measure rendering/network costs.
92. **How would you analyze the production bundle?** — Run Vite build with bundle visualizer or inspect emitted chunks; identify large dependencies and route chunks, then remove/split only measured bottlenecks.
93. **What is code splitting’s downside?** — More chunk requests and a possible delay when navigating to a not-yet-loaded route; prefetch likely routes and show robust fallbacks.
94. **How would you improve accessibility of ConfirmModal?** — Focus trap, initial focus, focus restoration, Escape behavior, correct button labels, and test keyboard/screen-reader interaction.
95. **What is a backend consistency issue after moving wishlist item to cart?** — The mutation crosses two domain resources; ideally it is atomic server-side, and client refreshes both cart and wishlist on success.
96. **How would you handle session expiry across multiple browser tabs?** — Listen for the `storage` event or use a shared auth mechanism; clear context state and redirect consistently.
97. **How would you reduce duplicated data-fetching state?** — Extract typed hooks or adopt TanStack Query; keep truly transient presentation state local.
98. **How should API errors be typed without unsafe casts?** — Use Axios error type guards and a normalizer returning a discriminated `ApiError`; avoid `any` and validate unknown response payloads.
99. **What belongs in URL state versus Context?** — Shareable navigable filters belong in the URL; session/theme/cart/wishlist are cross-route shared state; modal/input state is usually local.
100. **What is the strongest architectural improvement you would make first?** — Add a consistent server-state layer (or typed query hooks), including cancellation/cache/invalidation and explicit errors, while keeping Context for client-wide session/theme and potentially cart coordination.

## 6. JavaScript questions grounded in this codebase

1. **What is a closure?** — A function retains access to lexical variables from its creation scope. Event handlers and effect callbacks close over component values; dependencies ensure effects see current values.
2. **Why can a stale closure happen in an effect?** — An omitted dependency leaves the callback with values from an earlier render. Include dependencies, use functional state setters, or restructure the effect.
3. **What does `async` return?** — Always a Promise; returning a value resolves it, and throwing rejects it.
4. **How does `await` behave on rejection?** — It throws at that point, so `try/catch/finally` can handle errors and cleanup flags.
5. **What is the event loop?** — JS runs synchronous work on the call stack; queued microtasks (Promise reactions) run before the next task such as a timer callback.
6. **Promise vs `setTimeout(..., 0)` order?** — After current synchronous code, a resolved Promise callback generally runs as a microtask before the timer task.
7. **What does `Promise.all` do?** — Runs independent promises concurrently and rejects when any rejects; useful for parallel product/review loads if they share one combined error boundary.
8. **What does `Promise.allSettled` add?** — Reports each result independently; useful when independent widgets should succeed/fail separately.
9. **Explain `map`, `filter`, and `reduce` used here.** — `map` renders/transforms lists, `filter` selects records, and `reduce` aggregates line totals/counts.
10. **Why use `Set` for wishlist IDs?** — Unique values and average constant-time membership lookup; clone it before updating React state to preserve immutability.
11. **What does optional chaining do?** — Stops access if a preceding value is nullish, such as `session?.role`.
12. **What is nullish coalescing?** — `a ?? b` uses `b` only for null/undefined, unlike `||`, which also replaces `0`, `false`, and `''`.
13. **Why use `Number(...)` or `parseInt` at form boundaries?** — DOM input values are strings; convert and validate before sending numeric DTO properties.
14. **What is the difference between `==` and `===`?** — Strict equality avoids coercion; use it unless coercion is intentional.
15. **What is hoisting?** — Declarations are processed before execution; `var` is initialized to undefined, `let`/`const` are in a temporal dead zone, and function declarations can be called before their source line.
16. **Lexical scope vs global scope?** — Lexical scope is determined by source nesting; block-scoped `let`/`const` avoid leaking temporary values outside blocks.
17. **What are destructuring and spread used for?** — Extract selected fields and create shallow copies, e.g. `{ ...session, firstName }` without mutating the old object.
18. **Why avoid mutating arrays in state?** — React relies on identity changes; create a new array/object so updates are observable and previous snapshots remain intact.

## 7. API and backend integration

### Current approach

- `axiosClient` uses `VITE_API_BASE_URL` (empty string fallback) and JSON headers. Vite dev server proxies `/api` to `VITE_GATEWAY_URL` or `http://localhost:8080`.
- Request interceptor reads `shopsphere.session` and adds a Bearer token when present.
- Response interceptor normalizes network/server errors and performs global handling for non-login 401s.
- Domain modules expose typed functions for auth, users/addresses, products, categories, cart, wishlist, orders, payments, and reviews.
- The UI handles important business statuses explicitly (e.g. registration conflict 409, review permission/duplicate responses, checkout 400/402/503).
- Pagination follows Spring-style `PageResponse<T>` fields (`content`, zero-based `page`, `size`, `totalElements`, `totalPages`, `last`).

### Authentication flow / interview Q&A

- **Where is the token stored?** In the JSON session in localStorage. The interceptor adds it to API requests; the session also records role and expiry.
- **How is login expiry handled?** `expiresIn` becomes an absolute timestamp; AuthContext schedules a timer and clears local session on expiration.
- **What is the limitation?** Storage is JavaScript-readable and the interceptor/AuthContext can drift on global 401. A cookie-based design or a centralized expiry callback would improve this, depending on backend support.
- **Does logout require the server?** The API attempts a logout request but intentionally ignores its failure; the context then clears local state.
- **Does frontend role checking authorize admin work?** No. Server authorization is required.

### API questions

1. **Why use an Axios instance?** Shared config/interceptors avoid duplicating cross-cutting request behavior.
2. **Where should request/response types live?** Beside domain services for DTOs and in shared types for reusable domain/response contracts.
3. **How should retries be designed?** Retry only safe/idempotent requests or explicitly idempotent mutations; use bounded exponential backoff and surface terminal failure.
4. **How prevent duplicate order submissions?** Disable UI while submitting, plus backend idempotency key and transaction rules.
5. **Why is checkout validation repeated server-side?** Client values are untrusted and inventory/address/payment may change concurrently.
6. **How handle API contract drift?** Generate/validate types from OpenAPI or share a schema; add contract and integration tests.
7. **What would you do with 401 refresh token behavior?** Coordinate a single refresh request, queue retries, prevent loops, and clear session if refresh fails; only if backend supports refresh tokens.

## 8. Performance round

### Code-specific observations

- **Re-render opportunities:** Context provider values are freshly created objects. Since consumers include the header and multiple pages, changing auth/cart/wishlist can rerender broad subtrees. Profile first; then memoize provider values/split state and actions or use selector-based state if warranted.
- **Large pages:** `ProductDetail` and `AdminProducts` combine substantial UI/forms with data logic. Extracting focused subcomponents can reduce cognitive and render scope, though extraction alone does not guarantee speed.
- **Catalogue request races:** Debounce limits calls, but in-flight responses can arrive out of order. Cancel stale requests and normalize query state.
- **Repeated data:** Home/catalogue/product detail may fetch overlapping product data. A query cache can deduplicate and keep details fresh.
- **Memoization:** `useMemo` currently appears for category lookup, password checks, and rating distribution. The latter two have straightforward work; benchmark before claiming measurable benefit. There is no `React.memo`-based card optimization.
- **Images:** ProductCard uses `loading="lazy"` and placeholder fallback, but remote image dimensions/format and responsive `srcSet` are not modeled.
- **Bundle:** Route-level lazy imports already split page code. Audit chunk sizes; icon imports are from `lucide-react`, and dependency inclusion alone is not evidence of a bundle issue.
- **Pagination:** Server-side pagination is used for products/orders, which avoids rendering the entire catalog in the browser.
- **Effects:** Effects that fetch data need cancellation/ignore logic to avoid stale updates after route/filter changes or unmount.

### Interviewer prompts and concise answers

1. **A catalogue feels slow. What do you inspect?** — Network waterfalls, server latency, payload size, rerender/profile data, image transfer and JS chunk costs; establish a measurable baseline.
2. **How do you reduce card rerenders?** — Stabilize props and context dependencies, memoize the card if profiling shows value, and avoid passing newly created objects/functions unnecessarily.
3. **How would you improve first load?** — Keep route splitting, inspect initial chunk, defer noncritical widgets, optimize fonts/images, and avoid loading admin-only code for storefront users.
4. **Should every derived value use `useMemo`?** — No; measure expensive computations or stable identity needs.
5. **How do you handle search request churn?** — Debounce, cancel prior request, and ensure stale results cannot overwrite newer query results.

## 9. System design round

1. **How would you scale this frontend to many product domains?** — Organize by feature/domain boundaries with shared design primitives, typed API contracts and explicit ownership; keep route/page code lazy-loaded.
2. **How would you choose state management?** — URL for navigable filters, local state for transient controls, Context for small cross-cutting client state, query cache for remote state; use Redux/Zustand only if complexity and profiling justify it.
3. **How would you cache API data?** — Query keys by domain and filter; define stale times, invalidation after mutations, pagination strategy, and avoid caching user-private data across sessions.
4. **How would you support offline behavior?** — Cache safe read-only catalog data, queue only explicitly supported idempotent writes, expose stale/offline status, and never assume payment/order mutations succeeded until server confirmation.
5. **Would you use micro-frontends?** — Only for independently deployed teams/apps with clear boundaries; they add runtime/versioning/auth/design-system complexity and are not justified by this current app alone.
6. **How would you handle large admin workflows?** — Feature modules, route-level code splitting, shared validated form components, server-side permissions, audit-friendly mutation flows and pagination.
7. **How would you evolve API integration?** — OpenAPI/generated types, query hooks, cancellation, normalized errors, request tracing and contract tests.
8. **Where would SSR fit?** — If SEO/first meaningful content is critical, evaluate SSR/SSG for public product pages while protecting private customer data and retaining client interaction.

## 10. Top 20 files most likely to be discussed

Ranked for architectural and interview value:

| Rank | File | Purpose and important logic | Likely interviewer question |
|---:|---|---|---|
| 1 | `src/App.tsx` | Provider order, public/protected/admin routes, lazy chunks and suspense fallback | Why is WishlistProvider nested inside CartProvider? How do routes resolve? |
| 2 | `src/context/AuthContext.tsx` | Session restore, login/logout, expiry timer, role flags | Explain token persistence and auto-logout lifecycle. |
| 3 | `src/api/axiosClient.ts` | Shared client, bearer token, network/401/error normalization | What happens to an unauthorized request? |
| 4 | `src/pages/Catalogue.tsx` | URL-backed filters, debounced search, pagination, async states | How do URL and API state stay synchronized? |
| 5 | `src/pages/Checkout.tsx` | Address/payment selection, order submission, status-specific failures | Walk through a successful and failed checkout. |
| 6 | `src/pages/ProductDetail.tsx` | Product/review loads, quantity, wishlist/cart, review CRUD | Why separate review state from product state? |
| 7 | `src/context/CartContext.tsx` | Shared cart, optimistic quantity update and rollback | Describe the optimistic update and its concurrency trade-off. |
| 8 | `src/context/WishlistContext.tsx` | Wishlist state, Set membership, optimistic mutations | Why use a Set and how does rollback work? |
| 9 | `src/pages/Register.tsx` | Controlled registration fields, manual rules, live password checks | How do client and server validation cooperate? |
| 10 | `src/pages/AdminProducts.tsx` | Product/category CRUD, paginated/search state, edit/delete forms | How do you map UI form strings to typed DTO values? |
| 11 | `src/pages/AdminOrders.tsx` | Admin order pagination and permitted status choices | Where must order transitions be validated? |
| 12 | `src/components/Guards.tsx` | Protected/admin/guest route behavior and redirects | Why are route guards not an authorization boundary? |
| 13 | `src/api/types.ts` | Domain models, DTO response shapes, pagination and errors | How does TypeScript improve API/UI boundaries? |
| 14 | `src/api/products.ts` | Product query cleanup, list/detail and CRUD requests | Why normalize query params before making the request? |
| 15 | `src/api/orders.ts` | Customer/admin order, cancellation, and status endpoints | How would you prevent duplicate order creation? |
| 16 | `src/components/ProductCard.tsx` | Product summary, image fallback, add/wishlist behavior | How does it handle guest actions and stock? |
| 17 | `src/pages/Login.tsx` | Controlled login, role redirect and previous-route return | How is a requested route preserved through login? |
| 18 | `src/pages/OrderDetail.tsx` | Fetch order, progress/cancel interaction | How is cancellation eligibility modeled? |
| 19 | `src/context/ThemeContext.tsx` | System preference, local persistence and DOM theme synchronization | Why use CSS variables with a root theme marker? |
| 20 | `src/main.tsx` | React entry, StrictMode, stylesheet import | What does StrictMode reveal in development? |

## 11. Top 50 most likely interview questions

1. **Explain the app architecture.** — Vite/React entry; routed lazy pages; shared Context providers; typed Axios service layer; reusable UI components and CSS tokens.
2. **Walk me through app startup.** — `main.tsx` creates the root and renders StrictMode; App composes providers/router and loads the matched page.
3. **How does routing work?** — React Router maps paths to lazy page elements; nested storefront routes render through Layout’s Outlet.
4. **How is the admin area protected?** — AdminRoute waits for auth restoration, requires a session and ADMIN role, then renders the admin layout.
5. **Why are frontend route guards insufficient for security?** — Users can call APIs directly; server must enforce identity, role, ownership and action permissions.
6. **What is the source of truth for authentication state?** — AuthContext in memory, persisted/restored from localStorage.
7. **Describe login end to end.** — Login page calls context; context calls auth API, builds/persists session and starts expiry timer; page routes based on role.
8. **What happens on session timeout?** — Timer clears stored session, clears in-memory session, notifies user and redirects to login.
9. **How is the token attached to requests?** — Axios request interceptor reads saved session and sets Authorization bearer header.
10. **How are HTTP errors handled?** — Interceptor normalizes network/HTTP errors; screens handle business statuses and present inline messages/toasts.
11. **How does catalogue search work?** — Local input is debounced; filters update URL query params; effect fetches server-paginated products.
12. **Why put filters in the URL?** — Deep links, refresh persistence, browser navigation and shareability.
13. **How do you avoid searching on every keystroke?** — A 400 ms timer is reset on input change.
14. **What is a possible debounce race?** — Older requests can resolve late; cancel or ignore superseded results.
15. **Where is server-side pagination represented?** — `PageResponse<T>` and `page/size/totalPages/last` fields.
16. **How does ProductDetail manage async state?** — Separate product and review loading/error/data states with independent fetch functions.
17. **How does cart state reach the header?** — Header consumes CartContext’s derived item count.
18. **Explain the cart optimistic update.** — Update local quantity/totals immediately, send PUT, replace with server cart on success or restore prior items on failure.
19. **What risk comes with optimistic updates?** — Concurrent updates and stale snapshots can cause out-of-order state; coordinate mutations and reconcile robustly.
20. **How does wishlist optimism work?** — Toggle product ID in a cloned Set immediately; API success updates data; failure reverses the Set change.
21. **Why use a Set?** — Uniqueness and fast membership lookups for heart state across product cards.
22. **Why Context instead of Redux?** — Shared state is limited and the built-in solution is simple; Redux is an option if workflows/middleware/selectors become more complex.
23. **Is React Query in use?** — No; requests and cache-like state are managed manually. It would help with deduping, caching and invalidation.
24. **Where does `useEffect` appear?** — External synchronization: fetches, listeners, titles, scrolling, theme DOM changes and auth restoration.
25. **How are effect dependencies chosen?** — Include every reactive value used, then cancel/clean up resources; restructure if dependencies cause unintended loops.
26. **Why is the timeout in a ref?** — It needs stable mutable storage but should not itself trigger a render.
27. **Where is `useMemo` used?** — Password checklist, selected category lookup, review rating distribution.
28. **When would `useMemo` be premature?** — When calculation is cheap and no referential stability is required.
29. **Where does `useCallback` help?** — Stable data loaders/context operations referenced in effects or shared consumers; it should be used based on identity needs.
30. **What form strategy is used?** — Controlled inputs and custom submit validation, plus native browser constraints.
31. **Are Zod and React Hook Form active?** — Dependencies exist, but current source forms do not use them.
32. **How does Register validate passwords?** — Live rules for length, upper/lowercase, digit and special character, then confirm-password match on submit.
33. **How does it handle duplicate account registration?** — A 409 becomes an email field error.
34. **What happens after account registration?** — Success toast, navigate to login, and pass the email as location state.
35. **How is checkout data validated?** — Client verifies pincode and selected address; backend validates address, cart/inventory/payment authoritatively.
36. **How are checkout failures differentiated?** — 402 payment, 400 corrective cart/address error, 503 retry, otherwise generic error banner.
37. **How do orders move through statuses?** — Admin UI provides next valid transitions; API updates status; backend remains authoritative.
38. **What can customers do in OrderDetail?** — Inspect status/items/address/payment summary and cancel when PENDING or CONFIRMED.
39. **What is code splitting?** — Splitting route modules into independently loaded chunks; here implemented with `React.lazy`.
40. **What covers lazy loading?** — A `Suspense` fallback; route error boundary for chunk failure is not currently implemented.
41. **What is an error boundary?** — A component that catches descendant render/lifecycle errors and displays fallback UI; async network errors need separate handling.
42. **How can shared contexts cause unnecessary renders?** — New provider value identities notify all consumers; split/memoize or use selective store subscriptions when justified.
43. **What should be measured before optimizing?** — User-visible latency, network payload/waterfall, React Profiler render costs, bundle chunks, and image load.
44. **What image optimization exists?** — Lazy loading in ProductCard and fallback image; responsive sizing/source formats could be added.
45. **How do keys help React?** — Stable unique keys preserve item identity across list changes; this project generally uses domain IDs.
46. **Why is localStorage token storage a concern?** — XSS can read JavaScript-accessible tokens; HttpOnly cookies reduce that exposure when supported by backend design.
47. **How does theme persist?** — Reads saved preference or OS preference, updates document root marker/classes, stores selected value.
48. **How are currency and dates displayed consistently?** — Shared formatters use INR/Indian number conventions and a central date formatter.
49. **What are the first two improvements you would propose?** — Centralize server-state caching/cancellation and unify auth expiry so context and interceptor cannot diverge.
50. **What is one strength and one trade-off of the implementation?** — Strength: clear domain API modules and role-specific routes. Trade-off: manual async state is duplicated and lacks query caching/cancellation.

## 12. One-hour final revision sheet

### Minutes 0–10: Architecture and route map

- Say: “React 18 + TypeScript + Vite; React Router v6; route-level lazy loading; four Context providers; typed Axios domain APIs.”
- Recall: `/`, `/products`, `/products/:id`, `/login`, `/register`, customer cart/wishlist/checkout/orders, `/admin/products`, `/admin/orders`.
- Explain storefront `Layout`/`Outlet` vs standalone admin layout and the three guard types.

### Minutes 10–20: State, hooks, and async behavior

- Context owns session/cart/wishlist/theme; page-local state owns forms, filters, modals, and page requests.
- `useState`: local/UI state. `useEffect`: external synchronization and fetch lifecycle. `useMemo`: selected derivations. `useCallback`: stable loader/context function identity. `useRef`: timer, input, DOM container.
- Catalogue: URL params → debounce → server query → loading/error/empty/results; page size 12.
- Mention cancellation/race handling as a next improvement, not as an existing feature.

### Minutes 20–30: Auth and API layer

- Login API response → typed session + expiry → localStorage + AuthContext + timer.
- Axios interceptor attaches bearer token; non-login 401 clears local storage and redirects; server still owns authorization.
- Important trade-off: localStorage exposure to XSS and potential mismatch between interceptor-cleared storage and AuthContext memory.
- Network errors, status errors, DTOs and pagination types are centralized.

### Minutes 30–40: Commerce flows

- ProductCard actions → cart/wishlist contexts. Cart quantity is optimistic with rollback; wishlist heart is optimistic through Set membership.
- Checkout validates availability, selects saved/default address and payment option, submits order, refreshes cart, routes to detail.
- Status handling: 400 input/cart correction; 402 payment failure; 503 retry.
- Customer can cancel pending/confirmed order; admin transitions follow explicit map.

### Minutes 40–50: Forms, performance, quality

- Registration controlled fields/manual checks; password rules; server 409/field errors.
- No active React Query, Redux/Zustand, RHF/Zod usage, `React.memo`, or Error Boundary observed in app source.
- Performance discussion: context value identities, request cancellation/caching, images, route chunk analysis, pagination, profiling.
- StrictMode can reveal duplicate effect setup in development; clean timers/listeners and make effects resilient.

### Minutes 50–60: Practice the interview answer

Use this structure for any question:

1. **What it does in this app** — name the specific page/context/API.
2. **Why it was chosen** — user or engineering need.
3. **Trade-off** — one concrete limitation.
4. **Next improvement** — practical, measurable, backend-aware.

Prepare three short stories:

- **Architecture:** one request from Catalogue through API module/client to rendered page state.
- **Reliability:** cart optimistic update, rollback, and what concurrent mutations would require.
- **Security/scale:** client route guard is UX only; backend authorization and a safer session strategy are essential.

Before the interview, open `src/App.tsx`, `src/context/AuthContext.tsx`, `src/api/axiosClient.ts`, `src/pages/Catalogue.tsx`, `src/context/CartContext.tsx`, and `src/pages/Checkout.tsx` and rehearse each flow aloud in under two minutes.
