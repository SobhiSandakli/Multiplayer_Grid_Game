import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { NAME_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from 'src/constants/game-constants';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { SaveService } from '@app/services/save/save.service';
import { IconDefinition, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-editor-page',
    templateUrl: './game-editor-page.component.html',
    styleUrls: ['./game-editor-page.component.scss'],
})
export class GameEditorPageComponent implements OnInit, OnDestroy {
    @ViewChild(ObjectContainerComponent) objectContainer: ObjectContainerComponent;
    faArrowLeft: IconDefinition = faArrowLeft;
    showCreationPopup = false;
    isNameExceeded = false;
    isDescriptionExceeded = false;
    gameName: string;
    gameDescription: string;
    gameId: string;
    nameMaxLength = NAME_MAX_LENGTH;
    descriptionMaxLength = DESCRIPTION_MAX_LENGTH;
    private subscriptions: Subscription = new Subscription();

    constructor(
        private gameFacade: GameFacadeService,
        private dragDropService: DragDropService,
        private saveService: SaveService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        const queryParamsSub = this.route.queryParams.subscribe((params) => {
            const gameId = params['gameId'];
            if (gameId) {
                this.loadGame(gameId);
            }
        });
        this.subscriptions.add(queryParamsSub);
    }
    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadGame(gameId: string): void {
        this.gameId = gameId;
        const gameFetch = this.gameFacade.fetchGame(gameId).subscribe((game: Game) => {
            this.gameName = game.name;
            this.gameDescription = game.description;
            this.dragDropService.setInvalid(this.objectContainer.startedPointsIndexInList);
        });
        this.subscriptions.add(gameFetch);
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
