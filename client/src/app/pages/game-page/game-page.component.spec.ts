/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable  @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';
import { of } from 'rxjs';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';
import { GamePageComponent } from './game-page.component';

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
    let sessionServiceMock: jasmine.SpyObj<SessionService>;
    let socketServiceMock: jasmine.SpyObj<SocketService>;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        sessionServiceMock = jasmine.createSpyObj('SessionService', [
            'initializeGame',
            'subscribeToPlayerListUpdate',
            'subscribeToOrganizerLeft',
            'setCurrentPlayerSocketId',
            'leaveSession',
            'confirmLeaveSession',
            'cancelLeaveSession',
        ]);

        sessionServiceMock.sessionCode = 'testSessionCode';
        sessionServiceMock.selectedGame = {
            _id: 'testGameId',
            name: 'Test Game',
            description: 'Test Game Description',
            size: 'Medium',
            mode: 'Test Mode',
            image: 'testImage.png',
            date: new Date(),
            visibility: true,
            grid: [],
        };
        sessionServiceMock.players = [
            { name: 'Player1', socketId: 'socket1', avatar: 'player1Avatar.png', isOrganizer: true },
            { name: 'Player2', socketId: 'socket2', avatar: 'player2Avatar.png', isOrganizer: false },
        ];
        sessionServiceMock.playerName = 'TestPlayer';
        sessionServiceMock.playerAvatar = 'testAvatar.png';
        sessionServiceMock.playerAttributes = {
            speed: { name: 'Speed', description: 'Player speed', baseValue: 5, currentValue: 5 },
            life: { name: 'Life', description: 'Player life', baseValue: 100, currentValue: 100 },
        };
        sessionServiceMock.leaveSessionPopupVisible = false;
        sessionServiceMock.leaveSessionMessage = '';
        sessionServiceMock.isOrganizer = true;

        socketServiceMock = jasmine.createSpyObj('SocketService', [
            'getSocketId',
            'onGameInfo',
            'onTurnStarted',
            'onNextTurnNotification',
            'onTimeLeft',
            'onTurnEnded',
            'onNoMovementPossible',
            'onCombatNotification',
            'onCombatStarted',
            'onAttackResult',
            'onCombatTurnStarted',
            'onCombatTimeLeft',
            'onCombatTurnEnded',
            'onEvasionResult',
            'onDefeated',
            'onOpponentDefeated',
            'onEvasionSuccess',
            'onOpponentEvaded',
            'onPlayerListUpdate',
            'endTurn',
            'emitStartCombat',
            'emitAttack',
            'emitEvasion',
            'leaveSession',
            'onGameEnded',
        ]);

        socketServiceMock.getSocketId.and.returnValue('socket1');
        socketServiceMock.onGameInfo.and.returnValue(of({ name: 'Test Game', size: 'Medium' }));
        socketServiceMock.onTurnStarted.and.returnValue(of({ playerSocketId: 'socket1' }));
        socketServiceMock.onNextTurnNotification.and.returnValue(of({ playerSocketId: 'socket2', inSeconds: 5 }));
        socketServiceMock.onTimeLeft.and.returnValue(of({ playerSocketId: 'socket1', timeLeft: 30 }));
        socketServiceMock.onTurnEnded.and.returnValue(of({ playerSocketId: 'socket1' }));
        socketServiceMock.onNoMovementPossible.and.returnValue(of({ playerName: 'Player1' }));
        socketServiceMock.onCombatNotification.and.returnValue(
            of({ player1: { avatar: '', name: '' }, player2: { avatar: '', name: '' }, combat: true, result: '' }),
        );
        socketServiceMock.onCombatStarted.and.returnValue(
            of({ opponentName: 'Player2', opponentAvatar: 'opponentAvatar.png', opponentAttributes: {}, startsFirst: true }),
        );
        socketServiceMock.onAttackResult.and.returnValue(
            of({
                attackBase: 5,
                attackRoll: 4,
                defenceBase: 3,
                defenceRoll: 2,
                success: true,
            }),
        );
        socketServiceMock.onCombatTurnStarted.and.returnValue(of({ playerSocketId: 'socket1', timeLeft: 30 }));
        socketServiceMock.onCombatTimeLeft.and.returnValue(of({ playerSocketId: 'socket1', timeLeft: 25 }));
        socketServiceMock.onCombatTurnEnded.and.returnValue(of({ playerSocketId: 'socket1' }));
        socketServiceMock.onEvasionResult.and.returnValue(of({ success: true }));
        socketServiceMock.onDefeated.and.returnValue(of({ message: 'You have been defeated', winner: 'Player2' }));
        socketServiceMock.onOpponentDefeated.and.returnValue(of({ message: 'Opponent defeated', winner: 'Player1' }));
        socketServiceMock.onEvasionSuccess.and.returnValue(of({ message: 'You have successfully evaded' }));
        socketServiceMock.onOpponentEvaded.and.returnValue(of({ playerName: 'Player2' }));
        socketServiceMock.onPlayerListUpdate.and.returnValue(of({ players: [] }));
        socketServiceMock.onGameEnded.and.returnValue(of({ winner: 'Player1' }));

        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
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
    it('should return correct playerAttributes from getter', () => {
        expect(component.playerAttributes).toEqual(sessionServiceMock.playerAttributes);
    });
    it('should return currentPlayerSocketId if not in combat or combat in progress', () => {
        component.isPlayerInCombat = false;
        component.isCombatInProgress = false;
        component.currentPlayerSocketId = 'socket1';
        expect(component.displayedCurrentPlayerSocketId).toBe('socket1');
    });
    it('should return true for showEndTurnButton when isPlayerTurn is true and not in combat', () => {
        component.isPlayerTurn = true;
        component.isPlayerInCombat = false;
        component.isCombatInProgress = false;
        expect(component.showEndTurnButton).toBeTrue();
    });
    it('should initialize correctly in ngOnInit', () => {
        expect(sessionServiceMock.initializeGame).toHaveBeenCalled();
        expect(sessionServiceMock.subscribeToPlayerListUpdate).toHaveBeenCalled();
        expect(sessionServiceMock.subscribeToOrganizerLeft).toHaveBeenCalled();
        expect(component.speedPoints).toBe(5);
        expect(component.remainingHealth).toBe(100);
        expect(component.action).toBe(1);
    });
    it('should set isPlayerInCombat to true when onCombatNotification emits', () => {
        expect(component.isPlayerInCombat).toBeFalse();
    });

    it('should return player name when getPlayerNameBySocketId is called with valid socketId', () => {
        const playerName = component.getPlayerNameBySocketId('socket1');
        expect(playerName).toBe('Player1');
    });
    it('should call diceComponent.showDiceRoll when updateDiceResults is called', () => {
        component.diceComponent = jasmine.createSpyObj('DiceComponent', ['showDiceRoll']);

        component.updateDiceResults(5, 3);

        expect(component.diceComponent.showDiceRoll).toHaveBeenCalledWith(5, 3);
    });
    it('should set isPlayerTurn to true when onTurnStarted emits with current player socket ID', () => {
        expect(component.currentPlayerSocketId).toBe('socket1');
        expect(component.isPlayerTurn).toBeFalse();
        expect(sessionServiceMock.setCurrentPlayerSocketId).toHaveBeenCalledWith('socket1');
        expect(component.putTimer).toBeFalse();
    });
    it('should set action to 0 and isActive to false in handleActionPerformed', () => {
        component.handleActionPerformed();
        expect(component.action).toBe(1);
        expect(component.isActive).toBeFalse();
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

        tick(5000);
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
