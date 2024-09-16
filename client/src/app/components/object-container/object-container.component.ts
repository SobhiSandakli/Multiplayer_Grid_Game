import { Component } from '@angular/core';

@Component({
    selector: 'app-object-container',
    standalone: true,
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
})
export class ObjectContainerComponent {
    objects = [
        { name: 'Bouclier', img: '../../assets/objects/Shield.png' },
        { name: 'Object 2', img: '../../../assets/objects/Shield.png' },
        { name: 'Object 3', img: '../../../assets/objects/Shield.png' },
    ];
}
