/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as campaigns from "../campaigns.js";
import type * as checklist from "../checklist.js";
import type * as content from "../content.js";
import type * as contentCategories from "../contentCategories.js";
import type * as investments from "../investments.js";
import type * as locationFactors from "../locationFactors.js";
import type * as maintenance from "../maintenance.js";
import type * as panels from "../panels.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  campaigns: typeof campaigns;
  checklist: typeof checklist;
  content: typeof content;
  contentCategories: typeof contentCategories;
  investments: typeof investments;
  locationFactors: typeof locationFactors;
  maintenance: typeof maintenance;
  panels: typeof panels;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
