import {BaseType} from 'd3-selection';
import {select} from 'd3';

export function selectById<GElement extends BaseType, OldDatum>(id: string) {
  return select<GElement, OldDatum>(`[id="${id}"]`);
}

export function sortByPosition<T extends { getPosition: () => number }>(
  a: T,
  b: T
): number {
  return a.getPosition() - b.getPosition();
}

export function getSum(arr: number[]): number {
  return arr.reduce((a, v) => a + v, 0);
}
