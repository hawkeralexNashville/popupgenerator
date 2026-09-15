import { describe, expect, it, vi } from "vitest";
import { observeViewableOnce } from "@/lib/viewability";

type Callback = IntersectionObserverCallback;
class FakeObserver {
  static instances: FakeObserver[] = [];
  observed: Element[] = [];
  constructor(private callback: Callback) { FakeObserver.instances.push(this); }
  observe(element: Element) { this.observed.push(element); }
  unobserve(element: Element) { this.observed = this.observed.filter((item) => item !== element); }
  disconnect() { this.observed = []; }
  takeRecords() { return []; }
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0.5];
  fire(target: Element, ratio: number) { this.callback([{ target, intersectionRatio: ratio, isIntersecting: ratio > 0 } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
}

describe("inline viewability", () => {
  it("does not record before 50% visibility and records only once", () => {
    const element = {} as Element;
    const record = vi.fn();
    const observer = observeViewableOnce(element, record, FakeObserver as unknown as typeof IntersectionObserver) as unknown as FakeObserver;
    observer.fire(element, 0.49);
    expect(record).not.toHaveBeenCalled();
    observer.fire(element, 0.5);
    observer.fire(element, 1);
    expect(record).toHaveBeenCalledTimes(1);
  });

  it("tracks each inline instance independently", () => {
    const records = [vi.fn(), vi.fn(), vi.fn()];
    const elements = records.map(() => ({} as Element));
    const observers = elements.map((element, index) => observeViewableOnce(element, records[index], FakeObserver as unknown as typeof IntersectionObserver) as unknown as FakeObserver);
    observers[0].fire(elements[0], 0.8);
    observers[2].fire(elements[2], 0.8);
    expect(records.map((record) => record.mock.calls.length)).toEqual([1, 0, 1]);
  });
});
