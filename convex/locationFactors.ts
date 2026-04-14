import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listLocationFactors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("location_factors").collect();
  },
});

export const getFactorForPanel = query({
  args: {
    state: v.string(),
    city: v.optional(v.string()),
    country: v.string(),
  },
  handler: async (ctx, { state, city, country }) => {
    // 1. Busca fator por cidade + estado (mais específico)
    if (city) {
      const byCity = await ctx.db
        .query("location_factors")
        .withIndex("by_state_city", (q) =>
          q.eq("state", state).eq("city", city)
        )
        .first();
      if (byCity) return byCity;
    }

    // 2. Busca só por estado
    const byState = await ctx.db
      .query("location_factors")
      .withIndex("by_state_city", (q) => q.eq("state", state))
      .filter((q) => q.eq(q.field("city"), undefined))
      .first();
    if (byState) return byState;

    // 3. Busca por país
    const byCountry = await ctx.db
      .query("location_factors")
      .filter((q) => q.eq(q.field("country"), country))
      .filter((q) => q.eq(q.field("state"), undefined))
      .first();
    return byCountry ?? null;
  },
});

export const createLocationFactor = mutation({
  args: {
    country: v.string(),
    state: v.string(),
    city: v.optional(v.string()),
    averagePeoplePerCar: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("location_factors", args);
  },
});

export const updateLocationFactor = mutation({
  args: {
    id: v.id("location_factors"),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    averagePeoplePerCar: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const deleteLocationFactor = mutation({
  args: { id: v.id("location_factors") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
