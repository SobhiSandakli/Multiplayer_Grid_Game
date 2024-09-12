import { Component } from '@angular/core';

@Component({
  selector: 'app-object-container',
  standalone: true,
  templateUrl: './object-container.component.html',
  styleUrls: ['./object-container.component.scss']
})

export class ObjectContainerComponent {
    objects = [
      { name: 'Bouclier', img: 'assets/object1.png' },
      { name: 'Object 2', img: 'assets/object2.png' },
      { name: 'Object 3', img: 'assets/object3.png' }
    ];
  
    draggedObject: any = null;
  
    onDragStart(event: DragEvent, object: any) {
      this.draggedObject = object;
    }
  
    onDragOver(event: DragEvent) {
      event.preventDefault();
    }
  
    onDrop(event: DragEvent) {
      event.preventDefault();
      // Logique pour déposer et réorganiser les objets
      if (this.draggedObject) {
        console.log(`Dropped ${this.draggedObject.name}`);
        this.draggedObject = null;
      }
    }
  }