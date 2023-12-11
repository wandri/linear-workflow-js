import {createId} from "@paralleldrive/cuid2";
import {STEP_HEIGHT, STEP_WIDTH} from "../diagram/utils/diagram-step.utils";

export class Step {
  id: string;
  x: number;
  y: number;
  width: number = STEP_WIDTH;
  height: number = STEP_HEIGHT;
  name: string;
  icon: string = '../assets/data/workflow-icons/default.png';
  isStart: boolean;

  constructor(name: string, x: number, y: number, option: {
    icon?: string,
    isStart?: boolean,
    width?: number,
    height?: number,
    id?: string,
  } = {}) {
    this.id = option.id ?? createId();
    this.name = name;
    this.x = x;
    this.y = y;
    this.isStart = option.isStart ?? false;
    this.width = option.width ?? STEP_WIDTH;
    this.height = option.height ?? STEP_HEIGHT;
    this.icon = option.icon ?? '../assets/data/workflow-icons/default.png';
  }

  rename(name: string): void {
    this.name = name;
  }

  update(step: Partial<Step>) {
    Object.assign(this, step)
  }
}
