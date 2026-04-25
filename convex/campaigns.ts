import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listCampaigns = query({
  args: { panelId: v.id("panels") },
  handler: async (ctx, { panelId }) => {
    return await ctx.db
      .query("panel_campaigns")
      .withIndex("by_panel_startDate", (q) => q.eq("panelId", panelId))
      .collect()
      .then((r) => r.sort((a, b) => b.startDate.localeCompare(a.startDate)));
  },
});

export const getCampaign = query({
  args: { id: v.id("panel_campaigns") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const createCampaign = mutation({
  args: {
    panelId: v.id("panels"),
    companyName: v.string(),
    name: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    startDate: v.string(),
    endDate: v.string(),
    totalAmount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("panel_campaigns", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateCampaign = mutation({
  args: {
    id: v.id("panel_campaigns"),
    companyName: v.optional(v.string()),
    name: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const deleteCampaign = mutation({
  args: { id: v.id("panel_campaigns") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
