import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DiceComponent } from '@app/components/dice/dice.component';
import { CombatSocket } from '@app/services/combat-socket/combatSocket.service';
import { PlayerSocket } from '@app/services/player-socket/playerSocket.service';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';
import { of } from 'rxjs';
import { FightComponent } from './fight.component';

describe('FightComponent', () => {
    let component: FightComponent;
    let fixture: ComponentFixture<FightComponent>;
    let mockSnackBar: any;
    let mockCombatSocket: any;
    let mockPlayerSocket: any;
    let mockSessionService: any;
    let mockSocketService: any;
    let mockDiceComponent: any;

    beforeEach(async () => {
        mockSnackBar = { open: jasmine.createSpy('open') };
        mockCombatSocket = {
            emitAttack: jasmine.createSpy('emitAttack'),
            emitEvasion: jasmine.createSpy('emitEvasion'),
            onCombatStarted: jasmine.createSpy('onCombatStarted').and.returnValue(of({ opponentPlayer: {}, startsFirst: true })),
            onAttackResult: jasmine.createSpy('onAttackResult').and.returnValue(of({ attackRoll: 5, defenceRoll: 3 })),
            onEvasionResult: jasmine.createSpy('onEvasionResult').and.returnValue(of({ success: false })),
            onCombatTurnStarted: jasmine.createSpy('onCombatTurnStarted').and.returnValue(of({ playerSocketId: 'socket123' })),
            onDefeated: jasmine.createSpy('onDefeated').and.returnValue(of({ message: 'You lost' })),
            onOpponentDefeated: jasmine.createSpy('onOpponentDefeated').and.returnValue(of({ message: 'You won' })),
            onOpponentEvaded: jasmine.createSpy('onOpponentEvaded').and.returnValue(of({})),
            onCombatEnded: jasmine.createSpy('onCombatEnded').and.returnValue(of({ message: 'Le combat est fini.' })),
            onEvasionSuccess: jasmine.createSpy('onEvasionSuccess').and.returnValue(of({})),
        };
        mockPlayerSocket = {
            onUpdateLifePoints: jasmine.createSpy('onUpdateLifePoints').and.returnValue(of({ playerLife: 20, opponentLife: 15 })),
            onPlayerListUpdate: jasmine.createSpy('onPlayerListUpdate').and.returnValue(of({ players: [] })),
        };
        mockSessionService = {
            sessionCode: 'test-session-code',
            playerAvatar: 'avatar.png',
            playerName: 'Test Player',
            playerAttributes: { life: { currentValue: 10 } },
        };
        mockSocketService = {
            getSocketId: jasmine.createSpy('getSocketId').and.returnValue('socket123'),
        };
        mockDiceComponent = {
            rollDice: jasmine.createSpy('rollDice'),
            showDiceRoll: jasmine.createSpy('showDiceRoll'),
        };

        await TestBed.configureTestingModule({
            declarations: [FightComponent],
            providers: [
                { provide: MatSnackBar, useValue: mockSnackBar },
                { provide: CombatSocket, useValue: mockCombatSocket },
                { provide: PlayerSocket, useValue: mockPlayerSocket },
                { provide: SessionService, useValue: mockSessionService },
                { provide: SocketService, useValue: mockSocketService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FightComponent);
        component = fixture.componentInstance;
        component.diceComponent = mockDiceComponent as DiceComponent;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should update playerAttributes.life.currentValue if defined', () => {
        component.ngOnInit();
        expect(mockSessionService.playerAttributes.life.currentValue).toBe(20);
    });

    it('should handle undefined playerAttributes.life without errors', () => {
        mockSessionService.playerAttributes = null;
        expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle undefined combatOpponentInfo without errors', () => {
        (component as any).combatOpponentInfo = null;
        expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should subscribe to all CombatSocket events on init', () => {
        component.ngOnInit();

        expect(mockCombatSocket.onCombatStarted).toHaveBeenCalled();
        expect(mockCombatSocket.onAttackResult).toHaveBeenCalled();
        expect(mockCombatSocket.onEvasionResult).toHaveBeenCalled();
        expect(mockCombatSocket.onCombatTurnStarted).toHaveBeenCalled();
    });

    it('should disable options and emit attack if isCombatTurn is true', () => {
        component.isCombatTurn = true;
        component.chooseAttack();

        expect(mockCombatSocket.emitAttack).toHaveBeenCalledWith('test-session-code');
        expect(component.isAttackOptionDisabled).toBeTrue();
        expect(component.isEvasionOptionDisabled).toBeTrue();
        expect(mockDiceComponent.rollDice).toHaveBeenCalled();
    });

    it('should do nothing if isCombatTurn is false for chooseAttack', () => {
        component.isCombatTurn = false;
        component.chooseAttack();
        expect(mockCombatSocket.emitAttack).not.toHaveBeenCalled();
    });

    it('should disable options and emit evasion if isCombatTurn is true', () => {
        component.isCombatTurn = true;
        component.chooseEvasion();

        expect(mockCombatSocket.emitEvasion).toHaveBeenCalledWith('test-session-code');
        expect(component.isAttackOptionDisabled).toBeTrue();
        expect(component.isEvasionOptionDisabled).toBeTrue();
    });

    it('should show dice roll results', () => {
        component.updateDiceResults(5, 3);

        expect(mockDiceComponent.showDiceRoll).toHaveBeenCalledWith(5, 3);
    });

    it('should open a SnackBar with the correct message', () => {
        component.openSnackBar('Test message');

        expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'OK', jasmine.any(Object));
    });

    it('should unsubscribe from all subscriptions on destroy', () => {
        spyOn(component['subscriptions'], 'unsubscribe');
        component.ngOnDestroy();

        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });

    it('should return an array of hearts based on life points', () => {
        const hearts = component.getHeartsArray(3);
        expect(hearts.length).toBe(3);
    });

    it('should return an empty array if life points are undefined or zero', () => {
        expect(component.getHeartsArray(undefined)).toEqual([]);
        expect(component.getHeartsArray(0)).toEqual([]);
    });

    it('should return playerAvatar from sessionService', () => {
        expect(component.playerAvatar).toBe('avatar.png');
    });

    it('should return playerName from sessionService', () => {
        expect(component.playerName).toBe('Test Player');
    });

    it('should return an empty string if playerName is null or undefined', () => {
        mockSessionService.playerName = null;
        expect(component.playerName).toBe('');

        mockSessionService.playerName = undefined;
        expect(component.playerName).toBe('');
    });

    it("should open the SnackBar with failure message if evasion isn't successful", () => {
        component.ngOnInit();
        const calls = mockSnackBar.open.calls.allArgs();
        const expectedCall = ["Vous n'avez pas réussi à vous échapper.", 'OK', { duration: 3000, panelClass: ['custom-snackbar'] }];
        expect(calls).toContain(expectedCall);
    });

    it('should handle successful evasion and display the correct messages', () => {
        mockCombatSocket.onEvasionResult.and.returnValue(of({ success: true }));
        component.ngOnInit();
        const calls = mockSnackBar.open.calls.allArgs();
        expect(component.isFight).toBeFalse();
        expect(component.action).toBe(1);
        expect(calls).toContain(['Vous avez réussi à vous échapper !', 'OK', { duration: 3000, panelClass: ['custom-snackbar'] }]);
        expect(calls).toContain(['Le combat est fini.', 'OK', { duration: 3000, panelClass: ['custom-snackbar'] }]);
    });

    // it('should handle onUpdateLifePoints event', () => {
    //     component.ngOnInit();
    //     if (component.combatOpponentInfo?.attributes?.life) {
    //         component.combatOpponentInfo.attributes.life.currentValue = 10;
    //     }
    //     expect(mockSessionService.playerAttributes.life.currentValue).toBe(20);
    //     expect(component.combatOpponentInfo.attributes?.life.currentValue).toBe(10);
    // });
});
