import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Configurações de manutenção ─────────────────────────────────────────────

export const listMaintenanceConfigs = query({
  args: { panelId: v.id("panels") },
  handler: async (ctx, { panelId }) => {
    return await ctx.db
      .query("maintenance_configs")
      .withIndex("by_panel", (q) => q.eq("panelId", panelId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const createMaintenanceConfig = mutation({
  args: {
    panelId: v.id("panels"),
    maintenanceType: v.string(),
    frequency: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    estimatedCost: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("maintenance_configs", {
      ...args,
      isActive: true,
    });
  },
});

export const updateMaintenanceConfig = mutation({
  args: {
    id: v.id("maintenance_configs"),
    maintenanceType: v.optional(v.string()),
    frequency: v.optional(
      v.union(
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("quarterly"),
        v.literal("yearly")
      )
    ),
    estimatedCost: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const deleteMaintenanceConfig = mutation({
  args: { id: v.id("maintenance_configs") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false });
  },
});

// ─── Registros de manutenção ──────────────────────────────────────────────────

export const listMaintenanceRecords = query({
  args: {
    panelId: v.id("panels"),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
  },
  handler: async (ctx, { panelId, from, to }) => {
    const records = await ctx.db
      .query("maintenance_records")
      .withIndex("by_panel_date", (q) => q.eq("panelId", panelId))
      .collect();

    return records
      .filter((r) => {
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const createMaintenanceRecord = mutation({
  args: {
    panelId: v.id("panels"),
    maintenanceConfigId: v.optional(v.id("maintenance_configs")),
    date: v.string(),
    actualCost: v.number(),
    description: v.string(),
    performedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("maintenance_records", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateMaintenanceRecord = mutation({
  args: {
    id: v.id("maintenance_records"),
    date: v.optional(v.string()),
    actualCost: v.optional(v.number()),
    description: v.optional(v.string()),
    performedBy: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const deleteMaintenanceRecord = mutation({
  args: { id: v.id("maintenance_records") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
