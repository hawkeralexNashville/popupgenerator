"use strict";(()=>{function N(e){let r=e.imageAspectRatio==="square"?"1/1":e.imageAspectRatio==="4:3"?"4/3":e.imageAspectRatio==="portrait"?"3/4":"auto",d=e.imageVerticalAlign==="top"?"start":e.imageVerticalAlign==="bottom"?"end":"center",p=e.buttonAlign==="center"?"0 auto":e.buttonAlign==="right"?"0 0 0 auto":"0 auto 0 0";return`
    .pg-veil,.pg-veil *,.pg-inline-root,.pg-inline-root *{box-sizing:border-box}
    .pg-veil{position:absolute;width:100%;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:auto;background:${e.presentation==="focus"?"rgba(15,23,42,.55)":"rgba(15,23,42,.35)"};${e.presentation==="focus"?"backdrop-filter:blur(4px)":""}}
    .pg-inline-root{position:static;display:block;padding:0;background:none;backdrop-filter:none;pointer-events:auto}
    .pg-box{position:relative;width:min(440px,100%);max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;background:${e.background};color:${e.textColor};border:1px solid ${e.borderColor};border-radius:16px;padding:${e.innerPadding}px;box-shadow:0 24px 80px #0004;text-align:${e.align};font:${e.fontSize}px/${e.lineHeight} ${e.fontFamily==="serif"?"Georgia,serif":"system-ui,sans-serif"};animation:pg-enter .22s ease-out}
    .pg-inline-root .pg-box{width:100%;max-height:none;overflow:visible;box-shadow:0 8px 24px #0f172a1f;animation:none}
    .pg-box.pg-wide{width:min(680px,100%)}
    .pg-inline-root .pg-box.pg-wide,.pg-inline-root .pg-box.pg-horizontal{width:100%}
    .pg-box.pg-horizontal{display:grid;width:min(680px,100%);grid-template-columns:minmax(0,${e.horizontalImagePercent}fr) minmax(0,${100-e.horizontalImagePercent}fr);gap:${e.horizontalGap}px}
    .pg-box.pg-horizontal.pg-no-image{display:block}
    .pg-content{min-width:0}
    .pg-img-frame{width:min(100%,${e.imageWidth}px);max-height:${e.imageHeight}px;aspect-ratio:${r};align-self:${d};overflow:hidden;border-radius:10px}
    .pg-box:not(.pg-horizontal) .pg-img-frame{width:100%}
    .pg-img-frame.pg-original{aspect-ratio:auto}
    .pg-img{display:block;width:100%;height:100%;max-height:${e.imageHeight}px;object-fit:${e.imageFit}}
    .pg-img-frame.pg-original .pg-img{height:auto}
    .pg-heading{overflow-wrap:anywhere;font-size:${e.headlineSize}px;line-height:1.1;color:${e.headlineColor};margin:5px 0 10px}
    .pg-copy{overflow-wrap:anywhere;margin:0 0 12px}
    .pg-form{display:flex;flex-direction:column;align-items:${e.align==="center"?"center":"flex-start"};gap:10px;margin:0}
    .pg-email{display:block;width:${e.inputWidth}%;height:${e.inputHeight}px;min-width:0;padding:0 12px;border:1px solid ${e.borderColor};background:${e.inputBackground};border-radius:${e.inputRadius}px;font:inherit;font-size:${e.inputFontSize}px}
    .pg-submit{display:block;width:${e.buttonWidth}%;height:${e.buttonHeight}px;min-width:0;margin:${p};padding:0 18px;border:0;border-radius:${e.buttonRadius}px;background:${e.buttonBackground};color:${e.buttonText};font-size:${e.buttonFontSize}px;font-weight:${e.fontWeight};cursor:pointer}
    .pg-small{display:block;margin-top:10px;font-size:12px;line-height:1.4;overflow-wrap:anywhere}
    .pg-close{position:absolute;z-index:1;right:9px;top:7px;border:0;background:none;color:${e.textColor};font-size:25px;line-height:1;cursor:pointer}
    .pg-error{color:#b91c1c}
    .pg-slide-up{align-items:flex-end}
    .pg-slide-up .pg-box{animation:pg-up .25s ease-out}
    @keyframes pg-enter{from{opacity:0;transform:scale(.97)}}
    @keyframes pg-up{from{transform:translateY(30px);opacity:0}}
    @media(max-width:600px){
      .pg-veil{padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}
      .pg-box,.pg-box.pg-wide{width:100%;max-height:calc(100vh - 16px);max-height:calc(100dvh - max(16px,calc(env(safe-area-inset-top) + env(safe-area-inset-bottom))));padding:clamp(18px,5vw,24px);padding-top:clamp(48px,12vw,52px);border-radius:14px;font-size:min(${e.fontSize}px,16px)}
      .pg-inline-root .pg-box,.pg-inline-root .pg-box.pg-wide{max-height:none;padding:clamp(18px,5vw,24px)}
      .pg-box.pg-horizontal{display:flex;width:100%;flex-direction:column;gap:clamp(14px,4vw,18px)}
      .pg-img-frame{width:100%;max-height:min(180px,28dvh);align-self:center}
      .pg-img{height:auto;max-height:min(180px,28dvh);object-fit:cover;object-position:center}
      .pg-hide-mobile{display:none}
      .pg-heading{font-size:min(${e.headlineSize}px,clamp(26px,8vw,34px));margin:0 0 10px}
      .pg-copy{margin-bottom:14px}
      .pg-email,.pg-submit{width:100%}
      .pg-email{font-size:max(${e.inputFontSize}px,16px)}
      .pg-submit{margin:0}
      .pg-small{margin-top:10px;font-size:min(12px,3.5vw)}
      .pg-close{top:6px;right:6px;display:grid;place-items:center;width:40px;height:40px;padding:0}
    }
    @media(max-width:600px) and (pointer:coarse){
      .pg-email,.pg-submit{min-height:40px}
    }
  `}function O(e,r,d=IntersectionObserver){let p=!1,a=new d(f=>{let l=f.find(w=>w.target===e);!p&&(l!=null&&l.isIntersecting)&&l.intersectionRatio>=.5&&(p=!0,a.unobserve(e),r())},{threshold:[.5]});return a.observe(e),a}(()=>{var z;let e=document.currentScript,r=e!=null&&e.src?new URL(e.src).origin:location.origin,d=new WeakSet,p={get:i=>{try{return localStorage.getItem(i)}catch{return null}},set:(i,n)=>{try{localStorage.setItem(i,n)}catch{}}},a=p.get("pg:visitor")||((z=crypto.randomUUID)==null?void 0:z.call(crypto))||Math.random().toString(36).slice(2);p.set("pg:visitor",a);let f=()=>{var i;return((i=crypto.randomUUID)==null?void 0:i.call(crypto))||`${Date.now()}-${Math.random()}`};function l(i){i.replaceChildren(Object.assign(document.createElement("h2"),{className:"pg-heading",textContent:"You're in!"}),Object.assign(document.createElement("p"),{className:"pg-copy",textContent:"Thanks for subscribing."}))}async function w(i){if(d.has(i))return;d.add(i);let n=i.getAttribute("data-popup-generator-form");if(n)try{let g=await fetch(`${r}/api/public/embedded-forms/${encodeURIComponent(n)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitorId:a}),credentials:"omit",mode:"cors"});if(!g.ok)throw new Error(`Form request failed (${g.status})`);let y=await g.json(),t=y.variant.config,x=document.createElement("div");x.style.cssText="display:block;position:static;width:100%;clear:both";let A=x.attachShadow({mode:"open"}),I=document.createElement("style"),$=document.createElement("div"),c=document.createElement("section"),b=document.createElement("div"),E=document.createElement("h2"),k=document.createElement("p"),v=document.createElement("form"),m=document.createElement("input"),s=document.createElement("button"),h=document.createElement("div");if(I.textContent=N(t),$.className="pg-inline-root",c.className=`pg-box pg-${t.layout} ${!t.imageUrl||t.layout==="no-image"?"pg-no-image":""}`,c.setAttribute("aria-label",t.headline),b.className="pg-content",E.className="pg-heading",E.textContent=t.headline,k.className="pg-copy",k.textContent=t.body,v.className="pg-form",m.className="pg-email",m.type="email",m.required=!0,m.placeholder=t.emailPlaceholder,s.className="pg-submit",s.textContent=t.cta,h.className="pg-small",h.textContent=t.supportingText,v.append(m,s),b.append(E,k,v,h),t.imageUrl&&t.layout!=="no-image"){let u=document.createElement("div"),o=document.createElement("img");u.className=`pg-img-frame ${t.imageAspectRatio==="original"?"pg-original":""} ${t.hideImageMobile?"pg-hide-mobile":""}`,o.className="pg-img",o.src=t.imageUrl,o.alt="",u.append(o),c.append(u)}c.append(b),$.append(c),A.append(I,$),i.append(x);let S=`${a}:${n}:${f()}`;O(x,()=>fetch(`${r}/api/public/embedded-events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitorId:a,formId:n,variantId:y.variant.id,type:"IMPRESSION",idempotencyKey:S,device:innerWidth<768?"mobile":"desktop",path:location.pathname,referrerHost:document.referrer?new URL(document.referrer).hostname:void 0}),keepalive:!0,credentials:"omit",mode:"cors"}).catch(()=>null)),v.onsubmit=async u=>{u.preventDefault(),s.disabled=!0,s.textContent="Joining\u2026";try{let o=await fetch(`${r}/api/public/embedded-subscribe`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:m.value,visitorId:a,formId:n,variantId:y.variant.id,idempotencyKey:`${S}:conversion`}),credentials:"omit",mode:"cors"});if(!o.ok)throw new Error((await o.json()).error||"Please try again.");document.dispatchEvent(new CustomEvent(`pg:embedded-subscribed:${n}`))}catch(o){h.className="pg-small pg-error",h.textContent=o instanceof Error?o.message:"Please try again.",s.disabled=!1,s.textContent=t.cta}},document.addEventListener(`pg:embedded-subscribed:${n}`,()=>l(b),{once:!0})}catch(g){console.error("Popup Generator could not render embedded form",g)}}let C=()=>document.querySelectorAll("[data-popup-generator-form]").forEach(w);C(),new MutationObserver(C).observe(document.documentElement,{childList:!0,subtree:!0})})();})();
