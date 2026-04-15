import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listContentCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("content_categories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((r) => r.sort((a, b) => a.createdAt - b.createdAt));
  },
});

export const createContentCategory = mutation({
  args: { label: v.string() },
  handler: async (ctx, { label }) => {
    return await ctx.db.insert("content_categories", {
      label,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const deleteContentCategory = mutation({
  args: { id: v.id("content_categories") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false });
  },
});

const DEFAULT_CATEGORIES = ["Promocional", "Institucional", "Serviço"];

export const ensureDefaultCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("content_categories").collect();
    const existingLabels = new Set(existing.map((c) => c.label));
    for (const label of DEFAULT_CATEGORIES) {
      if (!existingLabels.has(label)) {
        await ctx.db.insert("content_categories", {
          label,
          isDefault: true,
          isActive: true,
          createdAt: Date.now(),
        });
      }
    }
  },
});
