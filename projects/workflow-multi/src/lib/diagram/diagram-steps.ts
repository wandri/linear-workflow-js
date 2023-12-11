import {
  Direction,
  STEP_ANCHOR_ACTIVE,
  STEP_ANCHOR_BACKGROUND,
  STEP_ANCHOR_CIRCLE_SELECTOR,
  STEP_ANCHOR_CONTAINER_SELECTOR,
  STEP_ANCHOR_CROSS_SELECTOR,
  STEP_AREA_SELECTOR,
  STEP_BACKGROUND_COLOR,
  STEP_ELEMENT_SELECTOR,
  STEP_FONT_SIZE_MAIN_TEXT_CREATION,
  STEP_HEIGHT,
  STEP_PADDING,
  STEP_RECT_SELECTOR,
  STEP_STROKE_DEFAULT_COLOR,
  STEP_STROKE_OVER_COLOR,
  STEP_STROKE_OVER_ERROR_COLOR,
  STEP_STROKE_SELECTED_COLOR,
  STEP_WIDTH
} from "./utils/diagram-step.utils";
import {select, selectAll, Selection, symbol, symbolCross} from "d3";
import {GRID_SIZE} from "./utils/diagram-grid.utils";
import {Cursor} from "../interface/cursor.enum";

import {selectById} from "./utils/diagram.utils";
import {EntityDiagram} from "./entity-diagram";
import {Step} from "../entities";

export class DiagramSteps extends EntityDiagram {

  private height = STEP_HEIGHT;
  private width = STEP_WIDTH;
  private steps: Step[];
  private stepElement: Selection<SVGGElement, Step, SVGGElement, undefined>
  private anchorsContainer: Selection<SVGGElement, Step, SVGGElement, undefined>;
  private anchors: { element: Selection<SVGGElement, Step, SVGGElement, undefined>, direction: Direction }[] = []
  private readonly anchorPosition: Record<Direction, { x: number, y: number }> = {
    'left': {x: -GRID_SIZE * 3 / 2, y: this.height / 2},
    'right': {x: this.width + GRID_SIZE * 3 / 2, y: this.height / 2},
    'top': {x: this.width / 2, y: -GRID_SIZE * 3 / 2},
    'bottom': {x: this.width / 2, y: this.height + GRID_SIZE * 3 / 2},
  }

  constructor(steps: Step[]) {
    super();
    this.steps = steps;
    this.stepElement = select<SVGGElement, Step>('g') as unknown as Selection<SVGGElement, Step, SVGGElement, undefined>
    this.anchorsContainer = select<SVGGElement, Step>('g') as unknown as Selection<SVGGElement, Step, SVGGElement, undefined>
  }

  createContainer(container: Selection<SVGGElement, undefined, Element, undefined>): void {
    this.stepElement = container
      .append('g')
      .attr('class', 'step-container')
      .selectAll(`.${STEP_ELEMENT_SELECTOR}`)
      .data(this.steps)
      .enter()
      .append('g')
      .attr('class', `${STEP_ELEMENT_SELECTOR}`)
      .attr('id', (step) => step.id)
      .attr('transform', (step) => `translate(${step.x},${step.y})`)
  }

  createSelectionArea() {
    const sizeRatio = 1;
    this.stepElement
      .append('g')
      .attr('transform', `translate(${-sizeRatio * GRID_SIZE},${-sizeRatio * GRID_SIZE})`)
      .append('rect')
      .attr('class', STEP_AREA_SELECTOR)
      .attr('width', this.width + 2 * sizeRatio * GRID_SIZE)
      .attr('height', this.height + 2 * sizeRatio * GRID_SIZE)
      .attr('fill', "transparent")
      .attr('stroke', "transparent")
      .attr('cursor', 'pointer')
  }

  createAnchors(): void {
    this.createAnchorContainer();
    const directions: Direction[] = [
      // 'top',
      // 'left',
      // 'bottom',
      'right'];
    directions.forEach(direction => {
      const element = this.createSubAnchorContainer(direction);
      this.anchors.push({element, direction});
    })
  }

