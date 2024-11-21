import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { GameEditorPageComponent } from '@app/pages/game-editor-page/game-editor-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { JoinGameComponent } from '@app/pages/join-game-page/join-game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { StatisticsComponent } from '@app/pages/statistics-page/statistics.component';
import { WaitingViewComponent } from '@app/pages/waiting-page/waiting-page.component';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    {path: 'statistics', component: StatisticsComponent},
    { path: 'material', component: MaterialPageComponent },
    { path: 'admin-page', component: AdminPageComponent },
    { path: 'create-page', component: CreatePageComponent },
    { path: 'waiting', component: WaitingViewComponent },
    { path: 'join-game', component: JoinGameComponent },
    { path: 'edit-page', component: GameEditorPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: '**', redirectTo: '/home' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations()],
});
