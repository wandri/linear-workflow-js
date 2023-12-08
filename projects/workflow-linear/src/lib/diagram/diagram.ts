import {drag, DragBehavior, select, selectAll, Selection} from 'd3';
import {
  CREATE_STEP_BUTTON_CONTAINER_SELECTOR,
  GROUP_CREATE_STEP_BUTTON_DEFAULT_COLOR,
  GROUP_CREATE_STEP_BUTTON_DOWN_COLOR,
  GROUP_CREATE_STEP_BUTTON_OVER_COLOR,
  GROUP_DRAG_PLACEHOLDER_BACKGROUND_COLOR,
  GROUP_PADDING,
  GROUP_PLACEHOLDER_SELECTOR,
  GROUPS_CONTAINER_SELECTOR,
  STEP_DRAG_PLACEHOLDER_BACKGROUND_COLOR,
  STEP_PADDING,
  STEP_PLACEHOLDER_SELECTOR,
  STEPS_CONTAINER_SELECTOR,
} from './utils/diagram.constants';
import {DiagramGroups} from './diagram-group/diagram-groups';
import {DiagramActionType} from '../interface/diagram-action-type.enum';
import {selectById} from './utils/diagram.utils';
import {DiagramAbstract} from './diagram-abstract';
import {GRID_SIZE} from './utils/diagram-grid.utils';
import {Step, StepGroup} from "../entities";

export class Diagram extends DiagramAbstract<StepGroup, DiagramGroups> {
  protected override diagramGroups: DiagramGroups = new DiagramGroups([]);

  private draggedItemId?: string;
  private initialClick: { x: number; y: number } = {x: 0, y: 0};
  private isDragDisabled = false;

  override init(
    width: number,
    height: number,
    wrapper: Selection<HTMLElement, undefined, Element, undefined>,
    groups: StepGroup[]
  ): void {
    this.width = width;
    this.height = height;
    if (wrapper) {
      this.svg = wrapper
        .append<SVGElement>('svg')
        .attr('viewBox', [0, 0, this.width, this.height])
        .attr('width', this.width)
        .attr('height', this.height);

      this.svg.append('defs');
      this.svg
        .on('click', (event: MouseEvent) =>
          this.sendClickOnGridAndStopPropagation(event)
        )
        .on('contextmenu', (event: MouseEvent) =>
          this.sendContextMenuOnGridAndStopPropagation(event)
        );
    }

    this.createGridAndGlobalZoom();
    this.createContentContainer(groups);
    this.update(groups, true, 0);
  }

  createDiagramGroups(groups: StepGroup[]): DiagramGroups {
    return new DiagramGroups(groups);
  }

  protected override generateContent(groups: StepGroup[]): void {
    this.content?.remove();
    if (this.contentContainer) {
      this.content = this.contentContainer
        .append<SVGGElement>('g')
        .attr('id', 'content');

      // The order is important.
      // 1. define the groups,
      this.diagramGroups = new DiagramGroups(groups);
      // 2. then display the links to be always behind
      this.createLinksBetweenGroup(this.content);
      // 3. and after the groups.
      this.createGroups(this.content);

      this.createGroupCreationButton(this.content);
    }
  }

  protected getZoomPositionPaddingRight(): number {
    return GRID_SIZE * 2 * 4;
  }

  protected override createGroups(
    content: Selection<SVGGElement, undefined, Element, undefined>
  ): void {
    this.createGroupsAndSteps(content);

    this.diagramGroups
      .getArea()
      .on('mouseover', (event: MouseEvent, group: StepGroup) =>
        this.mouseOverOnGroup(group)
      )
      .on('mouseout', (event: MouseEvent, group: StepGroup) =>
        this.mouseOutOnGroup(group)
      )
      .on('contextmenu', (event: MouseEvent, group: StepGroup) =>
        this.contextMenuOnGroup(event, group)
      );

    this.diagramGroups
      .getStepElements()
      .on('mouseover', (event: MouseEvent, step: Step) =>
        this.mouseOverOnStep(step)
      )
      .on('mouseout', (event: MouseEvent, step: Step) =>
        this.mouseOutOnStep(step)
      )
      .on('contextmenu', (event: MouseEvent, step: Step) =>
        this.contextMenuOnStep(event, step)
      );

    this.diagramGroups
      .getStepButtonCreationContainer()
      .on('mouseover', (event: MouseEvent, group: StepGroup) =>
        this.mouseOverOnStepCreationButton(group)
      )
      .on('mouseout', (event: MouseEvent, group: StepGroup) =>
        this.mouseOutOnStepCreationButton(group)
      )
      .on('mousedown', (event: MouseEvent, group: StepGroup) =>
        this.mouseDownOnStepCreationButton(group)
      )
      .on('click', (event: MouseEvent, group: StepGroup) =>
        this.clickOnStepCreationButton(group)
      );

    this.diagramGroups.getGroupElements().call(this.dragAndDropGroup());
    this.diagramGroups.getStepElements().call(this.dragAndDropStep());
  }

