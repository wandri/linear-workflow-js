import {StepGroup} from "./step-group.entity";
import {Step} from "./step.entity";
import {Entity} from "../shared";
import {sortByPosition} from "../diagram/utils/diagram.utils";
import {STEP_DISTANCE_BETWEEN} from "../diagram/utils/diagram.constants";

export const defaultWorkflowName = 'Untitled';

export class WorkflowLinear extends Entity {
  protected groups: StepGroup[] = [];
  protected name = defaultWorkflowName;

  constructor(workflow: Entity & { groups: StepGroup[]; name: string }) {
    super(workflow);
    this.groups = workflow.groups;
    this.name = workflow.name;
  }

  static new(groups: StepGroup[]): WorkflowLinear {
    return new WorkflowLinear({
      name: defaultWorkflowName,
      ...Entity.createNew(),
      groups: groups,
    });
  }

  getStepById(id: string): Step | undefined {
    return this.groups
      .map((group) => group.steps)
      .flat()
      .find((step) => step.id === id);
  }

  getStepGroupById(id: string): StepGroup | undefined {
    return this.groups.find((step) => step.id === id);
  }

  removeGroupById(id: string): void {
    this.groups = this.groups.filter((group) => group.id !== id);
    this.groups.sort(sortByPosition).forEach((group, i) => {
      group.setPosition(i, true);
    });
  }

  getGroups(): StepGroup[] {
    return this.groups;
  }

  removeStep(stepToDelete: Step): void {
    const group = this.groups.find(
      (group) => group.id === stepToDelete.groupId
    );
    if (group) {
      group.steps = group.steps.filter((step) => stepToDelete.id !== step.id);
      group.steps.sort(sortByPosition);
      let y = 0;
      group.steps.forEach((step, i) => {
        step.position = i;
        step.setDefaultPositionY(y);
        step.setYPosition(y);
        y += step.getHeight() + STEP_DISTANCE_BETWEEN;
      });
      group.setDefaultYPosition();
    }
  }

  addStepToGroup(newStep: Step, groupId: string): void {
    const group = this.groups.find((group) => group.id === groupId);
    if (group) {
      group.steps.push(newStep);
      group.setDefaultYPosition();
    }
  }
}
