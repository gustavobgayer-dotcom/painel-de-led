import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("checklist_templates")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((r) => r.sort((a, b) => a.order - b.order));
  },
});

export const listAllTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("checklist_templates")
      .collect()
      .then((r) => r.sort((a, b) => a.order - b.order));
  },
});

export const listCompletionsForDate = query({
  args: { dateKey: v.string() },
  handler: async (ctx, { dateKey }) => {
    return await ctx.db
      .query("checklist_completions")
      .withIndex("by_dateKey", (q) => q.eq("dateKey", dateKey))
      .collect();
  },
});

export const listCompletionHistory = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }) => {
    const all = await ctx.db.query("checklist_completions").collect();
    return all.filter((c) => c.dateKey >= from && c.dateKey <= to);
  },
});

export const createTemplate = mutation({
  args: {
    label: v.string(),
    recurrence: v.union(v.literal("daily"), v.literal("weekly")),
    dayOfWeek: v.optional(v.number()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("checklist_templates", {
      ...args,
      isActive: true,
    });
  },
});

export const updateTemplate = mutation({
  args: {
    id: v.id("checklist_templates"),
    label: v.optional(v.string()),
    recurrence: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"))
    ),
    dayOfWeek: v.optional(v.number()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const deleteTemplate = mutation({
  args: { id: v.id("checklist_templates") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false });
  },
});

export const toggleCompletion = mutation({
  args: {
    templateId: v.id("checklist_templates"),
    dateKey: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { templateId, dateKey, note }) => {
    const existing = await ctx.db
      .query("checklist_completions")
      .withIndex("by_templateId_dateKey", (q) =>
        q.eq("templateId", templateId).eq("dateKey", dateKey)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("checklist_completions", {
        templateId,
        dateKey,
        completedAt: Date.now(),
        note,
      });
    }
  },
});

export const deleteCompletion = mutation({
  args: { id: v.id("checklist_completions") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
