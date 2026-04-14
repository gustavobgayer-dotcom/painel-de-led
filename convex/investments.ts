import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listInvestments = query({
  args: { panelId: v.id("panels") },
  handler: async (ctx, { panelId }) => {
    return await ctx.db
      .query("panel_investments")
      .withIndex("by_panel", (q) => q.eq("panelId", panelId))
      .collect()
      .then((r) => r.sort((a, b) => b.date.localeCompare(a.date)));
  },
});

export const createInvestment = mutation({
  args: {
    panelId: v.id("panels"),
    category: v.union(
      v.literal("materials"),
      v.literal("government"),
      v.literal("software"),
      v.literal("other")
    ),
    description: v.string(),
    amount: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("panel_investments", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateInvestment = mutation({
  args: {
    id: v.id("panel_investments"),
    category: v.optional(
      v.union(
        v.literal("materials"),
        v.literal("government"),
        v.literal("software"),
        v.literal("other")
      )
    ),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const deleteInvestment = mutation({
  args: { id: v.id("panel_investments") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
