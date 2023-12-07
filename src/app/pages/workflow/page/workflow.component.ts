import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {WorkflowSchemaComponent} from "../workflow-schema/workflow-schema.component";
import {Workflow} from "../entities/workflow.entity";
import {workflowDemo} from "./workflow.demo";

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [
    WorkflowSchemaComponent
  ],
  templateUrl: './workflow.component.html',
  styles: [':host {@apply flex flex-col h-full w-full relative; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowComponent {
  readonly workflow = signal<Workflow>(workflowDemo);
}
