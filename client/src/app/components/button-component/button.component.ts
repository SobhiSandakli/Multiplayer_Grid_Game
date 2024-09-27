import { Component, Input, Output, EventEmitter } from '@angular/core';
@Component({
    selector: 'app-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
    // Inputs for customizations
    @Input() label: string = ''; // Button text
    @Input() icon: unknown; // Icon input
    @Input() routerLink: string | string[] = ''; // Router link input

    // Output event to handle button click
    @Output() buttonClick = new EventEmitter<void>();

    // Method to emit the click event
    onClick(): void {
        this.buttonClick.emit();
    }
}
