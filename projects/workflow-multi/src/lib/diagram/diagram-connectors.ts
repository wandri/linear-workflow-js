import {select, selectAll, Selection} from "d3";
import {
  CONNECTOR_AREA_SELECTOR,
  CONNECTOR_CREATION_CONTAINER_SELECTOR,
  CONNECTOR_CREATION_END_CONTAINER_SELECTOR,
  CONNECTOR_CREATION_SELECTOR,
  CONNECTOR_CREATION_SIDE_END_SELECTOR,
  CONNECTOR_CREATION_SIDE_START_SELECTOR,
  CONNECTOR_CREATION_START_CONTAINER_SELECTOR,
  CONNECTOR_DEFAULT_COLOR,
  CONNECTOR_OVER_COLOR,
  CONNECTOR_SELECTED_COLOR,
  CONNECTOR_SELECTOR,
  CONNECTOR_STROKE_WIDTH,
  DiagramConnectorUtils
} from "./utils/diagram-connector.utils";
import {STEP_STROKE_SELECTED_COLOR} from "./utils/diagram-step.utils";
import {Cursor} from "../interface/cursor.enum";

import {selectById} from "./utils/diagram.utils";
import {StepWithAnchor} from "../interface/step-with-anchor.class";
import {EntityDiagram} from "./entity-diagram";
import {Connector} from "../entities/connector.entity";
import {Step, WorkflowMulti} from "../entities";

export class DiagramConnectors extends EntityDiagram {
  private connectors: Connector[] = [];
  private hoveringZone: Selection<SVGPathElement, Connector, Element, undefined>[] = [];
  private connectorCreationContainer: Selection<SVGGElement, undefined, Element, undefined>
  private connectorsElement: Selection<SVGGElement, Connector, Element, undefined>;

  constructor(connectors: Connector []) {
    super();
    this.connectors = connectors;
    this.connectorsElement = select<SVGGElement, Connector>('g') as unknown as Selection<SVGGElement, Connector, SVGGElement, undefined>
    this.connectorCreationContainer = select<SVGGElement, Connector>('g') as unknown as Selection<SVGGElement, undefined, SVGGElement, undefined>
  }

  createConnectorCreationContainer(content: Selection<SVGGElement, undefined, Element, undefined>): void {
    this.connectorCreationContainer = content.append('g')
      .attr('id', CONNECTOR_CREATION_CONTAINER_SELECTOR)
  }

  createExistingConnectorsContainer(content: Selection<SVGGElement, undefined, Element, undefined>): void {
    const PATH_CONTAINER_SELECTOR = "path-selector";
    this.connectorsElement = content
      .append('g')
      .attr('class', 'path-container')
      .selectAll(`.${PATH_CONTAINER_SELECTOR}`)
      .data(this.connectors)
      .enter()
      .append('g')
      .attr('class', `${PATH_CONTAINER_SELECTOR}`)
      .attr('id', (connector: Connector) => connector.id)
  }

  drawConnectors(workflow: WorkflowMulti): void {

    const pathArea =
      this.connectorsElement
        .append('path')
        .attr('class', CONNECTOR_AREA_SELECTOR)
        .attr('d', (connector: Connector) => {
          const startNode = workflow.getStepById(connector.startId);
          const endNode = workflow.getStepById(connector.endId);
          return DiagramConnectorUtils.getConnectorPath(
            new StepWithAnchor(startNode, 'right'),
            new StepWithAnchor(endNode, 'left')
          );
        })
        .attr('stroke-width', CONNECTOR_STROKE_WIDTH * 15)
        .attr('stroke-linecap', 'round')
        .attr('stroke', CONNECTOR_DEFAULT_COLOR)
        .attr('stroke-opacity', 0)
        .attr('cursor', Cursor.POINTER)
        .attr('marker-end', 'none')
        .attr('fill-opacity', 0);

    this.hoveringZone.push(pathArea);
    pathArea.clone()
      .attr('stroke-width', CONNECTOR_STROKE_WIDTH)
      .attr('class', CONNECTOR_SELECTOR)
      .attr('stroke-linecap', 'round')
      .attr('stroke-opacity', 1)
      .attr("pointer-events", "none");

    this.setDefaultConnectorDesign();
  }

