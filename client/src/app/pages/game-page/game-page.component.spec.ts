/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed, } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GamePageComponent } from './game-page.component';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SessionService } from '@app/services/session/session.service';
import { CombatSocket } from '@app/services/socket/combatSocket.service';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { TurnSocket } from '@app/services/socket/turnSocket.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let sessionServiceMock: jasmine.SpyObj<SessionService>;
    let combatSocketMock: jasmine.SpyObj<CombatSocket>;
    let turnSocketMock: jasmine.SpyObj<TurnSocket>;
    let sessionSocketMock: jasmine.SpyObj<SessionSocket>;
    let subscriptionServiceMock: jasmine.SpyObj<SubscriptionService>;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        sessionServiceMock = jasmine.createSpyObj('SessionService', [
            'initializeGame',
            'subscribeToPlayerListUpdate',
            'subscribeToOrganizerLeft',
            'leaveSession',
            'confirmLeaveSession',
            'cancelLeaveSession',
        ]);

        combatSocketMock = jasmine.createSpyObj('CombatSocket', ['emitStartCombat', 'emitAttack', 'emitEvasion']);
        turnSocketMock = jasmine.createSpyObj('TurnSocket', ['onTurnEnded']);
        sessionSocketMock = jasmine.createSpyObj('SessionSocket', ['leaveSession']);
        subscriptionServiceMock = jasmine.createSpyObj('SubscriptionService', ['initSubscriptions', 'unsubscribeAll']);

        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

        TestBed.configureTestingModule({
            declarations: [GamePageComponent, DiceComponent],
            providers: [
                { provide: SessionService, useValue: sessionServiceMock },
                { provide: CombatSocket, useValue: combatSocketMock },
                { provide: TurnSocket, useValue: turnSocketMock },
                { provide: SessionSocket, useValue: sessionSocketMock },
                { provide: SubscriptionService, useValue: subscriptionServiceMock },
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

    it('should initialize correctly on ngOnInit', () => {
        component.ngOnInit();
        expect(sessionServiceMock.initializeGame).toHaveBeenCalled();
        expect(sessionServiceMock.subscribeToPlayerListUpdate).toHaveBeenCalled();
        expect(sessionServiceMock.subscribeToOrganizerLeft).toHaveBeenCalled();
        expect(subscriptionServiceMock.initSubscriptions).toHaveBeenCalled();
        expect(component.speedPoints).toEqual(sessionServiceMock.playerAttributes?.speed.currentValue ?? 0);
        expect(component.remainingHealth).toEqual(sessionServiceMock.playerAttributes?.life.currentValue ?? 0);
    });

    it('should unsubscribe from subscriptions and leave session if organizer on destroy', () => {
        spyOn(component['subscriptions'], 'unsubscribe');
        component.sessionService.isOrganizer = true;

        component.ngOnDestroy();

        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
        expect(subscriptionServiceMock.unsubscribeAll).toHaveBeenCalled();
        expect(sessionSocketMock.leaveSession).toHaveBeenCalledWith('testSessionCode');
    });

    it('should set action to 0 and isActive to false in handleActionPerformed', () => {
        component.handleActionPerformed();
        expect(subscriptionServiceMock.action).toBe(0);
        expect(component.isActive).toBeFalse();
    });

    it('should return correct sessionCode from getter', () => {
        expect(component.sessionCode).toBe(sessionServiceMock.sessionCode);
    });

    it('should return correct gameName from getter', () => {
        expect(component.gameName).toBe(sessionServiceMock.selectedGame?.name ?? '');
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

        expect(combatSocketMock.emitStartCombat).toHaveBeenCalledWith(sessionServiceMock.sessionCode, component.playerAvatar, 'opponentAvatar.png');
    });

    it('should handle data from child component', () => {
        spyOn(component, 'startCombat');
        component.handleDataFromChild('opponentAvatar.png');

        expect(component.isActive).toBeFalse();
        expect(component.opposentPlayer).toBe('opponentAvatar.png');
        expect(component.startCombat).toHaveBeenCalled();
    });

    it('should emit attack when chooseAttack is called and isCombatTurn is true', () => {
        subscriptionServiceMock.isCombatTurn = true;
        component.diceComponent = jasmine.createSpyObj('DiceComponent', ['rollDice']);

        component.chooseAttack();

        expect(combatSocketMock.emitAttack).toHaveBeenCalledWith(sessionServiceMock.sessionCode);
        expect(subscriptionServiceMock.isAttackOptionDisabled).toBeTrue();
        expect(subscriptionServiceMock.isEvasionOptionDisabled).toBeTrue();
        expect(component.diceComponent.rollDice).toHaveBeenCalled();
    });

    it('should emit evasion when chooseEvasion is called and isCombatTurn is true', () => {
        subscriptionServiceMock.isCombatTurn = true;

        component.chooseEvasion();

        expect(combatSocketMock.emitEvasion).toHaveBeenCalledWith(sessionServiceMock.sessionCode);
        expect(subscriptionServiceMock.isAttackOptionDisabled).toBeTrue();
        expect(subscriptionServiceMock.isEvasionOptionDisabled).toBeTrue();
    });

    it('should set isFight when onFightStatusChanged is called', () => {
        subscriptionServiceMock.isFight = false;
        component.onFightStatusChanged(true);

        expect(subscriptionServiceMock.isFight).toBeTrue();
    });

    it('should leave session when leaveSession is called', () => {
        component.leaveSession();
        expect(sessionServiceMock.leaveSession).toHaveBeenCalled();
    });

    it('should confirm leave session when confirmLeaveSession is called', () => {
        component.confirmLeaveSession();
        expect(sessionServiceMock.confirmLeaveSession).toHaveBeenCalled();
    });

    it('should cancel leave session when cancelLeaveSession is called', () => {
        component.cancelLeaveSession();
        expect(sessionServiceMock.cancelLeaveSession).toHaveBeenCalled();
    });

    it('should return correct player name from getter', () => {
        expect(component.playerName).toBe(sessionServiceMock.playerName);
    });

    it('should open snackbar with correct message when no movement is possible', () => {
        const expectedMessage = 'Aucun mouvement possible pour Player1 - Le tour de se termine dans 3 secondes.';
        component.onFightStatusChanged(false);
        expect(snackBarMock.open).toHaveBeenCalledWith(expectedMessage, 'OK', {
            duration: 5000, // Assuming TURN_NOTIF_DURATION is 5000ms
            panelClass: ['custom-snackbar'],
        });
    });
});
