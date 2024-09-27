import { Injectable } from "@angular/core";
import { LoggerService } from "./LoggerService"; // Ensure this path is correct

@Injectable({
  providedIn: "root",
})
export class ValidateGameService {

  constructor(private loggerService: LoggerService) {}
  // Check if more than 50% of the total surface area is occupied by terrain tiles
  isSurfaceAreaValid(gridArray: any[][]): boolean {
    let terrainCount = 0;
    let totalTiles = 0;

    for (const row of gridArray) {
      for (const cell of row) {
        totalTiles++;
        if (cell.images && cell.images.includes("assets/grass.png")) {
          terrainCount++;
        }
      }
    }
    const isValid = terrainCount / totalTiles > 0.5;
    if (!isValid) {
      console.log(
        `Surface area validation failed: Only ${
          (terrainCount / totalTiles) * 100
        }% is occupied by terrain tiles.`
      );
    }
    return isValid;
  }

  // Verify if all terrain tiles are accessible using BFS from the starting point
  areAllTerrainTilesAccessible(gridArray: any[][]): boolean {
    const rows = gridArray.length;
    const cols = gridArray[0].length;

    const startPoint = this.findStartPoint(gridArray, rows, cols);
    if (!startPoint) {
      console.log("No starting point found.");
      return false;
    }

    const visited = this.performBFS(gridArray, startPoint, rows, cols);
    return this.verifyAllTerrainTiles(gridArray, visited, rows, cols);
  }

  // Check if the correct number of start points are present
  areStartPointsCorrect(gridArray: any[][]): boolean {
    let startPointCount = 0;
    for (const row of gridArray) {
      for (const cell of row) {
        if (
          cell.images &&
          cell.images.includes("../../../assets/objects/started-points.png")
        ) {
          startPointCount++;
        }
      }
    }

    const expectedCount = this.getExpectedStartPoints(gridArray.length);
    const isValid = startPointCount === expectedCount;
    if (!isValid) {
      this.loggerService.error("Start points validation failed: Expected " + expectedCount + " start points, but found " + startPointCount + ".");
    }
    return isValid;
  }

  // Function to validate all conditions
  validateAll(gridArray: any[][]): boolean {
    const surfaceAreaValid = this.isSurfaceAreaValid(gridArray);
    const accessibilityValid = this.areAllTerrainTilesAccessible(gridArray);
    const doorsValid = this.areDoorsCorrectlyPlaced(gridArray);
    const startPointsValid = this.areStartPointsCorrect(gridArray);

    const allValid =
      surfaceAreaValid && accessibilityValid && doorsValid && startPointsValid;

    if (!allValid) {
      let errorMessage = "Game validation failed. Please review the errors above. Reasons:";
      if (!surfaceAreaValid) errorMessage += " Insufficient terrain area.";
      if (!accessibilityValid) errorMessage += " Some terrain tiles are not accessible.";
      if (!doorsValid) errorMessage += " Doors are not correctly placed.";
      if (!startPointsValid) errorMessage += " Incorrect number of start points.";
      
      this.loggerService.error(errorMessage);
      window.alert(errorMessage); // Display an alert with the error message
    } else {
      this.loggerService.log("Game validation successful. All checks passed.");
    }

    return allValid;
  }


  // Additional private methods for utility
  findStartPoint(
    gridArray: any[][],
    rows: number,
    cols: number
  ): [number, number] | null {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (
          gridArray[row][col].images &&
          gridArray[row][col].images.includes(
            "../../../assets/objects/started-points.png"
          )
        ) {
          return [row, col];
        }
      }
    }
    return null;
  }

  performBFS(
    gridArray: any[][],
    startPoint: [number, number],
    rows: number,
    cols: number
  ): boolean[][] {
    const queue: [number, number][] = [startPoint];
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    visited[startPoint[0]][startPoint[1]] = true;

    while (queue.length > 0) {
      const [currentRow, currentCol] = queue.shift()!;
      const neighbors: [number, number][] = [
        [currentRow - 1, currentCol],
        [currentRow + 1, currentCol],
        [currentRow, currentCol - 1],
        [currentRow, currentCol + 1],
      ];

      for (const [neighborRow, neighborCol] of neighbors) {
        if (
          this.isInBounds(gridArray, neighborRow, neighborCol) &&
          this.isTerrain(gridArray, neighborRow, neighborCol) &&
          !visited[neighborRow][neighborCol]
        ) {
          visited[neighborRow][neighborCol] = true;
          queue.push([neighborRow, neighborCol]);
        }
      }
    }
    return visited;
  }

  verifyAllTerrainTiles(
    gridArray: any[][],
    visited: boolean[][],
    rows: number,
    cols: number
  ): boolean {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (this.isTerrain(gridArray, row, col) && !visited[row][col]) {
          this.loggerService.error("Terrain tile at row: " + (row + 1) + ", col: " + (col + 1) + " is not accessible.");
          return false;
        }
      }
    }
    this.loggerService.log("All terrain tiles are accessible.");
    return true;
  }

  areDoorsCorrectlyPlaced(gridArray: any[][]): boolean {
    for (let row = 0; row < gridArray.length; row++) {
      for (let col = 0; col < gridArray[row].length; col++) {
        const cell = gridArray[row][col];
        if (
          cell.images &&
          (cell.images.includes("assets/tiles/Door.png") ||
            cell.images.includes("assets/tiles/DoorOpen.png"))
        ) {
          const isHorizontalCorrect =
            this.isWall(gridArray, row, col - 1) &&
            this.isWall(gridArray, row, col + 1) &&
            this.isTerrain(gridArray, row - 1, col) &&
            this.isTerrain(gridArray, row + 1, col);

          const isVerticalCorrect =
            this.isWall(gridArray, row - 1, col) &&
            this.isWall(gridArray, row + 1, col) &&
            this.isTerrain(gridArray, row, col - 1) &&
            this.isTerrain(gridArray, row, col + 1);

          if (!isHorizontalCorrect && !isVerticalCorrect) {
            console.log(
              `Door at row: ${row}, col: ${col} is not correctly placed.`
            );
            return false;
          }
        }
      }
    }
    return true;
  }
  isWall(gridArray: any[][], row: number, col: number): boolean {
    return (
      this.isInBounds(gridArray, row, col) &&
      gridArray[row][col].images.includes("assets/tiles/Wall.png")
    );
  }

  isTerrain(gridArray: any[][], row: number, col: number): boolean {
    return gridArray[row][col].images.includes("assets/grass.png");
  }

  isInBounds(gridArray: any[][], row: number, col: number): boolean {
    return (
      row >= 0 &&
      row < gridArray.length &&
      col >= 0 &&
      col < gridArray[row].length
    );
  }

  getExpectedStartPoints(gridSize: number): number {
    switch (gridSize) {
      case 10:
        return 2;
      case 15:
        return 4;
      case 20:
        return 6;
      default:
        return 2;
    }
  }
}
