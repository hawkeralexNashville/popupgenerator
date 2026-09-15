import type { VariantConfig } from "@/lib/schemas";

/** Standalone publisher widget. Deliberately no imports or runtime dependencies. */
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
      style.textContent = `*{box-sizing:border-box}.veil{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:auto;background:${config.presentation === "focus" ? "rgba(15,23,42,.55)" : "rgba(15,23,42,.35)"};${config.presentation === "focus" ? "backdrop-filter:blur(4px)" : ""}}.veil.inline{position:static;display:block;padding:0;background:none;backdrop-filter:none;pointer-events:auto}.box{position:relative;width:min(440px,100%);max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;background:${config.background};color:${config.textColor};border:1px solid ${config.borderColor};border-radius:16px;padding:${config.innerPadding}px;box-shadow:0 24px 80px #0004;text-align:${config.align};font:${config.fontSize}px/${config.lineHeight} ${config.fontFamily === "serif" ? "Georgia,serif" : "system-ui,sans-serif"};animation:enter .22s ease-out}.inline .box{width:100%;max-height:none;overflow:visible;box-shadow:0 8px 24px #0f172a1f;animation:none}.box.wide{width:min(680px,100%)}.inline .box.wide,.inline .box.horizontal{width:100%}.box.horizontal{display:grid;width:min(680px,100%);grid-template-columns:${config.horizontalImagePercent}% minmax(0,1fr);gap:${config.horizontalGap}px}.img-frame{width:min(100%,${config.imageWidth}px);max-height:${config.imageHeight}px;aspect-ratio:${config.imageAspectRatio === "square" ? "1/1" : config.imageAspectRatio === "4:3" ? "4/3" : config.imageAspectRatio === "portrait" ? "3/4" : "auto"};align-self:${config.imageVerticalAlign === "top" ? "start" : config.imageVerticalAlign === "bottom" ? "end" : "center"};overflow:hidden;border-radius:10px}.img{display:block;width:100%;height:100%;max-height:${config.imageHeight}px;object-fit:${config.imageFit}}.img-frame.original .img{height:auto}h2{overflow-wrap:anywhere;font-size:${config.headlineSize}px;line-height:1.1;color:${config.headlineColor};margin:5px 0 10px}p{overflow-wrap:anywhere;margin:0 0 12px}.email{display:block;width:${config.inputWidth}%;padding:12px;border:1px solid ${config.borderColor};background:${config.inputBackground};border-radius:9px;font:inherit}.submit{display:block;width:${config.buttonWidth}%;margin:10px ${config.buttonAlign === "center" ? "auto" : config.buttonAlign === "right" ? "0 0 auto" : "auto 0 0"};padding:${config.buttonPadding}px 18px;border:0;border-radius:${config.buttonRadius}px;background:${config.buttonBackground};color:${config.buttonText};font-weight:${config.fontWeight};cursor:pointer}.x{position:absolute;z-index:1;right:9px;top:7px;border:0;background:none;color:${config.textColor};font-size:25px;line-height:1;cursor:pointer}.small{font-size:12px;overflow-wrap:anywhere}.error{color:#b91c1c}.slide-up{align-items:flex-end}.slide-up .box{animation:up .25s ease-out}@keyframes enter{from{opacity:0;transform:scale(.97)}}@keyframes up{from{transform:translateY(30px);opacity:0}}@media(max-width:600px){.veil:not(.inline){padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}.box,.box.wide{width:100%;max-height:calc(100dvh - 16px);padding:clamp(18px,5vw,24px);padding-top:clamp(48px,12vw,52px);border-radius:14px;font-size:min(${config.fontSize}px,16px)}.inline .box,.inline .box.wide{max-height:none;padding:clamp(18px,5vw,24px)}.box.horizontal{display:flex;width:100%;flex-direction:column;gap:clamp(14px,4vw,18px)}.img-frame{width:100%;max-height:min(180px,28dvh);align-self:center}.img{height:auto;max-height:min(180px,28dvh);object-fit:cover;object-position:center}.hide-mobile{display:none}h2{font-size:min(${config.headlineSize}px,clamp(26px,8vw,34px));margin:0 0 10px}p{margin-bottom:14px}.email,.submit{width:100%;min-height:44px;font-size:16px}.email{padding:11px 12px;margin:0 0 10px}.submit{margin:0 0 10px;padding:max(11px,${config.buttonPadding}px) 16px}.small{font-size:min(12px,3.5vw);line-height:1.4}.x{top:6px;right:6px;display:grid;place-items:center;width:40px;height:40px;padding:0}}`;
      const veil = document.createElement("div");
      veil.className = `veil ${inline ? "inline" : config.presentation === "slide-up" ? "slide-up" : ""}`;
      const box = document.createElement("section");
      box.className = `box ${config.layout}`;
      box.setAttribute("aria-label", config.headline);
      if (!inline) { box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); }
      const content = document.createElement("div");
      const heading = document.createElement("h2");
      const copy = document.createElement("p");
      const form = document.createElement("form");
      const email = document.createElement("input");
      const submit = document.createElement("button");
      const small = document.createElement("div");
      heading.textContent = config.headline; copy.textContent = config.body;
      email.className = "email"; email.type = "email"; email.required = true; email.placeholder = config.emailPlaceholder;
      submit.className = "submit"; submit.textContent = config.cta;
      small.className = "small"; small.textContent = config.supportingText;
      form.append(email, submit); content.append(heading, copy, form, small);
      if (config.imageUrl && config.layout !== "no-image") { const frame = document.createElement("div"); const image = document.createElement("img"); frame.className = `img-frame ${config.imageAspectRatio === "original" ? "original" : ""} ${config.hideImageMobile ? "hide-mobile" : ""}`; image.className = "img"; image.src = config.imageUrl; image.alt = ""; frame.append(image); box.append(frame); }
      if (!inline && config.closeButton) { const close = document.createElement("button"); close.className = "x"; close.textContent = "×"; close.setAttribute("aria-label", "Close signup"); close.onclick = dismiss; box.append(close); }
      box.append(content); veil.append(box); shadow.append(style, veil);
      if (inline) point!.after(host); else document.body.append(host);
      if (!inline) email.focus({ preventScroll: true });

      const eventId = `${visitor}:${campaign.id}:${Date.now()}`;
      const payload = { siteId, campaignId: campaign.id, variantId: variant.id, type: "IMPRESSION", idempotencyKey: eventId, device: innerWidth < 768 ? "mobile" : "desktop", path: location.pathname, referrerHost: document.referrer ? new URL(document.referrer).hostname : undefined };
      const body = JSON.stringify(payload);
      if (!navigator.sendBeacon?.(`${base}/api/public/events`, new Blob([body], { type: "application/json" }))) fetch(`${base}/api/public/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch((error) => console.error("Popup Generator could not record impression", error));
      function dismiss() { const expires = campaign.frequency.kind === "session" ? Number.MAX_SAFE_INTEGER : Date.now() + campaign.frequency.days * 86400000; store.set(`pg:dismiss:${campaign.id}`, String(expires)); host.remove(); }
      if (!inline) veil.onclick = (event) => { if (event.target === veil) dismiss(); };
      form.onsubmit = (event) => { event.preventDefault(); submit.disabled = true; submit.textContent = "Joining…"; fetch(`${base}/api/public/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.value, siteId, campaignId: campaign.id, variantId: variant.id, idempotencyKey: eventId }) }).then(async (response) => { if (!response.ok) throw new Error((await response.json()).error); store.set("pg:subscribed", String(Date.now() + campaign.frequency.subscriberDays * 86400000)); content.replaceChildren(Object.assign(document.createElement("h2"), { textContent: "You're in!" }), Object.assign(document.createElement("p"), { textContent: "Thanks for subscribing." })); if (!inline) setTimeout(() => host.remove(), 1800); }).catch((error) => { small.textContent = error.message || "Please try again."; small.className = "small error"; submit.disabled = false; submit.textContent = config.cta; }); };
    }
  } catch (error) {
    console.error("Popup Generator widget failed unexpectedly", error);
  }
})();
