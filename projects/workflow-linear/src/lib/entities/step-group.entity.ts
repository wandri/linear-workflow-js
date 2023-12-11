import {Step} from "./step.entity";
import {createId} from "@paralleldrive/cuid2";
import {
  GROUP_DISTANCE_BETWEEN,
  GROUP_PADDING,
  GROUP_PADDING_BOTTOM,
  GROUP_PADDING_TOP,
  GROUP_WIDTH,
  STEP_DISTANCE_BETWEEN
} from "../diagram/utils/diagram.constants";
import {GRID_SIZE} from "../diagram/utils/diagram-grid.utils";
import {getSum} from "../diagram/utils/diagram.utils";

export class StepGroup {
  id: string;
  name: string;
  steps: Step[];
  position: number;
  private x = 0;
  private y = 0;

  constructor(group: {
    name: string;
    position: number;
    steps: Step[];
    id?: string;
  }) {
    this.id = group.id ?? createId();
    this.name = group.name;
    this.position = group.position;
    this.steps = group.steps;
    this.setDefaultXPosition();
    this.setDefaultYPosition();
  }

  rename(name: string): void {
    this.name = name;
  }

  getHeight(): number {
    const groupPadding = GROUP_PADDING_TOP + GROUP_PADDING_BOTTOM;
    const distanceBetweenSteps =
      (this.steps.length - 1) * STEP_DISTANCE_BETWEEN;
    const stepHeight = Math.max(
      getSum(this.steps.map((step) => step.getHeight())) || 0,
      2 * GRID_SIZE
    );
    return stepHeight + distanceBetweenSteps + groupPadding;
  }

  getYPosition(): number {
    return this.y;
  }

  getXPosition(): number {
    return this.x;
  }

  setXPosition(x: number): void {
    this.x = x;
  }

  setYPosition(y: number): void {
    this.y = y;
  }

  setDefaultXPosition(): void {
    this.x = this.getDefaultXPosition();
    this.updateStepTheoreticalXY();
  }

  getDefaultXPosition(): number {
    return this.position * (this.getGlobalWidth() + GROUP_DISTANCE_BETWEEN);
  }

  getNewPosition(x: number): number {
    return Math.round(
      (x - GROUP_DISTANCE_BETWEEN / 2) /
      (this.getGlobalWidth() + GROUP_DISTANCE_BETWEEN)
    );
  }

  setDefaultYPosition(): void {
    this.y = this.getDefaultYPosition();
    this.updateStepTheoreticalXY();
  }

  getDefaultYPosition(): number {
    return -this.getHeight() / 2;
  }

  getGlobalWidth(): number {
    return GROUP_WIDTH;
  }

  setPosition(position: number, withResetXY = false): void {
    this.position = position;
    if (withResetXY) {
      this.setDefaultXPosition();
      this.setDefaultYPosition();
    }
  }

  getPosition(): number {
    return this.position;
  }

  clone(): StepGroup {
    return new StepGroup({
      id: this.id,
      name: this.name,
      position: this.position,
      steps: this.steps.map((step) => step.clone()),
    });
  }

  isEqual(group: StepGroup): boolean {
    if (
      this.id !== group.id ||
      this.name !== group.name ||
      this.position !== group.position ||
      this.steps.length !== group.steps.length
    ) {
      return false;
    }
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const refStep = group.steps.find((refStep) => refStep.isEqual(step));
      if (!refStep) {
        return false;
      }
    }
    return true;
  }

  private updateStepTheoreticalXY() {
    this.steps.forEach((step) => {
      step.stepContainerX = this.getXPosition() + GROUP_PADDING;
      step.stepContainerY = this.getYPosition() + GROUP_PADDING_TOP;
    });
  }
}
