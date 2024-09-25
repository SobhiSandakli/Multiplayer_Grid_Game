import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class DragDropService {
    draggedItem: any;

    setDraggedItem(item: any) {
        this.draggedItem = item;
    }

    getDraggedItem() {
        return this.draggedItem;
    }
}
