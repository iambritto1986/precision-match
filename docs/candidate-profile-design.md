# Candidate Profile & Multi-Source Ingestion — Design Spec

**Status:** Proposal, not yet implemented
**Author:** Drafted for Britto, Aug 2026
**Scope:** Replaces single "Upload File" ingestion with multi-source ingestion, and introduces a persistent Candidate Profile separate from resume documents.

---

## 1. The problem

Two problems, and they're connected.

**Ingestion is too narrow.** Today the only real entry point is `handleFileUpload` → `/api/extract-resume` → `processIngestion(text)`. One file, one shot, and the extracted data goes straight into a resume document. If a user has a LinkedIn profile, an old resume, and a portfolio site, they can only feed us one of those, and re-importing a second source creates a *whole new resume* rather than enriching what we already know.

**Identity is implicit and unsafe.** There is currently no concept of "who is this resume about." The app quietly assumes `users/{uid}` *is* the candidate. That assumption breaks the moment someone builds a resume for their spouse, a friend, or a client — which is a normal thing for people to do, and for a recruiter or career coach it's the primary use case. Today, a resume built for someone else would:

- put their name in the sidebar account widget (`resumeData.personalDetails.name` is used as a display-name fallback in `Sidebar.tsx`),
- put their photo in the account avatar (same component falls back to `resumeData.personalDetails.profilePictureUrl`),
- give Aadhya their history to talk about in chat and voice interviews.

That's a correctness bug and a privacy problem, not just a UX wrinkle. Someone's phone number and employment history should never silently become another person's profile.

## 2. Core principle

> **A Profile is who you are. A Resume is a document about someone.**
>
> Ingestion always produces a Resume. Promoting a Resume's contents into a Profile is always an explicit, reversible user action.

Everything below follows from that one separation.

## 3. Data model

### 3.1 New: `users/{uid}.profile`

Stored on the existing user document, so no new collection and no security-rule changes.

```ts
interface CandidateProfile {
  // Identity — the source of truth for "me"
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;          // e.g. "Senior Product Manager"
  photoUrl: string;          // compressed, same pipeline as today

  // Links
  linkedin: string;
  website: string;
  github: string;

  // Accumulated career memory — the union of everything we've ever ingested
  // ABOUT THE OWNER, not about third parties.
  experience: Experience[];
  education: Education[];
  skills: SkillGroup[];
  certifications: Certification[];
  projects: Project[];

  // Provenance: which sources contributed, so we can show "imported from
  // LinkedIn on 3 Aug" and let the user re-sync or remove a source.
  sources: ProfileSource[];

  updatedAt: number;
}

interface ProfileSource {
  id: string;
  kind: 'resume-file' | 'linkedin' | 'website' | 'manual' | 'interview';
  label: string;             // "Britto_Resume_2026.pdf"
  importedAt: number;
}
```

### 3.2 Changed: resume entries gain a subject

`users/{uid}.resumes[]` entries get one new field:

```ts
interface StoredResume {
  id: string;
  name: string;
  data: ResumeData;
  subject: 'self' | 'other';   // NEW — defaults to 'self' for existing records
}
```

`subject` is the entire safety mechanism. It's deliberately a two-value enum rather than a `forPersonId` reference — we are not building a CRM, we only need to know "may this data touch my profile or not."

### 3.3 Migration

Existing users have `resumes[]` with no `subject` and no `profile`. On first load after deploy:

1. Every existing resume gets `subject: 'self'` (true for essentially all current data — single-user accounts building their own resumes).
2. `profile` is seeded from the *most recently updated* resume marked `self`.
3. Set `profileMigratedAt` so this runs exactly once.

No data is destroyed, and the seeded profile is fully editable, so a bad guess is cheap to correct.

## 4. Ingestion flow

### 4.1 Sources

Replace the single "Upload File" card with a source picker. Each source ends at the same place: raw text handed to the existing `processIngestion`.

| Source | Mechanism | Notes |
|---|---|---|
| Resume / CV file | Existing `/api/extract-resume` | Already built. PDF, DOCX, TXT. |
| LinkedIn export | Same endpoint, accepts the `.zip`/PDF LinkedIn provides | **Use LinkedIn's own "Download your data" export.** Do not scrape linkedin.com — it violates their ToS and will get the scraper IP banned. |
| Personal website / portfolio | New `/api/extract-url` → fetch + strip to text → same Gemini extraction | Needs an allowlist/timeout and a size cap. |
| Paste text | No API call, straight to `processIngestion` | Cheapest to build, covers everything else. |
| Aadhya interview | Existing voice transcript | Highest-signal source; the interview already surfaces detail resumes omit. |

