import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule, MatGridListModule],
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent  {
  @Input() gridSize: number = 10;  

  gridCols: number;
  grid: any[] = [];

  ngOnInit() {
    this.updateGrid();
  }

  updateGrid() {
    this.gridCols = this.gridSize;  // Définit le nombre de colonnes selon la taille de la grille
    this.grid = Array(this.gridSize * this.gridSize).fill(0);  // Crée la grille
  }
}