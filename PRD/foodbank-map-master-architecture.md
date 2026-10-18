# Foodbank Map — Master Architecture Sheet

> **Purpose:** Persistent handoff document for future agentic sessions working on Foodbank Map.
>
> **Status:** Planning / pre-implementation. No application code has been written as part of this plan.
>
> **Last updated:** 2026-10-11
>
> **How to use this document:** Treat confirmed decisions as constraints. Treat items marked *proposed*, *investigate*, or *open question* as unresolved. Update this file when a decision changes, and preserve the rationale so future sessions do not silently reverse earlier choices.

---

## 1. Product vision

Foodbank Map is a responsive, map-first discovery platform that helps people find food assistance they may not know exists, including both permanent services and short-notice pop-up food distributions.

The differentiating goal is **discoverability of time-sensitive food assistance**. Traditional directories help people find established organizations; Foodbank Map should also surface community distributions that may be announced only a day or two before they happen.

### Core user questions

1. Where can I get food or find food assistance?
2. What distributions, meals, or other relevant services are happening soon?
3. Where exactly is the event, when is it happening, and what should I know before going?
4. How recent and trustworthy is this information?

### Product principles

- Make services discoverable in one place, even when source directories overlap.
- Treat event discovery and event verification as separate steps.
- Do not publish unverified candidate events as confirmed facts.
- Preserve source provenance and freshness information.
- Keep the user experience simple, accessible, responsive, and useful on mobile.
- Minimize infrastructure and operational overhead while keeping a path to scale.
- Do not assume that a recurring event is happening on a future date unless that occurrence is confirmed.
- Prefer accurate and useful records over maximizing the number of map pins.

---

## 2. Confirmed decisions

These decisions were explicitly provided or accepted by the project owner.

| Area | Decision |
|---|---|
| Product purpose | Focus on discoverability of food assistance, including services people may not know exist. |
| Geographic scope | **BC-wide** pilot/coverage from the outset. |
| Event discovery | Use official sources **and** community discovery. |
| Ingestion approach | **Automated collection plus human approval** before publishing discovered event candidates. |
| Directions | Directions can be handed off to an external maps app/link; do not build routing ourselves initially. |
| Initial planning stage | Plan first; no coding until the architecture and scope are agreed. |
| UX | Responsive UI with a map and synchronized list. |
| Initial map position | Use browser geolocation with permission; provide a fallback if location is unavailable or denied. |
| Address search | Optional address/place search bar is desired. |
| Desktop layout | Left sidebar/list; map fills remaining viewport space. |
| Mobile layout | Bottom drawer/sheet with collapsed/expanded states, keeping part of the map visible above it. |
| Filters | Support distance and upcoming-time filtering. |
| Map markers | Different marker treatments for different service/event types; clustering may be used when needed. |
| Data quality | Deduplicate overlapping records from multiple directories and sources. |

### Product scope distinction

Food assistance listings should distinguish between:

- **Food distribution:** visitors can receive food.
- **Community meal:** visitors can attend and eat a prepared meal.
- **Food pantry / ongoing service:** visitors can access food at a location, subject to its rules.
- **Donation drive:** visitors bring food to donate. Keep this distinct from services where people receive food.

Primary discovery focus is on the first three categories. Donation-only events must not be misrepresented as food available to the visitor.

---

## 3. Proposed technical architecture

The following is the recommended lean starting point, not yet a final vendor commitment.

### Frontend

- **React + TypeScript + Vite** for a single-page web application.
- **Tailwind CSS** for responsive styling.
- A small accessible component library may be added if it reduces implementation effort; avoid a large UI framework without a clear need.
- One shared application state for map results, selected listing, search reference point, and active filters so map and list remain synchronized.

### Map

- **MapLibre GL JS** is the current first choice.
  - Custom map styling and markers.
  - GeoJSON support and clustering.
  - Modern vector-map rendering.
  - Less lock-in to a single commercial map ecosystem.
- Use an established hosted map style/tile provider. MapLibre is a renderer, not a complete free tile/data service.
- Use custom markers for permanent services versus time-limited events and relevant service categories.
- Selecting a list item should highlight/pan to its marker; selecting a marker should highlight the list item.
- Do not build a custom map engine.
- **Alternatives to reconsider only if requirements change:**
  - Leaflet: simpler/mature for conventional maps.
  - Google Maps JavaScript API: consider if Google Places/search integration outweighs cost and provider dependency.