### 4.2 The identity checkpoint

This is the important part. **After** extraction succeeds and **before** anything is written:

```
┌──────────────────────────────────────────────┐
│  We found a resume for  Priya Sharma          │
│                                               │
│  Who is this resume for?                      │
│                                               │
│  ( • ) This is me                             │
│        Adds to your profile so Aadhya knows   │
│        your background and future resumes     │
│        prefill automatically.                 │
│                                               │
│  (   ) Someone else                           │
│        Creates a standalone resume. Nothing   │
│        is added to your profile.              │
│                                               │
│              [ Continue ]                     │
└──────────────────────────────────────────────┘
```

Rules:

- **Default selection is "This is me"** for the *first ever* import (overwhelmingly the common case, and the profile is empty so there's nothing to corrupt).
- **Default flips to "Someone else"** when the extracted name meaningfully differs from the existing `profile.name`. Fail safe: when we're unsure, we protect the profile.
- The step is never auto-skipped. One extra click is a fair price for not attributing a stranger's phone number to the user.
- `subject` is editable later from the resume's context menu, and changing `'other'` → `'self'` re-runs the merge.

### 4.3 Merge semantics (`subject: 'self'` only)

The profile accumulates; it does not get clobbered.

- **Scalar identity fields** (name, email, phone, photo): only fill if currently empty. Never silently overwrite — if they differ, surface a small "Update your profile phone number to X?" prompt.
- **List fields** (experience, education, skills, certifications, projects): union with de-duplication. Match experience on `company + role + duration` normalized to lowercase/trimmed; skills on normalized skill string. Conflicts keep the longer, more detailed entry.
- Every merged batch appends a `ProfileSource` so the user can see and undo it.

For `subject: 'other'`, none of this runs. The resume is written and the profile is untouched. Full stop.

## 5. Consumers of the profile

Once the profile exists, several current behaviours get better and one gets safer:

- **New resume prefill** — "Start New Resume" can prefill from profile instead of starting blank.
- **Aadhya (chat + voice)** — currently receives `resumeContext` from whatever resume is active. It should receive **profile** context when the active resume is `self`, and **resume-only** context when it's `other`. Otherwise Aadhya would coach the user using a third party's history. This also composes with the existing `hasResumeContent` honesty fix in `server.ts`.
- **Sidebar account widget** — must read `profile.name` / `profile.photoUrl`, never `resumeData.personalDetails.*`. This alone fixes the visible identity leak described in §1.
- **ATS scoring / tailoring** — can draw on the full profile, including experience trimmed out of the current resume, which is a genuine quality win: the AI can suggest re-adding a relevant role the user cut.

## 6. Build order

Each step ships independently and is useful on its own.

1. **Identity opt-in + `subject` field.** Add `subject` to stored resumes, add the checkpoint dialog, and fix the Sidebar to stop falling back to resume data for the account widget. *Ships the safety half with no schema risk.*
2. **Profile object + migration.** Create `profile`, seed it, build a Profile settings page where it can be viewed and edited. Read-only consumers first.
3. **Merge-on-import.** Wire `subject: 'self'` imports into the merge logic with provenance tracking.
4. **Additional sources.** Paste-text first (trivial), then LinkedIn export, then URL extraction.
5. **Profile-aware Aadhya + prefill.** Switch context construction and new-resume prefill over to the profile.

## 7. Risks

- **Schema churn on a live product.** Mitigated by additive-only fields and a one-time guarded migration. Nothing existing is removed or renamed.
- **Firestore 1 MiB document limit.** The user doc already holds up to 10 resumes plus a compressed photo. Adding a full profile with its own lists brings this closer to the ceiling. **Before step 2, measure real document sizes.** If they're above roughly 400 KiB, move `profile` to a `users/{uid}/profile/main` subdocument rather than a field.
- **Merge producing duplicates.** De-duplication on free-text fields is genuinely hard and will sometimes be wrong. Make every merge visible and undoable via `sources` rather than trying to be perfect.
- **Scope creep into a CRM.** `subject` is intentionally binary. If multi-person management is ever wanted, that's a separate product decision, not an accident of this design.
