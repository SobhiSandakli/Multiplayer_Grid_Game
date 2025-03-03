import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { Game } from '@app/interfaces/game-model.interface';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { SaveService } from '@app/services/save/save.service';
import { IconDefinition, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from 'src/constants/game-constants';

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
    gameMode: string;
    games: Game[] = [];
    nameMaxLength = NAME_MAX_LENGTH;
    descriptionMaxLength = DESCRIPTION_MAX_LENGTH;
    private subscriptions: Subscription = new Subscription();

    constructor(
        private gameFacade: GameFacadeService,
        private saveService: SaveService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        const queryParamsSub = this.route.queryParams.subscribe((params) => {
            const gameId = params['gameId'];
            if (gameId) {
                this.loadGame(gameId);
            }
            this.gameMode = params['mode'];
        });
        this.subscriptions.add(queryParamsSub);
    }
    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    onNameInput(event: Event): void {
        this.gameName = this.saveService.onNameInput(event, this.gameName);
    }

    onDescriptionInput(event: Event): void {
        this.gameDescription = this.saveService.onDescriptionInput(event, this.gameDescription);
    }

    saveGame(): void {
        this.saveService.onSave(this.gameMode, this.gameName, this.gameDescription);
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
    private loadGame(gameId: string): void {
        this.gameId = gameId;
        const gameFetch = this.gameFacade.fetchGame(gameId).subscribe((game: Game) => {
            this.gameName = game.name;
            this.gameDescription = game.description;
            this.objectContainer.setContainerObjects(game);
        });
        this.subscriptions.add(gameFetch);
    }
}
