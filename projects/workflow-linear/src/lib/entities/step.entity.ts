import {createId} from "@paralleldrive/cuid2";
import {STEP_DEFAULT_HEIGHT, STEP_WIDTH} from "../diagram/utils/diagram.constants";

export class Step {
  id: string;
  name: string;
  icon: string;
  position: number;
  y: number;
  x: number;
  groupId: string;
  stepContainerX = 0;
  stepContainerY = 0;
  defaultYPosition = 0;
  status?: string;

  constructor(step: {
    name: string;
    position: number;
    y: number;
    groupId: string;
    icon?: string;
    id?: string;
  }) {
    this.id = step.id ?? createId();
    this.name = step.name;
    this.groupId = step.groupId;
    this.position = step.position;
    this.setDefaultPositionY(step.y);
    this.y = this.getDefaultYPosition();
    this.x = this.getDefaultXPosition();
    this.icon = step.icon ?? '../assets/data/workflow-icons/default.png';
  }

  rename(name: string): void {
    this.name = name;
  }

  getHeight(): number {
    return STEP_DEFAULT_HEIGHT;
  }

  getYPosition(): number {
    return this.y;
  }

  getXPosition(): number {
    return this.x;
  }

  getDefaultXPosition(): number {
    return 0;
  }

  getDefaultYPosition(): number {
    return this.defaultYPosition;
  }

  getWith(): number {
    return STEP_WIDTH;
  }

  getPosition(): number {
    return this.position;
  }

  setDefaultPositionY(y: number): void {
    this.defaultYPosition = y;
  }

  setXPosition(x: number): void {
    this.x = x;
  }

  setYPosition(y: number): void {
    this.y = y;
  }

  setDefaultXPosition() {
    this.x = this.getDefaultXPosition();
  }

  setDefaultYPosition() {
    this.y = this.defaultYPosition;
  }

  clone(): Step {
    return new Step(this);
  }

  isEqual(step: Step): boolean {
    return (
      this.name === step.name ||
      this.position === step.position ||
      this.y === step.y ||
      this.groupId === step.groupId ||
      this.icon === step.icon ||
      this.id === step.id
    );
  }
}
