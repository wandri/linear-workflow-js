import {D3ZoomEvent, drag, DragBehavior, Selection, SubjectPosition, zoom, ZoomBehavior, zoomIdentity} from "d3";
import {DiagramGridUtils} from "./utils/diagram-grid.utils";
import {Direction, STEP_HEIGHT, STEP_WIDTH} from "./utils/diagram-step.utils";
import {DiagramConnectorUtils} from "./utils/diagram-connector.utils";
import {DiagramSteps} from "./diagram-steps";
import {DiagramConnectors} from "./diagram-connectors";
import {ConnectorCreationDetail} from "../interface/connectorCreationDetail.interface";
import {Subject} from "rxjs";
import {ManualZoomAction} from "../manual-zoom-action.enum";
import {DiagramActionType} from "../interface/diagram-action-type.enum";
import {StepWithAnchor} from "../interface/step-with-anchor.class";
import {Connector, Step, WorkflowMulti} from "../entities";

export class Diagram {
  selectedConnector?: Connector;
  selectedStep?: Step;

  readonly actions$: Subject<{
    event: MouseEvent | D3ZoomEvent<SVGElement, null> | undefined,
    element: Step | Connector | { stepStart: Step, stepEnd: Step, connector?: Connector } | undefined,
    eventType: DiagramActionType
  }> = new Subject<{
    event: MouseEvent | D3ZoomEvent<SVGElement, null> | undefined,
    element: Step | Connector | { stepStart: Step, stepEnd: Step, connector?: Connector } | undefined,
    eventType: DiagramActionType
  }>();
  private width: number = 0;
  private height: number = 0;
  private svg?: Selection<SVGElement, undefined, Element, undefined>;
  private connectorCreationDetailStart: ConnectorCreationDetail = {positionOnStep: 'right'};
  private connectorCreationDetailEnd: ConnectorCreationDetail = {positionOnStep: 'left'};
  private content?: Selection<SVGGElement, undefined, Element, undefined>;
  private contentContainer?: Selection<SVGGElement, undefined, Element, undefined>;
  private isCreatingConnection: boolean = false;
  private draggedConnector?: Connector;
  private draggedConnectorSide: 'end' | 'start' = 'end';
  private diagramConnectors: DiagramConnectors = new DiagramConnectors([]);
  private diagramSteps: DiagramSteps = new DiagramSteps([]);

  init(width: number, height: number, wrapper: Selection<HTMLElement, undefined, Element, undefined>,
       workflow: WorkflowMulti): void {
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
        .on("click", (event: MouseEvent) => this.sendClickOnGridAndStopPropagation(event))
        .on("contextmenu", (event: MouseEvent) => this.sendContextMenuOnGridAndStopPropagation(event));
    }

