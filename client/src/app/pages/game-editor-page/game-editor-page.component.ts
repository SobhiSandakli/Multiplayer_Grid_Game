import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GridComponent } from '@app/components/grid/grid.component';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { TileComponent } from '@app/components/tile/tile.component';
import { Game } from '@app/game.model';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-game-editor-page',
    standalone: true,
    imports: [CommonModule, GridComponent, ObjectContainerComponent, TileComponent, FormsModule],
    templateUrl: './game-editor-page.component.html',
    styleUrl: './game-editor-page.component.scss',
})
export class GameEditorPageComponent implements OnInit {
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 200;

    isNameExceeded = false;
    isDescriptionExceeded = false;

    gameName: string = '';
    gameDescription: string = '';

    constructor(
        private route: ActivatedRoute,
        private gameService: GameService,
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const gameId = params['gameId'];
            if (gameId) {
                this.loadGame(gameId);
            }
        });
    }
    loadGame(gameId: string): void {
        this.gameService.fetchGame(gameId).subscribe((game: Game) => {
            this.gameName = game.name;
            this.gameDescription = game.description;
        });
    }
    onNameInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isNameExceeded = textarea.value.length > this.maxLengthName;
        this.gameName = textarea.value;
    }

    onDescriptionInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isDescriptionExceeded = textarea.value.length > this.maxLengthDescription;
        this.gameDescription = textarea.value;
    }
}
