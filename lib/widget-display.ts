export type CampaignPlacement = "MODAL" | "INLINE";

export type CampaignTrigger = {
  scrollPercent?: number;
  seconds?: number;
  exitIntent: boolean;
  logic: "ANY" | "ALL";
};

type DisplayEnvironment = {
  scrollPercent: () => number;
  onScroll: (callback: () => void) => void;
  after: (callback: () => void, milliseconds: number) => void;
  onExitIntent: (callback: () => void) => void;
  isDesktop: () => boolean;
};

export function startCampaignDisplay(
  placement: CampaignPlacement,
  trigger: CampaignTrigger,
  show: () => void,
  environment: DisplayEnvironment,
) {
  if (placement === "INLINE") {
    show();
    return;
  }

  const fired = new Set<string>();
  const checks: (() => boolean)[] = [];
  if (trigger.scrollPercent !== undefined) checks.push(() => environment.scrollPercent() >= trigger.scrollPercent!);
  if (trigger.seconds !== undefined) {
    checks.push(() => fired.has("time"));
    environment.after(() => { fired.add("time"); test(); }, trigger.seconds * 1000);
  }
  if (trigger.exitIntent && environment.isDesktop()) {
    checks.push(() => fired.has("exit"));
    environment.onExitIntent(() => { fired.add("exit"); test(); });
  }

  let shown = false;
  const test = () => {
    if (shown) return;
    const pass = !checks.length || (trigger.logic === "ALL" ? checks.every((check) => check()) : checks.some((check) => check()));
    if (pass) { shown = true; show(); }
  };
  environment.onScroll(test);
  test();
}

export function inlineInsertionIndexes(
  paragraphCount: number,
  settings: { firstAfter: number; repeatEvery: number; maxInsertions: number },
) {
  const indexes: number[] = [];
  for (let after = settings.firstAfter; after < paragraphCount && indexes.length < settings.maxInsertions; after += settings.repeatEvery) {
    indexes.push(after - 1);
  }
  return indexes;
}