  getHoveringZone(): Selection<SVGPathElement, Connector, Element, undefined>[] {
    return this.hoveringZone;
  }

  addHoveringPathDesign(id: string): void {
    selectById(id).raise().select(`.${CONNECTOR_SELECTOR}`)
      .attr('stroke', CONNECTOR_OVER_COLOR)
      .attr('marker-end', 'url(#arrow-head-over)')
  }

  addDefaultPathDesign(id: string): void {
    selectById(id).raise().select(`.${CONNECTOR_SELECTOR}`)
      .attr('stroke', CONNECTOR_DEFAULT_COLOR)
      .attr('marker-end', 'url(#arrow-head)')
  }

  addSelectingPathDesign(id: string): void {
    selectById(id).raise().select(`.${CONNECTOR_SELECTOR}`)
      .attr('stroke', CONNECTOR_SELECTED_COLOR)
      .attr('marker-end', 'url(#arrow-head-active)')
  }

  getStartSideConnector(id: string): Selection<SVGGElement, Connector, Element, undefined> {
    return selectById<SVGGElement, Connector>(id).raise().select<SVGGElement>(`.${CONNECTOR_CREATION_START_CONTAINER_SELECTOR}`)
  }

  getEndSideConnector(id: string): Selection<SVGGElement, Connector, Element, undefined> {
    return selectById<SVGGElement, Connector>(id).raise().select<SVGGElement>(`.${CONNECTOR_CREATION_END_CONTAINER_SELECTOR}`)
  }

  generateConnectorSideSelectors(workflow: WorkflowMulti, connectorId: string): void {
    const startContainer = selectById<SVGGElement, Connector>(connectorId).append('g')
      .attr('class', `${CONNECTOR_CREATION_START_CONTAINER_SELECTOR}`)

    const areaCircleStart = startContainer
      .append('circle')
      .attr('cx', (connector: Connector) => {
        const step = new StepWithAnchor(workflow.getStepById(connector.startId), 'right');
        return step.anchorPosition.x
      })
      .attr('cy', (connector: Connector) => {
        const step = new StepWithAnchor(workflow.getStepById(connector.startId), 'right');
        return step.anchorPosition.y
      })
      .attr('r', 25)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0)
      .attr('fill-opacity', 0)
      .attr('cursor', Cursor.POINTER)
      .attr('stroke-width', CONNECTOR_STROKE_WIDTH)
      .attr('fill', '#fff')
      .attr('stroke', STEP_STROKE_SELECTED_COLOR)

    areaCircleStart.clone()
      .attr('class', CONNECTOR_CREATION_SIDE_START_SELECTOR)
      .attr('r', 5)
      .attr("pointer-events", "none")
      .attr('stroke-opacity', 1)
      .attr('fill-opacity', 1);

    const endContainer = selectById<SVGGElement, Connector>(connectorId).append('g')
      .attr('class', `${CONNECTOR_CREATION_END_CONTAINER_SELECTOR}`)

    const areaCircleEnd = endContainer.append('circle')
      .attr('cx', (connector: Connector) => {
        const stepWithAnchor = new StepWithAnchor(workflow.getStepById(connector.endId), 'left');
        return stepWithAnchor.anchorPosition.x;
      })
      .attr('cy', (connector: Connector) => {
        const stepWithAnchor = new StepWithAnchor(workflow.getStepById(connector.endId), 'left');
        return stepWithAnchor.anchorPosition.y;
      })
      .attr('r', 25)
      .attr('stroke-opacity', 0)
      .attr('fill-opacity', 0)
      .attr('cursor', Cursor.POINTER)
      .attr('stroke-width', CONNECTOR_STROKE_WIDTH)
      .attr('fill', '#fff')
      .attr('stroke', STEP_STROKE_SELECTED_COLOR)

