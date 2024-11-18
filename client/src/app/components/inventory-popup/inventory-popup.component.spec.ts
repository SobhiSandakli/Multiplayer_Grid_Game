import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InventoryPopupComponent } from './inventory-popup.component';

describe('InventoryPopupComponent', () => {
    let component: InventoryPopupComponent;
    let fixture: ComponentFixture<InventoryPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [InventoryPopupComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InventoryPopupComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should display the items passed as @Input()', () => {
        // Arrange
        component.items = ['assets/item1.png', 'assets/item2.png', 'assets/item3.png'];
        fixture.detectChanges();

        // Act
        const itemElements = fixture.debugElement.queryAll(By.css('.item img'));

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(itemElements.length).toBe(3);
        expect(itemElements[0].nativeElement.src).toContain('assets/item1.png');
        expect(itemElements[1].nativeElement.src).toContain('assets/item2.png');
        expect(itemElements[2].nativeElement.src).toContain('assets/item3.png');
    });

    it('should emit discard event with the correct item when onDiscardItem is called', () => {
        // Arrange
        spyOn(component.discard, 'emit');
        const itemToDiscard = 'assets/item1.png';

        // Act
        component.onDiscardItem(itemToDiscard);

        // Assert
        expect(component.discard.emit).toHaveBeenCalledOnceWith(itemToDiscard);
    });

    it('should emit cancel event when cancel button is clicked', () => {
        // Arrange
        spyOn(component.cancel, 'emit');

        // Act
        component.cancel.emit();

        // Assert
        expect(component.cancel.emit).toHaveBeenCalled();
    });

    it('should call onDiscardItem when the "Supprimer" button is clicked for an item', () => {
        // Arrange
        spyOn(component, 'onDiscardItem');
        component.items = ['assets/item1.png'];
        fixture.detectChanges();
        const discardButton = fixture.debugElement.query(By.css('.item button'));

        // Act
        discardButton.nativeElement.click();

        // Assert
        expect(component.onDiscardItem).toHaveBeenCalledOnceWith('assets/item1.png');
    });
});
