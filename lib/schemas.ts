import { z } from "zod";

export const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const variantConfigSchema = z.object({
  headline: z.string().min(1).max(120), body: z.string().max(500), supportingText: z.string().max(160).default(""),
  emailPlaceholder: z.string().max(80).default("Email address"), cta: z.string().min(1).max(60), imageUrl: z.string().url().or(z.literal("")).default(""),
  imagePosition: z.enum(["top", "left", "right"]).default("top"), imageSize: z.number().min(20).max(60).default(40), hideImageMobile: z.boolean().default(false),
  imageWidth: z.number().min(80).max(600).default(240), imageHeight: z.number().min(60).max(400).default(220),
  imageAspectRatio: z.enum(["square", "4:3", "portrait", "original"]).default("original"),
  imageFit: z.enum(["cover", "contain"]).default("cover"), imageVerticalAlign: z.enum(["top", "center", "bottom"]).default("center"),
  horizontalImagePercent: z.union([z.literal(25), z.literal(33), z.literal(40), z.literal(50)]).default(33),
  horizontalGap: z.number().min(0).max(80).default(20), innerPadding: z.number().min(12).max(64).default(32),
  layout: z.enum(["vertical", "horizontal", "no-image", "wide"]), presentation: z.enum(["modal", "slide-up", "focus"]),
  fontFamily: z.enum(["system", "serif", "modern"]), headlineFont: z.enum(["system", "serif", "modern"]).default("system"),
  fontSize: z.number().min(14).max(22), headlineSize: z.number().min(20).max(52), fontWeight: z.enum(["400", "500", "600", "700"]),
  align: z.enum(["left", "center"]), lineHeight: z.number().min(1).max(2), background: hex, textColor: hex, headlineColor: hex,
  buttonBackground: hex, buttonText: hex, inputBackground: hex, borderColor: hex, buttonRadius: z.number().min(0).max(40), buttonPadding: z.number().min(8).max(24),
  inputHeight: z.number().min(34).max(64).default(44), buttonHeight: z.number().min(34).max(64).default(42),
  inputRadius: z.number().min(0).max(30).default(8), inputFontSize: z.number().min(12).max(20).default(16), buttonFontSize: z.number().min(12).max(20).default(14),
  buttonFullWidth: z.boolean(), buttonAlign: z.enum(["left", "center", "right"]), closeButton: z.boolean().default(true),
  inputWidth: z.number().min(25).max(100).default(100), buttonWidth: z.number().min(25).max(100).default(100),
});
export const triggerSchema = z.object({ scrollPercent: z.number().min(0).max(100).optional(), seconds: z.number().min(0).max(3600).optional(), exitIntent: z.boolean().default(false), logic: z.enum(["ANY", "ALL"]).default("ANY") });
export const targetingSchema = z.object({ articleOnly: z.boolean().default(true), includeUrls: z.array(z.string().max(300)).max(30).default([]), excludeUrls: z.array(z.string().max(300)).max(30).default([]), categories: z.array(z.string().max(80)).max(30).default([]), tags: z.array(z.string().max(80)).max(30).default([]) });
export const frequencySchema = z.object({ kind: z.enum(["session", "days", "custom"]), days: z.number().min(0).max(365).default(7), subscriberDays: z.number().min(1).max(3650).default(365) });
export const campaignPlacementSchema = z.enum(["MODAL", "INLINE"]);
export const inlinePlacementSchema = z.object({
  firstAfter: z.number().int().min(1).max(100).default(4),
  repeatEvery: z.number().int().min(3).max(100).default(10),
  maxInsertions: z.number().int().min(1).max(10).default(3),
});
export type InlinePlacement = z.infer<typeof inlinePlacementSchema>;
export type VariantConfig = z.infer<typeof variantConfigSchema>;
export const defaultVariant: VariantConfig = { headline:"Join the newsletter", body:"The best stories, delivered straight to your inbox.", supportingText:"No spam. Unsubscribe anytime.", emailPlaceholder:"Email address", cta:"Sign me up", imageUrl:"", imagePosition:"top", imageSize:40, imageWidth:240, imageHeight:220, imageAspectRatio:"original", imageFit:"cover", imageVerticalAlign:"center", horizontalImagePercent:33, horizontalGap:20, innerPadding:32, hideImageMobile:true, layout:"vertical", presentation:"focus", fontFamily:"system", headlineFont:"system", fontSize:16, headlineSize:32, fontWeight:"600", align:"center", lineHeight:1.4, background:"#ffffff", textColor:"#475569", headlineColor:"#0f172a", buttonBackground:"#6366f1", buttonText:"#ffffff", inputBackground:"#ffffff", borderColor:"#cbd5e1", buttonRadius:10, buttonPadding:13, inputHeight:44, buttonHeight:42, inputRadius:8, inputFontSize:16, buttonFontSize:14, buttonFullWidth:true, buttonWidth:100, inputWidth:100, buttonAlign:"center", closeButton:true };
