import { NgModule } from '@angular/core';
// import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
// import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
// import { MatCheckboxModule } from '@angular/material/checkbox';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
// import { MatListModule } from '@angular/material/list';
// import { MatMenuModule } from '@angular/material/menu';
// import { MatPaginatorModule } from '@angular/material/paginator';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
// import { MatSelectModule } from '@angular/material/select';
// import { MatSidenavModule } from '@angular/material/sidenav';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// import { MatSliderModule } from '@angular/material/slider';
// import { MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatSortModule } from '@angular/material/sort';
// import { MatStepperModule } from '@angular/material/stepper';
// import { MatTableModule } from '@angular/material/table';
// import { MatTabsModule } from '@angular/material/tabs';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list'; // For listing items, if needed
import { MatSnackBarModule } from '@angular/material/snack-bar'; // For future notifications
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@app/components/button-component/button.component';
// import { SnackbarComponent } from '@app/components/snackbar/snackbar.component';
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
    // MatAutocompleteModule,
    MatButtonModule,
    // MatButtonToggleModule,
    MatCardModule,
    // MatCheckboxModule,
    // MatCheckboxModule,
    // MatChipsModule,
    // MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    // MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    // MatListModule,
    // MatMenuModule,
    // MatPaginatorModule,
    // MatProgressBarModule,
    // MatProgressSpinnerModule,
    MatRadioModule,
    // MatSelectModule,
    // MatSidenavModule,
    // MatSliderModule,
    // MatSlideToggleModule,
    // MatSnackBarModule,
    // MatSortModule,
    // MatStepperModule,
    // MatTableModule,
    // MatTabsModule,
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

/**
 * Material module
 * IMPORTANT : IMPORT ONLY USED MODULES !!!!!!
 */
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
        // SnackbarComponent,
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
