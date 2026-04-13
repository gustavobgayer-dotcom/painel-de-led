import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listContent = query({
  args: {
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
  },
  handler: async (ctx, { status, type }) => {
    let items = await ctx.db.query("content_items").collect();
    if (status) items = items.filter((i) => i.status === status);
    if (type) items = items.filter((i) => i.type === type);
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
    title: v.optional(v.string()),
    type: v.optional(
      v.union(v.literal("text"), v.literal("image"), v.literal("video"))
    ),
    body: v.optional(v.string()),
    fileRef: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("active"),
        v.literal("archived")
      )
    ),
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
