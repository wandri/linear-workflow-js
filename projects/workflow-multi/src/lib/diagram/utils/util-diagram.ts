export function isCyclicUtil(i: string, visited: Record<string, boolean>, recStack: Record<string, boolean>, adj: Record<string, string[]>) {
  if (recStack[i]) {
    return true;
  }

  if (visited[i]) {
    return false;
  }

  visited[i] = true;

  recStack[i] = true;
  let children = adj[i];

  for (let j = 0; j < children.length; j++) {
    if (isCyclicUtil(children[j], visited, recStack, adj)) {
      return true;
    }
  }

  recStack[i] = false;
  return false;
}

export function getConnectorsLinkedToOneStep<T extends {
  startId: string,
  endId: string
}>(stepId: string, connectors: T[]): T[] {
  return connectors.filter(connector => connector.startId === stepId || connector.endId === stepId)
}

export function getStepById(id: string, steps: { id: string, isStart: boolean }[]): {
  id: string,
  isStart: boolean
} | undefined {
  return steps.find(step => step.id === id);
}
