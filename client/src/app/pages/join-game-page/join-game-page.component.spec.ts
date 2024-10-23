import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { JoinGameComponent } from '@app/pages/join-game-page/join-game-page.component';
import { SocketService } from '@app/services/socket/socket.service';

describe('JoinGameComponent', () => {
    let component: JoinGameComponent;
    let fixture: ComponentFixture<JoinGameComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['joinGame']);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

        await TestBed.configureTestingModule({
            declarations: [JoinGameComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(JoinGameComponent);
        component = fixture.componentInstance;
    });

    it('should create the JoinGameComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should display an error if the secretCode is empty when onJoinGame is called', () => {
        component.secretCode = '';
        component.onJoinGame();
        expect(component.errorMessage).toBe('Veuillez entrer un code valide.');
        expect(component.showCharacterCreation).toBeFalse();
    });

    it('should join the game and set showCharacterCreation to true if response is successful', () => {
        const mockResponse = { success: true, message : 'Succès' };
        socketServiceSpy.joinGame.and.returnValue(of(mockResponse));

        component.secretCode = 'VALID_CODE';
        component.onJoinGame();

        expect(socketServiceSpy.joinGame).toHaveBeenCalledWith('VALID_CODE');
        expect(component.showCharacterCreation).toBeTrue();
        expect(component.sessionCode).toBe('VALID_CODE');
        expect(component.isCreatingGame).toBeFalse();
        expect(component.errorMessage).toBe('');
    });

    it('should handle locked room error and display appropriate error message', () => {
        const mockResponse = { success: false, message: 'La salle est verrouillée.' };
        socketServiceSpy.joinGame.and.returnValue(of(mockResponse));

        component.secretCode = 'LOCKED_CODE';
        component.onJoinGame();

        expect(socketServiceSpy.joinGame).toHaveBeenCalledWith('LOCKED_CODE');
        expect(component.showCharacterCreation).toBeFalse();
        expect(component.errorMessage).toBe('');
        expect(snackBarSpy.open).toHaveBeenCalledWith('Impossible de rejoindre la salle, la salle est verrouillée.', 'OK', jasmine.any(Object));
    });

    it('should handle invalid code and display an error message', () => {
        const mockResponse = { success: false, message: 'Code invalide' };
        socketServiceSpy.joinGame.and.returnValue(of(mockResponse));

        component.secretCode = 'INVALID_CODE';
        component.onJoinGame();

        expect(socketServiceSpy.joinGame).toHaveBeenCalledWith('INVALID_CODE');
        expect(component.showCharacterCreation).toBeFalse();
        expect(snackBarSpy.open).toHaveBeenCalledWith('Code invalide. Veuillez réessayer.', 'OK', jasmine.any(Object));
    });

    it('should display an error if there is a server error during joinGame', () => {
        socketServiceSpy.joinGame.and.returnValue(throwError('Erreur serveur'));

        component.secretCode = 'SERVER_ERROR';
        component.onJoinGame();

        expect(socketServiceSpy.joinGame).toHaveBeenCalledWith('SERVER_ERROR');
        expect(snackBarSpy.open).toHaveBeenCalledWith('Erreur lors de la connexion à la partie : Erreur serveur', 'OK', jasmine.any(Object));
    });

    it('should reset showCharacterCreation to false when onBackToGameSelection is called', () => {
        component.showCharacterCreation = true;
        component.onBackToGameSelection();
        expect(component.showCharacterCreation).toBeFalse();
    });
});
