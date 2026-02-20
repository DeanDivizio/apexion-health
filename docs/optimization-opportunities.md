# Optimization Opportunities

Tracked enhancements that improve performance or scalability but are not critical bugs.

---

## Bootstrap Payload Size

**Status:** Open
**Area:** `lib/medication/server/medicationService.ts` — `getMedicationBootstrap`

`getMedicationBootstrap` sends the entire substance catalog (with all methods, variants, and ingredients) to the client on every page load. As users create custom substances and the default catalog grows, this payload will increase unboundedly.

### Possible Approaches

- **Paginated / search-driven loading**: Only send substances matching the user's search query, lazy-loading as they type in the combobox.
- **Split bootstrap into stages**: Load the substance list (id + name only) eagerly, then fetch full details (methods, variants, ingredients) on demand when a substance is selected.
- **Cache with revalidation**: Cache the catalog in a client-side store (e.g., React Query / SWR) with stale-while-revalidate, reducing redundant fetches on repeat visits.
