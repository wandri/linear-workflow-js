import {DiagramGroupsOverview} from './diagram-group/diagram-groups-overview';
import {DiagramAbstract} from './diagram-abstract';
import {Selection} from 'd3';
import {Step} from '../../entities/step.entity';
import {StepGroupOverview} from "../../entities/step-group-overview.entity";

export class DiagramOverview extends DiagramAbstract<
  StepGroupOverview,
  DiagramGroupsOverview
> {
  protected override diagramGroups: DiagramGroupsOverview =
    new DiagramGroupsOverview([]);

  createDiagramGroups(groups: StepGroupOverview[]): DiagramGroupsOverview {
    return new DiagramGroupsOverview(groups);
  }

  protected override createGroups(
    content: Selection<SVGGElement, undefined, Element, undefined>
  ): void {
    this.createGroupsAndSteps(content);

    this.diagramGroups
      .getStepElements()
      .on('mouseover', (event: MouseEvent, step: Step) =>
        this.mouseOverOnStep(step)
      )
      .on('mouseout', (event: MouseEvent, step: Step) =>
        this.mouseOutOnStep(step)
      )
      .on('click', (event: MouseEvent, step: Step) => this.clickOnStep(step));
  }

  protected getZoomPositionPaddingRight(): number {
    return 0;
  }

  private mouseOverOnStep(step: Step): void {
    this.diagramGroups.setStepHoveringDesign(step.id);
  }

  private clickOnStep(step: Step): void {
    // TODO
  }

  private mouseOutOnStep(step: Step): void {
    this.diagramGroups.setStepDefaultDesign(step.id);
  }
}
