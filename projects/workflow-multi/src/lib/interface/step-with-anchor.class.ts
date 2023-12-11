import {DiagramStepUtils, DirectionWithNone, STEP_HEIGHT, STEP_WIDTH} from "../diagram/utils/diagram-step.utils";

export class StepWithAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
  anchor: DirectionWithNone;

  anchorPosition: { x: number, y: number } = {x: 0, y: 0}

  constructor(position: {
    x: number,
    y: number
  } = {x: 0, y: 0}, anchor: DirectionWithNone, width: number = STEP_WIDTH, height: number = STEP_HEIGHT) {
    this.x = position.x;
    this.y = position.y;
    this.width = width;
    this.height = height;
    this.anchor = anchor;

    this.anchorPosition = DiagramStepUtils.getStepAnchor(this);
  }

}
