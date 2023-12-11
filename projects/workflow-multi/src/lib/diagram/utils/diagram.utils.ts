import {BaseType} from "d3-selection";
import {select} from "d3";
import {decrossOpt, graphStratify, MutGraph, shapeRect, sugiyama, tweakShape} from "d3-dag";
import {STEP_HEIGHT, STEP_WIDTH} from "./diagram-step.utils";
import {GRID_SIZE} from "./diagram-grid.utils";
import {WorkflowMulti} from "../../entities";

export function selectById<GElement extends BaseType, OldDatum>(id: string) {
  return select<GElement, OldDatum>(`[id="${id}"]`)
}

export function computeLayoutWithD3Dag(workflow: WorkflowMulti): MutGraph<{
  id: string,
  parentIds: string[]
}, undefined> {
  const list: { id: string, parentIds: string[] }[] = workflow.getSteps().map(step => ({
    id: step.id,
    parentIds: workflow.getConnectors().filter(connector => connector.endId === step.id).map(connector => connector.startId)
  }));

  const shape = tweakShape([STEP_HEIGHT, STEP_WIDTH], shapeRect);
  const stratify = graphStratify();
  const dag = stratify(list);
  const layout = sugiyama()
    .decross(decrossOpt())
    .nodeSize([STEP_HEIGHT, STEP_WIDTH])
    .gap([GRID_SIZE * 3, GRID_SIZE * 6])
    .tweaks([shape])
  layout(dag);
  return dag
}
