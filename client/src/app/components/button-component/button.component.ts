import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
@Component({
    selector: 'app-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
    @Input() label: string = '';
    @Input() icon: IconProp;
    @Input() routerLink: string | string[] = '';
    @Output() buttonClick = new EventEmitter<void>();
    onClick(): void {
        this.buttonClick.emit();
    }
}
