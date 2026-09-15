import type { VariantConfig } from "@/lib/schemas";

/**
 * The canonical popup stylesheet used by both the builder preview and widget.
 * Keeping the configurable values here prevents the preview from drifting from
 * the shadow-DOM rendering shipped to publisher sites.
 */
export function popupStyles(config: VariantConfig) {
  const imageRatio = config.imageAspectRatio === "square" ? "1/1" : config.imageAspectRatio === "4:3" ? "4/3" : config.imageAspectRatio === "portrait" ? "3/4" : "auto";
  const imageAlign = config.imageVerticalAlign === "top" ? "start" : config.imageVerticalAlign === "bottom" ? "end" : "center";
  const buttonMargin = config.buttonAlign === "center" ? "0 auto" : config.buttonAlign === "right" ? "0 0 0 auto" : "0 auto 0 0";

  return `
    .pg-veil,.pg-veil *,.pg-inline-root,.pg-inline-root *{box-sizing:border-box}
    .pg-veil{position:absolute;width:100%;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:auto;background:${config.presentation === "focus" ? "rgba(15,23,42,.55)" : "rgba(15,23,42,.35)"};${config.presentation === "focus" ? "backdrop-filter:blur(4px)" : ""}}
    .pg-inline-root{position:static;display:block;padding:0;background:none;backdrop-filter:none;pointer-events:auto}
    .pg-box{position:relative;width:min(440px,100%);max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;background:${config.background};color:${config.textColor};border:1px solid ${config.borderColor};border-radius:16px;padding:${config.innerPadding}px;box-shadow:0 24px 80px #0004;text-align:${config.align};font:${config.fontSize}px/${config.lineHeight} ${config.fontFamily === "serif" ? "Georgia,serif" : "system-ui,sans-serif"};animation:pg-enter .22s ease-out}
    .pg-inline-root .pg-box{width:100%;max-height:none;overflow:visible;box-shadow:0 8px 24px #0f172a1f;animation:none}
    .pg-box.pg-wide{width:min(680px,100%)}
    .pg-inline-root .pg-box.pg-wide,.pg-inline-root .pg-box.pg-horizontal{width:100%}
    .pg-box.pg-horizontal{display:grid;width:min(680px,100%);grid-template-columns:minmax(0,${config.horizontalImagePercent}fr) minmax(0,${100 - config.horizontalImagePercent}fr);gap:${config.horizontalGap}px}
    .pg-box.pg-horizontal.pg-no-image{display:block}
    .pg-content{min-width:0}
    .pg-img-frame{width:min(100%,${config.imageWidth}px);max-height:${config.imageHeight}px;aspect-ratio:${imageRatio};align-self:${imageAlign};overflow:hidden;border-radius:10px}
    .pg-box:not(.pg-horizontal) .pg-img-frame{width:100%}
    .pg-img-frame.pg-original{aspect-ratio:auto}
    .pg-img{display:block;width:100%;height:100%;max-height:${config.imageHeight}px;object-fit:${config.imageFit}}
    .pg-img-frame.pg-original .pg-img{height:auto}
    .pg-heading{overflow-wrap:anywhere;font-size:${config.headlineSize}px;line-height:1.1;color:${config.headlineColor};margin:5px 0 10px}
    .pg-copy{overflow-wrap:anywhere;margin:0 0 12px}
    .pg-form{display:flex;flex-direction:column;align-items:${config.align === "center" ? "center" : "flex-start"};gap:10px;margin:0}
    .pg-email{display:block;width:${config.inputWidth}%;min-width:0;padding:12px;border:1px solid ${config.borderColor};background:${config.inputBackground};border-radius:9px;font:inherit}
    .pg-submit{display:block;width:${config.buttonWidth}%;min-width:0;margin:${buttonMargin};padding:${config.buttonPadding}px 18px;border:0;border-radius:${config.buttonRadius}px;background:${config.buttonBackground};color:${config.buttonText};font-weight:${config.fontWeight};cursor:pointer}
    .pg-small{display:block;margin-top:10px;font-size:12px;line-height:1.4;overflow-wrap:anywhere}
    .pg-close{position:absolute;z-index:1;right:9px;top:7px;border:0;background:none;color:${config.textColor};font-size:25px;line-height:1;cursor:pointer}
    .pg-error{color:#b91c1c}
    .pg-slide-up{align-items:flex-end}
    .pg-slide-up .pg-box{animation:pg-up .25s ease-out}
    @keyframes pg-enter{from{opacity:0;transform:scale(.97)}}
    @keyframes pg-up{from{transform:translateY(30px);opacity:0}}
    @media(max-width:600px){
      .pg-veil{padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}
      .pg-box,.pg-box.pg-wide{width:100%;max-height:calc(100vh - 16px);max-height:calc(100dvh - max(16px,calc(env(safe-area-inset-top) + env(safe-area-inset-bottom))));padding:clamp(18px,5vw,24px);padding-top:clamp(48px,12vw,52px);border-radius:14px;font-size:min(${config.fontSize}px,16px)}
      .pg-inline-root .pg-box,.pg-inline-root .pg-box.pg-wide{max-height:none;padding:clamp(18px,5vw,24px)}
      .pg-box.pg-horizontal{display:flex;width:100%;flex-direction:column;gap:clamp(14px,4vw,18px)}
      .pg-img-frame{width:100%;max-height:min(180px,28dvh);align-self:center}
      .pg-img{height:auto;max-height:min(180px,28dvh);object-fit:cover;object-position:center}
      .pg-hide-mobile{display:none}
      .pg-heading{font-size:min(${config.headlineSize}px,clamp(26px,8vw,34px));margin:0 0 10px}
      .pg-copy{margin-bottom:14px}
      .pg-email,.pg-submit{width:100%;min-height:44px;font-size:16px}
      .pg-email{padding:11px 12px}
      .pg-submit{margin:0;padding:max(11px,${config.buttonPadding}px) 16px}
      .pg-small{margin-top:10px;font-size:min(12px,3.5vw)}
      .pg-close{top:6px;right:6px;display:grid;place-items:center;width:40px;height:40px;padding:0}
    }
  `;
}
