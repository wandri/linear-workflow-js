import {Routes} from '@angular/router';

export const routingConstants = {
  workflow: 'workflow'
} as const;


export const routes: Routes = [
  {
    path: '**',
    redirectTo: routingConstants.workflow,
    pathMatch: 'full'
  },
  {
    path: routingConstants.workflow,
    loadComponent: () =>
      import(
        './pages/workflow/page/workflow.component'
        ).then((mod) => mod.WorkflowComponent),
    title: () => Promise.resolve('Workflow')
  },
];
