import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { SaveService } from '@app/services/save/save.service';
import { IconDefinition, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-game-editor-page',
    templateUrl: './game-editor-page.component.html',
    styleUrls: ['./game-editor-page.component.scss'],
})
export class GameEditorPageComponent implements OnInit {
    @ViewChild(ObjectContainerComponent) objectContainer: ObjectContainerComponent;
    faArrowLeft: IconDefinition = faArrowLeft;
    showCreationPopup = false;
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 100;

    isNameExceeded = false;
    isDescriptionExceeded = false;

    gameName: string = '';
    gameDescription: string = '';
    gameId: string = '';

    constructor(
        private gameFacade: GameFacadeService,
        private dragDropService: DragDropService,
        private saveService: SaveService,
        private route: ActivatedRoute,
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
        this.gameId = gameId;
        this.gameFacade.fetchGame(gameId).subscribe((game: Game) => {
            this.gameName = game.name;
            this.gameDescription = game.description;
            this.dragDropService.setInvalid(this.objectContainer.startedPointsIndexInList);
        });
    }

    onNameInput(event: Event): void {
        this.gameName = this.saveService.onNameInput(event, this.gameName);
    }

    onDescriptionInput(event: Event): void {
        this.gameDescription = this.saveService.onDescriptionInput(event, this.gameDescription);
    }

    saveGame(): void {
        this.saveService.onSave(this.gameName, this.gameDescription);
    }

    confirmReset(): void {
        this.showCreationPopup = false;
        this.reset();
    }

    cancelReset(): void {
        this.showCreationPopup = false;
    }

    reset(): void {
        if (this.gameId) {
            this.loadGame(this.gameId);
        } else {
            this.gameName = '';
            this.gameDescription = '';
            this.gameFacade.resetDefaultGrid();
            this.objectContainer.resetDefaultContainer();
        }
    }

    openPopup(): void {
        this.showCreationPopup = true;
    }
}
