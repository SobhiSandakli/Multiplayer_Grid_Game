import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryPopupComponent } from './inventory-popup.component';

describe('InventoryPopupComponent', () => {
  let component: InventoryPopupComponent;
  let fixture: ComponentFixture<InventoryPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
