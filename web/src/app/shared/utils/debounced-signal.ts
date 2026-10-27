import { DestroyRef, Signal, effect, inject, signal } from '@angular/core';

/** Mirrors `source` after it stops changing for `delayMs`. Must be created in an injection context. */
export function debouncedSignal<T>(source: Signal<T>, delayMs: number): Signal<T> {
  const debounced = signal(source());
  let timer: ReturnType<typeof setTimeout> | undefined;
  effect(() => {
    const value = source();
    clearTimeout(timer);
    timer = setTimeout(() => debounced.set(value), delayMs);
  });
  inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  return debounced.asReadonly();
}
