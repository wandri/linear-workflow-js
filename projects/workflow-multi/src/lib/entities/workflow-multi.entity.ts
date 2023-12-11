import {Step} from "./step.entity";
import {Connector} from "./connector.entity";
import {computeLayoutWithD3Dag} from "../diagram/utils/diagram.utils";
import {getConnectorsLinkedToOneStep} from "../diagram/utils/util-diagram";
import {isCyclic} from "../diagram/utils/util-diagram-validity";

export class WorkflowMulti {
  protected steps: Step[] = [];
  protected connectors: Connector[] = [];
  protected name: string = '';

  constructor(steps: Step[], connectors: Connector[]) {
    this.connectors = connectors;
    this.steps = steps;
  };

  getStepById(id: string): Step | undefined {
    return this.steps.find(step => step.id === id);
  }

  reorder(): void {
    const mutGraph = computeLayoutWithD3Dag(this);

    for (const node of mutGraph.nodes()) {
      const correspondingStep = this.getStepById(node.data.id);
      if (correspondingStep) {
        // D3Drag build vertical Layout. We need to switch it to horizontal.
        correspondingStep.x = node.y;
        correspondingStep.y = node.x;
      }
    }
  }

  removeStepById(id: string): void {
    this.steps = this.steps.filter(step => step.id !== id);
  }

  removeConnectorById(id: string): void {
    this.connectors = this.connectors.filter(connector => connector.id !== id);
  }

  removeConnectorByStepId(stepId: string): void {
    this.connectors = this.connectors
      .filter(connector => connector.startId !== stepId && connector.endId !== stepId)
  }

  getConnectorByStepIds(startId: string, endId: string): Connector | undefined {
    return this.connectors
      .find(connector => connector.startId === startId && connector.endId === endId)
  }

  addStep(step: Step): void {
    this.steps.push(step);
  }

  addConnector(connector: Connector): void {
    this.connectors.push(connector);
  }

  changeConnectors(connectors: Connector[]): void {
    this.connectors = connectors;
  }

  getSteps(): Step[] {
    return this.steps;
  }

  getConnectors(): Connector[] {
    return this.connectors;
  }

  getConnectorById(id: string): Connector | undefined {
    return this.connectors.find(connector => connector.id === id);
  }

  isCyclic(customConnectors?: Connector[]): { isValid: boolean, cyclicStepIds: string[] } {
    return isCyclic(this.steps.map(step => step.id), customConnectors || this.connectors)
  }

  getMaxStepX(): number {
    return Math.max(...this.steps.map(step => step.x + step.width))
  }

  getMinStepY(): number {
    return Math.min(...this.steps.map(step => step.y))
  }

  getConnectorsLinkedToOneStep(stepId: string): Connector[] {
    return getConnectorsLinkedToOneStep<Connector>(stepId, this.connectors);
  }

}