  private mouseOutOnStepCreationButton(group: StepGroup) {
    selectById<SVGGElement, StepGroup>(group.id)
      .select(`.${CREATE_STEP_BUTTON_CONTAINER_SELECTOR}`)
      .select('rect')
      .attr('fill', GROUP_CREATE_STEP_BUTTON_DEFAULT_COLOR);
  }

  private mouseDownOnStepCreationButton(group: StepGroup) {
    this.isDragDisabled = true;
    selectById<SVGGElement, StepGroup>(group.id)
      .select(`.${CREATE_STEP_BUTTON_CONTAINER_SELECTOR}`)
      .select('rect')
      .attr('fill', GROUP_CREATE_STEP_BUTTON_DOWN_COLOR);
  }

  private clickOnStepCreationButton(group: StepGroup) {
    this.isDragDisabled = false;
    selectById<SVGGElement, StepGroup>(group.id)
      .select(`.${CREATE_STEP_BUTTON_CONTAINER_SELECTOR}`)
      .select('rect')
      .attr('fill', GROUP_CREATE_STEP_BUTTON_OVER_COLOR);

    this.actions$.next({
      eventType: DiagramActionType.ADD_STEP,
      element: group,
      event: undefined,
    });
  }

  private mouseOverOnStepCreationButton(group: StepGroup): void {
    selectById<SVGGElement, StepGroup>(group.id)
      .select(`.${CREATE_STEP_BUTTON_CONTAINER_SELECTOR}`)
      .select('rect')
      .attr('fill', GROUP_CREATE_STEP_BUTTON_OVER_COLOR);
    this.diagramGroups.setGroupHoveringDesign(group.id);
  }

  private dragAndDropGroup(): DragBehavior<SVGGElement, StepGroup, unknown> {
    return drag<SVGGElement, StepGroup>()
      .filter(
        (event: DragEvent) => !this.isDragDisabled && this.isLeftClick(event)
      )
      .on('start', (event: DragEvent, group: StepGroup) =>
        this.startGroupDrag(event, group)
      )
      .on('drag', (event: MouseEvent, group: StepGroup) =>
        this.dragGroup(event, group)
      )
      .on('end', (event: MouseEvent, group: StepGroup) =>
        this.endDragGroup(group)
      );
  }

  private dragAndDropStep(): DragBehavior<SVGGElement, Step, unknown> {
    return drag<SVGGElement, Step>()
      .filter(
        (event: DragEvent) => !this.isDragDisabled && this.isLeftClick(event)
      )
      .on('start', (event: DragEvent, step: Step) =>
        this.startStepDrag(event, step)
      )
      .on('drag', (event: MouseEvent, step: Step) => this.dragStep(event, step))
      .on('end', (event: MouseEvent, step: Step) => this.endDragStep(step));
  }

  private endDragGroup(group: StepGroup) {
    this.draggedItemId = undefined;
    selectAll(`.${GROUP_PLACEHOLDER_SELECTOR}`).remove();
    group.setDefaultXPosition();
    group.setDefaultYPosition();
    this.diagramGroups.moveGroup(group, false);
    this.diagramGroups.setGroupHoveringDesign(group.id);
  }

  private endDragStep(step: Step) {
    this.draggedItemId = undefined;
    selectAll(`.${STEP_PLACEHOLDER_SELECTOR}`).remove();
    step.setDefaultXPosition();
    step.setDefaultYPosition();
    this.diagramGroups.moveStep(step, false);
    this.diagramGroups.setStepHoveringDesign(step.id);
  }

  private dragGroup(event: MouseEvent, group: StepGroup): void {
    group.setXPosition(Math.round(event.x + this.initialClick.x));
    group.setYPosition(Math.round(event.y + this.initialClick.y));
    this.diagramGroups.moveGroup(group, true);
    const position = group.getNewPosition(event.x);
    if (group.getPosition() !== position) {
      this.diagramGroups.updateGroupsPosition(group.getPosition(), position);
      select(`.${GROUP_PLACEHOLDER_SELECTOR}`).attr(
        'transform',
        `translate(${group.getDefaultXPosition()},${group.getDefaultYPosition()})`
      );
    }
  }

  private dragStep(event: MouseEvent, step: Step): void {
    step.setXPosition(Math.round(event.x + this.initialClick.x));
    step.setYPosition(Math.round(event.y + this.initialClick.y));
    this.diagramGroups.moveStep(step, true);
    const previousPosition = step.position;
    this.diagramGroups.updateStepsPosition(step);
    if (step.position !== previousPosition) {
      select(`.${STEP_PLACEHOLDER_SELECTOR}`).attr(
        'transform',
        `translate(${step.getDefaultXPosition()},${step.getDefaultYPosition()})`
      );
    }
  }

