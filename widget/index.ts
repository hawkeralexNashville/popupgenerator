import type { VariantConfig } from "@/lib/schemas";
import { popupStyles } from "@/lib/popupStyles";

/** Standalone publisher widget. Bundled without external runtime dependencies. */
(() => {
  try {
    const script = document.currentScript as HTMLScriptElement | null;
    if (!script) return;
    const siteId = script.dataset.site;
    const base = new URL(script.src).origin;
    if (!siteId) return;

    type Campaign = {
      id: string;
      placement: "MODAL" | "INLINE";
      priority: number;
      trigger: { scrollPercent?: number; seconds?: number; exitIntent: boolean; logic: "ANY" | "ALL" };
      targeting: { articleOnly: boolean; includeUrls: string[]; excludeUrls: string[]; categories: string[]; tags: string[] };
      frequency: { kind: "session" | "days" | "custom"; days: number; subscriberDays: number };
      variants: { id: string; name: string; config: VariantConfig }[];
    };
    const store = {
      get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
      set: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Storage may be disabled. */ } },
    };
    const visitor = store.get("pg:visitor") || crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    store.set("pg:visitor", visitor);
    const hash = (value: string) => { let h = 2166136261; for (const char of value) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
    const glob = (pattern: string, value: string) => new RegExp("^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$", "i").test(value);
    const tokens = [...document.body.classList, ...Array.from(document.querySelectorAll('[rel="category tag"],.cat-links a,.tags-links a')).map((item) => item.textContent || "")].map((item) => item.toLowerCase().replace(/^(category|tag)-/, ""));
    const article = document.querySelector("article,.single-post,[itemtype*='Article']");
    const context = { url: location.href, article: Boolean(article) || document.body.classList.contains("single-post") };
    const eligible = (campaign: Campaign) => {
      const target = campaign.targeting;
      const until = +(store.get(`pg:dismiss:${campaign.id}`) || 0);
      const subscribed = +(store.get("pg:subscribed") || 0);
      return (!until || until < Date.now()) && (!subscribed || subscribed < Date.now()) && (!target.articleOnly || context.article) && !target.excludeUrls.some((x) => glob(x, context.url)) && (!target.includeUrls.length || target.includeUrls.some((x) => glob(x, context.url))) && (!target.categories.length || target.categories.some((x) => tokens.includes(x.toLowerCase()))) && (!target.tags.length || target.tags.some((x) => tokens.includes(x.toLowerCase())));
    };

    fetch(`${base}/api/public/sites/${encodeURIComponent(siteId)}/config`, { mode: "cors", credentials: "omit" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Config request failed (${response.status})`)))
      .then((data) => {
        const campaign = (data.campaigns as Campaign[]).find(eligible);
        if (!campaign) return;
        const variant = campaign.variants[hash(visitor + campaign.id) % campaign.variants.length];
        const fired = new Set<string>();
        const checks: (() => boolean)[] = [];
        if (campaign.trigger.scrollPercent !== undefined) checks.push(() => { const root = document.documentElement; return (scrollY / (root.scrollHeight - innerHeight || 1)) * 100 >= campaign.trigger.scrollPercent!; });
        if (campaign.trigger.seconds !== undefined) { checks.push(() => fired.has("time")); setTimeout(() => { fired.add("time"); test(); }, campaign.trigger.seconds * 1000); }
        if (campaign.trigger.exitIntent && innerWidth > 768) { checks.push(() => fired.has("exit")); document.addEventListener("mouseout", (event) => { if (event.clientY <= 0) { fired.add("exit"); test(); } }, { once: true }); }
        let shown = false;
        const test = () => {
          if (shown) return;
          const pass = !checks.length || (campaign.trigger.logic === "ALL" ? checks.every((check) => check()) : checks.some((check) => check()));
          if (pass) { shown = true; show(campaign, variant); }
        };
        addEventListener("scroll", test, { passive: true });
        test();
      })
      .catch((error) => console.error("Popup Generator could not load campaign configuration", error));

    function inlineInsertionPoint() {
      const containers = [
        "article .entry-content", "article .post-content", "article .wp-block-post-content",
        ".single-post .entry-content", ".single-post .post-content", ".wp-block-post-content", "article",
      ];
      for (const selector of containers) {
        const container = document.querySelector(selector);
        if (!container) continue;
        const paragraphs = Array.from(container.querySelectorAll(":scope > p, :scope > .wp-block-paragraph"));
        if (paragraphs.length >= 3) return paragraphs[Math.min(3, paragraphs.length - 1)];
      }
      return null;
    }

    function show(campaign: Campaign, variant: Campaign["variants"][number]) {
      const config = variant.config;
      const inline = campaign.placement === "INLINE";
      const point = inline ? inlineInsertionPoint() : null;
      if (inline && !point) {
        console.warn("Popup Generator did not find a safe inline article insertion point");
        return;
      }
      const host = document.createElement("div");
      const shadow = host.attachShadow({ mode: "closed" });
      host.style.cssText = inline ? "display:block;position:relative;margin:32px 0;clear:both" : "position:fixed;z-index:2147483000;inset:0;pointer-events:none";
      const style = document.createElement("style");
      style.textContent = popupStyles(config);
      const veil = document.createElement("div");
      veil.className = `pg-veil ${inline ? "pg-inline" : config.presentation === "slide-up" ? "pg-slide-up" : ""}`;
      const box = document.createElement("section");
      box.className = `pg-box pg-${config.layout} ${!config.imageUrl || config.layout === "no-image" ? "pg-no-image" : ""}`;
      box.setAttribute("aria-label", config.headline);
      if (!inline) { box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); }
      const content = document.createElement("div");
      content.className = "pg-content";
      const heading = document.createElement("h2");
      const copy = document.createElement("p");
      const form = document.createElement("form");
      const email = document.createElement("input");
      const submit = document.createElement("button");
      const small = document.createElement("div");
      heading.className = "pg-heading"; copy.className = "pg-copy"; form.className = "pg-form";
      heading.textContent = config.headline; copy.textContent = config.body;
      email.className = "pg-email"; email.type = "email"; email.required = true; email.placeholder = config.emailPlaceholder;
      submit.className = "pg-submit"; submit.textContent = config.cta;
      small.className = "pg-small"; small.textContent = config.supportingText;
      form.append(email, submit); content.append(heading, copy, form, small);
      if (config.imageUrl && config.layout !== "no-image") { const frame = document.createElement("div"); const image = document.createElement("img"); frame.className = `pg-img-frame ${config.imageAspectRatio === "original" ? "pg-original" : ""} ${config.hideImageMobile ? "pg-hide-mobile" : ""}`; image.className = "pg-img"; image.src = config.imageUrl; image.alt = ""; frame.append(image); box.append(frame); }
      if (!inline && config.closeButton) { const close = document.createElement("button"); close.className = "pg-close"; close.textContent = "×"; close.setAttribute("aria-label", "Close signup"); close.onclick = dismiss; box.append(close); }
      box.append(content); veil.append(box); shadow.append(style, veil);
      if (inline) point!.after(host); else document.body.append(host);
      if (!inline) email.focus({ preventScroll: true });

      const eventId = `${visitor}:${campaign.id}:${Date.now()}`;
      const payload = { siteId, campaignId: campaign.id, variantId: variant.id, type: "IMPRESSION", idempotencyKey: eventId, device: innerWidth < 768 ? "mobile" : "desktop", path: location.pathname, referrerHost: document.referrer ? new URL(document.referrer).hostname : undefined };
      const body = JSON.stringify(payload);
      if (!navigator.sendBeacon?.(`${base}/api/public/events`, new Blob([body], { type: "application/json" }))) fetch(`${base}/api/public/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch((error) => console.error("Popup Generator could not record impression", error));
      function dismiss() { const expires = campaign.frequency.kind === "session" ? Number.MAX_SAFE_INTEGER : Date.now() + campaign.frequency.days * 86400000; store.set(`pg:dismiss:${campaign.id}`, String(expires)); host.remove(); }
      if (!inline) veil.onclick = (event) => { if (event.target === veil) dismiss(); };
      form.onsubmit = (event) => { event.preventDefault(); submit.disabled = true; submit.textContent = "Joining…"; fetch(`${base}/api/public/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.value, siteId, campaignId: campaign.id, variantId: variant.id, idempotencyKey: eventId }) }).then(async (response) => { if (!response.ok) throw new Error((await response.json()).error); store.set("pg:subscribed", String(Date.now() + campaign.frequency.subscriberDays * 86400000)); content.replaceChildren(Object.assign(document.createElement("h2"), { textContent: "You're in!" }), Object.assign(document.createElement("p"), { textContent: "Thanks for subscribing." })); if (!inline) setTimeout(() => host.remove(), 1800); }).catch((error) => { small.textContent = error.message || "Please try again."; small.className = "pg-small pg-error"; submit.disabled = false; submit.textContent = config.cta; }); };
    }
  } catch (error) {
    console.error("Popup Generator widget failed unexpectedly", error);
  }
})();
