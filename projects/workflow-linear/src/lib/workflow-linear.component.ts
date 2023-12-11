import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
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
import {CdkMenu, CdkMenuItem} from "@angular/cdk/menu";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatRippleModule} from "@angular/material/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {D3ZoomEvent} from "d3";
import {ManualZoomAction} from "./manual-zoom-action.enum";
import {Diagram} from "./diagram/diagram";
import {STEP_DISTANCE_BETWEEN} from "./diagram/utils/diagram.constants";
import {selectById} from "./diagram/utils/diagram.utils";
import {DiagramActionType} from "./interface/diagram-action-type.enum";
import {MatTooltipModule} from "@angular/material/tooltip";
import {Step, StepGroup, WorkflowLinear} from "./entities";
import {generateName} from "./shared";

@Component({
  selector: 'lib-workflow-linear',
  standalone: true,
  styles: [':host {@apply flex flex-col h-full w-full relative; }'],
  templateUrl: './workflow-linear.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkMenu,
    CdkMenuItem,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatTooltipModule
  ]
})
export class WorkflowLinearComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('contextMenu') contextMenu!: CdkMenu;
  @ViewChild('svgContainer') svgContainer!: ElementRef<SVGElement>;
  @Input() workflow: WorkflowLinear = WorkflowLinear.new([]);
  readonly contextMenuOption = signal<{
    isOpened: boolean,
    step?: Step,
    group?: StepGroup,
    position: { x: number; y: number }
  }>(
    {isOpened: false, step: undefined, group: undefined, position: {x: 0, y: 0}}
  )

  isContextStepOpened = computed<boolean>(() => this.contextMenuOption().isOpened && !!this.contextMenuOption().step)
  isContextGroupOpened = computed<boolean>(() => this.contextMenuOption().isOpened && !!this.contextMenuOption().group)

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
    const lastStep = group.steps.at(-1);
    let yPosition = 0; // Default y position

    if (lastStep) {
      yPosition = lastStep.getYPosition() + lastStep.getHeight() + STEP_DISTANCE_BETWEEN;
    }

    const newStep: Step = new Step({
      name: stepName,
      position,
      y: yPosition,
      groupId: group.id,
    });

    this.workflow.addStepToGroup(newStep, group.id);
    this.diagram.update(this.workflow.getGroups(), true);
  }

  openRenamingStepDialog(step?: Step): void {
    // Change for real word step renaming
    if (step) {
      this.renameStep(step, generateName());
    }
  }

  openRenamingGroupDialog(group?: StepGroup): void {
    // Change for real word group renaming
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
    this.contextMenuOption.set({isOpened: false, step: undefined, group: undefined, position: {x: 0, y: 0}})
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
        this.contextMenuOption.set({isOpened: false, step: undefined, group: undefined, position: {x: 0, y: 0}})
        break;
    }
  }

  private contextMenuOnGroup(event: MouseEvent, group: StepGroup): void {
    this.contextMenuOption.set({
      isOpened: true,
      step: undefined,
      group: group,
      position: {x: event.clientX, y: event.clientY}
    })
  }

  private contextMenuOnStep(event: MouseEvent, step: Step): void {
    this.contextMenuOption.set({
      isOpened: true,
      step: step,
      group: undefined,
      position: {x: event.clientX, y: event.clientY}
    })
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