### Geolocation, search, and directions

- Ask browser permission for current location; do not require it to use the app.
- If permission is denied/unavailable, use a sensible configured default or ask the user to search.
- Address search requires a geocoding/place-search provider.
- Distance filtering should use the selected reference point:
  - Current user location, or
  - Searched address/place.
- Make it clear which reference point is active; searching a new address should normally update the distance reference.
- Directions: generate external Google Maps / Apple Maps links. No in-app routing engine in the first release.
- Review geocoding and map provider price, rate limits, terms, attribution, and privacy implications before choosing a vendor.

### Data/backend

- **Proposed: Supabase + PostgreSQL/PostGIS** for the canonical data store, API, admin authentication, and geographic queries.
- The initial directory could be bootstrapped from CSV/JSON imports, but a database is recommended because event ingestion requires review state, source history, deduplication, recurring schedule handling, and frequent updates.
- Keep ingestion jobs outside the browser.
- Avoid microservices, message brokers, a custom search cluster, and a separate routing service at the start.

### Hosting and scheduled ingestion

- Static frontend hosting: Cloudflare Pages, Netlify, or Vercel are reasonable candidates.
- Scheduled collectors/normalizers: managed scheduled functions, serverless workers, or equivalent.
- Final provider is not chosen. Select based on cost, deployment simplicity, runtime requirements, and source-access constraints.
- Automated collection must respect source terms, applicable law, rate limits, privacy expectations, and access restrictions. Prefer official APIs, downloadable datasets, RSS/Atom, partner feeds, and direct submissions where available.

---

## 4. Data sources and source strategy

### Permanent directory candidates

1. **BC provincial open-data foodbank dataset**
   - Investigate as an initial seed for organization/location records.
   - Verify exact dataset identity, fields, coverage, freshness, provenance, and reuse licence before import.
   - A dataset of mapped food banks may not cover community meals, temporary distributions, or all relevant services.
   - Previously identified reference URL:
     - https://open.canada.ca/data/en/dataset/ca0433b2-8e20-468b-9093-3bbdc1721e08
   - **Important:** verify that this URL and dataset are current and are the intended BC dataset before relying on it.

2. **211 BC / 211 Canada**
   - Investigate access to food-assistance service records, including food banks, emergency food, community meals, pantries, and outreach.
   - 211 Canada has described data-sharing options including API, map-ready formats, and spreadsheets, subject to access arrangements.
   - Confirm BC coverage, terms, permitted reuse, refresh cadence, available fields, and whether data includes event-level schedules.
   - Reference: https://211.ca/data/
   - Publicly searchable information does not automatically imply bulk reuse permission.

3. **Food Banks Canada and local food bank networks**
   - Potential sources for cross-checking and organization relationships.
   - Investigate data-sharing options and licensing; do not assume public directory pages are a bulk data feed.

4. **OpenStreetMap**
   - Potential supplementary source for mapped amenities/locations, not proof that food is currently available.
   - Verify tags and coverage; observe ODbL and attribution requirements before reusing data.

### Pop-up and time-sensitive event sources

Potential sources to investigate, in priority order:

1. Direct feeds, official APIs, RSS/Atom feeds, and organization event pages.
2. Direct agreements or submissions from foundations, food banks, community groups, and event organizers.
3. Public organization social media posts and newsletters, collected only where permitted.
4. Community-submitted links/tips, moderated before publication.
5. Community forums (including Reddit) as discovery leads, not the default source of truth.

**Source rule:** Prefer the original organizer's announcement for event confirmation. A community post may be enough to create a candidate, but it should not automatically become a confirmed published event.

### Concrete lead to investigate

**DuMonde Helping Hands Foundation** was identified as a potential recurring pop-up distribution organizer, with public discussion/announcements about distributions around Metrotown and Nanaimo SkyTrain stations.

- Website: https://www.helphands.org/
- LinkedIn: https://www.linkedin.com/company/dumondehelpinghandsfoundation
- Reddit lead: https://www.reddit.com/r/burnaby/comments/1q0p8cg/foodbank_pop_up_at_metrotown/

