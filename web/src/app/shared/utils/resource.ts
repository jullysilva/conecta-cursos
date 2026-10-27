import type { Resource } from '@angular/core';

/**
 * Reads a resource's value without throwing. Since Angular 21, `value()` throws while
 * the resource is in an error state, so reads that run before the error check use this.
 */
export function valueOf<T>(resource: Resource<T>): T | undefined {
  return resource.hasValue() ? resource.value() : undefined;
}