  drawSteps(): void {
    this.createRectangles();
    // this.createImageSteps();
    this.createTitleCreation();
    // this.createUserSteps();
  }

  getContainer(): Selection<SVGGElement, Step, SVGGElement, undefined> {
    return this.stepElement;
  }

  getArea(): Selection<SVGGElement, Step, HTMLElement, undefined> {
    return selectAll<SVGGElement, Step>(`.${STEP_AREA_SELECTOR}`);
  }

  createSubAnchorContainer(direction: Direction): Selection<SVGGElement, Step, SVGGElement, unknown> {
    const subContainer = this.anchorsContainer
      .append('g')
      .attr('class', STEP_ANCHOR_CONTAINER_SELECTOR)
      .attr("pointer-events", "none");

    const anchorPosition = this.getAnchorPosition(direction);
    const x = anchorPosition.x;
    const y = anchorPosition.y;

    subContainer.append('rect')
      .attr('x', x - 3 / 2 * GRID_SIZE)
      .attr('y', y - 3 / 2 * GRID_SIZE)
      .attr('width', 3 * GRID_SIZE)
      .attr('height', 3 * GRID_SIZE)
      .attr('stroke-opacity', 0)
      .attr('fill-opacity', 0)
      .attr('cursor', Cursor.POINTER)

    subContainer.append('circle')
      .attr('class', `${STEP_ANCHOR_CIRCLE_SELECTOR} anchor-${direction}`)
      .attr('cx', x)
      .attr('cy', y)
      .attr('cursor', Cursor.POINTER)
      .attr('r', 6)
      .attr('stroke', STEP_ANCHOR_ACTIVE)
      .attr('stroke-width', 2)
      .attr('fill', STEP_ANCHOR_BACKGROUND)
      .attr('stroke-opacity', 0)
      .attr('fill-opacity', 0)
      .attr("pointer-events", "none");

    const cross = subContainer
      .append('g')
      .attr("class", `${STEP_ANCHOR_CROSS_SELECTOR} anchor-${direction}`)
      .attr('stroke-opacity', 0)
      .attr('fill-opacity', 0)
      .attr('transform', `translate(${x},${y})`)

    cross.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', GRID_SIZE)
      .attr('fill', '#fff')
      .attr('stroke-width', 2)
      .attr('stroke', STEP_ANCHOR_ACTIVE)

    cross.append('path')
      .attr("d", symbol().type(symbolCross).size(200)())
      .attr('fill', STEP_ANCHOR_ACTIVE)
      .attr('stroke', STEP_ANCHOR_ACTIVE)

    return subContainer;
  }

  getAnchors(): { element: Selection<SVGGElement, Step, SVGGElement, undefined>, direction: Direction }[] {
    return this.anchors;
  }

  getAnchorPosition(direction: Direction): { x: number, y: number } {
    return this.anchorPosition[direction];
  }

  setDefaultStepDesigns(): void {
    selectAll(`.${STEP_RECT_SELECTOR}`)
      .attr('stroke', STEP_STROKE_DEFAULT_COLOR);
    this.hideAnchors();
  }

  select(id: string): void {
    this.setSelectedDesign(id);

    selectById(id).selectAll(`.${STEP_ANCHOR_CONTAINER_SELECTOR}`).raise()
      .attr("pointer-events", "auto");

    selectById(id).selectAll(`.${STEP_ANCHOR_CIRCLE_SELECTOR}`).raise()
      .attr('stroke-opacity', 1)
      .attr('fill-opacity', 1)
    selectById(id).selectAll(`.${STEP_ANCHOR_CIRCLE_SELECTOR}`).raise()
      .attr('stroke-opacity', 1)
      .attr('fill-opacity', 1)
  }

  setSelectedDesign(id: string): void {
    selectById(id).raise().select(`.${STEP_RECT_SELECTOR}`)
      .attr('stroke', STEP_STROKE_SELECTED_COLOR);
  }

