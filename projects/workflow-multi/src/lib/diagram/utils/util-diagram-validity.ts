import {getConnectorsLinkedToOneStep, getStepById, isCyclicUtil} from "./util-diagram";

export function isCyclic(stepIds: string[], connectors: { startId: string; endId: string; }[]): {
  isValid: boolean,
  cyclicStepIds: string[]
} {
  let visited: Record<string, boolean> = {};
  let recStack: Record<string, boolean> = {};
  const adj: Record<string, string[]> = {};
  stepIds.forEach(stepId => {
    visited[stepId] = false;
    recStack[stepId] = false;
    adj[stepId] = [];
  })

  connectors.forEach(connector => {
    adj[connector.startId].push(connector.endId);
  })

  // Call the recursive helper function to
  // detect cycle in different DFS trees
  for (let i = 0; i < stepIds.length; i++) {
    if (isCyclicUtil(stepIds[i], visited, recStack, adj)) {
      return {isValid: false, cyclicStepIds: Object.keys(recStack).filter(key => recStack[key])};
    }
  }

  return {isValid: true, cyclicStepIds: []};
}

export function checkWorkflowValidity(steps: { id: string, isStart: boolean }[], connectors: {
  startId: string;
  endId: string;
}[]): { isValid: boolean, invalidStepIds: string[] } {
  const allStartIds: string[] = connectors.map(connector => connector.startId);
  const startingSteps: string[] = allStartIds.filter(id => !connectors.some(connector => connector.endId === id) && !getStepById(id, steps)?.isStart);
  const stepsWithoutAnyConnector: string[] = steps.filter(step => getConnectorsLinkedToOneStep(step.id, connectors).length === 0).map(step => step.id);
  const stepWithProblems = Array.from(new Set<string>([...stepsWithoutAnyConnector, ...startingSteps]));
  return {isValid: stepWithProblems.length === 0, invalidStepIds: Array.from(stepWithProblems)};
}
