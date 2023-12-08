import {StepGroup} from './step-group.entity';
import {Step} from "./step.entity";
import {GROUP_PADDING_TOP, STEP_DISTANCE_BETWEEN} from "../diagram/utils/diagram.constants";
import {GRID_SIZE} from "../diagram/utils/diagram-grid.utils";
import {getSum} from "../diagram/utils/diagram.utils";

export class StepGroupOverview extends StepGroup {
  constructor(group: {
    name: string;
    position: number;
    steps: Step[];
    id?: string;
  }) {
    super(group);
  }

  override getHeight(): number {
    const groupPadding = GROUP_PADDING_TOP + GRID_SIZE;
    const distanceBetweenSteps =
      (this.steps.length - 1) * STEP_DISTANCE_BETWEEN;
    const stepHeight = Math.max(
      getSum(this.steps.map((step) => step.getHeight())) || 0,
      2 * GRID_SIZE
    );
    return stepHeight + distanceBetweenSteps + groupPadding;
  }
}
