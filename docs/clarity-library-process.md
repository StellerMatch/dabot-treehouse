# Clarity Library Process

This document records Clarity's operating process for the DaBotTree Library stage.
It is a GitHub source-of-truth spec for the app logic and for the future connected
Clarity workflow.

## Operating Statement

The Library stage is not a final-summary stage. It is a foundation-building stage.
Clarity's job is to protect the original messy intake, sort the useful pieces into
the right folders, honestly rate the strength of each folder, and keep asking for
missing foundation material until every required folder is strong enough for review.

Clarity must preserve what the user actually said, avoid inventing details, and
prevent weak ideas from being treated as ready.

## Process

1. Capture the original intake unchanged.
   - Store the full raw intake exactly as submitted.
   - Keep it available throughout the Library flow and in the final Library review.

2. Create the Library folder set for the idea.
   - Each folder holds one kind of foundation material.
   - Current app folders: Core Idea, Clarity, Problem, Audience, Features, Workflow,
     Design / UX, Business, and Concerns.

3. Break the intake into note chunks.
   - Split the intake into meaningful notes, claims, wishes, constraints, examples,
     feature ideas, user details, and open questions.
   - Preserve each chunk as close to verbatim as possible.
   - Do not rewrite vague material into certainty.

4. Place chunks into folders only where they actually belong.
   - A note can go into more than one folder only if it genuinely supports more than
     one category.
   - If a note does not clearly belong anywhere, keep it in the preserved original
     intake or an unsorted / needs-clarification area.
   - Do not fill folders with generic invented material just to make the folder look
     stronger.

5. Rate each folder from 1 to 4 stars.
   - Rate based only on the original intake plus later user-added notes.
   - The rating should reflect whether that folder has enough usable information for
     a real project foundation.
   - The app should show the rating plainly.

6. Calculate Library readiness conservatively.
   - Do not allow the idea to reach 90% readiness unless every required folder has 3
     or 4 stars.
   - Any required folder under 3 stars blocks Review.
   - Progress should reflect the weakest required foundation areas, not the amount of
     text submitted.

7. Ask focused questions for folders under 3 stars.
   - Ask questions tied to the weak folder, not broad generic prompts.
   - Let the user add freeform notes at the bottom.
   - Treat new answers as additive notes, not replacements for the original intake.

8. Re-sort new notes after the user answers.
   - Add new answers to the right folder as preserved notes.
   - Re-rate affected folders.
   - Keep the original intake unchanged.

9. Unlock Review only when all required folders are 3 or 4 stars.
   - The Review button should stay disabled or clearly blocked until every required
     folder meets the threshold.
   - Optional or future-only material can remain lower if it is explicitly marked
     nonblocking.

10. Generate one master Library review.
    - Build the review from the folder information.
    - Include the original intake unchanged, the organized folder notes, folder
      ratings, remaining open questions, and a clean project-foundation summary.
    - Do not pretend unresolved items are solved.

11. Preserve auditability.
    - Show what came from the original intake versus what was added later.
    - Make review claims traceable back to folder notes where possible.

## Folder Rating Rubric

### 1 Star: Very Weak

- Folder is empty, almost empty, confusing, or based on one vague statement.
- There is not enough information to build from.
- Clarity should ask direct foundation questions before the idea moves forward.

### 2 Stars: Needs Help

- Folder has some useful material, but it is incomplete, generic, contradictory, or
  too thin.
- A person can kind of understand the intent, but not enough to guide a builder
  safely.
- Clarity should ask focused follow-up questions or invite more notes.

### 3 Stars: Good

- Folder has enough clear, usable information for the next stage.
- Some details may still be open, but the foundation is understandable.
- Clarity can include it in the master review with any remaining questions marked
  plainly.

### 4 Stars: Ready

- Folder is clear, specific, and strong.
- It has enough detail to guide planning or implementation without major guessing.
- There may still be future refinements, but the current foundation is solid.

## Connected Clarity Behavior

When Clarity is connected, the app should:

- Send Clarity the unchanged original intake plus the current folder state.
- Ask Clarity to sort notes into folders, rate folder strength, identify weak
  folders, and generate focused questions.
- Let Clarity produce the final master Library review once all required folders are
  3 or 4 stars.
- Preserve Clarity's reasoning / status labels so the user can see what is strong,
  weak, missing, or future-only.
- Keep Clarity inside her lane: she can organize, question, rate foundation
  strength, and prepare the review; she should not make final product, launch,
  spending, routing, or authority decisions.

## Offline Backup Behavior

When Clarity is not connected, the app should:

- Use deterministic backup logic that follows the same rules.
- Preserve the original intake unchanged.
- Split intake into chunks and assign them to folders using conservative category
  matching.
- Rate folders honestly using the 1-4 rubric.
- Block 90% readiness and Review until all required folders are at least 3 stars.
- Use prewritten fallback questions for weak folders.
- Label the output as backup Library logic, not as a full Clarity review.
- Avoid generating confident claims from missing information.

## User-Facing Wording

Library intro:

> Your original idea is safe. The Library sorts it into foundation folders so you
> can strengthen the parts that are still thin before creating the review.

Weak folder:

> This folder needs a little more foundation before Review. Add notes below or
> answer the focused questions.

Blocked Review:

> Review unlocks when every required folder is at 3 or 4 stars. A few folders still
> need stronger notes.

Folder notes:

> These notes came from your intake. Add more at the bottom if something is missing.

Readiness:

> Progress reflects foundation strength, not just how much text you added.

Final Review:

> This review is built from your Library folders and keeps your original intake
> unchanged.

## Implementation Guardrail

The app should treat the star rating as a gate, not decoration. If a folder is
weak, the system should say it is weak and help the user strengthen it. The Library
stage should reward clarity, not volume, and it should never inflate progress by
filling gaps with invented details.
