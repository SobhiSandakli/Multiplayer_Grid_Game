import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-inventory-popup',
    templateUrl: './inventory-popup.component.html',
    styleUrls: ['./inventory-popup.component.scss'],
})
export class InventoryPopupComponent {
    @Input() items: string[] = [];
    @Output() discard = new EventEmitter<string>();
    @Output() cancel = new EventEmitter<void>();

    onDiscardItem(item: string): void {
        this.discard.emit(item);
    }
}
