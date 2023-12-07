import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Workflow} from "../entities/workflow.entity";
import {Step} from "../entities/step.entity";
import {StepGroup} from "../entities/step-group.entity";
import {ManualZoomAction} from "./manual-zoom-action.enum";
import {Diagram} from "./diagram/diagram";
import {selectById} from "./diagram/utils/diagram.utils";
import {D3ZoomEvent} from "d3";
import {DiagramActionType} from "./interface/diagram-action-type.enum";
import {STEP_DISTANCE_BETWEEN} from "./diagram/utils/diagram.constants";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatRippleModule} from "@angular/material/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {generateName} from "../../../../shared/random";
import {CdkMenu, CdkMenuItem} from "@angular/cdk/menu";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-workflow-schema',
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    MatRippleModule,
    CdkMenu,
    CdkMenuItem,
    MatButtonModule
  ],
  templateUrl: './workflow-schema.component.html',
  styles: [':host {@apply flex flex-col h-full w-full relative; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowSchemaComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('stepDialog') stepDialog!: ElementRef;
  @ViewChild('contextMenu') contextMenu!: CdkMenu;
  @ViewChild('svgContainer') svgContainer!: ElementRef<SVGElement>;
  @Input() workflow: Workflow = Workflow.new([]);
  readonly contextMenuOpen = signal<boolean>(false);
  readonly contextMenuStep = signal<Step | undefined>(undefined);
  readonly contextMenuGroup = signal<StepGroup | undefined>(undefined);
  readonly contextMenuOption = signal<{ x: number; y: number }>({x: 0, y: 0});
  readonly zoomActions: {
    icon: string;
    type: ManualZoomAction;
    description: string;
  }[] = [
    {type: ManualZoomAction.IN, icon: 'add', description: 'Zoom in'},
    {type: ManualZoomAction.OUT, icon: 'remove', description: 'Zoom out'},
    {
      type: ManualZoomAction.ADJUST,
      icon: 'fullscreen_exit',
      description: 'Zoom to fit',
    },
  ];
  private destroyRef = inject(DestroyRef);
  private readonly diagram = new Diagram();

  ngOnInit() {
    this.diagram.actions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({event, element, eventType}) =>
        this.manageDiagramActions(event, element, eventType)
      );
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.createWorkflow();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const workflowChange = changes['workflow'];
    if (workflowChange) {
      if (!workflowChange.isFirstChange()) {
        this.diagram.update(this.workflow.getGroups(), true);
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createWorkflow();
    });
  }

  openNewStepCreationDialog(group?: StepGroup): void {
    if (group) {
      this.createStep(generateName(), group);
    }
  }

  createStep(stepName: string, group: StepGroup): void {
    const position = group.steps.length;
    const lastStep = group.steps[position - 1];
    if (lastStep) {
      const y =
        lastStep.getYPosition() + lastStep.getHeight() + STEP_DISTANCE_BETWEEN;
      const newStep: Step = new Step({
        name: stepName,
        position,
        y,
        groupId: group.id,
      });
      this.workflow.addStepToGroup(newStep, group.id);
      this.diagram.update(this.workflow.getGroups(), true);
    } else {
      const newStep: Step = new Step({
        name: stepName,
        position,
        y: 0,
        groupId: group.id,
      });
      this.workflow.addStepToGroup(newStep, group.id);
      this.diagram.update(this.workflow.getGroups(), true);
    }
  }

  openRenamingStepDialog(step?: Step) {
    if (step) {
      this.renameStep(step, generateName());

    }
  }

  openRenamingGroupDialog(group?: StepGroup) {
    if (group) {
      this.renameGroup(group, generateName());
    }
  }

  deleteAndUpdateStep(step?: Step): void {
    if (step) {
      this.workflow.removeStep(step);
      this.diagram.update(this.workflow.getGroups());
    }
  }

  deleteAndUpdateGroup(group?: StepGroup): void {
    if (group) {
      this.removeGroup(group);
    }
  }

  closeMenu(): void {
    this.contextMenuOpen.set(false);
  }

  onActiveZone(active: boolean): void {
    this.contextMenuOpen.set(active && this.contextMenuOpen());
  }

  renameStep(step: Step, name: string): void {
    if (step) {
      this.workflow.getStepById(step.id)?.rename(name);
      this.diagram.update(this.workflow.getGroups(), true);
    }
  }

  renameGroup(group: StepGroup, name: string): void {
    this.workflow.getStepGroupById(group.id)?.rename(name);
    this.diagram.update(this.workflow.getGroups(), true);
  }

  applyManualZoom(type: ManualZoomAction): void {
    this.diagram.applyManualZoom(type, this.workflow.getGroups());
  }

  private removeGroup(group: StepGroup): void {
    this.workflow.removeGroupById(group.id);
    this.diagram.update(this.workflow.getGroups());
  }

  private createWorkflow(): void {
    this.diagram.remove();
    this.diagram.init(
      this.svgContainer.nativeElement.clientWidth,
      this.svgContainer.nativeElement.clientHeight,
      selectById<HTMLElement, undefined>('svg-container'),
      this.workflow.getGroups()
    );
  }

  private manageDiagramActions(
    event: MouseEvent | D3ZoomEvent<SVGElement, null> | undefined,
    element: Step | StepGroup | undefined,
    eventType: DiagramActionType
  ): void {
    switch (eventType) {
      case DiagramActionType.CONTEXT_MENU_ON_STEP:
        this.contextMenuOnStep(event as MouseEvent, element as Step);
        break;
      case DiagramActionType.CONTEXT_MENU_ON_GROUP:
        this.contextMenuOnGroup(event as MouseEvent, element as StepGroup);
        break;
      case DiagramActionType.ADD_STEP:
        this.openNewStepCreationDialog(element as StepGroup);
        break;
      case DiagramActionType.ADD_GROUP:
        this.openNewGroupCreationDialog();
        break;
      case DiagramActionType.CLICK_ON_GRID:
      case DiagramActionType.CONTEXT_MENU_ON_GRID:
      case DiagramActionType.ZOOM:
        this.contextMenuOpen.set(false);
        break;
    }
  }

  private contextMenuOnGroup(event: MouseEvent, group: StepGroup): void {
    this.contextMenuGroup.set(group);
    this.contextMenuStep.set(undefined);
    this.contextMenuOption.set({x: event.clientX, y: event.clientY});
    this.contextMenuOpen.set(true);
  }

  private contextMenuOnStep(event: MouseEvent, step: Step): void {
    this.contextMenuStep.set(step);
    this.contextMenuGroup.set(undefined);
    this.contextMenuOption.set({x: event.clientX, y: event.clientY});
    this.contextMenuOpen.set(true);
  }

  private openNewGroupCreationDialog(): void {
    this.createGroup(generateName());
  }

  private createGroup(name: string): void {
    const newGroup = new StepGroup({
      name,
      position: this.workflow.getGroups().length,
      steps: [],
    });
    this.workflow.getGroups().push(newGroup);
    this.diagram.update(this.workflow.getGroups(), true);
  }
}
