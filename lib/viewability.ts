type ObserverConstructor = new (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
) => IntersectionObserver;

/** Calls onView once when this particular element is at least half visible. */
export function observeViewableOnce(
  element: Element,
  onView: () => void,
  Observer: ObserverConstructor = IntersectionObserver,
) {
  let recorded = false;
  const observer = new Observer((entries) => {
    const entry = entries.find((candidate) => candidate.target === element);
    if (!recorded && entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
      recorded = true;
      observer.unobserve(element);
      onView();
    }
  }, { threshold: [0.5] });
  observer.observe(element);
  return observer;
}
