"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ImageUpload";
import { variantConfigSchema, type VariantConfig } from "@/lib/schemas";

type Variant = { id?: string; name: string; enabled: boolean; config: VariantConfig };
type Campaign = { id: string; name: string; status: string; priority: number; trigger: { scrollPercent: number }; targeting: unknown; frequency: { days: number }; variants: Variant[] };
type Props = { campaign: Campaign };
type PreviewStyle = CSSProperties & Record<`--${string}`, string>;

const aspectRatios: Record<VariantConfig["imageAspectRatio"], string | undefined> = {
  square: "1 / 1",
  "4:3": "4 / 3",
  portrait: "3 / 4",
  original: undefined,
};

export function Builder({ campaign }: Props) {
  const [name, setName] = useState(campaign.name);
  const [variants, setVariants] = useState(() => campaign.variants.map(variant => ({ ...variant, config: variantConfigSchema.parse(variant.config) })));
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState(campaign.status);
  const [saved, setSaved] = useState("");
  const router = useRouter();
  const variant = variants[active];
  const config = variant.config;

  const update = (patch: Partial<VariantConfig>) => setVariants(current => current.map((item, index) =>
    index === active ? { ...item, config: { ...item.config, ...patch } } : item,
  ));

  async function save(next = status) {
    setSaved("Saving…");
    const response = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, status: next, priority: campaign.priority, trigger: campaign.trigger, targeting: campaign.targeting, frequency: campaign.frequency, variants }),
    });
    setSaved(response.ok ? (next === "ACTIVE" ? "Published" : "Saved") : "Could not save");
    if (response.ok) { setStatus(next); router.refresh(); }
  }

  function add() {
    setVariants(current => [...current, { name: `Variant ${String.fromCharCode(65 + current.length)}`, enabled: true, config: { ...current[active].config } }]);
    setActive(variants.length);
  }

  const split = config.horizontalSplit.split("/")[0];
  const imageStyle: CSSProperties = {
    width: `${config.imageWidth}${config.imageWidthUnit}`,
    height: config.imageAspectRatio === "original" ? config.imageHeight : undefined,
    aspectRatio: aspectRatios[config.imageAspectRatio],
    objectFit: config.imageFit,
    alignSelf: config.imageVerticalAlign === "top" ? "start" : config.imageVerticalAlign === "bottom" ? "end" : "center",
  };
  const previewStyle: PreviewStyle = {
    background: config.background,
    color: config.textColor,
    textAlign: config.align,
    fontFamily: config.fontFamily === "serif" ? "Georgia,serif" : "system-ui",
    fontSize: config.fontSize,
    maxWidth: config.layout === "horizontal" || config.layout === "wide" ? 680 : 440,
    padding: config.innerPadding,
    "--image-column": `${split}%`,
    "--column-gap": `${config.columnGap}px`,
  };

  return <>
    <div className="pagehead">
      <div><input aria-label="Campaign name" value={name} onChange={event => setName(event.target.value)} style={{ fontSize: 24, fontWeight: 700, border: 0, background: "transparent" }} /><div className="muted">{status.toLowerCase()} · {saved}</div></div>
      <div className="actions"><button className="secondary" onClick={() => save()}>Save draft</button>{status === "ACTIVE" ? <button onClick={() => save("PAUSED")}>Pause</button> : <button onClick={() => save("ACTIVE")}>Publish</button>}</div>
    </div>
    <div className="builder">
      <div className="card controls">
        <div className="section"><h3>A/B variants</h3><div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>{variants.map((item, index) => <button className={index === active ? "" : "secondary"} key={index} onClick={() => setActive(index)}>{item.name}</button>)}<button className="secondary" onClick={add}>+ Variant</button></div></div>
        <div className="section form">
          <h3>Content</h3>
          <label>Variant name<input value={variant.name} onChange={event => setVariants(current => current.map((item, index) => index === active ? { ...item, name: event.target.value } : item))} /></label>
          <label>Headline<input value={config.headline} onChange={event => update({ headline: event.target.value })} /></label>
          <label>Body<textarea value={config.body} onChange={event => update({ body: event.target.value })} /></label>
          <label>Supporting text<input value={config.supportingText} onChange={event => update({ supportingText: event.target.value })} /></label>
          <ImageUpload campaignId={campaign.id} value={config.imageUrl} onChange={imageUrl => update({ imageUrl })} />
          <label>Image URL<input type="url" value={config.imageUrl} onChange={event => update({ imageUrl: event.target.value })} placeholder="https://…" /></label>
          <div className="two"><label>Email placeholder<input value={config.emailPlaceholder} onChange={event => update({ emailPlaceholder: event.target.value })} /></label><label>Button text<input value={config.cta} onChange={event => update({ cta: event.target.value })} /></label></div>
        </div>
        <div className="section form">
          <h3>Layout & presentation</h3>
          <div className="two"><label>Layout<select value={config.layout} onChange={event => update({ layout: event.target.value as VariantConfig["layout"] })}><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option><option value="no-image">No image</option><option value="wide">Wide/banner</option></select></label><label>Presentation<select value={config.presentation} onChange={event => update({ presentation: event.target.value as VariantConfig["presentation"] })}><option value="modal">Modal</option><option value="focus">Focus / blur</option><option value="slide-up">Slide-up</option></select></label></div>
          {config.layout === "horizontal" && <div className="control-group">
            <h4>Horizontal layout</h4>
            <div className="two">
              <label>Column split<select value={config.horizontalSplit} onChange={event => update({ horizontalSplit: event.target.value as VariantConfig["horizontalSplit"] })}><option value="25/75">25 / 75</option><option value="33/67">33 / 67</option><option value="40/60">40 / 60</option><option value="50/50">50 / 50</option></select></label>
              <label>Column gap (px)<input type="number" min="0" max="80" value={config.columnGap} onChange={event => update({ columnGap: +event.target.value })} /></label>
            </div>
          </div>}
          <div className="control-group">
            <h4>Image</h4>
            <div className="two">
              <label>Width<div className="unit-input"><input type="number" min="20" max={config.imageWidthUnit === "%" ? 100 : 800} value={config.imageWidth} onChange={event => update({ imageWidth: +event.target.value })} /><select aria-label="Image width unit" value={config.imageWidthUnit} onChange={event => update({ imageWidthUnit: event.target.value as VariantConfig["imageWidthUnit"], imageWidth: event.target.value === "%" ? Math.min(config.imageWidth, 100) : config.imageWidth })}><option value="%">%</option><option value="px">px</option></select></div></label>
              <label>Height (px)<input type="number" min="80" max="600" value={config.imageHeight} disabled={config.imageAspectRatio !== "original"} onChange={event => update({ imageHeight: +event.target.value })} /></label>
              <label>Aspect ratio<select value={config.imageAspectRatio} onChange={event => update({ imageAspectRatio: event.target.value as VariantConfig["imageAspectRatio"] })}><option value="square">Square</option><option value="4:3">4:3</option><option value="portrait">Portrait</option><option value="original">Original</option></select></label>
              <label>Image fit<select value={config.imageFit} onChange={event => update({ imageFit: event.target.value as VariantConfig["imageFit"] })}><option value="cover">Cover</option><option value="contain">Contain</option></select></label>
              <label>Vertical alignment<select value={config.imageVerticalAlign} onChange={event => update({ imageVerticalAlign: event.target.value as VariantConfig["imageVerticalAlign"] })}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label>
              <label>Inner padding (px)<input type="number" min="0" max="80" value={config.innerPadding} onChange={event => update({ innerPadding: +event.target.value })} /></label>
            </div>
          </div>
          <label><input type="checkbox" checked={config.hideImageMobile} onChange={event => update({ hideImageMobile: event.target.checked })} /> Hide image on mobile</label>
        </div>
        <div className="section form">
          <h3>Typography & form</h3>
          <div className="two">
            <label>Font<select value={config.fontFamily} onChange={event => update({ fontFamily: event.target.value as VariantConfig["fontFamily"] })}><option value="system">System</option><option value="serif">Editorial serif</option><option value="modern">Modern sans</option></select></label>
            <label>Alignment<select value={config.align} onChange={event => update({ align: event.target.value as VariantConfig["align"] })}><option value="left">Left</option><option value="center">Center</option></select></label>
            <label>Headline size (px)<input type="number" min="20" max="52" value={config.headlineSize} onChange={event => update({ headlineSize: +event.target.value })} /></label>
            <label>Body size (px)<input type="number" min="14" max="22" value={config.fontSize} onChange={event => update({ fontSize: +event.target.value })} /></label>
            <label>Form width (%)<input type="number" min="25" max="100" value={config.formWidth} onChange={event => update({ formWidth: +event.target.value })} /></label>
            <label>Button width (%)<input type="number" min="25" max="100" value={config.buttonWidth} onChange={event => update({ buttonWidth: +event.target.value, buttonFullWidth: +event.target.value === 100 })} /></label>
          </div>
        </div>
        <div className="section form"><h3>Colors & button</h3><div className="two">{[["Background", "background"], ["Headline", "headlineColor"], ["Text", "textColor"], ["Button", "buttonBackground"], ["Button text", "buttonText"], ["Border", "borderColor"]].map(([label, key]) => <label key={key}>{label}<input type="color" value={String(config[key as keyof VariantConfig])} onChange={event => update({ [key]: event.target.value })} /></label>)}</div></div>
        <div className="section form"><h3>Behavior</h3><p className="muted">Trigger: {campaign.trigger.scrollPercent}% scroll · Dismissal: {campaign.frequency.days} days</p><p className="muted">URL/category targeting and priority are saved with this campaign. Advanced behavior editing follows the same validated configuration model.</p></div>
      </div>
      <div className="preview-wrap" style={{ backdropFilter: config.presentation === "focus" ? "blur(3px)" : "none" }}>
        <div className={`popup-preview ${config.layout}`} style={previewStyle}>
          {config.closeButton && <button className="close" aria-label="Close preview">×</button>}
          {config.imageUrl && config.layout !== "no-image" && <Image className={config.hideImageMobile ? "hide-mobile" : ""} style={imageStyle} src={config.imageUrl} alt="Popup preview" width={800} height={450} unoptimized />}
          <div className="preview-content"><h2 style={{ color: config.headlineColor, fontSize: config.headlineSize }}>{config.headline}</h2><p>{config.body}</p><div className="preview-form" style={{ width: `${config.formWidth}%` }}><input disabled placeholder={config.emailPlaceholder} style={{ background: config.inputBackground, borderColor: config.borderColor }} /><button style={{ background: config.buttonBackground, color: config.buttonText, borderRadius: config.buttonRadius, padding: config.buttonPadding, width: `${config.buttonWidth}%` }}>{config.cta}</button></div><small>{config.supportingText}</small></div>
        </div>
      </div>
    </div>
  </>;
}
