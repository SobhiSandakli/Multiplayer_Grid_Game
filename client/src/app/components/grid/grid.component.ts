import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule ],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss'
})
export class GridComponent {
  rows: number = 4;  // Nombre de lignes
  cols: number = 4;  // Nombre de colonnes
  grid: number[] = []; // Tableau pour les cellules de la grille

  ngOnInit(): void {
    this.generateGrid();
  }

  generateGrid(): void {
    const totalCells = this.rows * this.cols;
    this.grid = Array.from({ length: totalCells }, (_, index) => index + 1);
  }
}
