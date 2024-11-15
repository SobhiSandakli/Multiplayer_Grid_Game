import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuplicateNameComponent } from './duplicate-name.component';

describe('DuplicateNameComponent', () => {
  let component: DuplicateNameComponent;
  let fixture: ComponentFixture<DuplicateNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DuplicateNameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuplicateNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
