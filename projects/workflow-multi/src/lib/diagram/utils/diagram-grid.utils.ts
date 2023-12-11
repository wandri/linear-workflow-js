import {Selection, ZoomTransform} from 'd3';

import {selectById} from "./diagram.utils";

export const GRID_COLOR = '#a4a4a4';
export const GRID_SIZE = 20;
export const GRID_DOT_SIZE = 3;

const GRID_PATTERN_SELECTOR = 'dot-pattern'

export class DiagramGridUtils {
  static updateGridWithZoom(
    transform: ZoomTransform
  ): void {
    selectById(GRID_PATTERN_SELECTOR)
      .attr('x', transform.x)
      .attr('y', transform.y)
      .attr('width', GRID_SIZE * transform.k)
      .attr('height', GRID_SIZE * transform.k)
      .selectAll(`rect`)
      .attr('x', GRID_SIZE * transform.k - GRID_DOT_SIZE / 2)
      .attr('y', GRID_SIZE * transform.k - GRID_DOT_SIZE / 2)
      .attr('opacity', Math.min(transform.k, 1)); // Lower opacity as the pattern gets more dense.
  }

  static generatePattern(
    svg: Selection<SVGElement, undefined, Element, undefined>
  ): void {
    svg
      .append('pattern')
      .attr('id', GRID_PATTERN_SELECTOR)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', GRID_SIZE)
      .attr('height', GRID_SIZE)
      .append('rect')
      .attr('width', GRID_DOT_SIZE)
      .attr('height', GRID_DOT_SIZE)
      .attr('fill', GRID_COLOR)
      .attr('x', GRID_SIZE - GRID_DOT_SIZE / 2)
      .attr('y', GRID_SIZE - GRID_DOT_SIZE / 2);

    svg
      .append('rect')
      .attr('fill', `url(#${GRID_PATTERN_SELECTOR})`)
      .attr('width', '100%')
      .attr('height', '100%');
  }

}
