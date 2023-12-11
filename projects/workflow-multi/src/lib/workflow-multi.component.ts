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
import {ManualZoomAction} from "./manual-zoom-action.enum";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {D3ZoomEvent} from "d3";
import {DiagramActionType} from "./interface/diagram-action-type.enum";
import {Connector, Step, WorkflowMulti} from "./entities";
import {Diagram} from "./diagram/diagram";
import {GRID_SIZE} from "./diagram/utils/diagram-grid.utils";
import {selectById} from "./diagram/utils/diagram.utils";
import {MatTooltipModule} from "@angular/material/tooltip";
import {generateName} from "./shared";

@Component({
  selector: 'lib-workflow-multi',
  standalone: true,
  styles: [':host {@apply flex flex-col h-full w-full relative; }'],
  templateUrl: './workflow-multi.component.html',
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
export class WorkflowMultiComponent implements AfterViewInit, OnChanges, OnInit {
  @ViewChild('svgContainer') svgContainer!: ElementRef<SVGElement>;
  @Input() workflow: WorkflowMulti = new WorkflowMulti([], []);

  readonly contextMenuOption = signal<{
    isOpened: boolean,
    step?: Step,
    connector?: Connector,
    position: { x: number; y: number }
  }>(
    {isOpened: false, step: undefined, connector: undefined, position: {x: 0, y: 0}}
  )

  isContextStepOpened = computed<boolean>(() => this.contextMenuOption().isOpened && !!this.contextMenuOption().step)
  isContextConnectorOpened = computed<boolean>(() => this.contextMenuOption().isOpened && !!this.contextMenuOption().connector)

  zoomActions: { icon: string, type: ManualZoomAction, description: string } [] = [
    {type: ManualZoomAction.IN, icon: 'add', description: 'Zoom in'},
    {type: ManualZoomAction.OUT, icon: 'remove', description: 'Zoom out'},
    {type: ManualZoomAction.ADJUST, icon: 'fullscreen_exit', description: 'Zoom to fit'},
  ];
  private stepParent = signal<Step | undefined>(undefined);
  private isDialogOpen = signal<boolean>(false)
  private diagram: Diagram = new Diagram();
  private renamingStep?: Step;
  private destroyRef: DestroyRef = inject(DestroyRef);

  ngOnInit() {
    this.diagram.actions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({event, element, eventType}) =>
        this.manageDiagramActions(event, element, eventType)
      );
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    setTimeout(() => {
      this.createWorkflow();
    })
  }

  @HostListener('window:keydown', ['$event'])
  removeStepOrConnector(event: KeyboardEvent): void {
    const backspaceOrDeleteKey = event.code == 'Backspace' || event.code == 'Delete';
    const escapeKey = event.code == 'Escape';
    const isDialogOpened = this.isDialogOpen();
    if (backspaceOrDeleteKey && !isDialogOpened) {
      if (this.diagram.selectedConnector) {
        this.deleteAndUpdateConnector(this.diagram.selectedConnector);
      } else if (this.diagram.selectedStep) {
        this.deleteStepAndUpdate(this.diagram.selectedStep)
      }
      this.contextMenuOption.set({isOpened: false, step: undefined, connector: undefined, position: {x: 0, y: 0}});
    } else if (escapeKey && !isDialogOpened) {
      this.diagram.selectedConnector = undefined;
      this.diagram.selectedStep = undefined;
      this.contextMenuOption.set({isOpened: false, step: undefined, connector: undefined, position: {x: 0, y: 0}});
      this.diagram.update(this.workflow);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const workflowChange = changes['workflow'];
    if (workflowChange) {
      if (!workflowChange.isFirstChange()) {
        this.diagram.update(this.workflow, true);
      }
    }
    const selectedStepChanges = changes['selectedStepChanges'];
    if (selectedStepChanges) {
      const change: {
        step?: Partial<Step>;
        connectors?: Connector[];
      } = selectedStepChanges.currentValue;
      if (change && change.step) {
        this.diagram.selectedStep?.update(change.step as Step)
      }
      if (change && change.connectors) {
        this.workflow.changeConnectors(change.connectors);
      }
      if (!selectedStepChanges.isFirstChange()) {
        this.diagram.update(this.workflow);
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createWorkflow();
    })
  }

  openNewStepDialog(step: Step): void {
    this.stepParent.set(step);
    this.createStep(generateName())
  }

  createStep(stepName: string): void {
    let maxX: number;
    let minY: number;
    if (this.workflow.getConnectors().length === 0) {
      maxX = 0;
      minY = 0;
    } else {
      maxX = this.workflow.getMaxStepX() + 4 * GRID_SIZE
      minY = this.workflow.getMinStepY();
    }
    const newStep: Step = new Step(stepName, maxX, minY)
    this.workflow.addStep(newStep)
    // this.stepNameForm.reset('');
    this.diagram.selectedStep = newStep;
    this.diagram.selectedConnector = undefined;

    const stepParent = this.stepParent();
    if (stepParent) {
      const newConnector: Connector = new Connector(stepParent.id, newStep.id);
      this.workflow.addConnector(newConnector);
      this.workflow.reorder();
    }
    this.diagram.update(this.workflow, true);
    this.stepParent.set(undefined);
  }

  openRenamingStepDialog(step?: Step) {
    if (step) {
      this.renamingStep = step;
      // this.stepNameForm.setValue(step.name);
    }
  }

  deleteStepAndUpdate(step?: Step): void {
    if (step) {
      if (step.isStart) {
      } else {
        const stepId = step.id;
        this.workflow.removeStepById(stepId);
        this.workflow.removeConnectorByStepId(stepId);
        this.diagram.selectedStep = undefined;
        this.diagram.selectedConnector = undefined;
        this.diagram.update(this.workflow);
      }
    }
  }

  deleteAndUpdateConnector(selectedConnector?: Connector): void {
    if (selectedConnector) {
      const connectorId = selectedConnector.id;
      this.workflow.removeConnectorById(connectorId)
      this.diagram.selectedConnector = undefined;
      this.diagram.update(this.workflow);
    }
  }

  closeMenu(): void {
    this.contextMenuOption.set({isOpened: false, step: undefined, connector: undefined, position: {x: 0, y: 0}});
  }

  renameStep(name: string): void {
    if (this.renamingStep) {
      this.workflow.getStepById(this.renamingStep?.id)?.rename(name)
      // this.stepNameForm.reset('')
      this.diagram.update(this.workflow, true);
    }
  }

  applyManualZoom(type: ManualZoomAction): void {
    this.diagram.applyManualZoom(type, this.workflow);
  }

  organizeSteps(): void {
    this.workflow.reorder();
    this.diagram.update(this.workflow, true, 0);
  }


  private createWorkflow(): void {
    this.diagram.remove();
    console.log(this.svgContainer.nativeElement.clientWidth, this.svgContainer.nativeElement.clientHeight)
    this.diagram.init(this.svgContainer.nativeElement.clientWidth, this.svgContainer.nativeElement.clientHeight,
      selectById<HTMLElement, undefined>("svg-container"), this.workflow);
    // self.clickOnStep.emit(step); TODO redo
  }

  private manageDiagramActions(
    event: MouseEvent | D3ZoomEvent<SVGElement, null> | undefined,
    element: Step | Connector | { stepStart: Step, stepEnd: Step, connector?: Connector } | undefined,
    eventType: DiagramActionType
  ): void {
    switch (eventType) {
      case DiagramActionType.CONTEXT_MENU_ON_STEP:
        this.contextMenuOnStep(event as MouseEvent, element as Step)
        break;
      case DiagramActionType.CONTEXT_MENU_ON_CONNECTOR:
        this.contextMenuOnConnector(event as MouseEvent, element as Connector)
        break;
      case DiagramActionType.ADD_STEP:
        this.openNewStepDialog(element as Step);
        break;
      case DiagramActionType.ADD_CONNECTOR:
        this.createConnector(element as { stepStart: Step, stepEnd: Step });
        break;
      case DiagramActionType.UPDATE_CONNECTOR:
        this.updateConnection(element as { stepStart: Step, stepEnd: Step, connector?: Connector });
        break;
      case DiagramActionType.CLICK_ON_GRID:
      case DiagramActionType.CONTEXT_MENU_ON_GRID:
      case DiagramActionType.ZOOM:
      case DiagramActionType.CLICK_ON_ELEMENT:
        this.contextMenuOption.set({isOpened: false, step: undefined, connector: undefined, position: {x: 0, y: 0}});
        break;
    }
  }

  private contextMenuOnConnector(event: MouseEvent, connector: Connector): void {
    this.contextMenuOption.set({
      isOpened: false,
      step: undefined,
      connector: connector,
      position: {x: event.clientX, y: event.clientY}
    });
  }

  private contextMenuOnStep(event: MouseEvent, step: Step): void {
    this.contextMenuOption.set({
      isOpened: false,
      step: step,
      connector: undefined,
      position: {x: event.clientX, y: event.clientY}
    })
  }

  private updateConnection(update: { stepStart: Step, stepEnd: Step, connector?: Connector }): void {
    if (update.connector) {
      const selectedConnector = this.workflow.getConnectorById(update.connector.id);
      if (selectedConnector) {
        const alreadyExistingStep = this.workflow.getConnectorByStepIds(update.stepStart.id, update.stepEnd.id)

        if (alreadyExistingStep) {
          this.workflow.removeConnectorById(selectedConnector.id);
        } else {
          const cyclic = this.workflow.isCyclic();
          const firstStep = this.workflow.getStepById(selectedConnector.endId);
          if (firstStep && firstStep.isStart) {
          } else if (!cyclic.isValid) {
            this.displayCyclingError(cyclic);
          } else {
            selectedConnector.startId = update.stepStart.id;
            selectedConnector.endId = update.stepEnd.id;
          }
        }
      }
      this.diagram.update(this.workflow);
    }
  }

  private displayCyclingError(cyclic: { isValid: boolean; cyclicStepIds: string[] }): void {
    const errorSteps = cyclic.cyclicStepIds
      .map(id => this.workflow.getStepById(id))
      .map(step => `<i>${step?.name}</i>`).join(', ')
  }

  private createConnector(steps: { stepStart: Step, stepEnd: Step }): void {
    const newConnector = new Connector(steps.stepStart.id, steps.stepEnd.id);

    const cyclic = this.workflow.isCyclic([...this.workflow.getConnectors(), newConnector]);
    const firstStep = this.workflow.getStepById(newConnector.endId);
    const alreadyExist = this.workflow.getConnectors().some(connector => connector.endId === steps.stepEnd.id && connector.startId === steps.stepStart.id);
    if (firstStep && firstStep.isStart) {
    } else if (!cyclic.isValid) {
      this.displayCyclingError(cyclic);
    } else if (!alreadyExist) {
      this.workflow.addConnector(newConnector);
      this.diagram.update(this.workflow);
    }
  }
}
