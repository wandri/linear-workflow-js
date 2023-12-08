import {
  CREATE_STEP_BUTTON_CONTAINER_SELECTOR,
  CREATION_GROUP_CIRCLE_SELECTOR,
  CREATION_GROUP_CROSS_SELECTOR,
  CREATION_GROUP_LINK_SELECTOR,
  GROUP_AREA_SELECTOR,
  GROUP_CONTAINER_SELECTOR,
  GROUP_CREATE_STEP_BUTTON_DEFAULT_COLOR,
  GROUP_CREATION_BUTTON_SELECTOR,
  GROUP_CREATION_CONTAINER_SELECTOR,
  GROUP_CREATION_DEFAULT_COLOR,
  GROUP_CREATION_OVER_COLOR,
  GROUP_DEFAULT_BACKGROUND_COLOR,
  GROUP_DISTANCE_BETWEEN,
  GROUP_DRAG_BACKGROUND_COLOR,
  GROUP_OVER_BACKGROUND_COLOR,
  GROUP_PADDING,
  GROUP_PADDING_BOTTOM,
  GROUP_RECT_SELECTOR,
  GROUP_WIDTH,
  PATH_CROSS,
  SELECTED_COLOR,
  STEP_DISTANCE_BETWEEN,
  STEP_DRAG_BACKGROUND_COLOR,
  STEP_FONT_SIZE_STEP_CREATION_BUTTON,
  STEP_RECT_SELECTOR,
} from '../utils/diagram.constants';
import {select, selectAll, Selection} from 'd3';
import {GRID_SIZE} from '../utils/diagram-grid.utils';

import {selectById, sortByPosition} from '../utils/diagram.utils';
import {DiagramGroupsAbstract} from './diagram-groups-abstract';
import {Step, StepGroup} from "../../entities";

export class DiagramGroups extends DiagramGroupsAbstract<StepGroup> {
  constructor(groups: StepGroup[]) {
    super(groups);
  }

  override drawGroups(): void {
    this.createRectangles();
    this.createTitleCreation();
    this.createNewStepButton();
  }

  getGroupElements(): Selection<
    SVGGElement,
    StepGroup,
    SVGGElement,
    undefined
  > {
    return this.groupElement;
  }

  getArea(): Selection<SVGGElement, StepGroup, HTMLElement, undefined> {
    return selectAll<SVGGElement, StepGroup>(`.${GROUP_AREA_SELECTOR}`);
  }

  getStepButtonCreationContainer(): Selection<
    SVGGElement,
    StepGroup,
    HTMLElement,
    undefined
  > {
    return selectAll<SVGGElement, StepGroup>(
      `.${CREATE_STEP_BUTTON_CONTAINER_SELECTOR}`
    );
  }

  setGroupHoveringDesign(id: string): void {
    this.groupElement
      .filter((group) => group.id !== id)
      .each((group) => this.setGroupDefaultDesign(group.id));

    selectById(id)
      .raise()
      .select(`.${GROUP_RECT_SELECTOR}`)
      .attr('fill', GROUP_OVER_BACKGROUND_COLOR);
  }

  setGroupDragDesign(id: string): void {
    selectById(id)
      .raise()
      .select(`.${GROUP_RECT_SELECTOR}`)
      .attr('fill', GROUP_DRAG_BACKGROUND_COLOR);
  }

  setStepDragDesign(id: string): void {
    selectById(id)
      .raise()
      .select(`.${STEP_RECT_SELECTOR}`)
      .attr('fill', STEP_DRAG_BACKGROUND_COLOR);
  }

  setGroupDefaultDesign(id: string): void {
    selectById(id)
      .raise()
      .select(`.${GROUP_RECT_SELECTOR}`)
      .attr('fill', GROUP_DEFAULT_BACKGROUND_COLOR);
  }

  moveGroup(group: StepGroup, withRotation: boolean): void {
    selectById(group.id)
      .attr(
        'transform',
        `translate(${group.getXPosition()},${group.getYPosition()}) ${
          withRotation ? 'rotate(4)' : ''
        }`
      )
      .raise()
      .select(`.${GROUP_RECT_SELECTOR}`);
  }

  moveStep(step: Step, withRotation: boolean): void {
    selectById(step.id)
      .attr(
        'transform',
        `translate(${step.getXPosition()},${step.getYPosition()}) ${
          withRotation ? 'rotate(4)' : ''
        }`
      )
      .raise()
      .select(`.${GROUP_RECT_SELECTOR}`);
  }

