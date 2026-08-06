import { ResumeData } from '../types';

/**
 * Diffing a tailored resume against the original.
 *
 * The point of this module is not just "show a diff". The product promise is that
 * tailoring never invents facts, and until now the user had to take that on faith
 * because the AI's output replaced their resume wholesale. Here every proposed
 * edit is surfaced individually so it can be accepted or rejected.
 *
 * It also acts as a safety net on the model itself. The server prompt forbids
 * changing employers, titles and dates, and forbids adding skills the candidate
 * doesn't have — but a prompt is a request, not a guarantee. Any change that
 * touches one of those anchors is marked `risky`, so if the model ignores its
 * instructions the user sees it in amber rather than silently shipping it.
 */

export type ChangeKind = 'modified' | 'added' | 'removed';

export interface ResumeChange {
  id: string;
  /** Grouping header in the review UI, e.g. "Experience — Uber Technologies". */
  section: string;
  /** What specifically changed, e.g. "Bullet 2". */
  label: string;
  kind: ChangeKind;
  before?: string;
  after?: string;
  /**
   * True when the edit alters a factual anchor (employer, job title, dates,
   * institution) or introduces a skill that wasn't there. These are exactly the
   * edits the grounding rules prohibit, so they're highlighted for scrutiny and
   * left OFF by default.
   */
  risky?: boolean;
  /** Why it's risky, shown inline. */
  riskNote?: string;
  /** Mutates a draft copy of the resume to apply this single change. */
  apply: (draft: ResumeData) => void;
}

const norm = (s?: string) => (s ?? '').trim();
const changed = (a?: string, b?: string) => norm(a) !== norm(b);

/** Deep clone that's sufficient for plain resume JSON. */
export const cloneResume = (d: ResumeData): ResumeData => JSON.parse(JSON.stringify(d));