Previous research suggested reports of a Thursday Metrotown / Saturday Nanaimo pattern and a public app listing with weekly updates. These are **leads to verify**, not an authoritative schedule. Do not publish future occurrences based on a recurring pattern alone. Investigate official channels and contact the organizer about direct submissions or a feed.

### Source inventory to maintain

For every source, track:

- Source name and organization.
- Source type and URL.
- Geographic coverage.
- Service/event categories covered.
- Access method (API, download, RSS, page collection, manual submission, etc.).
- Permission/licence/terms and attribution requirements.
- Collection frequency and last successful collection.
- Typical announcement lead time, if known.
- Reliability and verification method.
- Known limitations and contact details.

---

## 5. Data ingestion pipeline

Every source adapter should produce a common normalized candidate record.

1. **Collect**
   - Scheduled import for stable directory sources.
   - More frequent checks for known event sources where permitted and useful.
   - Community-submitted links can enter at any time.
   - Record the source URL, source identifier, collection time, and original content/evidence permitted to retain.

2. **Extract**
   - Parse organization, event title, event/service type, date, start/end time, address/landmark, eligibility, registration, accessibility notes, and original announcement.
   - Prefer structured fields and deterministic parsers.
   - AI-assisted extraction may help with unstructured text, but must not invent missing details.
   - Preserve uncertainty and missing fields explicitly.

3. **Normalize**
   - Standardize names, addresses, timestamps, time zones, service types, organization aliases, and locations.
   - BC event times should be stored with explicit timezone semantics and displayed in the event location's local time.
   - Geocode addresses only through a selected provider and retain geocoding quality/source as appropriate.

4. **Deduplicate and match**
   - Match organization aliases and stable external IDs.
   - Compare normalized address/coordinates, date/time, title, and organizer.
   - Multiple posts about the same event should normally be multiple source records linked to one event, not multiple map pins.
   - Ambiguous matches should be sent to human review rather than merged automatically.
   - Preserve the ability to undo a merge.

5. **Moderate**
   - Present candidate fields next to the original source.
   - Actions: approve, edit and approve, reject, merge, request clarification, mark cancelled, or mark stale.
   - Require approval before a candidate is published as a confirmed upcoming event.
   - Do not make source confidence scores a substitute for source evidence.

6. **Publish**
   - Only approved records appear as confirmed public events.
   - If a separate “unverified tip” experience is ever added, it must be explicitly designed and labelled; it is not in the first-release scope.
   - Public event cards should link to the source where practical.

7. **Refresh and expire**
   - Automatically mark past occurrences as past/expired and remove them from upcoming results.
   - Check updates/cancellations from sources where possible.
   - Do not automatically roll recurring schedules into future confirmed occurrences.
   - Flag stale, changed, conflicting, or cancelled records for review.
   - Keep an audit trail of edits and status changes.

### Suggested review rules

- Missing date or unresolvable location → clarification required.
- Candidate extracted from a credible source → review required.
- Organizer-confirmed or otherwise sufficiently reliable original announcement → eligible for human approval.
- Conflicting dates, unclear eligibility, possible duplicate, or uncertain source → hold for review.
- Cancelled or out-of-date announcement → do not show as upcoming.
- Repeating schedule without confirmation of a particular occurrence → do not present that occurrence as confirmed.

---

## 6. Proposed initial data model

This is a conceptual model; exact columns and migrations are still to be designed.

| Entity/table | Purpose and key fields |
|---|---|
| `organizations` | Stable organization ID, name, aliases, website, phone, description, organization type, status |
| `locations` | Stable location ID, organization ID where applicable, address, latitude/longitude, location notes, accessibility/access notes |
| `services` (optional, or represented through events/listing types) | Ongoing service type, description, eligibility, schedule/hours, associated location |
| `events` | One-time event/occurrence, organization/location, title, type, start/end time, timezone, status, eligibility, registration notes, cancellation state |
| `recurrence_rules` (later phase) | Recurrence pattern and source; must not be treated as confirmation of future occurrences |
| `sources` | Provider/source ID, URL, source type, access method, licence/terms notes, collection metadata |
| `event_sources` | Many-to-many links from an event to supporting announcements, with source URL, first/last seen, and evidence metadata |
| `review_queue` | Candidate data, extraction result, review status, reviewer, decision, and timestamps |
| `change_log` / audit records | Before/after values, action, actor, and timestamp |

