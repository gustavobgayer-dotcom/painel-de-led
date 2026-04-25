import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listSuppliers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("suppliers")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((r) => r.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
  },
});

export const listSuppliersWithCount = query({
  args: {},
  handler: async (ctx) => {
    const suppliers = await ctx.db
      .query("suppliers")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((r) => r.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));

    return await Promise.all(
      suppliers.map(async (supplier) => {
        const campaigns = await ctx.db
          .query("panel_campaigns")
          .withIndex("by_supplier", (q) => q.eq("supplierId", supplier._id))
          .collect();
        return { supplier, campaignCount: campaigns.length };
      })
    );
  },
});

export const createSupplier = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db.insert("suppliers", {
      name,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const deleteSupplier = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false });
  },
});