export const diffResume = (before: ResumeData, after: ResumeData): ResumeChange[] => {
  const changes: ResumeChange[] = [];
  let n = 0;
  const id = () => `c${n++}`;

  // ---- Headline & summary -------------------------------------------------
  if (changed(before.personalDetails?.title, after.personalDetails?.title)) {
    const value = after.personalDetails.title;
    changes.push({
      id: id(), section: 'Profile', label: 'Headline', kind: 'modified',
      before: before.personalDetails?.title, after: value,
      apply: d => { d.personalDetails.title = value; },
    });
  }

  if (changed(before.personalDetails?.summary, after.personalDetails?.summary)) {
    const value = after.personalDetails.summary;
    changes.push({
      id: id(), section: 'Profile', label: 'Summary', kind: 'modified',
      before: before.personalDetails?.summary, after: value,
      apply: d => { d.personalDetails.summary = value; },
    });
  }

  // ---- Experience ---------------------------------------------------------
  // Matched positionally: the model is asked to preserve order and never drop
  // roles. If counts differ we still diff the overlap and report the remainder.
  const beforeExp = before.experience ?? [];
  const afterExp = after.experience ?? [];

  afterExp.forEach((aExp, i) => {
    const bExp = beforeExp[i];
    const where = `Experience — ${norm(bExp?.company) || norm(aExp.company) || `Role ${i + 1}`}`;

    if (!bExp) {
      const snapshot = JSON.parse(JSON.stringify(aExp));
      changes.push({
        id: id(), section: where, label: 'Entire role', kind: 'added',
        after: `${aExp.role} @ ${aExp.company}`,
        risky: true,
        riskNote: "This role wasn't in your original resume. Only accept it if it's genuinely yours.",
        apply: d => { d.experience = [...(d.experience ?? []), snapshot]; },
      });
      return;
    }

    // Factual anchors — the grounding rules say these must never change.
    ([
      ['role', 'Job title'],
      ['company', 'Employer'],
      ['duration', 'Dates'],
      ['location', 'Location'],
    ] as const).forEach(([key, label]) => {
      if (changed((bExp as any)[key], (aExp as any)[key])) {
        const value = (aExp as any)[key];
        changes.push({
          id: id(), section: where, label, kind: 'modified',
          before: (bExp as any)[key], after: value,
          risky: true,
          riskNote: `${label} shouldn't change when tailoring — check this is still accurate.`,
          apply: d => { if (d.experience?.[i]) (d.experience[i] as any)[key] = value; },
        });
      }
    });

    // Bullets. Positional again, which is right for rewrites; genuinely new or
    // dropped bullets fall out as added/removed at the tail.
    const bBul = (bExp.responsibilities ?? []).filter(r => norm(r));
    const aBul = (aExp.responsibilities ?? []).filter(r => norm(r));
    const max = Math.max(bBul.length, aBul.length);

    for (let j = 0; j < max; j++) {
      const b = bBul[j];
      const a = aBul[j];
      if (b !== undefined && a !== undefined) {
        if (changed(b, a)) {
          changes.push({
            id: id(), section: where, label: `Bullet ${j + 1}`, kind: 'modified',
            before: b, after: a,
            apply: d => { const e = d.experience?.[i]; if (e) e.responsibilities[j] = a; },
          });
        }
      } else if (a !== undefined) {
        changes.push({
          id: id(), section: where, label: `New bullet ${j + 1}`, kind: 'added',
          after: a,
          risky: true,
          riskNote: "This bullet wasn't in your original. Make sure it describes something you actually did.",
          apply: d => { const e = d.experience?.[i]; if (e) e.responsibilities = [...e.responsibilities, a]; },
        });
      } else if (b !== undefined) {
        changes.push({
          id: id(), section: where, label: `Bullet ${j + 1}`, kind: 'removed',
          before: b,
          apply: d => {
            const e = d.experience?.[i];
            if (e) e.responsibilities = e.responsibilities.filter(r => norm(r) !== norm(b));
          },
        });
      }
    }
  });

  if (beforeExp.length > afterExp.length) {
    for (let i = afterExp.length; i < beforeExp.length; i++) {
      const bExp = beforeExp[i];
      changes.push({
        id: id(), section: `Experience — ${norm(bExp.company) || `Role ${i + 1}`}`,
        label: 'Entire role removed', kind: 'removed',
        before: `${bExp.role} @ ${bExp.company}`,
        apply: d => { d.experience = (d.experience ?? []).filter(e => e !== d.experience?.[i]); },
      });
    }
  }

  // ---- Skills -------------------------------------------------------------
  // Added skills are the classic keyword-stuffing failure: the model sees a
  // requirement in the job ad and quietly claims it. Every addition is flagged.
  const beforeSkills = before.skills ?? [];
  const afterSkills = after.skills ?? [];
  const beforeAll = new Set(
    beforeSkills.flatMap(g => (g.items ?? []).map(s => norm(s).toLowerCase())).filter(Boolean)
  );

  afterSkills.forEach((aGroup, i) => {
    const bGroup = beforeSkills.find(g => norm(g.category).toLowerCase() === norm(aGroup.category).toLowerCase());
    const newItems = (aGroup.items ?? []).filter(s => norm(s) && !beforeAll.has(norm(s).toLowerCase()));

    if (newItems.length > 0) {
      const snapshot = [...(aGroup.items ?? [])];
      const category = aGroup.category;
      changes.push({
        id: id(), section: 'Skills', label: bGroup ? `Added to "${category}"` : `New group "${category}"`,
        kind: 'added',
        before: bGroup ? (bGroup.items ?? []).join(', ') : undefined,
        after: newItems.join(', '),
        risky: true,
        riskNote: "Skills added from the job description. Only keep the ones you can actually demonstrate.",
        apply: d => {
          const target = (d.skills ?? []).find(g => norm(g.category).toLowerCase() === norm(category).toLowerCase());
          if (target) target.items = snapshot;
          else d.skills = [...(d.skills ?? []), { category, items: snapshot }];
        },
      });
    } else if (bGroup && changed((bGroup.items ?? []).join(', '), (aGroup.items ?? []).join(', '))) {
      // Reordering or dropping — no new claims, so not risky.
      const snapshot = [...(aGroup.items ?? [])];
      const category = aGroup.category;
      changes.push({
        id: id(), section: 'Skills', label: `Reordered "${category}"`, kind: 'modified',
        before: (bGroup.items ?? []).join(', '), after: snapshot.join(', '),
        apply: d => {
          const target = (d.skills ?? []).find(g => norm(g.category).toLowerCase() === norm(category).toLowerCase());
          if (target) target.items = snapshot;
        },
      });
    }
  });

  return changes;
};

/**
 * Produces the final resume: the original, with only the accepted changes applied.
 * Rejecting everything therefore yields exactly the original — which is the
 * guarantee that makes the review meaningful.
 */
export const applyChanges = (
  original: ResumeData,
  changes: ResumeChange[],
  acceptedIds: Set<string>,
): ResumeData => {
  const draft = cloneResume(original);
  changes.forEach(c => { if (acceptedIds.has(c.id)) c.apply(draft); });
  return draft;
};

/** Changes that are safe by default: rewrites and removals, never new claims. */
export const defaultAccepted = (changes: ResumeChange[]): Set<string> =>
  new Set(changes.filter(c => !c.risky).map(c => c.id));
