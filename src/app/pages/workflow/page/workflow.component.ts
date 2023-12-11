import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {workflowLinearDemo} from "./workflow-linear.demo";
import {WorkflowLinear, WorkflowLinearComponent,} from 'workflow-linear';
import {WorkflowMulti, WorkflowMultiComponent} from 'workflow-multi';
import {MatButtonModule} from "@angular/material/button";
import {workflowMultiDemo} from "./workflow-multi.demo";

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [
    WorkflowLinearComponent,
    WorkflowMultiComponent,
    MatButtonModule,
  ],
  templateUrl: './workflow.component.html',
  styles: [':host {@apply flex flex-col h-full w-full relative; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowComponent {
  readonly display = signal<'linear' | 'multi'>('linear')
  readonly workflowLinear = signal<WorkflowLinear>(workflowLinearDemo);
  readonly workflowMulti = signal<WorkflowMulti>(workflowMultiDemo);
}
