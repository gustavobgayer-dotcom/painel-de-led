import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listContent = query({
  args: {
    panelId: v.optional(v.id("panels")),
    panelIds: v.optional(v.array(v.id("panels"))),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("active"),
        v.literal("archived")
      )
    ),
    type: v.optional(
      v.union(v.literal("text"), v.literal("image"), v.literal("video"))
    ),
    scheduledWeekStart: v.optional(v.string()),
  },
  handler: async (ctx, { panelId, panelIds, status, type, scheduledWeekStart }) => {
    let items;

    if (panelId) {
      if (scheduledWeekStart) {
        items = await ctx.db
          .query("content_items")
          .withIndex("by_panel_week", (q) =>
            q.eq("panelId", panelId).eq("scheduledWeekStart", scheduledWeekStart)
          )
          .collect();
      } else if (status) {
        items = await ctx.db
          .query("content_items")
          .withIndex("by_panel_status", (q) =>
            q.eq("panelId", panelId).eq("status", status)
          )
          .collect();
      } else {
        items = await ctx.db
          .query("content_items")
          .withIndex("by_panel", (q) => q.eq("panelId", panelId))
          .collect();
      }
    } else if (panelIds && panelIds.length > 0) {
      const results = await Promise.all(
        panelIds.map((pid) =>
          ctx.db
            .query("content_items")
            .withIndex("by_panel", (q) => q.eq("panelId", pid))
            .collect()
        )
      );
      items = results.flat();
    } else {
      items = await ctx.db.query("content_items").collect();
    }

    if (status && !panelId) items = items.filter((i) => i.status === status);
    if (type) items = items.filter((i) => i.type === type);
    if (scheduledWeekStart && !panelId)
      items = items.filter((i) => i.scheduledWeekStart === scheduledWeekStart);

    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getContent = query({
  args: { id: v.id("content_items") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const createContent = mutation({
  args: {
    panelId: v.id("panels"),
    campaignId: v.optional(v.id("panel_campaigns")),
    title: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
    source: v.union(v.literal("cassol"), v.literal("fornecedor")),
    body: v.optional(v.string()),
    fileRef: v.optional(v.string()),
    duration: v.optional(v.number()),
    slotNumber: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("archived")
    ),
    scheduledWeekStart: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("content_items", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateContent = mutation({
  args: {
    id: v.id("content_items"),
    campaignId: v.optional(v.id("panel_campaigns")),
    title: v.optional(v.string()),
    type: v.optional(
      v.union(v.literal("text"), v.literal("image"), v.literal("video"))
    ),
    source: v.optional(
      v.union(v.literal("cassol"), v.literal("fornecedor"))
    ),
    body: v.optional(v.string()),
    fileRef: v.optional(v.string()),
    duration: v.optional(v.number()),
    slotNumber: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("active"),
        v.literal("archived")
      )
    ),
    scheduledWeekStart: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const deleteContent = mutation({
  args: { id: v.id("content_items") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
