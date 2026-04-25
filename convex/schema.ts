import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Fatores de localização para cálculo de impacto ───────────────────────
  location_factors: defineTable({
    country: v.string(),
    state: v.string(),
    city: v.optional(v.string()),
    averagePeoplePerCar: v.number(),
  }).index("by_state_city", ["state", "city"]),

  // ─── Painéis de LED ────────────────────────────────────────────────────────
  panels: defineTable({
    name: v.string(),
    companyName: v.string(),
    address: v.string(),
    responsible: v.string(),
    email: v.string(),
    // Localização para cálculo de impacto
    locationCountry: v.string(),
    locationState: v.string(),
    locationCity: v.optional(v.string()),
    dailyCarTraffic: v.number(),
    // Fase de construção / operação
    status: v.union(
      v.literal("construction"),
      v.literal("active"),
      v.literal("inactive")
    ),
    totalSlots: v.optional(v.number()),
    constructionStartDate: v.optional(v.string()),
    constructionEndDate: v.optional(v.string()),
    operationReleaseDate: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_state", ["locationState"]),

  // ─── Investimentos do painel ───────────────────────────────────────────────
  panel_investments: defineTable({
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
    createdAt: v.number(),
  }).index("by_panel", ["panelId"]),

  // ─── Campanhas pagas por empresas ─────────────────────────────────────────
  panel_campaigns: defineTable({
    panelId: v.id("panels"),
    companyName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    totalAmount: v.number(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_panel", ["panelId"])
    .index("by_panel_startDate", ["panelId", "startDate"]),

  // ─── Tipos de conteúdo (configurável) ────────────────────────────────────
  content_categories: defineTable({
    label: v.string(),
    isDefault: v.optional(v.boolean()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }),

  // ─── Conteúdos do painel ──────────────────────────────────────────────────
  content_items: defineTable({
    panelId: v.optional(v.id("panels")),
    campaignId: v.optional(v.id("panel_campaigns")),
    title: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
    contentCategory: v.optional(v.id("content_categories")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    source: v.optional(v.union(v.literal("cassol"), v.literal("fornecedor"))),
    body: v.optional(v.string()),
    fileRef: v.optional(v.string()),
    duration: v.optional(v.number()),
    slotNumber: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_approval"),
      v.literal("scheduled"),
      v.literal("active"),
    ),
    scheduledWeekStart: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_panel", ["panelId"])
    .index("by_panel_status", ["panelId", "status"])
    .index("by_panel_week", ["panelId", "scheduledWeekStart"])
    .index("by_campaign", ["campaignId"]),

  // ─── Checklist — templates de tarefas ─────────────────────────────────────
  checklist_templates: defineTable({
    panelId: v.id("panels"),
    label: v.string(),
    recurrence: v.union(v.literal("daily"), v.literal("weekly")),
    dayOfWeek: v.optional(v.number()),
    order: v.number(),
    isActive: v.boolean(),
  }).index("by_panel", ["panelId"]),

  // ─── Checklist — registros de conclusão ───────────────────────────────────
  checklist_completions: defineTable({
    templateId: v.id("checklist_templates"),
    panelId: v.id("panels"),
    completedAt: v.number(),
    dateKey: v.string(),
    note: v.optional(v.string()),
  })
    .index("by_dateKey", ["dateKey"])
    .index("by_templateId_dateKey", ["templateId", "dateKey"])
    .index("by_panel_dateKey", ["panelId", "dateKey"]),

  // ─── Manutenção — configurações de frequência ─────────────────────────────
  maintenance_configs: defineTable({
    panelId: v.id("panels"),
    maintenanceType: v.string(),
    frequency: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    estimatedCost: v.number(),
    isActive: v.boolean(),
  }).index("by_panel", ["panelId"]),

  // ─── Manutenção — histórico de registros ──────────────────────────────────
  maintenance_records: defineTable({
    panelId: v.id("panels"),
    maintenanceConfigId: v.optional(v.id("maintenance_configs")),
    date: v.string(),
    actualCost: v.number(),
    description: v.string(),
    performedBy: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_panel", ["panelId"])
    .index("by_panel_date", ["panelId", "date"]),
});
