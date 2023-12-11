import {select, Selection} from "d3";
import {GRID_SIZE} from "./diagram-grid.utils";
import {Grid, JumpPointFinderBase} from "../path-finder/JumpPointFinderBase";
import {StepWithAnchor} from "../../interface/step-with-anchor.class";

export const CONNECTOR_MAX_RADIUS = 10;
export const CONNECTOR_SELECTED_COLOR = '#0D99FF';
export const CONNECTOR_OVER_COLOR = '#656565';
export const CONNECTOR_DEFAULT_COLOR = '#969696';
export const CONNECTOR_CREATION_SELECTOR = "connector-creation"
export const CONNECTOR_CREATION_CONTAINER_SELECTOR = "connector-creation-container"
export const CONNECTOR_CREATION_END_CONTAINER_SELECTOR = "connector-creation-end-container"
export const CONNECTOR_CREATION_START_CONTAINER_SELECTOR = "connector-creation-start-container"
export const CONNECTOR_STROKE_WIDTH = 2;
export const CONNECTOR_CREATION_SIDE_START_SELECTOR = 'anchor-connector-start';
export const CONNECTOR_CREATION_SIDE_END_SELECTOR = 'anchor-connector-end';
export const CONNECTOR_SELECTOR = "connector";
export const CONNECTOR_AREA_SELECTOR = "connector-area";

export class DiagramConnectorUtils {

