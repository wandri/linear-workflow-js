import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {workflowDemo} from "./workflow.demo";
import {Workflow, WorkflowLinearComponent,} from 'workflow-linear';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [
    WorkflowLinearComponent
  ],
  templateUrl: './workflow.component.html',
  styles: [':host {@apply flex flex-col h-full w-full relative; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowComponent {
  readonly workflow = signal<Workflow>(workflowDemo);
}
