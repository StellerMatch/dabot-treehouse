# Treehouse Manual Dispatch Run Card

## Current Fake Project

- Working name: `Real Estate Media Tool`
- Project type: fake local proof project
- Current local status: `ready_for_chief_review_local_only`
- Current proof file: `test-results/treehouse-fake-project-status/real-estate-media-tool-local-proof.json`

## What Is Ready

The safe local chain is proven:

1. Idea entered.
2. Treehouse generates a short working name.
3. Idea saves locally.
4. `/levels` reads the active project.
5. A Treehouse action button creates a local packet.
6. Steward receives the packet.
7. Trend Watch exists as a local planned slot.
8. Chief manual dispatch prep marks the packet ready for review.

## Boss Phone Command

When Boss is ready, he can say:

```text
Chief, manually review the Real Estate Media Tool packet for dispatch.
```

That means Chief may review the local packet and report the next recommended safe step.

## What The Command Does Not Mean Yet

It does not mean:

- approve dispatch automatically;
- fire n8n;
- notify bots;
- use credentials;
- deploy;
- spend money;
- publish anything;
- change runtime/config;
- change authority.

## Local Commands

```bash
npm run test:treehouse-fake-project
npm run prep:treehouse-dispatch
```

Use `npm run test:treehouse-fake-project` for the full local proof.
Use `npm run prep:treehouse-dispatch` only to mark Steward-received packets ready for Chief review.

## Next Human Decision

Boss needs to choose the first real dispatch lane after Chief review:

- keep manual Chief review only;
- prepare Steward queue review;
- later connect approved packets to n8n.

Recommended next choice: keep manual Chief review for one more run before any n8n connection.

## Boundary

This run card is documentation only. It does not approve automation, dispatch, n8n, bot notifications, credentials, deployment, spending, public actions, runtime/config changes, or authority changes.
