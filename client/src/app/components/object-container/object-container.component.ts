import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GridSize } from '../../classes/grid-size.enum';

@Component({
    selector: 'app-object-container',
    standalone: true,
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
    imports: [CommonModule, DragDropModule],
})
export class ObjectContainerComponent implements OnInit {
    gridSize: GridSize = GridSize.Large; // for test
    displayedNumber: number;
    objectsList = [
        { description: 'Le bouclier: +2 points en défense.', link: '../../../assets/objects/Shield.png' },
        { description: 'La potion critique: +2 points sur la vie et -1 point en attaque.', link: '../../../assets/objects/Critical-Potion.png' },
        { description: "La clé: ouvrir ou fermer une porte peu importe l'endroit où tu te trouves.", link: '../../../assets/objects/Key.png' },
    ];
    elementCoordinates: { top: number; left: number; right: number; bottom: number; width: number; height: number } | null = null;

    getCoordinates(element: HTMLElement) {
        const rect = element.getBoundingClientRect();
        this.elementCoordinates = {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
        };
    }

    onRightClick(element: HTMLElement, event: MouseEvent) {
        event.preventDefault(); // Empêche le menu contextuel de s'afficher
        console.log(element);
        if (this.elementCoordinates) {
            element.style.position = 'relative'; // Assure-toi que l'élément peut être repositionné
            element.style.top = `${this.elementCoordinates.top}px`; // Ajuste pour le défilement de la page
            element.style.left = `${this.elementCoordinates.left}px`;
            element.style.right = `${this.elementCoordinates.right}px`; // Ajuste pour le défilement de la page
        }
    }
    ngOnInit() {
        this.displayedNumber = this.getNumberByGridSize(this.gridSize);
    }

    getNumberByGridSize(size: GridSize): number {
        if (size === GridSize.Small) {
            return 2;
        } else if (size === GridSize.Medium) {
            return 4;
        } else if (size === GridSize.Large) {
            return 6;
        } else return 0;
    }
}