    areaCircleEnd.clone()
      .attr('class', CONNECTOR_CREATION_SIDE_END_SELECTOR)
      .attr('r', 5)
      .attr("pointer-events", "none")
      .attr('stroke-opacity', 1)
      .attr('fill-opacity', 1);
  }

  updateSideRadius(id: string, radius: number, isStart: boolean): void {
    selectById(id).raise().select(`.${isStart ? CONNECTOR_CREATION_SIDE_START_SELECTOR : CONNECTOR_CREATION_SIDE_END_SELECTOR}`).transition()
      .duration(50)
      .attr('r', radius)
  }

  removeSideConnectorSelectors(): void {
    selectAll(`.${CONNECTOR_CREATION_START_CONTAINER_SELECTOR}`).remove()
    selectAll(`.${CONNECTOR_CREATION_END_CONTAINER_SELECTOR}`).remove()
  }

  updateSideConnectorPosition(id: string, anchor: { x: number; y: number }, isStart: boolean): void {
    selectById(id).select(`.${isStart ? CONNECTOR_CREATION_SIDE_START_SELECTOR : CONNECTOR_CREATION_SIDE_END_SELECTOR}`)
      .attr('cy', () => anchor.y)
      .attr('cx', () => anchor.x)
  }

  setDefaultConnectorDesign(): void {
    selectAll(`.${CONNECTOR_SELECTOR}`)
      .attr('stroke', CONNECTOR_DEFAULT_COLOR)
      .attr('marker-end', 'url(#arrow-head)');
    selectAll(`.${CONNECTOR_CREATION_SIDE_START_SELECTOR}`)
      .attr('stroke-opacity', 0)
      .attr('fill-opacity', 0)
    selectAll(`.${CONNECTOR_CREATION_SIDE_END_SELECTOR}`)
      .attr('stroke-opacity', 0)
      .attr('fill-opacity', 0);

    this.removeSideConnectorSelectors();
  }

  updateExistingConnectorPath(id: string, path: string): void {
    selectById(id).select(`.${CONNECTOR_SELECTOR}`)
      .attr(
        'd',
        path
      );
    selectById(id).select(`.${CONNECTOR_AREA_SELECTOR}`)
      .attr(
        'd',
        path
      )
  }

  updateNewConnectorPath(path: string): void {
    selectById(CONNECTOR_CREATION_SELECTOR)
      .attr('d', () => path)
  }

  initializeConnectorCreation(): void {
    selectById(CONNECTOR_CREATION_CONTAINER_SELECTOR).append('path')
      .attr('id', CONNECTOR_CREATION_SELECTOR)
      .attr('stroke', CONNECTOR_SELECTED_COLOR)
      .attr('marker-end', 'url(#arrow-head-active)')
      .attr('fill', 'none')
      .attr("pointer-events", "none");
  }

  updateConnectorSideSelectors(startNode?: Step, endNode?: Step): void {
    const startAnchor = new StepWithAnchor(startNode, 'right');
    const endAnchor = new StepWithAnchor(endNode, 'left');

    select(`.${CONNECTOR_CREATION_SIDE_START_SELECTOR}`)
      .attr('cx', startAnchor.x)
      .attr('cy', startAnchor.y)
    select(`.${CONNECTOR_CREATION_SIDE_END_SELECTOR}`)
      .attr('cx', endAnchor.x)
      .attr('cy', endAnchor.y)
  }

  activatePathArea(): void {
    selectAll(`.${CONNECTOR_AREA_SELECTOR}`).attr("pointer-events", "auto")
  }

  disableConnectorArea(): void {
    selectAll(`.${CONNECTOR_AREA_SELECTOR}`).attr("pointer-events", "none")
  }

  removeCreationConnector(): void {
    selectById(CONNECTOR_CREATION_CONTAINER_SELECTOR).selectAll('path').remove();
  }
}
