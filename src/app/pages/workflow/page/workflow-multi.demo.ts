import {Step, WorkflowMulti} from 'workflow-multi';
import {generateName} from "../../../../../projects/workflow-linear/src/lib/shared";
import {Connector} from "../../../../../projects/workflow-multi/src/lib/entities";
import {STEP_HEIGHT, STEP_WIDTH} from "../../../../../projects/workflow-multi/src/lib/diagram/utils/diagram-step.utils";

const step1 = new Step(generateName(), 0, 0, {isStart: true});
const step2 = new Step(generateName(), STEP_WIDTH + 100, 0, {isStart: false});
const step3 = new Step(generateName(), STEP_WIDTH + 100, STEP_HEIGHT + 100, {isStart: false});
const step4 = new Step(generateName(), STEP_WIDTH * 2 + 200, 0, {isStart: false});
const connection1 = new Connector(step1.id, step2.id);
const connection2 = new Connector(step1.id, step3.id);
const connection3 = new Connector(step3.id, step4.id);
const connection4 = new Connector(step2.id, step4.id);
export const workflowMultiDemo = new WorkflowMulti([step1, step2, step3, step4],
  [connection1, connection2, connection3, connection4])
