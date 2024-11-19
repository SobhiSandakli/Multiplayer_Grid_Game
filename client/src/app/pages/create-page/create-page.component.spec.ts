/* eslint-disable @typescript-eslint/no-magic-numbers*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Game } from '@app/interfaces/game-model.interface';
import { SessionCreatedData } from '@app/interfaces/socket.interface';
import { GameService } from '@app/services/game/game.service';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { of, throwError } from 'rxjs';
import { CreatePageComponent } from './create-page.component';

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let sessionSocketSpy: jasmine.SpyObj<SessionSocket>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameValidateSpy: jasmine.SpyObj<GameValidateService>;

    const mockGame: Game = {
        _id: 'game123',
        name: 'Test Game',
        description: 'This is a test game description',
        size: 'medium',
        mode: 'standard',
        image: 'test-image.png',
        date: new Date(),
        visibility: true,
        grid: [[{ images: ['grass.png'], isOccuped: false }]], // Exemple simplifié pour la grille
    };

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGame']);
        sessionSocketSpy = jasmine.createSpyObj('SessionSocket', ['createNewSession']);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameValidateSpy = jasmine.createSpyObj('GameValidateService', ['gridMaxPlayers']);

        TestBed.configureTestingModule({
            declarations: [CreatePageComponent],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: SessionSocket, useValue: sessionSocketSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameValidateService, useValue: gameValidateSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should enable validation if a game is selected', () => {
        component.selectedGame = mockGame;
        expect(component.enableValidation()).toBeTrue();
    });

    it('should disable validation if no game is selected', () => {
        component.selectedGame = null;
        expect(component.enableValidation()).toBeFalse();
    });

    it('should set selectedGame on game selection', () => {
        component.onGameSelected(mockGame);
        expect(component.selectedGame).toEqual(mockGame);
    });

    it('should reset to game selection on back', () => {
        component.selectedGame = mockGame;
        component.errorMessage = 'Error';
        component.showCharacterCreation = true;

        component.onBackToGameSelection();

        expect(component.selectedGame).toBeNull();
        expect(component.errorMessage).toBe('');
        expect(component.showCharacterCreation).toBeFalse();
    });

    it('should navigate to home on goHome', () => {
        component.goHome();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    describe('validateGameBeforeCreation', () => {
        it('should handle game creation when game is valid', () => {
            gameServiceSpy.fetchGame.and.returnValue(of(mockGame));
            gameValidateSpy.gridMaxPlayers.and.returnValue(4);
            sessionSocketSpy.createNewSession.and.returnValue(of({ sessionCode: '1234' } as SessionCreatedData));

            component.selectedGame = mockGame;
            component.validateGameBeforeCreation();

            expect(sessionSocketSpy.createNewSession).toHaveBeenCalledWith(4, mockGame._id);
            expect(component.sessionCode).toBe('1234');
            expect(component.showCharacterCreation).toBeTrue();
        });

        it('should handle invalid game', () => {
            const invalidGame = { ...mockGame, visibility: false };
            gameServiceSpy.fetchGame.and.returnValue(of(invalidGame));

            component.selectedGame = invalidGame;
            component.validateGameBeforeCreation();

            expect(component.errorMessage).toBe('Le jeu sélectionné a été supprimé ou caché. Veuillez en choisir un autre.');
            expect(component.selectedGame).toBeNull();
            expect(snackBarSpy.open).toHaveBeenCalledWith('Le jeu sélectionné a été supprimé ou caché. Veuillez en choisir un autre.', 'OK', {
                duration: 5000,
                panelClass: ['custom-snackbar'],
            });
        });

        it('should handle error during game fetching', () => {
            gameServiceSpy.fetchGame.and.returnValue(throwError('fetch error'));

            component.selectedGame = mockGame;
            component.validateGameBeforeCreation();

            expect(component.errorMessage).toBe('Une erreur est survenue lors de la vérification du jeu.');
            expect(component.selectedGame).toBeNull();
        });

        it('should handle session creation error', () => {
            gameServiceSpy.fetchGame.and.returnValue(of(mockGame));
            gameValidateSpy.gridMaxPlayers.and.returnValue(4);
            sessionSocketSpy.createNewSession.and.returnValue(throwError('creation error'));

            component.selectedGame = mockGame;
            component.validateGameBeforeCreation();

            expect(component.errorMessage).toBe('Une erreur est survenue lors de la création de la session.creation error');
        });
    });
});
