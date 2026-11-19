/**
 * Resolver entrypoint (#1388).
 *
 * The resolver implementations now live in ./resolvers/* by domain. This
 * module re-exports them for backward compatibility — every existing
 * importer (`./resolvers.js`) keeps working without change.
 *
 * #1682/#1684: business logic has been moved out of the resolver entrypoints
 * into the injectable service classes (cache/contract/auth). Only resolvers
 * that back a live schema field (see `./schema.ts`) are exported here; dead
 * resolver exports were removed.
 */
export { resolvers } from "./resolvers/index.js";
export { CAMPAIGN_STATUS_ENUM_MAP } from "./resolvers/shared.js";
</｜｜DSML｜｜ parameter>