  static getConnectorPath(startStep: StepWithAnchor, endStep: StepWithAnchor): string {
    const top = Math.min(startStep.y, endStep.y);
    const bottom = Math.max(startStep.y + startStep.height, endStep.y + endStep.height);
    const left = Math.min(startStep.x, endStep.x);
    const right = Math.max(startStep.x + startStep.width, endStep.x + endStep.width);

    const RESIZE = GRID_SIZE;
    const matrix: number[][] = []
    const startY = top - 20;
    const startX = left - 20;

    for (let y = startY / RESIZE; y < (bottom + 40) / RESIZE; y++) {
      const row: number[] = [];
      for (let x = startX / RESIZE; x <= (right + 40) / RESIZE; x++) {
        row.push(1);
      }
      matrix.push(row);
    }

    for (let y = (startStep.y - startY) / RESIZE; y <= (startStep.y + startStep.height - startY) / RESIZE; y++) {
      for (let x = (startStep.x - startX) / RESIZE; x <= (startStep.x + startStep.width - startX) / RESIZE; x++) {
        matrix[y][x] = 0;
      }
    }
    for (let y = (endStep.y - startY) / RESIZE; y <= (endStep.y + endStep.height - startY) / RESIZE; y++) {
      for (let x = (endStep.x - startX) / RESIZE; x <= (endStep.x + endStep.width - startX) / RESIZE; x++) {
        matrix[y][x] = 0;
      }
    }
    matrix[(startStep.anchorPosition.y - startY) / RESIZE][(startStep.anchorPosition.x - startX) / RESIZE] = 8;
    matrix[(endStep.anchorPosition.y - startY) / RESIZE][(endStep.anchorPosition.x - startX) / RESIZE] = 8;

    let finder = new JumpPointFinderBase(new Grid(matrix));
    let result = finder.findPath(
      [(startStep.anchorPosition.x - startX) / RESIZE, (startStep.anchorPosition.y - startY) / RESIZE],
      [(endStep.anchorPosition.x - startX) / RESIZE, (endStep.anchorPosition.y - startY) / RESIZE]
    ).map(value => [value[0] * RESIZE + startX, value[1] * RESIZE + startY])

    if (result.length > 0) {

      const finalResult: { direction: 'top' | 'bottom' | 'right' | 'left' | 'none', coordinate: number[] }[] = [];
      finalResult.push({coordinate: result[0], direction: startStep.anchor})

      for (let i = 0; i < result.length - 1; i++) {
        const deltaX = result[i + 1][0] - result[i][0];
        const deltaY = result[i + 1][1] - result[i][1];
        let direction: 'top' | 'bottom' | 'right' | 'left' | 'none' = 'none';
        if (deltaX > 0) {
          direction = 'right';
        } else if (deltaX < 0) {
          direction = 'left'
        } else if (deltaY > 0) {
          direction = 'bottom'
        } else if (deltaY < 0) {
          direction = 'top'
        }
        if (finalResult.length === 0 || finalResult[finalResult.length - 1].direction !== direction) {
          finalResult.push({coordinate: result[i], direction});
        }
      }
      finalResult.push({coordinate: result[result.length - 1], direction: 'none'})

      finalResult.forEach((result, i) => {
        if (finalResult[i - 1] && finalResult[i + 1] && finalResult[i - 1].direction === finalResult[i + 1].direction) {
          if (finalResult[i - 1].direction === 'top' || finalResult[i - 1].direction === 'bottom') {
            finalResult[i].coordinate[1] = (startStep.anchorPosition.y + endStep.anchorPosition.y) / 2;
            finalResult[i + 1].coordinate[1] = (startStep.anchorPosition.y + endStep.anchorPosition.y) / 2;
          } else {
            finalResult[i].coordinate[0] = (startStep.anchorPosition.x + endStep.anchorPosition.x) / 2;
            finalResult[i + 1].coordinate[0] = (startStep.anchorPosition.x + endStep.anchorPosition.x) / 2;
          }
        }
      })

      const paths: string[] = [];
      paths.push(`M ${finalResult[0].coordinate[0]},${finalResult[0].coordinate[1]}`)

      for (let i = 1; i < finalResult.length; i++) {
        const previousDirection = finalResult[i - 1].direction;
        const newDirection = finalResult[i].direction;
        const radius = i !== finalResult.length - 1 ? CONNECTOR_MAX_RADIUS : 0;
        let xCoordinate = finalResult[i].coordinate[0];
        let yCoordinate = finalResult[i].coordinate[1];

        if (previousDirection === 'left') {
          paths.push(`H ${xCoordinate + radius}`)
        } else if (previousDirection === 'right') {
          paths.push(`H ${xCoordinate - radius}`)
        } else if (previousDirection === 'top') {
          paths.push(`V ${yCoordinate + radius}`)
        } else if (previousDirection === 'bottom') {
          paths.push(`V ${yCoordinate - radius}`)
        }

        if (i !== finalResult.length - 1) {
          if (newDirection === 'top') {
            paths.push(`Q ${xCoordinate},${yCoordinate} ${xCoordinate},${yCoordinate - CONNECTOR_MAX_RADIUS}`)
          } else if (newDirection === 'bottom') {
            paths.push(`Q ${xCoordinate},${yCoordinate} ${xCoordinate},${yCoordinate + CONNECTOR_MAX_RADIUS}`)
          } else if (newDirection === 'right') {
            paths.push(`Q ${xCoordinate},${yCoordinate} ${xCoordinate + CONNECTOR_MAX_RADIUS},${yCoordinate}`)
          } else if (newDirection === 'left') {
            paths.push(`Q ${xCoordinate},${yCoordinate} ${xCoordinate - CONNECTOR_MAX_RADIUS},${yCoordinate}`)
          }
        }
      }
      return paths.join(' ');
    } else {
      return `M ${startStep.anchorPosition.x},${startStep.anchorPosition.y} L ${endStep.anchorPosition.x} ${endStep.anchorPosition.y}`
    }
  }

  static generateMarkerArrowEnd(defs: Selection<SVGDefsElement, unknown, HTMLElement, any>, id: string, color: string): void {
    defs.append('marker')
      .attr('id', id)
      .attr('orient', 'auto')
      .attr('markerWidth', 14)
      .attr('markerHeight', 10)
      .attr('refX', 7)
      .attr('refY', 5)
      .append('path')
      .attr('d', 'M0,0 L7,5 L0,10')
      .attr('fill', "none")
      .attr('stroke', color)
      .attr('stroke-width', CONNECTOR_STROKE_WIDTH / 2)
      .attr('stroke-linecap', 'round')
  }

  static createConnectorDefs(): void {
    const defs = select<SVGDefsElement, unknown>("defs");
    DiagramConnectorUtils.generateMarkerArrowEnd(defs, 'arrow-head', CONNECTOR_DEFAULT_COLOR);
    DiagramConnectorUtils.generateMarkerArrowEnd(defs, 'arrow-head-active', CONNECTOR_SELECTED_COLOR);
    DiagramConnectorUtils.generateMarkerArrowEnd(defs, 'arrow-head-over', CONNECTOR_OVER_COLOR);
  }
}