  setDefaultDesign(id: string): void {
    selectById(id).raise().select(`.${STEP_RECT_SELECTOR}`)
      .attr('stroke', STEP_STROKE_DEFAULT_COLOR);
  }

  setHoveringDesign(id: string): void {
    selectById(id).raise().select(`.${STEP_RECT_SELECTOR}`)
      .attr('stroke', STEP_STROKE_OVER_COLOR);
  }

  setHoveringErrorDesign(id: string): void {
    selectById(id).raise().select(`.${STEP_RECT_SELECTOR}`)
      .attr('stroke', STEP_STROKE_OVER_ERROR_COLOR);
  }

  switchToCross(id: string, direction: Direction, reset: boolean): void {
    const selection = selectById(id);
    if (reset) {
      selection.select(`.${STEP_ANCHOR_CROSS_SELECTOR}.anchor-${direction}`).transition()
        .duration(50)
        .attr('stroke-opacity', 0)
        .attr('fill-opacity', 0)
      selection.select(`.${STEP_ANCHOR_CIRCLE_SELECTOR}.anchor-${direction}`).transition()
        .duration(50)
        .attr('stroke-opacity', 1)
        .attr('fill-opacity', 1)
    } else {
      selection.select(`.${STEP_ANCHOR_CROSS_SELECTOR}.anchor-${direction}`).transition()
        .duration(50)
        .attr('stroke-opacity', 1)
        .attr('fill-opacity', 1)
      selection.select(`.${STEP_ANCHOR_CIRCLE_SELECTOR}.anchor-${direction}`).transition()
        .duration(50)
        .attr('stroke-opacity', 0)
        .attr('fill-opacity', 0)
    }
  }

  move(id: string, position: { x: number, y: number }): void {
    selectById(id)
      .attr('transform', `translate(${position.x},${position.y})`)
      .select(`.${STEP_RECT_SELECTOR}`)
      .raise();
  }

  private hideAnchors(): void {
    selectAll(`.${STEP_ANCHOR_CONTAINER_SELECTOR}`)
      .attr("pointer-events", "none");

    selectAll(`.${STEP_ANCHOR_CIRCLE_SELECTOR}`)
      .attr('stroke-opacity', 0)
      .attr('fill-opacity', 0)

    selectAll(`.${STEP_ANCHOR_CROSS_SELECTOR}`)
      .attr('stroke-opacity', 0)
      .attr('fill-opacity', 0)
  }

  private createAnchorContainer(): void {
    this.anchorsContainer = this.stepElement
      .append('g')
      .attr('class', 'anchors');
  }

  private createRectangles(): void {
    this.stepElement
      .append('g')
      .attr('class', 'step-rect-container')
      .attr("pointer-events", "none")
      .append('rect')
      .attr('class', STEP_RECT_SELECTOR)
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('rx', STEP_PADDING)
      .attr('fill', STEP_BACKGROUND_COLOR)
      .attr('stroke', STEP_STROKE_DEFAULT_COLOR)
      .attr('stroke-width', 2);
  }

  private createTitleCreation(): void {
    this.stepElement.append("foreignObject")
      .attr("pointer-events", "none")
      .attr("width", this.width - STEP_PADDING * 2)
      .attr("height", this.height - STEP_PADDING * 2)
      .attr('x', STEP_PADDING)
      .attr('y', STEP_PADDING)
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .append("div")
      .style("color", "#000")
      .style("text-align", "center")
      .style("justify-content", "center")
      .style("align-items", "center")
      .style("display", "flex")
      .style("width", "100%")
      .style("height", "100%")
      .style("font-size", `${STEP_FONT_SIZE_MAIN_TEXT_CREATION}px`)
      .style("line-height", `${STEP_FONT_SIZE_MAIN_TEXT_CREATION}px`)
      .style('font-weight', 500)
      .html((step) => step.name)
  }
}
