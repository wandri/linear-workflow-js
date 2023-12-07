import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WorkflowSchemaComponent} from './workflow-schema.component';

describe('WorkflowSchemaComponent', () => {
  let component: WorkflowSchemaComponent;
  let fixture: ComponentFixture<WorkflowSchemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowSchemaComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WorkflowSchemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
