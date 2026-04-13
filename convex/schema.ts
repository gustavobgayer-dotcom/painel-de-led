import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  content_items: defineTable({
    title: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
    body: v.optional(v.string()),
    fileRef: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("archived")
    ),
    scheduledAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_scheduledAt", ["scheduledAt"]),

  checklist_templates: defineTable({
    label: v.string(),
    recurrence: v.union(v.literal("daily"), v.literal("weekly")),
    dayOfWeek: v.optional(v.number()),
    order: v.number(),
    isActive: v.boolean(),
  }),

  checklist_completions: defineTable({
    templateId: v.id("checklist_templates"),
    completedAt: v.number(),
    dateKey: v.string(),
    note: v.optional(v.string()),
  })
    .index("by_dateKey", ["dateKey"])
    .index("by_templateId_dateKey", ["templateId", "dateKey"]),
});