### Data integrity principles

- Stable IDs for organizations, locations, and events.
- One organization may have many locations; one location may host many events.
- Preserve source provenance and original extracted candidate data.
- Separate a recurring pattern from a dated occurrence.
- Model event status explicitly (e.g. candidate, approved, cancelled, expired).
- Store times unambiguously; avoid naive timestamps.
- Keep eligibility, registration, and accessibility notes distinct from free-form descriptions where feasible.
- Do not expose private submitter contact details or internal moderation notes publicly.

---

## 7. Public UX and functional requirements

### Desktop

- Search/address bar near the top of the interface.
- Results list in a left sidebar.
- Map fills the remaining viewport.
- Sidebar and map should scroll/resize independently as appropriate.
- Selecting a list item highlights and pans/zooms to its marker.
- Selecting a marker highlights the corresponding list item and opens a useful summary.

### Mobile

- Map remains visible at the top.
- Search control remains accessible.
- Draggable bottom sheet/drawer with collapsed, intermediate, and expanded states.
- List scrolls independently inside the sheet.
- Keep enough map visible to maintain geographic context when the sheet is collapsed.
- Controls must be touch-friendly and accessible.

### Search and filtering

- Search address/place/postal code through geocoding.
- Geolocation is optional and permission-based.
- If geolocation is denied/unavailable, use a sensible default map region or let the user search.
- Distance filtering and sorting use the active reference point (user location or searched location).
- Allow filtering by service/event type and upcoming time.
- Include “happening today” and upcoming date ranges.
- Sort by nearest or soonest.
- Consider a map-viewport filter as a later enhancement.
- Distinguish currently open, scheduled distribution, upcoming event, and schedule not confirmed. Do not imply that a place is open or food is available unless the data supports it.

### Event/listing card

At minimum, show:
- Name/title and service type.
- Event date and start/end time where applicable.
- Address or clear landmark.
- Important eligibility, registration, or access notes where known.
- Source link.
- Verification status and last-updated/verified information.
- Directions link.
- Clear indication if details are incomplete; do not imply availability is guaranteed.

### Marker semantics

- Distinguish permanent services from temporary events.
- Use a restrained, accessible visual system; do not rely on colour alone.
- Use clustering at suitable zoom levels.
- Marker and list selection must stay synchronized.

---

## 8. Admin and community submission workflow

### Admin dashboard, first release

- Review queue ordered by urgency (e.g. events starting soon) and submission age.
- Original source/evidence displayed beside extracted fields.
- Edit event details and location.
- Approve, reject, merge, request clarification, cancel, or mark stale.
- Show potential duplicates and existing related organization/location records.
- Show first-seen, last-checked, last-verified, and source history.
- Record who made each decision and when.

### Community submissions

- Public form to submit an announcement link, event details if known, and optional contact/context.
- All submissions enter the review queue.
- No automatic public publishing.
- Rate limiting and spam prevention are required.
- Keep personal information private; collect only what is needed to review a submission.

---

## 9. Deployment and operational posture

### Recommended first-release shape

- One frontend application.
- One managed PostgreSQL/PostGIS database and API.
- One private admin workflow.
- A small set of scheduled ingestion jobs.
- One geocoding provider and one hosted map-tile/style provider.
- External directions links.
- Basic logs, error alerts, and backup strategy.

### Explicitly avoid at first

- Custom map renderer or routing engine.
- Microservices or message broker.
- Complex event-stream infrastructure.
- Public accounts, favourites, and push notifications.
- Automatic publishing of unverified announcements.
- Broad web scraping without source-specific permissions and maintenance plans.
- A large number of data sources before the first ones are working reliably.

### Costs and constraints to assess

- Map tiles/style usage and attribution.
- Geocoding/place-search requests and limits.
- Hosting and scheduled worker limits.
- Database storage, backups, and geographic-query performance.
- Data licensing and source-specific terms.
- Any AI extraction cost, if AI is introduced.
- Admin time needed for review and data maintenance.

Open-source mapping libraries do not mean map tiles or geocoding are unlimited or free. Select providers after estimating expected traffic and reviewing their terms.

---

## 10. Rollout plan

