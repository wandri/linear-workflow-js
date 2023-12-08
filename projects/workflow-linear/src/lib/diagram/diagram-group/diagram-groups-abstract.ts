import {
  GROUP_AREA_SELECTOR,
  GROUP_CONTAINER_SELECTOR,
  GROUP_DEFAULT_BACKGROUND_COLOR,
  GROUP_DISTANCE_BETWEEN,
  GROUP_ELEMENT_SELECTOR,
  GROUP_FONT_SIZE_MAIN_TEXT_CREATION,
  GROUP_PADDING,
  GROUP_PADDING_TOP,
  GROUP_RECT_SELECTOR,
  GROUP_WIDTH,
  GROUPS_CONTAINER_SELECTOR,
  LINK_COLOR,
  LINKS_CONTAINER_SELECTOR,
  STEP_CONTAINER_SELECTOR,
  STEP_DEFAULT_BACKGROUND_COLOR,
  STEP_DEFAULT_HEIGHT,
  STEP_FONT_SIZE_MAIN_TEXT_CREATION,
  STEP_NAME_HEIGHT,
  STEP_NO_INFO_COLOR,
  STEP_PADDING,
  STEP_RECT_SELECTOR,
  STEP_STATUS_RADIUS,
  STEP_STROKE_DEFAULT_COLOR,
  STEP_STROKE_OVER_COLOR,
  STEP_USER_RADIUS,
  STEP_WIDTH,
  STEPS_CONTAINER_SELECTOR,
} from '../utils/diagram.constants';
import {selectAll, Selection} from 'd3';
import {GRID_SIZE} from '../utils/diagram-grid.utils';

import {EntityDiagram} from '../entity-diagram';
import {selectById, sortByPosition} from "../utils/diagram.utils";
import {Step, StepGroup} from "../../entities";

export abstract class DiagramGroupsAbstract<
  T extends StepGroup
