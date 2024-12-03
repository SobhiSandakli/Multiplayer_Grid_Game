import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list'; 
import { MatSnackBarModule } from '@angular/material/snack-bar'; 
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@app/components/button-component/button.component';
import { CharacterCreationComponent } from '@app/components/character-creation/character-creation.component';
import { ChatComponent } from '@app/components/chat/chat.component';
import { ConfirmationPopupComponent } from '@app/components/confirmation-popup/confirmation-popup.component';
import { DiceComponent } from '@app/components/dice/dice.component';
import { DuplicateNameComponent } from '@app/components/duplicate-name/duplicate-name.component';
import { FightComponent } from '@app/components/fight/fight.component';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { GameGridComponent } from '@app/components/game-grid/game-grid.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { GameSetupModalComponent } from '@app/components/game-modal/game-modal.component';
import { GridComponent } from '@app/components/grid/grid.component';
import { ImportComponent } from '@app/components/import/import.component';
import { InventoryPopupComponent } from '@app/components/inventory-popup/inventory-popup.component';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { TileComponent } from '@app/components/tile/tile.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { GameEditorPageComponent } from '@app/pages/game-editor-page/game-editor-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { JoinGameComponent } from '@app/pages/join-game-page/join-game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { StatisticsComponent } from '@app/pages/statistics-page/statistics.component';
import { WaitingViewComponent } from '@app/pages/waiting-page/waiting-page.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
const modules = [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatToolbarModule,
    MatTooltipModule,
    MatInputModule,
    MatSnackBarModule,
    MatListModule,
    DragDropModule,
    MatFormFieldModule,
    RouterModule,
    CommonModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    FormsModule,
];

@NgModule({
    declarations: [
        MainPageComponent,
        AdminPageComponent,
        GameSetupModalComponent,
        ButtonComponent,
        CreatePageComponent,
        CharacterCreationComponent,
        ConfirmationPopupComponent,
        GameListComponent,
        GameCardComponent,
        GameEditorPageComponent,
        GridComponent,
        ObjectContainerComponent,
        TileComponent,
        GamePageComponent,
        TimerComponent,
        InventoryPopupComponent,
        ChatComponent,
        JoinGameComponent,
        WaitingViewComponent,
        GamePageComponent,
        GameGridComponent,
        DiceComponent,
        FightComponent,
        ImportComponent,
        DuplicateNameComponent,
        StatisticsComponent,
    ],
    imports: [...modules],
    bootstrap: [MainPageComponent],
    exports: [...modules, ConfirmationPopupComponent],
    providers: [],
})
export class AppMaterialModule {}
