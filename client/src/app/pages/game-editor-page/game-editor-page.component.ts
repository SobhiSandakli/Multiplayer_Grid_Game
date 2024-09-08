import { Component } from '@angular/core';

@Component({
  selector: 'app-game-editor-page',
  standalone: true,
  imports: [],
  templateUrl: './game-editor-page.component.html',
  styleUrl: './game-editor-page.component.scss'
})
export class GameEditorPageComponent {
  game = { name: '', description: '' };

  updateGameName(event: any): void {
    this.game.name = event.target.value;
  }

  updateGameDescription(event: any): void {
    this.game.description = event.target.value;
  }
}
