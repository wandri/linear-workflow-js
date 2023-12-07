import {Entity} from '../../../../shared/entity';
import {StepGroup} from "./step-group.entity";
import {Step} from "./step.entity";
import {sortByPosition} from "../workflow-schema/diagram/utils/diagram.utils";
import {STEP_DISTANCE_BETWEEN} from "../workflow-schema/diagram/utils/diagram.constants";

export const defaultWorkflowName = 'Untitled';

export class Workflow extends Entity {
  protected groups: StepGroup[] = [];
  protected name = defaultWorkflowName;

  constructor(workflow: Entity & { groups: StepGroup[]; name: string }) {
    super(workflow);
    this.groups = workflow.groups;
    this.name = workflow.name;
  }

  static new(groups: StepGroup[]): Workflow {
    return new Workflow({
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

  workflowValidity(): { isValid: boolean; message: string } {
    const groupWithSteps = this.groups.filter(
      (group) => group.steps.length === 0
    );
    if (groupWithSteps.length > 0) {
      return {
        isValid: false,
        message: `Each group should have at least one step (${groupWithSteps
          .map((group) => '<i>' + group.name + '</i>')
          .join(', ')}).`,
      };
    }
    return {isValid: true, message: ''};
  }

  getName(): string {
    return this.name;
  }

  setName(name: string | null): void {
    this.name = name || defaultWorkflowName;
  }

  isNameDefaultName(): boolean {
    return this.name === defaultWorkflowName;
  }

  clone(): Workflow {
    return new Workflow({
      id: this.id,
      name: this.name,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
      groups: this.groups.map((group) => group.clone()),
    });
  }

  isEqual(workflow: Workflow): boolean {
    if (
      this.id !== workflow.id ||
      this.name !== workflow.name ||
      this.updatedAt !== workflow.updatedAt ||
      this.createdAt !== workflow.createdAt ||
      this.groups.length !== workflow.groups.length
    ) {
      return false;
    }
    for (let i = 0; i < this.groups.length; i++) {
      const group = this.groups[i];
      const refGroup = workflow.groups.find((refGroup) =>
        refGroup.isEqual(group)
      );
      if (!refGroup) {
        return false;
      }
    }
    return true;
  }
}