  updateGroupsPosition(oldPosition: number, newPosition: number): void {
    const group = this.groups.find(
      (group) => group.getPosition() === oldPosition
    );
    const otherGroup = this.groups.find(
      (group) => group.getPosition() === newPosition
    );
    if (group && otherGroup) {
      group.setPosition(newPosition);
      otherGroup.setPosition(oldPosition, true);
      otherGroup.setDefaultXPosition();
      this.groups.sort(sortByPosition);
      this.moveGroup(otherGroup, false);
    }
  }

  updateStepsPosition(step: Step) {
    const group = this.groups.find((group) => group.id === step.groupId);
    if (group) {
      let height = 0;
      group.steps.sort(sortByPosition);
      for (const element of group.steps) {
        const otherStep = element;
        const minY = otherStep.getYPosition() + GRID_SIZE;
        const maxY =
          otherStep.getYPosition() + otherStep.getHeight() - GRID_SIZE;
        const isInsideAnotherStep =
          step.getYPosition() > minY && step.getYPosition() < maxY;

        if (isInsideAnotherStep && otherStep.id !== step.id) {
          const previousPosition = step.position;
          step.position = otherStep.position;
          otherStep.position = previousPosition;
          if (step.position > otherStep.position) {
            otherStep.setDefaultPositionY(step.getDefaultYPosition());
            otherStep.setYPosition(step.getDefaultYPosition());
          } else {
            otherStep.setDefaultPositionY(
              height + step.getHeight() + STEP_DISTANCE_BETWEEN
            );
            otherStep.setYPosition(
              height + step.getHeight() + STEP_DISTANCE_BETWEEN
            );
          }
          step.setDefaultPositionY(height);
          group.steps.sort(sortByPosition);
          this.moveStep(otherStep, false);
          break;
        }
        height += otherStep.getHeight() + STEP_DISTANCE_BETWEEN;
      }
    }
  }

  createGroupCreationButton(
    content: Selection<SVGGElement, undefined, Element, undefined>
  ): void {
    const container = content
      .append('g')
      .attr('class', GROUP_CREATION_CONTAINER_SELECTOR)
      .attr(
        'transform',
        `translate(${
          this.groups.length * GROUP_WIDTH +
          (this.groups.length - 1) * GROUP_DISTANCE_BETWEEN
        },${0})`
      );

    container
      .append('rect')
      .attr('class', 'container-size')
      .attr('x', 0)
      .attr('y', -10 * GRID_SIZE)
      .attr('height', 20 * GRID_SIZE)
      .attr('width', 20 * GRID_SIZE)
      .attr('fill', 'transparent')
      .attr('stroke', 'transparent');

    container
      .append('path')
      .attr('class', CREATION_GROUP_LINK_SELECTOR)
      .attr('d', `M ${GRID_SIZE} 0, H ${3 * GRID_SIZE}`)
      .attr('stroke-width', 2)
      .attr('fill', 'transparent')
      .attr('stroke', GROUP_CREATION_DEFAULT_COLOR);

    const buttonIcon = container
      .append('g')
      .attr('class', GROUP_CREATION_BUTTON_SELECTOR)
      .attr('transform', `translate(${6 * GRID_SIZE},${0})`)
      .attr('cursor', 'pointer');

    buttonIcon
      .append('circle')
      .attr('class', CREATION_GROUP_CIRCLE_SELECTOR)
      .attr('r', 1.5 * GRID_SIZE)
      .attr('fill', 'transparent')
      .attr('stroke-width', 2)
      .attr('stroke', GROUP_CREATION_DEFAULT_COLOR);

    buttonIcon
      .append('path')
      .attr('class', CREATION_GROUP_CROSS_SELECTOR)
      .attr('d', PATH_CROSS.size(400))
      .attr('pointer-events', 'none')
      .attr('fill', GROUP_CREATION_DEFAULT_COLOR);
  }

