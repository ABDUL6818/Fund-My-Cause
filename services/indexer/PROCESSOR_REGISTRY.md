# Per-Event-Type Processor Registry — services/indexer

## Background

`IMPLEMENTATION_NOTES.md` flagged the risk of a growing monolithic on-chain
event handler. This document records the split into per-contract-event
processors and the registry-based dispatch that replaces a single large
switch/if-else handler.

## Processor Modules

Each contract event family now has an isolated processor module under
`src/handlers/`:

| Event family  | Module                                              | Responsibility                                   |
|---------------|------------------------------------------------------|---------------------------------------------------|
| Crowdfund     | `handlers/crowdfund/campaign.handler.ts`             | Campaign created/updated/closed events            |
| Crowdfund     | `handlers/crowdfund/donation.handler.ts`             | Donation received/refunded events                 |
| Crowdfund     | `handlers/crowdfund/achievement.handler.ts`          | Achievement/milestone unlock events                |
| QF            | `handlers/qf/` (see module)                          | Quadratic-funding round contribution/match events |
| Registry      | `handlers/registry/registered.handler.ts`            | Project/org registration events                    |
| Achievements  | `handlers/crowdfund/achievement.handler.ts`          | Shared with crowdfund achievement events           |

Each processor module exports a pure function of the shape
`(event: RawContractEvent) => Promise<IndexedRecord[]>` (see
`handlers/types.ts`), so it can be unit tested against recorded sample
events without a live RPC connection or database.

## Registry-Based Dispatch

`handlers/dispatcher.ts` holds a `Map<EventType, EventProcessor>` keyed by
the normalized event type/topic signature. `handlers/index.ts` registers
each processor module against the map at startup:

```ts
registry.register("CampaignCreated", campaignHandler.process);
registry.register("DonationReceived", donationHandler.process);
registry.register("AchievementUnlocked", achievementHandler.process);
registry.register("ProjectRegistered", registeredHandler.process);
```

Dispatch for an incoming event is a single lookup:

```ts
const processor = registry.resolve(event.type);
if (!processor) {
  // unknown event type — logged and skipped, does not throw
  return { skipped: true, reason: "unregistered-event-type" };
}
return processor(event);
```

## Unit Test Coverage

- Each processor has a co-located `*.handler.test.ts` exercising it against
  recorded sample events (fixtures capture real decoded event payloads from
  each contract family).
- `handlers/dispatcher.test.ts` covers registry-based dispatch, including a
  case for an **unknown event type**, asserting the dispatcher returns a
  `skipped` result rather than throwing, so unrecognized future event types
  degrade gracefully instead of crashing the indexer loop.

## Behavioral Guarantee

No change in indexed data output for existing sample events: the processor
functions are extracted 1:1 from the previous monolithic handler logic, and
the existing indexer integration tests (`ingestion.integration.test.ts`,
`consistency.integration.test.ts`) assert against the same fixture set as
before the split, with identical expected output rows.
