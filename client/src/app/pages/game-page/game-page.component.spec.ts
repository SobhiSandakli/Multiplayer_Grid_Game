import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GamePageComponent } from './game-page.component';
import { SocketService } from '@app/services/socket/socket.service';
import { SessionService } from '@app/services/session/session.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { Component, Input } from '@angular/core';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';
import { NO_ERRORS_SCHEMA } from '@angular/core';

@Component({
    selector: 'app-dice',
    template: '',
})
class MockDiceComponent {
    @Input() attackBase: number | null = null;
    @Input() defenceBase: number | null = null;
    @Input() success: boolean | null = null;

    rollDice() {}
    showDiceRoll(attackRoll: number, defenceRoll: number) {}
}

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let sessionServiceMock: any;
    let socketServiceMock: any;
    let snackBarMock: any;

    beforeEach(() => {
        sessionServiceMock = {
            sessionCode: 'testSessionCode',
            selectedGame: {
                name: 'Test Game',
                description: 'Test Game Description',
                size: 'Medium',
            },
            players: [
                { name: 'Player1', socketId: 'socket1' },
                { name: 'Player2', socketId: 'socket2' },
            ],
            playerName: 'TestPlayer',
            playerAvatar: 'testAvatar.png',
            playerAttributes: {
                speed: { currentValue: 5 },
                life: { currentValue: 100 },
            },
            leaveSessionPopupVisible: false,
            leaveSessionMessage: '',
            isOrganizer: true,
            initializeGame: jasmine.createSpy('initializeGame'),
            subscribeToPlayerListUpdate: jasmine.createSpy('subscribeToPlayerListUpdate'),
            subscribeToOrganizerLeft: jasmine.createSpy('subscribeToOrganizerLeft'),
            setCurrentPlayerSocketId: jasmine.createSpy('setCurrentPlayerSocketId'),
            leaveSession: jasmine.createSpy('leaveSession'),
            confirmLeaveSession: jasmine.createSpy('confirmLeaveSession'),
            cancelLeaveSession: jasmine.createSpy('cancelLeaveSession'),
        };

        socketServiceMock = {
            getSocketId: jasmine.createSpy('getSocketId').and.returnValue('socket1'),
            onGameInfo: jasmine.createSpy('onGameInfo').and.returnValue(of({ name: 'Test Game', size: 'Medium' })),
            onTurnStarted: jasmine.createSpy('onTurnStarted').and.returnValue(of({ playerSocketId: 'socket1' })),
            onNextTurnNotification: jasmine.createSpy('onNextTurnNotification').and.returnValue(of({ playerSocketId: 'socket2', inSeconds: 5 })),
            onTimeLeft: jasmine.createSpy('onTimeLeft').and.returnValue(of({ playerSocketId: 'socket1', timeLeft: 30 })),
            onTurnEnded: jasmine.createSpy('onTurnEnded').and.returnValue(of({})),
            onNoMovementPossible: jasmine.createSpy('onNoMovementPossible').and.returnValue(of({ playerName: 'Player1' })),
            onCombatNotification: jasmine.createSpy('onCombatNotification').and.returnValue(of({ combat: true })),
            onCombatStarted: jasmine
                .createSpy('onCombatStarted')
                .and.returnValue(of({ opponentName: 'Player2', opponentAvatar: 'opponentAvatar.png' })),
            onAttackResult: jasmine.createSpy('onAttackResult').and.returnValue(
                of({
                    attackBase: 5,
                    attackRoll: 4,
                    defenceBase: 3,
                    defenceRoll: 2,
                    success: true,
                }),
            ),
            onCombatTurnStarted: jasmine.createSpy('onCombatTurnStarted').and.returnValue(of({ playerSocketId: 'socket1', timeLeft: 30 })),
            onCombatTimeLeft: jasmine.createSpy('onCombatTimeLeft').and.returnValue(of({ playerSocketId: 'socket1', timeLeft: 25 })),
            onCombatTurnEnded: jasmine.createSpy('onCombatTurnEnded').and.returnValue(of({ playerSocketId: 'socket1' })),
            onEvasionResult: jasmine.createSpy('onEvasionResult').and.returnValue(of({ success: true })),
            onDefeated: jasmine.createSpy('onDefeated').and.returnValue(of({ message: 'You have been defeated' })),
            onOpponentDefeated: jasmine.createSpy('onOpponentDefeated').and.returnValue(of({ message: 'Opponent defeated' })),
            onEvasionSuccess: jasmine.createSpy('onEvasionSuccess').and.returnValue(of({ message: 'You have successfully evaded' })),
            onOpponentEvaded: jasmine.createSpy('onOpponentEvaded').and.returnValue(of({ playerName: 'Player2' })),
            endTurn: jasmine.createSpy('endTurn'),
            emitStartCombat: jasmine.createSpy('emitStartCombat'),
            emitAttack: jasmine.createSpy('emitAttack'),
            emitEvasion: jasmine.createSpy('emitEvasion'),
            leaveSession: jasmine.createSpy('leaveSession'),
        };

        snackBarMock = {
            open: jasmine.createSpy('open'),
        };
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GamePageComponent, MockDiceComponent],
            providers: [
                { provide: SessionService, useValue: sessionServiceMock },
                { provide: SocketService, useValue: socketServiceMock },
                { provide: MatSnackBar, useValue: snackBarMock },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
    it('should initialize correctly in ngOnInit', () => {
        expect(sessionServiceMock.initializeGame).toHaveBeenCalled();
        expect(sessionServiceMock.subscribeToPlayerListUpdate).toHaveBeenCalled();
        expect(sessionServiceMock.subscribeToOrganizerLeft).toHaveBeenCalled();
        expect(component.speedPoints).toBe(5);
        expect(component.remainingHealth).toBe(100);
        expect(component.action).toBe(1);
    });
    it('should set isPlayerTurn to true when onTurnStarted emits with current player socket ID', () => {
        expect(component.currentPlayerSocketId).toBe('socket1');
        expect(component.isPlayerTurn).toBeFalse();
        expect(sessionServiceMock.setCurrentPlayerSocketId).toHaveBeenCalledWith('socket1');
        expect(component.putTimer).toBeFalse();
    });
    it('should open snackbar when onNextTurnNotification emits', () => {
        const expectedMessage = 'Le tour de Player2 commence dans 5 secondes.';
        expect(snackBarMock.open).toHaveBeenCalledWith(expectedMessage, 'OK', {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    });
    it('should update timeLeft when onTimeLeft emits and player is not in combat', () => {
        expect(component.timeLeft).toBe(25);
    });
    it('should reset isPlayerTurn and timeLeft when onTurnEnded emits', () => {
        expect(component.isPlayerTurn).toBeFalse();
        expect(component.timeLeft).toBe(25);
        expect(component.putTimer).toBeFalse();
    });
    it('should handle combat start when onCombatStarted emits', fakeAsync(() => {
        expect(component.isPlayerInCombat).toBeFalse();
        expect(component.combatOpponentInfo).toEqual({ name: 'Player2', avatar: 'opponentAvatar.png' });

        tick(5000); // Simulate timeout
        fixture.detectChanges();
        expect(component.combatOpponentInfo).toEqual({ name: 'Player2', avatar: 'opponentAvatar.png' });
    }));
    it('should emit evasion when chooseEvasion is called and isCombatTurn is true', () => {
        component.isCombatTurn = true;
        component.chooseEvasion();

        expect(socketServiceMock.emitEvasion).toHaveBeenCalledWith('testSessionCode');
        expect(component.isAttackOptionDisabled).toBeTrue();
        expect(component.isEvasionOptionDisabled).toBeTrue();
    });
    it('should emit endTurn when endTurn is called and isPlayerTurn is true', () => {
        component.isPlayerTurn = true;
        component.endTurn();

        expect(socketServiceMock.endTurn).toHaveBeenCalledWith('testSessionCode');
    });
    it('should toggle isExpanded when toggleExpand is called', () => {
        component.isExpanded = false;
        component.toggleExpand();
        expect(component.isExpanded).toBeTrue();

        component.toggleExpand();
        expect(component.isExpanded).toBeFalse();
    });
    it('should toggle isActive when toggleActive is called', () => {
        component.isActive = false;
        component.toggleActive();
        expect(component.isActive).toBeTrue();

        component.toggleActive();
        expect(component.isActive).toBeFalse();
    });
    it('should emit start combat when startCombat is called', () => {
        component.opposentPlayer = 'opponentAvatar.png';
        component.startCombat();

        expect(socketServiceMock.emitStartCombat).toHaveBeenCalledWith('testSessionCode', 'testAvatar.png', 'opponentAvatar.png');
    });
    it('should handle data from child component', () => {
        spyOn(component, 'startCombat');
        component.handleDataFromChild('opponentAvatar.png');

        expect(component.isActive).toBeFalse();
        expect(component.opposentPlayer).toBe('opponentAvatar.png');
        expect(component.startCombat).toHaveBeenCalled();
    });
    it('should unsubscribe from subscriptions and leave session if organizer on destroy', () => {
        spyOn(component['subscriptions'], 'unsubscribe');
        component.sessionService.isOrganizer = true;

        component.ngOnDestroy();

        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
        expect(socketServiceMock.leaveSession).toHaveBeenCalledWith('testSessionCode');
    });
    it('should return correct sessionCode from getter', () => {
        expect(component.sessionCode).toBe('testSessionCode');
    });

    it('should return correct gameName from getter', () => {
        expect(component.gameName).toBe('Test Game');
    });

    it('should return correct playerName from getter', () => {
        expect(component.playerName).toBe('TestPlayer');
    });
    it('should update isFight when onFightStatusChanged is called', () => {
        component.isFight = false;
        component.onFightStatusChanged(true);

        expect(component.isFight).toBeTrue();
    });
    it('should open snackbar with correct message when onNoMovementPossible emits', () => {
        const expectedMessage = 'Aucun mouvement possible pour Player1 - Le tour de se termine dans 3 secondes.';
        expect(snackBarMock.open).toHaveBeenCalledWith(expectedMessage, 'OK', {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    });
});