  displayDefaultOnCreationGroupButton(): void {
    select(`.${CREATION_GROUP_LINK_SELECTOR}`)
      .transition()
      .duration(100)
      .attr('stroke', GROUP_CREATION_OVER_COLOR);
    select(`.${CREATION_GROUP_CIRCLE_SELECTOR}`)
      .attr('stroke', GROUP_CREATION_OVER_COLOR)
      .transition()
      .duration(100)
      .attr('r', 1.5 * GRID_SIZE);
    select(`.${CREATION_GROUP_CROSS_SELECTOR}`)
      .attr('fill', GROUP_CREATION_OVER_COLOR)
      .transition()
      .duration(100)
      .attr('d', PATH_CROSS.size(400));
  }

  displayOverOnCreationGroupButton(): void {
    select(`.${CREATION_GROUP_LINK_SELECTOR}`)
      .transition()
      .duration(100)
      .attr('stroke', SELECTED_COLOR);
    select(`.${CREATION_GROUP_CIRCLE_SELECTOR}`)
      .transition()
      .duration(100)
      .attr('stroke', SELECTED_COLOR)
      .attr('r', 1.75 * GRID_SIZE);
    select(`.${CREATION_GROUP_CROSS_SELECTOR}`)
      .transition()
      .duration(100)
      .attr('fill', SELECTED_COLOR)
      .attr('d', PATH_CROSS.size(500));
  }

  displayDefaultOnCreationGroupContainerButton(): void {
    select(`.${CREATION_GROUP_LINK_SELECTOR}`).attr(
      'stroke',
      GROUP_CREATION_DEFAULT_COLOR
    );
    select(`.${CREATION_GROUP_CIRCLE_SELECTOR}`).attr(
      'stroke',
      GROUP_CREATION_DEFAULT_COLOR
    );
    select(`.${CREATION_GROUP_CROSS_SELECTOR}`).attr(
      'fill',
      GROUP_CREATION_DEFAULT_COLOR
    );
  }

  displayOverOnCreationGroupContainerButton(): void {
    select(`.${CREATION_GROUP_LINK_SELECTOR}`).attr(
      'stroke',
      GROUP_CREATION_OVER_COLOR
    );
    select(`.${CREATION_GROUP_CIRCLE_SELECTOR}`).attr(
      'stroke',
      GROUP_CREATION_OVER_COLOR
    );
    select(`.${CREATION_GROUP_CROSS_SELECTOR}`).attr(
      'fill',
      GROUP_CREATION_OVER_COLOR
    );
  }

  getGroupCreationButton(): Selection<
    SVGGElement,
    undefined,
    HTMLElement,
    undefined
  > {
    return select(`.${GROUP_CREATION_BUTTON_SELECTOR}`);
  }

  getGroupCreationButtonContainer(): Selection<
    SVGGElement,
    undefined,
    HTMLElement,
    undefined
  > {
    return select(`.${GROUP_CREATION_CONTAINER_SELECTOR}`);
  }

  private createNewStepButton(): void {
    const createStepButtonContainer = this.groupElement
      .select(`.${GROUP_CONTAINER_SELECTOR}`)
      .append('g')
      .attr('class', CREATE_STEP_BUTTON_CONTAINER_SELECTOR)
      .attr(
        'transform',
        (group) =>
          `translate(${GROUP_PADDING},${
            group.getHeight() - GROUP_PADDING_BOTTOM + GRID_SIZE
          })`
      )
      .attr('cursor', 'pointer');

    createStepButtonContainer
      .append('rect')
      .attr('rx', GRID_SIZE / 2)
      .attr('height', 2 * GRID_SIZE)
      .attr('width', (group) => group.getGlobalWidth() - 2 * GROUP_PADDING)
      .attr('fill', GROUP_CREATE_STEP_BUTTON_DEFAULT_COLOR);

    createStepButtonContainer
      .append('foreignObject')
      .attr('class', 'step-name')
      .attr('pointer-events', 'none')
      .attr('x', 38)
      .attr('width', (group) => group.getGlobalWidth() - 2 * GROUP_PADDING)
      .attr('height', 2 * GRID_SIZE)
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
      .style('font-size', `${STEP_FONT_SIZE_STEP_CREATION_BUTTON}px`)
      .style('line-height', `${STEP_FONT_SIZE_STEP_CREATION_BUTTON}px`)
      .style('font-weight', 500)
      .html('Add a step');

    createStepButtonContainer
      .append('path')
      .attr('x', 20)
      .attr('d', 'M 8 20, H 28, M 18 10, V 30')
      .attr('stroke', 'black')
      .attr('stroke-with', 2);
  }
}