    this.createGridAndGlobalZoom();
    DiagramConnectorUtils.createConnectorDefs();
    this.createContentContainer(workflow);
    this.update(workflow, true, 0)
  }

  update(workflow: WorkflowMulti, withZoom: boolean = false, animationDuration = 200): void {
    this.generateContent(workflow);
    if (withZoom) {
      this.adjustZoomToView(workflow, animationDuration);
    }
  }

  remove(): void {
    this.svg?.remove();
  }

  initConnectorCreation(step: Step, positionOnStep: Direction): void {
    this.isCreatingConnection = true;
    this.connectorCreationDetailStart.step = step;
    this.connectorCreationDetailStart.positionOnStep = positionOnStep;
    this.diagramConnectors.initializeConnectorCreation();
  }

  applyManualZoom(type: ManualZoomAction, workflow: WorkflowMulti): void {
    if (type === ManualZoomAction.ADJUST) {
      this.adjustZoomToView(workflow);
    } else {
      let scale = 1;
      if (type === ManualZoomAction.OUT) {
        scale = 0.5
      } else if (type === ManualZoomAction.IN) {
        scale = 2
      }
      if (this.svg) {
        this.svg.transition().duration(200).call(this.d3Zoom().scaleBy, scale)
      }
    }
  }

  private createGridAndGlobalZoom(): void {
    if (this.svg) {
      DiagramGridUtils.generatePattern(this.svg);
      this.svg.call(this.d3Zoom());
    }
  }

  private createContentContainer(workflow: WorkflowMulti): void {
    if (this.svg) {
      const {k, x, y} = this.getZoomPosition(workflow);
      this.contentContainer = this.svg.append<SVGGElement>('g')
        .attr('id', 'content-container')
        .attr('transform', `translate(${x},${y}) scale(${k})`);
    }
  }

  private generateContent(workflow: WorkflowMulti): void {
    this.content?.remove();
    if (this.contentContainer) {
      this.content = this.contentContainer.append<SVGGElement>('g')
        .attr('id', 'content');

      this.createConnectors(this.content, workflow);
      this.createSteps(this.content, workflow);

      this.content.call(this.dragAndDropConnectors(workflow))
    }
  }

  private d3Zoom(): ZoomBehavior<SVGElement, undefined> {
    return zoom<SVGElement, undefined>()
      .scaleExtent([0.33, 0.8])
      .on('zoom', (event: D3ZoomEvent<SVGElement, null>) => {
        this.actions$.next({element: undefined, event, eventType: DiagramActionType.ZOOM});
        if (this.contentContainer) {
          this.contentContainer
            .attr('transform', `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`);
        }
        DiagramGridUtils.updateGridWithZoom(event.transform);
      });
  }

  private createSteps(
    content: Selection<SVGGElement, undefined, Element, undefined>,
    workflow: WorkflowMulti
  ): void {
    this.diagramSteps = new DiagramSteps(workflow.getSteps());
    this.diagramSteps.createContainer(content);
    this.diagramSteps.createSelectionArea();
    this.diagramSteps.drawSteps();
    this.diagramSteps.createAnchors();

    if (this.selectedStep) {
      this.selectStep(this.selectedStep);
    }

    this.diagramSteps.getAnchors().forEach(anchor => anchor.element
      .on('mouseover', (event: MouseEvent, step: Step) => this.mouseOverOnAnchorStep(step, anchor.direction))
      .on('mouseout', (event: MouseEvent, step: Step) => this.mouseOutOnAnchorStep(step, anchor.direction))
      .on('mousedown', (event, step: Step) => this.mouseDownOnAnchorStep(step, anchor))
      .on('click', (event, step: Step) => this.clickOnAnchorSteps(step))
    )

    this.diagramSteps.getContainer()
      .call(this.dragAndDropStep(workflow))

    this.diagramSteps.getArea()
      .on('mouseover', (event: MouseEvent, step: Step) => this.mouseOverOnStep(step))
      .on('mouseout', (event: MouseEvent, step: Step) => this.mouseOutOnStep(step))
      .on('mouseup', (event: MouseEvent, step: Step) => this.mouseUpOnStep(step))
      .on('click', (event: MouseEvent, step: Step) => this.clickOnStep(event, step))
      .on("contextmenu", (event: MouseEvent, step: Step) => this.contextMenuOnStep(event, step));
  }

  private dragAndDropConnectors(workflow: WorkflowMulti): DragBehavior<SVGGElement, undefined, SubjectPosition | undefined> {
    return drag<SVGGElement, undefined>()
      .filter((event: DragEvent) => this.isCreatingConnection || !!this.draggedConnector && this.isLeftClick(event))
      .on('drag', (event: MouseEvent) => this.updateConnection(event))
      .on('end', () => this.finishConnectorDragAndDrop(workflow));
  }

  private dragAndDropStep(
    workflow: WorkflowMulti
  ): DragBehavior<SVGGElement, Step, unknown> {
    let initialXClick: number, initialYClick: number;
    return drag<SVGGElement, Step>()
      .filter((event: DragEvent) => !this.isCreatingConnection && !this.draggedConnector && this.isLeftClick(event))
      .on('start', (event: DragEvent, step: Step) => {
        this.actions$.next({element: step, event, eventType: DiagramActionType.CLICK_ON_ELEMENT});
        if (this.selectedStep?.id !== step.id) {
          this.selectStep(step);
        }
        initialXClick = step.x - event.x;
        initialYClick = step.y - event.y;
      })
      .on('drag', (event: MouseEvent, step) => {
        step.x = Math.round((event.x + initialXClick) / 20) * 20;
        step.y = Math.round((event.y + initialYClick) / 20) * 20;
        this.diagramSteps.move(step.id, {x: step.x, y: step.y})
        this.updateConnectorsDuringDrag(step, workflow);
      })
      .on('end', () => this.finishStepDragAndDrop())
  }

  private createConnectors(content: Selection<SVGGElement, undefined, Element, undefined>, workflow: WorkflowMulti): void {
    this.diagramConnectors = new DiagramConnectors(workflow.getConnectors());
    this.diagramConnectors.createConnectorCreationContainer(content);
    this.diagramConnectors.createExistingConnectorsContainer(content);

    this.diagramConnectors.drawConnectors(workflow);

    this.diagramConnectors.getHoveringZone().forEach(zone => {
      zone
        .on('mouseover', (event, connector) => this.mouseoverOnConnector(connector))
        .on('mouseout', (event, connector) => this.mouseOutOnConnector(connector))
        .on('click', (event, connector) => this.clickOnConnector(event, connector, workflow))
        .on("contextmenu", (event: MouseEvent, connector: Connector) => this.contextMenuOnConnector(event, connector));
    })

    if (this.selectedConnector) {
      this.selectConnector(this.selectedConnector, workflow);
    }
  }

  private clickOnConnector(event: MouseEvent, connector: Connector, workflow: WorkflowMulti): void {
    this.mouseClickOnStepOrConnector(event, connector);
    this.setDefaultDesign();
    this.selectedStep = undefined;
    if (this.selectedConnector?.id === connector.id) {
      this.selectedConnector = undefined;
    } else {
      this.selectConnector(connector, workflow);
    }
  }

  private selectConnector(connector: Connector, workflow: WorkflowMulti): void {
    this.selectedConnector = connector;

    this.diagramConnectors.addSelectingPathDesign(connector.id);

    this.diagramConnectors.generateConnectorSideSelectors(workflow, connector.id);

    this.diagramConnectors.getStartSideConnector(connector.id)
      .on('mouseover', () => this.diagramConnectors.updateSideRadius(connector.id, 10, true))
      .on('mouseout', () => this.diagramConnectors.updateSideRadius(connector.id, 6, true))
      .on('mousedown', () => this.initDragConnectorStart(connector, workflow.getStepById(connector.endId)))

    this.diagramConnectors.getEndSideConnector(connector.id)
      .on('mouseover', () => this.diagramConnectors.updateSideRadius(connector.id, 10, false))
      .on('mouseout', () => this.diagramConnectors.updateSideRadius(connector.id, 6, false))
      .on('mousedown', () => this.initDragConnectorEnd(connector, workflow.getStepById(connector.startId)))
  }

  private isLeftClick(event: DragEvent): boolean {
    return event.button === 0;
  }

  private finishStepDragAndDrop(): void {
    this.diagramConnectors.activatePathArea();
  }

  private mouseDownOnAnchorStep(step: Step, anchor: {
    element: Selection<SVGGElement, Step, SVGGElement, undefined>;
    direction: Direction
  }): void {
    if (!this.isCreatingConnection && !this.selectedConnector) {
      this.initConnectorCreation(step, anchor.direction)
    }
  }

  private mouseOutOnAnchorStep(step: Step, direction: Direction): void {
    if (!this.selectedConnector && this.selectedStep?.id === step.id) {
      this.diagramSteps.switchToCross(step.id, direction, true)
    }
  }

  private mouseOverOnAnchorStep(step: Step, direction: Direction): void {
    if (!this.selectedConnector && this.selectedStep?.id === step.id) {
      this.diagramSteps.switchToCross(step.id, direction, false)
    }
  }

  private mouseUpOnStep(step: Step): void {
    if (this.connectorCreationDetailStart.step && this.connectorCreationDetailStart.positionOnStep && this.connectorCreationDetailStart.step.id !== step.id) {
      this.isCreatingConnection = false;
    }
  }

  private mouseOutOnStep(step: Step): void {
    if (this.isCreatingConnection || (this.draggedConnector && this.draggedConnectorSide === 'end')) {
      this.connectorCreationDetailEnd.step = undefined;
    } else if (this.draggedConnector && this.draggedConnectorSide === 'start') {
      this.connectorCreationDetailStart.step = undefined;
    }
    if (this.selectedStep?.id !== step.id) {
      this.diagramSteps.setDefaultDesign(step.id)
    }
  }

  private mouseOverOnStep(step: Step): void {
    const overOnSelectedStep = this.selectedStep?.id === step.id;
    const isNotCreatingOrDraggingConnectors = !this.isCreatingConnection && !this.draggedConnector;
    const isCreatingConnectionWithAnotherStep = this.isCreatingConnection && this.connectorCreationDetailStart.step?.id !== step.id;
    const isDraggingConnectorStartSideOnAnotherStep = !!this.draggedConnector && this.draggedConnectorSide === 'end' && this.connectorCreationDetailStart.step?.id !== step.id
    const isDraggingConnectorEndSideOnAnotherStep = !!this.draggedConnector && this.draggedConnectorSide === 'start' && this.connectorCreationDetailEnd.step?.id !== step.id
    if (!overOnSelectedStep) {
      if (isNotCreatingOrDraggingConnectors) {
        this.diagramSteps.setHoveringDesign(step.id)
      } else if (isCreatingConnectionWithAnotherStep || isDraggingConnectorStartSideOnAnotherStep) {
        if (step.isStart) {
          this.diagramSteps.setHoveringErrorDesign(step.id)
          this.connectorCreationDetailEnd.step = undefined;
        } else {
          this.diagramSteps.setSelectedDesign(step.id)
          this.connectorCreationDetailEnd.step = step;
        }
      } else if (isDraggingConnectorEndSideOnAnotherStep) {
        this.connectorCreationDetailStart.step = step;
        this.diagramSteps.setSelectedDesign(step.id)
      }
    }
    this.raiseSelectedElement();
  }

  private raiseSelectedElement(): void {
    if (this.selectedConnector) {
      this.diagramConnectors.raise(this.selectedConnector.id);
    } else if (this.selectedStep) {
      this.diagramSteps.raise(this.selectedStep.id);
    }
  }

  private finishConnectorDragAndDrop(workflow: WorkflowMulti): void {
    const stepStart = this.connectorCreationDetailStart.step;
    const stepEnd = this.connectorCreationDetailEnd.step;
    if (stepStart && stepEnd && !this.draggedConnector) {
      this.addConnection(stepStart, stepEnd)
    } else if (this.draggedConnector && stepStart && stepEnd) {
      this.updateConnector(this.draggedConnector, stepStart, stepEnd)
    } else if (this.draggedConnector) {
      this.resetConnector(workflow);
    }
    this.diagramConnectors.removeCreationConnector();
    this.diagramConnectors.activatePathArea();
    this.diagramConnectors.removeSideConnectorSelectors();
    this.isCreatingConnection = false;
    this.draggedConnector = undefined;
    this.connectorCreationDetailEnd.step = undefined;
    this.connectorCreationDetailStart.step = undefined;
  }

  private addConnection(stepStart: Step, stepEnd: Step): void {
    if (stepStart.id !== stepEnd.id) {
      this.actions$.next({eventType: DiagramActionType.ADD_CONNECTOR, element: {stepStart, stepEnd}, event: undefined});
    }
  }

  private selectStep(step: Step): void {
    this.setDefaultDesign();
    this.selectedStep = step
    this.selectedConnector = undefined;
    this.diagramSteps.select(step.id);
  }

  private setDefaultDesign(): void {
    this.diagramSteps.setDefaultStepDesigns();
    this.diagramConnectors.setDefaultConnectorDesign();
  }

  private updateConnection(position: {
    x: number,
    y: number,
  }): void {
    const x = Math.round(position.x / 20) * 20;
    const y = Math.round(position.y / 20) * 20;

    const stepStart = this.connectorCreationDetailStart.step;
    const stepEnd = this.connectorCreationDetailEnd.step;

    let end: StepWithAnchor = new StepWithAnchor({x: stepEnd?.x || x, y: stepEnd?.y || y},
      this.connectorCreationDetailEnd.step ? 'left' : 'none',
      stepEnd ? STEP_WIDTH : 0, stepEnd ? STEP_HEIGHT : 0)

    let start: StepWithAnchor = new StepWithAnchor({x: stepStart?.x || x, y: stepStart?.y || y},
      this.connectorCreationDetailStart.step ? this.connectorCreationDetailStart.positionOnStep : 'none',
      stepStart ? STEP_WIDTH : 0, stepStart ? STEP_HEIGHT : 0
    )
    const path = DiagramConnectorUtils.getConnectorPath(start, end);

    if (this.isCreatingConnection) {
      this.diagramConnectors.updateNewConnectorPath(path)
    } else if (this.selectedConnector) {
      const startAnchor: { x: number, y: number } = stepStart ? start.anchorPosition : {x, y};
      const endAnchor: { x: number, y: number } = stepEnd ? end.anchorPosition : {x, y};
      this.diagramConnectors.updateSideConnectorPosition(this.selectedConnector.id, startAnchor, true);
      this.diagramConnectors.updateSideConnectorPosition(this.selectedConnector.id, endAnchor, false);
      this.diagramConnectors.updateExistingConnectorPath(this.selectedConnector.id, path)
      this.diagramConnectors.disableConnectorArea();
    }
  }

  private updateConnectorsDuringDrag(
    step: Step,
    workflow: WorkflowMulti
  ): void {
    workflow.getConnectorsLinkedToOneStep(step.id)
      .forEach((connector) => {
        let startNode: Step | undefined;
        let endNode: Step | undefined;
        if (connector.startId === step.id) {
          startNode = step;
          endNode = workflow.getStepById(connector.endId);
        } else {
          startNode = workflow.getStepById(connector.startId);
          endNode = step
        }
        const path = DiagramConnectorUtils.getConnectorPath(
          new StepWithAnchor(startNode, 'right'),
          new StepWithAnchor(endNode, 'left'),
        );
        this.diagramConnectors.updateExistingConnectorPath(connector.id, path);
        if (this.selectedConnector) {
          this.diagramConnectors.updateConnectorSideSelectors(startNode, endNode);
        }
      });
    this.diagramConnectors.disableConnectorArea();
  }

  private adjustZoomToView(workflow: WorkflowMulti, duration = 200): void {
    if (workflow.getSteps().length > 0) {
      const {k, x, y} = this.getZoomPosition(workflow);
      if (this.svg) {
        this.svg.transition().duration(duration).call(
          this.d3Zoom().transform,
          zoomIdentity.scale(k).translate(x, y)
        )
      }
    }
  }

  private getZoomPosition(workflow: WorkflowMulti): { x: number, y: number, k: number } {
    const DEFAULT_POSITION_X = 40;
    const DEFAULT_POSITION_Y = 80;

    const steps = workflow.getSteps();
    const minPositionX = (Math.min(...steps.map(step => step.x)) || 0);
    const maxPositionX = Math.max(...steps.map(step => step.x), 0) + STEP_WIDTH;
    const minPositionY = (Math.min(...steps.map(step => step.y)) || 0);
    const maxPositionY = Math.max(...steps.map(step => step.y), 0) + STEP_HEIGHT;

    const k = Math.min(0.8, (this.width) / (maxPositionX - minPositionX + DEFAULT_POSITION_X * 4), (this.height) / (maxPositionY - minPositionY + DEFAULT_POSITION_Y * 2), 1);
    const x = DEFAULT_POSITION_X - minPositionX;
    const y = this.height / 2 / k - (minPositionY + (maxPositionY - minPositionY) / 2);
    console.log(minPositionX,
      maxPositionX,
      minPositionY,
      maxPositionY, this.width, this.height)
    return {k, x, y};
  }

  private initDragConnectorStart(connector: Connector, endStep?: Step): void {
    this.draggedConnector = connector;
    this.draggedConnectorSide = 'start';
    this.connectorCreationDetailEnd = {step: endStep, positionOnStep: 'left'};
  }

  private initDragConnectorEnd(connector: Connector, startStep?: Step): void {
    this.draggedConnector = connector;
    this.draggedConnectorSide = 'end';
    this.connectorCreationDetailStart = {step: startStep, positionOnStep: 'right'};
  }

  private updateConnector(draggedConnector: Connector, stepStart: Step, stepEnd: Step): void {
    if (stepStart.id !== stepEnd.id) {
      this.actions$.next({
        event: undefined,
        element: {connector: draggedConnector, stepStart, stepEnd},
        eventType: DiagramActionType.UPDATE_CONNECTOR
      });
    }
  }

  private mouseOutOnConnector(connector: Connector): void {
    if (this.selectedConnector?.id !== connector.id) {
      this.diagramConnectors.addDefaultPathDesign(connector.id);
    }
    this.raiseSelectedElement();
  }

  private mouseoverOnConnector(connector: Connector): void {
    if (!this.selectedConnector || this.selectedConnector?.id !== connector.id) {
      this.diagramConnectors.addHoveringPathDesign(connector.id);
    } else {
      this.diagramConnectors.raise(connector.id);
    }

    if (this.selectedConnector) {
      this.diagramConnectors.raise(this.selectedConnector.id);
    } else if (this.selectedStep) {
      this.diagramSteps.raise(this.selectedStep.id);
    }
  }

  private resetConnector(workflow: WorkflowMulti): void {
    if (this.selectedConnector) {
      const stepEnd = workflow.getStepById(this.selectedConnector.endId);
      const stepStart = workflow.getStepById(this.selectedConnector.startId);
      let end: StepWithAnchor = new StepWithAnchor(stepEnd, 'left')
      let start: StepWithAnchor = new StepWithAnchor(stepStart, 'right')
      const path = DiagramConnectorUtils.getConnectorPath(start, end);
      this.diagramConnectors.updateExistingConnectorPath(this.selectedConnector.id, path)
    }
  }

  private contextMenuOnStep(event: MouseEvent, step: Step): void {
    this.actions$.next({element: step, event, eventType: DiagramActionType.CONTEXT_MENU_ON_STEP});
    event.stopPropagation();
    event.preventDefault();
  }

  private contextMenuOnConnector(event: MouseEvent, connector: Connector): void {
    this.actions$.next({element: connector, event, eventType: DiagramActionType.CONTEXT_MENU_ON_CONNECTOR});
    event.stopPropagation();
    event.preventDefault();
  }

  private mouseClickOnStepOrConnector(event: MouseEvent, step: Step | Connector): void {
    event.stopPropagation();
    this.actions$.next({element: step, event, eventType: DiagramActionType.CLICK_ON_ELEMENT});
  }

  private clickOnStep(event: MouseEvent, step: Step): void {
    this.mouseClickOnStepOrConnector(event, step);
    if (this.selectedStep?.id !== step.id) {
      this.selectStep(step);
    }
  }

  private sendClickOnGridAndStopPropagation(event: MouseEvent): void {
    this.actions$.next({
      element: undefined,
      eventType: DiagramActionType.CLICK_ON_GRID,
      event
    })
    event.preventDefault();
  }

  private sendContextMenuOnGridAndStopPropagation(event: MouseEvent): void {
    this.actions$.next({
      element: undefined,
      eventType: DiagramActionType.CONTEXT_MENU_ON_GRID,
      event
    })
    event.preventDefault();
  }

  private clickOnAnchorSteps(step: Step): void {
    if (this.selectedStep?.id === step.id) {
      this.actions$.next({event: undefined, element: step, eventType: DiagramActionType.ADD_STEP})
    }
  }
}