  private startGroupDrag(event: DragEvent, group: StepGroup): void {
    this.initialClick.x = group.getXPosition() - event.x;
    this.initialClick.y = group.getYPosition() - event.y;
    this.draggedItemId = group.id;
    this.createGroupPlaceholder(group);
    this.diagramGroups.setGroupDragDesign(group.id);
    this.diagramGroups.raise(group.id);
  }

  private startStepDrag(event: DragEvent, step: Step): void {
    this.initialClick.x = step.getXPosition() - event.x;
    this.initialClick.y = step.getYPosition() - event.y;
    this.draggedItemId = step.id;
    this.createStepPlaceholder(step);
    this.diagramGroups.setStepDragDesign(step.id);
    this.diagramGroups.raise(step.id);
  }

  private createGroupPlaceholder(group: StepGroup): void {
    select<SVGGElement, undefined>(`.${GROUPS_CONTAINER_SELECTOR}`)
      .append('rect')
      .attr('class', GROUP_PLACEHOLDER_SELECTOR)
      .attr(
        'transform',
        `translate(${group.getDefaultXPosition()},${group.getDefaultYPosition()})`
      )
      .attr('width', group.getGlobalWidth())
      .attr('height', group.getHeight())
      .attr('rx', GROUP_PADDING)
      .attr('fill', GROUP_DRAG_PLACEHOLDER_BACKGROUND_COLOR)
      .attr('stroke', 'transparent')
      .attr('stroke-width', 2)
      .attr('pointer-events', 'none');
  }

  private createStepPlaceholder(step: Step): void {
    selectById<SVGGElement, StepGroup>(step.groupId)
      .select(`.${STEPS_CONTAINER_SELECTOR}`)
      .append('rect')
      .attr('class', STEP_PLACEHOLDER_SELECTOR)
      .attr(
        'transform',
        `translate(${step.getDefaultXPosition()},${step.getDefaultYPosition()})`
      )
      .attr('width', step.getWith())
      .attr('height', step.getHeight())
      .attr('rx', STEP_PADDING)
      .attr('fill', STEP_DRAG_PLACEHOLDER_BACKGROUND_COLOR)
      .attr('stroke', 'transparent')
      .attr('stroke-width', 2)
      .attr('pointer-events', 'none');
  }

  private isLeftClick(event: DragEvent): boolean {
    return event.button === 0;
  }

  private mouseOutOnStep(step: Step): void {
    this.diagramGroups.setStepDefaultDesign(step.id);
  }

  private mouseOverOnGroup(group: StepGroup): void {
    if (!this.draggedItemId || group.id === this.draggedItemId) {
      this.diagramGroups.setGroupHoveringDesign(group.id);
    }
  }

  private mouseOutOnGroup(group: StepGroup): void {
    this.diagramGroups.setGroupDefaultDesign(group.id);
  }

  private mouseOverOnStep(step: Step): void {
    if (!this.draggedItemId || step.groupId === this.draggedItemId) {
      this.diagramGroups.setGroupHoveringDesign(step.groupId);
      this.diagramGroups.setStepHoveringDesign(step.id);
    }
  }

  private contextMenuOnStep(event: MouseEvent, step: Step): void {
    this.actions$.next({
      element: step,
      event,
      eventType: DiagramActionType.CONTEXT_MENU_ON_STEP,
    });
    event.stopPropagation();
    event.preventDefault();
  }

  private contextMenuOnGroup(event: MouseEvent, group: StepGroup): void {
    this.actions$.next({
      element: group,
      event,
      eventType: DiagramActionType.CONTEXT_MENU_ON_GROUP,
    });
    event.stopPropagation();
    event.preventDefault();
  }

  private sendContextMenuOnGridAndStopPropagation(event: MouseEvent): void {
    this.actions$.next({
      element: undefined,
      eventType: DiagramActionType.CONTEXT_MENU_ON_GRID,
      event,
    });
    event.preventDefault();
  }

  private createGroupCreationButton(
    content: Selection<SVGGElement, undefined, Element, undefined>
  ) {
    this.diagramGroups.createGroupCreationButton(content);

    this.diagramGroups
      .getGroupCreationButtonContainer()
      .on('mouseover', () =>
        this.diagramGroups.displayOverOnCreationGroupContainerButton()
      )
      .on('mouseout', () =>
        this.diagramGroups.displayDefaultOnCreationGroupContainerButton()
      );
    this.diagramGroups
      .getGroupCreationButton()
      .on('mouseover', () =>
        this.diagramGroups.displayOverOnCreationGroupButton()
      )
      .on('mouseout', () =>
        this.diagramGroups.displayDefaultOnCreationGroupButton()
      )
      .on('click', () =>
        this.actions$.next({
          event: undefined,
          element: undefined,
          eventType: DiagramActionType.ADD_GROUP,
        })
      );
  }
}
