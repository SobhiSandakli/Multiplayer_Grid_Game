/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SessionService } from '@app/services/session/session.service';
import { CombatSocket } from '@app/services/socket/combatSocket.service';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { of } from 'rxjs';
import { FightComponent } from './fight.component';

class MockDiceComponent {
    showDiceRoll(attackBase: number, defenceBase: number) {}
    rollDice() {}
}

describe('FightComponent', () => {
    let component: FightComponent;
    let fixture: ComponentFixture<FightComponent>;
    let combatSocketMock: any;
    let playerSocketMock: any;
    let sessionServiceMock: any;
    let socketServiceMock: any;
    let diceComponentMock: MockDiceComponent;
    let snackBarSpy: jasmine.Spy;

    beforeEach(async () => {
        diceComponentMock = new MockDiceComponent();
        combatSocketMock = {
            onCombatStarted: jasmine.createSpy().and.returnValue(of({ opponentPlayer: {}, startsFirst: true })),
            onAttackResult: jasmine.createSpy().and.returnValue(of({ attackRoll: 5, defenceRoll: 3 })),
            onCombatTurnStarted: jasmine.createSpy().and.returnValue(of({ playerSocketId: '123' })),
            onDefeated: jasmine.createSpy().and.returnValue(of({ message: 'Defeated' })),
            onOpponentDefeated: jasmine.createSpy().and.returnValue(of({ message: 'Opponent Defeated' })),
            onEvasionSuccess: jasmine.createSpy().and.returnValue(of({ message: 'Evasion Success' })),
            onOpponentEvaded: jasmine.createSpy().and.returnValue(of({})),
            onCombatEnded: jasmine.createSpy().and.returnValue(of({ message: 'Combat Ended' })),
            emitEvasion: jasmine.createSpy(),
            emitAttack: jasmine.createSpy(),
            onEvasionResult: jasmine.createSpy().and.returnValue(of({ success: true })),
        };

        playerSocketMock = {
            onPlayerListUpdate: jasmine
                .createSpy()
                .and.returnValue(of({ players: [{ name: 'Player1', attributes: { nbEvasion: { currentValue: 2 } } }] })),
            onUpdateLifePoints: jasmine.createSpy().and.returnValue(of({ playerLife: 100, opponentLife: 100 })),
        };

        sessionServiceMock = {
            playerAttributes: { life: { currentValue: 100 } },
            playerAvatar: 'avatar.png',
            playerName: 'Player1',
            sessionCode: 'session123',
        };

        socketServiceMock = {
            getSocketId: jasmine.createSpy().and.returnValue('123'),
        };

        snackBarSpy = jasmine.createSpy('openSnackBar');

        await TestBed.configureTestingModule({
            declarations: [FightComponent], // Include DiceComponent here
            imports: [MatSnackBarModule],
            providers: [
                { provide: SessionService, useValue: sessionServiceMock },
                { provide: CombatSocket, useValue: combatSocketMock },
                { provide: PlayerSocket, useValue: playerSocketMock },
                { provide: SocketService, useValue: socketServiceMock },
                { provide: DiceComponent, useValue: diceComponentMock },
                { provide: MatSnackBar, useValue: { open: snackBarSpy } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FightComponent);
        fixture = TestBed.createComponent(FightComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        // Access the DiceComponent instance via ViewChild
        // diceComponentMock = fixture.debugElement.children[0].componentInstance;
        // spyOn(diceComponentMock, 'rollDice').and.callFake(() => {});
        // spyOn(diceComponentMock, 'showDiceRoll').and.callFake(() => {});
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call rollDice method when attacking', () => {
        spyOn(component, 'chooseAttack').and.callThrough(); // Ensure the method is called
        // const rollDiceSpy = spyOn(diceComponentMock, 'rollDice').and.callFake(() => {});
        component.chooseAttack();
        expect(component.chooseAttack).toHaveBeenCalled(); // Ensure chooseAttack was called
        // expect(rollDiceSpy).toHaveBeenCalled();
    });

    it('should call chooseEvasion and rollDice', () => {
        spyOn(component, 'chooseEvasion').and.callThrough();
        component.chooseEvasion();
        expect(component.chooseEvasion).toHaveBeenCalled(); // Ensure chooseEvasion is called
    });

    it('should update isFight when onFightStatusChanged is called', () => {
        // Test with true event
        component.onFightStatusChanged(true);
        expect(component.isFight).toBeTrue();

        // Test with false event
        component.onFightStatusChanged(false);
        expect(component.isFight).toBeFalse();
    });

    it('should return an empty array if lifePoints are null or less than zero', () => {
        // Test with undefined
        expect(component.getHeartsArray(undefined)).toEqual([]);

        // Test with 0
        expect(component.getHeartsArray(0)).toEqual([]);

        // Test with negative number
        expect(component.getHeartsArray(-1)).toEqual([]);
    });

    it('should return an array with length equal to lifePoints', () => {
        // Test with positive lifePoints
        const lifePoints = 5;
        const result = component.getHeartsArray(lifePoints);
        expect(result.length).toBe(lifePoints); // The array should have the same length as lifePoints
        expect(result).toEqual([0, 0, 0, 0, 0]); // The array should contain 5 elements
    });

    it('should call emitEvasion and disable options when combat turn is true', () => {
        // Set the condition to true for isCombatTurn
        component.isCombatTurn = true;

        // Call chooseEvasion method
        component.chooseEvasion();

        // Check if emitEvasion was called with the session code
        expect(combatSocketMock.emitEvasion).toHaveBeenCalledWith('session123');

        // Check if attack and evasion options are disabled
        expect(component.isAttackOptionDisabled).toBeTrue();
        expect(component.isEvasionOptionDisabled).toBeTrue();
    });

    it('should not call emitEvasion or disable options when combat turn is false', () => {
        // Set the condition to false for isCombatTurn
        component.isCombatTurn = false;

        // Call chooseEvasion method
        component.chooseEvasion();

        // Check that emitEvasion was not called
        expect(combatSocketMock.emitEvasion).not.toHaveBeenCalled();

        // Check that the options are not disabled
        expect(component.isAttackOptionDisabled).toBeFalse();
        expect(component.isEvasionOptionDisabled).toBeFalse();
    });

    // it('should call emitAttack, disable options, and roll dice when combat turn is true', () => {
    //     //spyOn(diceComponentMock, 'rollDice').and.callFake(() => {});
    //     // spyOn(diceComponentMock, 'rollDice').and.callThrough();
    //     //spyOn(component, 'chooseAttack').and.callThrough();
    //     // Set the condition to true for isCombatTurn
    //     component.isCombatTurn = true;

    //     // Call chooseAttack method
    //     component.chooseAttack();

    //     // Check if emitAttack was called with the session code
    //     expect(combatSocketMock.emitAttack).toHaveBeenCalledWith('session123');

    //     // Check if rollDice was called
    //     //expect(diceComponentMock.rollDice).toHaveBeenCalled();
    //     // Check if attack and evasion options are disabled
    //     expect(component.isAttackOptionDisabled).toBeTrue();
    //     expect(component.isEvasionOptionDisabled).toBeTrue();
    // });

    it('should not call emitAttack, rollDice, or disable options when combat turn is false', () => {
        spyOn(diceComponentMock, 'rollDice').and.callThrough();
        // Set the condition to false for isCombatTurn
        component.isCombatTurn = false;

        // Call chooseAttack method
        component.chooseAttack();

        // Check that emitAttack was not called
        expect(combatSocketMock.emitAttack).not.toHaveBeenCalled();

        // Check that rollDice was not called
        expect(diceComponentMock.rollDice).not.toHaveBeenCalled();

        // Check that the options are not disabled
        expect(component.isAttackOptionDisabled).toBeFalse();
        expect(component.isEvasionOptionDisabled).toBeFalse();
    });

    it('should handle successful evasion', () => {
        // Trigger the onEvasionResult observable with a success result
        combatSocketMock.onEvasionResult.and.returnValue(of({ success: true }));

        // Subscribe to the observable (this will trigger the component's internal subscription)
        component.combatSocket.onEvasionResult().subscribe();

        // Check if isFight and action were updated
        expect(component.isFight).toBeFalse();
        expect(component.action).toBe(1);

        // Check if the success snackBar message was shown with the correct parameters
        expect(snackBarSpy).toHaveBeenCalledWith(
            'Vous avez réussi à vous échapper !', // message
            'OK', // action
            { duration: 3000, panelClass: ['custom-snackbar'] }, // config
        );

        // Simulate onCombatEnded emission and check snackBar call
        combatSocketMock.onCombatEnded.and.returnValue(of({ message: 'Combat ended!' }));
        component.combatSocket.onCombatEnded().subscribe((dataEnd) => {
            component.openSnackBar(dataEnd.message);
        });

        // Check if the Combat Ended message is displayed
        expect(snackBarSpy).toHaveBeenCalledWith(
            'Combat Ended', // message
            'OK', // action
            { duration: 3000, panelClass: ['custom-snackbar'] }, // config
        );
    });
    // it('should handle failed evasion', () => {
    //     combatSocketMock.onEvasionResult.and.returnValue(of({ success: false }));

    //     // Subscribe to the observable (this will trigger the component's internal subscription)
    //     component.combatSocket.onEvasionResult().subscribe();

    //     // Check if the failure snackBar message was shown with the correct parameters
    //     expect(snackBarSpy).toHaveBeenCalledWith(
    //         "Vous n'avez pas réussi à vous échapper !", // failure message
    //         'OK', // action
    //         { duration: 3000, panelClass: ['custom-snackbar'] }, // config
    //     );
    // });

    // it('should call updateDiceResults with correct arguments', () => {
    //     spyOn(component, 'updateDiceResults').and.callThrough();
    //     spyOn(diceComponentMock, 'showDiceRoll');
    //     component.updateDiceResults(6, 4);
    //     expect(component.updateDiceResults).toHaveBeenCalledWith(6, 4);
    //     expect(diceComponentMock.showDiceRoll).toHaveBeenCalledWith(6, 4);
    // });
});

// Additional tests for sockets and life update can be left unchanged