> extends EntityDiagram {
  groups: T[];
  groupElement: Selection<SVGGElement, T, SVGGElement, undefined>;
  anchorsContainer: Selection<SVGGElement, T, SVGGElement, undefined>;

  protected constructor(groups: T[]) {
    super();
    this.groups = groups;
    this.groupElement = undefined as unknown as Selection<
      SVGGElement,
      T,
      SVGGElement,
      undefined
    >;
    this.anchorsContainer = undefined as unknown as Selection<
      SVGGElement,
      T,
      SVGGElement,
      undefined
    >;
  }

  createContainers(
    container: Selection<SVGGElement, undefined, Element, undefined>
  ): void {
    this.groupElement = container
      .append('g')
      .attr('class', GROUPS_CONTAINER_SELECTOR)
      .selectAll(`.${GROUP_ELEMENT_SELECTOR}`)
      .data(this.groups)
      .enter()
      .append('g')
      .attr('class', GROUP_ELEMENT_SELECTOR)
      .attr('id', (group) => group.id)
      .attr(
        'transform',
        (group: T) =>
          `translate(${group.getXPosition()},${group.getYPosition()})`
      );

    this.groupElement.append('g').attr('class', GROUP_CONTAINER_SELECTOR);

    this.groupElement
      .append('g')
      .attr('class', STEPS_CONTAINER_SELECTOR)
      .attr(
        'transform',
        () => `translate(${GROUP_PADDING},${GROUP_PADDING_TOP})`
      );
  }

  createSelectionArea() {
    const sizeRatio = 1;
    this.groupElement
      .select(`.${GROUP_CONTAINER_SELECTOR}`)
      .append('rect')
      .attr('class', GROUP_AREA_SELECTOR)
      .attr('width', GROUP_WIDTH + 2 * sizeRatio * GRID_SIZE)
      .attr('height', (group) => group.getHeight() + 2 * sizeRatio * GRID_SIZE)
      .attr('fill', 'transparent')
      .attr('stroke', 'transparent')
      .attr(
        'transform',
        `translate(${-sizeRatio * GRID_SIZE},${-sizeRatio * GRID_SIZE})`
      )
      .attr('cursor', 'pointer');
  }

  drawGroups(): void {
    this.createRectangles();
    this.createTitleCreation();
  }

  createLinks(
    content: Selection<SVGGElement, undefined, Element, undefined>
  ): void {
    const linksContainer = content
      .append('g')
      .attr('id', LINKS_CONTAINER_SELECTOR)
      .attr('pointer-events', 'none');

    const sortedGroups: T[] = [...this.groups].sort(sortByPosition);

    for (let i = 1; i < sortedGroups.length; i++) {
      linksContainer
        .append('path')
        .attr(
          'd',
          `M ${
            i * (GROUP_WIDTH + GROUP_DISTANCE_BETWEEN) -
            GROUP_DISTANCE_BETWEEN +
            GRID_SIZE
          } ${0}, L ${
            i * (GROUP_WIDTH + GROUP_DISTANCE_BETWEEN) - GRID_SIZE
          } ${0}`
        )
        .attr('stroke', LINK_COLOR)
        .attr('id', `${sortedGroups[i - 1].id}++${sortedGroups[i].id}`)
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round');
    }
  }

  drawSteps(): void {
    this.groups.forEach((group: T) => {
      this.createStepContainers(group);
      group.steps.forEach((step: Step) => this.drawStep(step));
    });
  }

  getStepElements(): Selection<SVGGElement, Step, HTMLElement, unknown> {
    return selectAll<SVGGElement, Step>(`.${STEP_CONTAINER_SELECTOR}`);
  }

  setStepDefaultDesign(id: string): void {
    selectById(id)
      .raise()
      .select(`.${STEP_RECT_SELECTOR}`)
      .attr('stroke', STEP_STROKE_DEFAULT_COLOR);
  }

  setStepHoveringDesign(id: string): void {
    selectById(id)
      .raise()
      .select(`.${STEP_RECT_SELECTOR}`)
      .attr('stroke', STEP_STROKE_OVER_COLOR);
  }

  protected createRectangles(): void {
    this.groupElement
      .select(`.${GROUP_CONTAINER_SELECTOR}`)
      .append('rect')
      .attr('class', GROUP_RECT_SELECTOR)
      .attr('width', (group) => group.getGlobalWidth())
      .attr('height', (group) => group.getHeight())
      .attr('rx', GROUP_PADDING)
      .attr('fill', GROUP_DEFAULT_BACKGROUND_COLOR)
      .attr('stroke', 'transparent')
      .attr('stroke-width', 2)
      .attr('pointer-events', 'none');
  }

  protected createTitleCreation(): void {
    this.groupElement
      .select(`.${GROUP_CONTAINER_SELECTOR}`)
      .append('foreignObject')
      .attr('cursor', 'pointer')
      .attr('width', (group) => group.getGlobalWidth() - GROUP_PADDING * 2)
      .attr('height', GROUP_PADDING_TOP)
      .attr('x', GROUP_PADDING)
      .attr('y', 0)
      .attr('pointer-events', 'none')
      .append('xhtml:div')
      .style('width', '100%')
      .style('height', '100%')
      .append('div')
      .style('color', '#000')
      .style('text-align', 'center')
      .style('align-items', 'center')
      .style('display', 'flex')
      .style('width', '100%')
      .style('height', '100%')
      .style('font-size', `${GROUP_FONT_SIZE_MAIN_TEXT_CREATION}px`)
      .style('line-height', `${GROUP_FONT_SIZE_MAIN_TEXT_CREATION}px`)
      .style('font-weight', 500)
      .html((group) => group.name);
  }

  private createStepContainers(group: T): void {
    const stepsContainer = selectById<SVGGElement, T>(group.id).select(
      `.${STEPS_CONTAINER_SELECTOR}`
    );
    const steps: Step[] = [...group.steps].sort(sortByPosition);

    stepsContainer
      .selectAll(`.${STEP_CONTAINER_SELECTOR}`)
      .data(steps)
      .enter()
      .append('g')
      .attr('class', `${STEP_CONTAINER_SELECTOR}`)
      .attr('id', (step) => step.id)
      .attr(
        'transform',
        (step: Step) =>
          `translate(${step.getXPosition()},${step.getYPosition()})`
      );
  }

  private drawStep(step: Step): void {
    const container = selectById<SVGGElement, Step>(step.id);

    container
      .append('rect')
      .attr('class', STEP_RECT_SELECTOR)
      .attr('width', STEP_WIDTH)
      .attr('height', (step) => step.getHeight())
      .attr('rx', STEP_PADDING)
      .attr('fill', STEP_DEFAULT_BACKGROUND_COLOR)
      .attr('stroke', STEP_STROKE_DEFAULT_COLOR)
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer');

    container
      .append('foreignObject')
      .attr('class', 'step-name')
      .attr('pointer-events', 'none')
      .attr('width', STEP_WIDTH - STEP_PADDING * 2)
      .attr('height', STEP_NAME_HEIGHT)
      .attr('x', STEP_PADDING)
      .attr('y', STEP_PADDING * 2 + STEP_STATUS_RADIUS * 2)
      .append('xhtml:div')
      .style('width', '100%')
      .style('height', '100%')
      .append('div')
      .style('color', '#000')
      .style('text-align', 'center')
      .style('align-items', 'center')
      .style('display', 'flex')
      .style('width', '100%')
      .style('height', '100%')
      .style('font-size', `${STEP_FONT_SIZE_MAIN_TEXT_CREATION}px`)
      .style('line-height', `${STEP_FONT_SIZE_MAIN_TEXT_CREATION}px`)
      .style('font-weight', 500)
      .html((step: Step) => step.name);

    if (step.status) {
      //
    } else {
      container
        .append('circle')
        .attr('pointer-events', 'none')
        .attr('cx', STEP_PADDING + STEP_STATUS_RADIUS)
        .attr('cy', STEP_PADDING + STEP_STATUS_RADIUS)
        .attr('r', STEP_STATUS_RADIUS)
        .attr('fill', STEP_NO_INFO_COLOR);
    }

    const userContainer = container
      .append('g')
      .attr('class', 'user-container')
      .attr('pointer-events', 'none')
      .attr(
        'transform',
        `translate(${STEP_PADDING},${
          STEP_DEFAULT_HEIGHT - STEP_PADDING - STEP_USER_RADIUS
        })`
      );
    userContainer
      .append('circle')
      .attr('cx', STEP_USER_RADIUS)
      .attr('cy', 0)
      .attr('r', STEP_USER_RADIUS)
      .attr('fill', STEP_NO_INFO_COLOR);

    userContainer
      .append('rect')
      .attr('rx', 24 / 2)
      .attr('y', -24 / 2)
      .attr('x', STEP_PADDING + STEP_USER_RADIUS * 2)
      .attr('height', 24)
      .attr('width', GRID_SIZE * 6)
      .attr('fill', STEP_NO_INFO_COLOR);
  }
}
