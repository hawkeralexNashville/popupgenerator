export type PopupGeneratorFeature = "in-content";

type DisableMarkerRoot = Pick<Document, "querySelectorAll">;

/** Read page-level opt-outs in one place so more marker values can be added later. */
export function popupGeneratorDisabledValues(root: DisableMarkerRoot): Set<string> {
  const values = new Set<string>();
  root.querySelectorAll("[data-popup-generator-disable]").forEach((marker) => {
    const value = marker.getAttribute("data-popup-generator-disable");
    if (value) values.add(value.trim().toLowerCase());
  });
  return values;
}

export function isPopupGeneratorFeatureDisabled(root: DisableMarkerRoot, feature: PopupGeneratorFeature): boolean {
  return popupGeneratorDisabledValues(root).has(feature);
}
