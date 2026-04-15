import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listPanels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("panels")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((r) => r.sort((a, b) => a.createdAt - b.createdAt));
  },
});

export const getPanel = query({
  args: { id: v.id("panels") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const createPanel = mutation({
  args: {
    name: v.string(),
    companyName: v.string(),
    address: v.string(),
    responsible: v.string(),
    email: v.string(),
    locationCountry: v.string(),
    locationState: v.string(),
    locationCity: v.optional(v.string()),
    dailyCarTraffic: v.number(),
    totalSlots: v.optional(v.number()),
    status: v.union(
      v.literal("construction"),
      v.literal("active"),
      v.literal("inactive")
    ),
    constructionStartDate: v.optional(v.string()),
    constructionEndDate: v.optional(v.string()),
    operationReleaseDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("panels", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updatePanel = mutation({
  args: {
    id: v.id("panels"),
    name: v.optional(v.string()),
    companyName: v.optional(v.string()),
    address: v.optional(v.string()),
    responsible: v.optional(v.string()),
    email: v.optional(v.string()),
    locationCountry: v.optional(v.string()),
    locationState: v.optional(v.string()),
    locationCity: v.optional(v.string()),
    dailyCarTraffic: v.optional(v.number()),
    totalSlots: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("construction"),
        v.literal("active"),
        v.literal("inactive")
      )
    ),
    constructionStartDate: v.optional(v.string()),
    constructionEndDate: v.optional(v.string()),
    operationReleaseDate: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const deletePanel = mutation({
  args: { id: v.id("panels") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false });
  },
});
