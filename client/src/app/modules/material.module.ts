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
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
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
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input'; // For future form inputs
import { MatSnackBarModule } from '@angular/material/snack-bar'; // For future notifications
import { MatListModule } from '@angular/material/list'; // For listing items, if needed
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';

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
    // MatGridListModule,
    MatIconModule,
    // MatInputModule,
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
];

/**
 * Material module
 * IMPORTANT : IMPORT ONLY USED MODULES !!!!!!
 */
@NgModule({
    declarations: [MainPageComponent, AdminPageComponent],
    imports: [...modules, RouterModule, CommonModule],
    bootstrap: [MainPageComponent],
    exports: [...modules],
    providers: [],
})
export class AppMaterialModule {}