### Phase 1 — Source audit and directory foundation
- Verify the provincial dataset and its licence/fields.
- Request 211 data access and determine coverage and permitted reuse.
- Build a source inventory.
- Define canonical organizations, locations, services, and event fields.
- Import a small sample and assess duplicate rates and geographic gaps.

### Phase 2 — Public map and list
- Implement responsive map/sidebar/bottom sheet.
- Add geolocation fallback, address search, marker types, list-map synchronization, distance/time filters, and directions links.
- Publish reviewed permanent directory records.
- Add clear source and freshness information.

### Phase 3 — Event ingestion and moderation
- Implement candidate records and review queue.
- Add a few reliable official/organizer sources and community link submissions.
- Extract event details, suggest duplicates, and require human approval.
- Add expiry/cancellation handling and an audit trail.

### Phase 4 — Broader coverage and automation
- Expand source adapters across BC based on source reliability and regional gaps.
- Add more organizations and community partners.
- Automate reliable imports and prioritization of reviews.
- Improve duplicate suggestions and change detection.
- Consider alerts/notifications only after data quality and freshness are proven.

---

## 11. Success metrics

Measure usefulness and trust, not just pin count.

- Directory coverage by region and service category.
- Number and share of upcoming events with usable source evidence.
- Time from original event announcement to publication.
- Percentage of event listings with verified date, time, and location.
- Duplicate rate caught before publication.
- Stale/cancelled events incorrectly remaining in upcoming results.
- Moderation queue age and time to approve an event.
- Searches with useful results versus no-result searches.
- Community submissions accepted and the effort required to review them.

---

## 12. Open questions / decisions still required

These are unresolved and should not be silently assumed.

### Source and data
- Which BC dataset is authoritative/current, and what is its exact licence and update cadence?
- What fields and geographic coverage are available through 211 BC/Canada?
- Which sources permit automated collection, and by what method?
- Which event organizers will agree to direct submissions or data sharing?
- What retention rules apply to scraped/extracted content and source evidence?

### Product policy
- What minimum evidence is required before an event can be approved?
- Should public listings have explicit statuses such as “Organizer-confirmed” and “Details not independently confirmed”? Define wording carefully.
- How long after an event should records remain accessible in history, if at all?
- Which eligibility/accessibility fields are required versus optional?
- How should conflicting announcements or last-minute cancellations be displayed?

### Technical choices
- Final map style/tile provider.
- Final geocoding/search provider.
- Hosting and scheduled-job provider.
- Exact Supabase/PostGIS schema and access-control rules.
- Whether to use an AI model for extraction in the first iteration, or start with deterministic parsing plus manual entry.
- Review/admin authentication approach.

### Operational
- Who reviews the moderation queue, and how often?
- What review turnaround is realistic for events announced 24–48 hours beforehand?
- Who responds to corrections and removal requests?
- What minimum monitoring, backups, and incident handling are needed?

---

## 13. Immediate next actions

Recommended next steps before implementation:

1. **Verify and inspect the provincial foodbank dataset**: confirm the intended source, download format, field quality, licence, geographic coverage, and update cadence.
2. **Contact 211 Canada / 211 BC about data access**: request food-assistance categories, format, BC coverage, licensing, refresh cadence, and event-level data availability.
3. **Create the source inventory**: begin with official directory sources and a small number of public pop-up organizers.
4. **Verify the DuMonde Helping Hands Foundation lead**: contact the organizer or inspect current official announcements; do not infer future dates from historical recurring patterns.
5. **Agree on event verification policy and status wording**.
6. **Finalize the first-release specification and provider choices**.
7. Only then begin implementation.

---

## 14. Handoff instructions for future agentic sessions

When continuing this project:

1. Read this master sheet first.
2. Preserve all confirmed decisions unless the project owner explicitly changes them.
3. Clearly distinguish verified current facts from leads that need validation.
4. Do not claim that a source offers a usable API or permits automated collection until its current documentation/terms have been checked.
5. Do not invent upcoming event dates or infer that a recurring event will occur on a future date without confirmation.
6. Do not publish a discovered event candidate without the agreed human approval step.
7. Update this document when a decision is made; record the decision, date, and rationale.
8. Prefer the smallest implementation that satisfies the agreed requirements.
9. Keep the app focused on discoverability, current information, and safe handoff to the original service provider.
10. Before coding, verify all external-source references and provider terms because they can change.

