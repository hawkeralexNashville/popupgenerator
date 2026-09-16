import type { VariantConfig } from "@/lib/schemas";
import { popupStyles } from "@/lib/popupStyles";
import { observeViewableOnce } from "@/lib/viewability";
import { inlineInsertionIndexes, startCampaignDisplay } from "@/lib/widget-display";

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
      inlinePlacement: { firstAfter: number; repeatEvery: number; maxInsertions: number };
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
      .then(async (data) => {
        const campaign = (data.campaigns as Campaign[]).find(eligible);
        if (!campaign) return;
        const assignmentResponse = await fetch(`${base}/api/public/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: visitor, siteId, campaignId: campaign.id }), mode: "cors", credentials: "omit" });
        if (!assignmentResponse.ok) throw new Error(`Assignment request failed (${assignmentResponse.status})`);
        const assigned = (await assignmentResponse.json()).variant as { id: string; config: VariantConfig };
        const variant = { id: assigned.id, name: "", config: assigned.config };
        startCampaignDisplay(campaign.placement, campaign.trigger, () => show(campaign, variant), {
          scrollPercent: () => { const root = document.documentElement; return (scrollY / (root.scrollHeight - innerHeight || 1)) * 100; },
          onScroll: (callback) => addEventListener("scroll", callback, { passive: true }),
          after: (callback, milliseconds) => { setTimeout(callback, milliseconds); },
          onExitIntent: (callback) => document.addEventListener("mouseout", (event) => { if (event.clientY <= 0) callback(); }, { once: true }),
          isDesktop: () => innerWidth > 768,
        });
      })
      .catch((error) => console.error("Popup Generator could not load campaign configuration", error));

    function inlineInsertionPoints(settings: Campaign["inlinePlacement"]) {
      const selectors = [
        "article .entry-content", "article .post-content", "article .wp-block-post-content",
        ".single-post .entry-content", ".single-post .post-content", ".single-post .wp-block-post-content",
        "main article", ".entry-content", ".post-content", ".wp-block-post-content", "article",
      ];
      const unsafe = "img,picture,figure,video,audio,iframe,table,blockquote,ul,ol,form,[class*='ad-'],[class*='advert'],[data-ad]";
      for (const selector of selectors) {
        const container = document.querySelector(selector);
        if (!container) continue;
        const paragraphs = Array.from(container.children).filter((child): child is HTMLParagraphElement =>
          child.tagName === "P" && Boolean(child.textContent?.trim()) && !child.querySelector(unsafe),
        );
        const points = inlineInsertionIndexes(paragraphs.length, settings).map((index) => paragraphs[index]);
        if (points.length) return points;
      }
      return [];
    }

    function recordImpression(campaign: Campaign, variant: Campaign["variants"][number], eventId: string) {
      const payload = { visitorId: visitor, siteId, campaignId: campaign.id, variantId: variant.id, type: "IMPRESSION", idempotencyKey: eventId, device: innerWidth < 768 ? "mobile" : "desktop", path: location.pathname, referrerHost: document.referrer ? new URL(document.referrer).hostname : undefined };
      fetch(`${base}/api/public/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        mode: "cors",
        credentials: "omit",
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Impression request failed (${response.status})`);
        })
        .catch((error) => console.error("Popup Generator could not record impression", error));
    }

    function buildSignup(campaign: Campaign, variant: Campaign["variants"][number], inline: boolean, onDismiss?: () => void) {
      const config = variant.config;
      const host = document.createElement("div");
      const shadow = host.attachShadow({ mode: "closed" });
      host.style.cssText = inline ? "display:block;position:relative;margin:32px 0;clear:both" : "position:fixed;z-index:2147483000;inset:0;pointer-events:none";
      const style = document.createElement("style");
      style.textContent = popupStyles(config);
      const root = document.createElement("div");
      root.className = inline ? "pg-inline-root" : `pg-veil ${config.presentation === "slide-up" ? "pg-slide-up" : ""}`;
      const box = document.createElement("section");
      box.className = `pg-box pg-${config.layout} ${!config.imageUrl || config.layout === "no-image" ? "pg-no-image" : ""}`;
      box.setAttribute("aria-label", config.headline);
      if (!inline) { box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); }
      const content = document.createElement("div");
      content.className = "pg-content";
      const heading = document.createElement("h2"); const copy = document.createElement("p"); const form = document.createElement("form");
      const email = document.createElement("input"); const submit = document.createElement("button"); const small = document.createElement("div");
      heading.className = "pg-heading"; copy.className = "pg-copy"; form.className = "pg-form";
      heading.textContent = config.headline; copy.textContent = config.body;
      email.className = "pg-email"; email.type = "email"; email.required = true; email.placeholder = config.emailPlaceholder;
      submit.className = "pg-submit"; submit.textContent = config.cta;
      small.className = "pg-small"; small.textContent = config.supportingText;
      form.append(email, submit); content.append(heading, copy, form, small);
      if (config.imageUrl && config.layout !== "no-image") { const frame = document.createElement("div"); const image = document.createElement("img"); frame.className = `pg-img-frame ${config.imageAspectRatio === "original" ? "pg-original" : ""} ${config.hideImageMobile ? "pg-hide-mobile" : ""}`; image.className = "pg-img"; image.src = config.imageUrl; image.alt = ""; frame.append(image); box.append(frame); }
      if (!inline && config.closeButton) { const close = document.createElement("button"); close.className = "pg-close"; close.textContent = "×"; close.setAttribute("aria-label", "Close signup"); close.onclick = onDismiss || null; box.append(close); }
      box.append(content); root.append(box); shadow.append(style, root);
      const eventId = `${visitor}:${campaign.id}:${crypto.randomUUID?.() || `${Date.now()}:${Math.random()}`}`;
      form.onsubmit = (event) => {
        event.preventDefault(); submit.disabled = true; submit.textContent = "Joining…";
        fetch(`${base}/api/public/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.value, visitorId: visitor, siteId, campaignId: campaign.id, variantId: variant.id, idempotencyKey: eventId }) })
          .then(async (response) => { if (!response.ok) throw new Error((await response.json()).error); store.set("pg:subscribed", String(Date.now() + campaign.frequency.subscriberDays * 86400000)); document.dispatchEvent(new CustomEvent(`pg:subscribed:${campaign.id}`)); if (!inline) setTimeout(() => host.remove(), 1800); })
          .catch((error) => { small.textContent = error.message || "Please try again."; small.className = "pg-small pg-error"; submit.disabled = false; submit.textContent = config.cta; });
      };
      document.addEventListener(`pg:subscribed:${campaign.id}`, () => content.replaceChildren(Object.assign(document.createElement("h2"), { textContent: "You're in!" }), Object.assign(document.createElement("p"), { textContent: "Thanks for subscribing." })), { once: true });
      return { host, root, email, eventId };
    }

    function show(campaign: Campaign, variant: Campaign["variants"][number]) {
      if (campaign.placement === "INLINE") {
        const points = inlineInsertionPoints(campaign.inlinePlacement);
        if (!points.length) { console.warn("Popup Generator did not find a safe inline article insertion point"); return; }
        const dimmer = document.createElement("div");
        dimmer.setAttribute("aria-hidden", "true");
        dimmer.style.cssText = "position:fixed;z-index:2147482998;inset:0;background:rgba(15,23,42,.32);opacity:0;pointer-events:none;transition:opacity .28s ease";
        const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) dimmer.style.transition = "none";
        document.body.append(dimmer);
        const visible = new Set<Element>();
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= .55) visible.add(entry.target);
            else visible.delete(entry.target);
          }
          dimmer.style.opacity = visible.size ? "1" : "0";
          for (const point of points) { const sibling = point.nextElementSibling as HTMLElement | null; if (sibling?.dataset.pgInline === campaign.id) sibling.style.zIndex = visible.has(sibling) ? "2147482999" : "auto"; }
        }, { threshold: [.2, .55, .8] });
        for (const point of points) {
          const instance = buildSignup(campaign, variant, true);
          instance.host.dataset.pgInline = campaign.id;
          point.after(instance.host);
          observer.observe(instance.host);
          observeViewableOnce(instance.host, () => recordImpression(campaign, variant, instance.eventId));
        }
        document.addEventListener(`pg:subscribed:${campaign.id}`, () => { visible.clear(); dimmer.style.opacity = "0"; observer.disconnect(); setTimeout(() => dimmer.remove(), reducedMotion ? 0 : 300); }, { once: true });
        return;
      }

      function dismiss() { const expires = campaign.frequency.kind === "session" ? Number.MAX_SAFE_INTEGER : Date.now() + campaign.frequency.days * 86400000; store.set(`pg:dismiss:${campaign.id}`, String(expires)); instance.host.remove(); }
      const instance = buildSignup(campaign, variant, false, dismiss);
      document.body.append(instance.host);
      instance.root.onclick = (event) => { if (event.target === instance.root) dismiss(); };
      instance.email.focus({ preventScroll: true });
      recordImpression(campaign, variant, instance.eventId);
    }

  } catch (error) {
    console.error("Popup Generator widget failed unexpectedly", error);
  }
})();
