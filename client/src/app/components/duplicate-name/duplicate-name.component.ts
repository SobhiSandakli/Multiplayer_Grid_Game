import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-duplicate-name',
    templateUrl: './duplicate-name.component.html',
    styleUrl: './duplicate-name.component.scss',
})
export class DuplicateNameComponent {
    @Output() confirmEvent = new EventEmitter<string>();
    @Output() cancelEvent = new EventEmitter<void>();

    newName: string = '';

    onConfirm(): void {
        this.confirmEvent.emit(this.newName);
    }

    onCancel(): void {
        this.cancelEvent.emit();
    }
}
