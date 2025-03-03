/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable max-lines */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugModeService } from '@app/services/debugMode/debug-mode.service';
import { GamePageFacade } from '@app/services/game-page-facade/gamePageFacade.service';
import { SessionService } from '@app/services/session/session.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { OBJECTS_LIST } from 'src/constants/objects-constants';
import { GamePageComponent } from './game-page.component';
@Component({
    selector: 'app-dice',
    template: '',
})
class MockDiceComponent {}
const faChevronDown = {};
const faChevronUp = {};
const faFistRaised = {};
const faShieldAlt = {};
const faTachometerAlt = {};
const faHeart = {};
const faCrown = {};
const faFlag = {};
const faUserCircle = {};
const faWalking = {};
const faBolt = {};

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let mockSubscriptionService: jasmine.SpyObj<SubscriptionService>;
    let mockSessionService: jasmine.SpyObj<SessionService>;
    let mockGamePageFacade: jasmine.SpyObj<GamePageFacade>;
    let mockDebugModeService: jasmine.SpyObj<DebugModeService>;
    let gameInfoSubject: Subject<any>;
    let currentPlayerSocketIdSubject: Subject<string>;
    let isPlayerTurnSubject: Subject<boolean>;
    let putTimerSubject: Subject<boolean>;
    let onTurnEndedSubject: Subject<{ playerSocketId: string }>;
    let onInventoryFullSubject: Subject<{ items: string[] }>;
    let onUpdateInventorySubject: Subject<{ inventory: string[] }>;
    let debugModeSubject: BehaviorSubject<boolean>;

    beforeEach(async () => {
        mockSubscriptionService = jasmine.createSpyObj('SubscriptionService', ['initSubscriptions', 'unsubscribeAll', 'reset'], {
            gameInfo$: of({}),
            currentPlayerSocketId$: of('socket123'),
            isPlayerTurn$: of(true),
            putTimer$: of(false),
        });

        mockSessionService = jasmine.createSpyObj(
            'SessionService',
            [
                'leaveSession',
                'confirmLeaveSession',
                'cancelLeaveSession',
                'initializeGame',
                'subscribeToPlayerListUpdate',
                'subscribeToOrganizerLeft',
                'getCurrentPlayer',
                'reset',
                'subscribeToPlayerInventoryUpdate',
            ],
            {
                sessionCode: 'ABC123',
                selectedGame: { name: 'Test Game', description: 'A game for testing', size: 'Medium' },
                players: [{ id: '1', name: 'Player1', inventory: ['Item1'] }],
                playerName: 'Player1',
                playerAvatar: 'avatar1.png',
                playerAttributes: {
                    speed: { name: 'test', baseValue: 5, currentValue: 10, description: 'test' },
                    life: { name: 'test', baseValue: 5, currentValue: 100, description: 'test' },
                    attack: { name: 'test', baseValue: 5, currentValue: 10, description: 'test', dice: 6 },
                    defence: { name: 'test', baseValue: 5, currentValue: 10, description: 'test', dice: 6 },
                },
                leaveSessionPopupVisible: false,
                leaveSessionMessage: 'Are you sure?',
                isOrganizer: false,
                playerInventorySubject: new BehaviorSubject<string[]>(['Item1']),
            },
        );

        mockGamePageFacade = jasmine.createSpyObj('GamePageFacade', [
            'onTurnEnded',
            'onInventoryFull',
            'onUpdateInventory',
            'emitStartCombat',
            'discardItem',
            'leaveSession',
        ]);

        mockDebugModeService = jasmine.createSpyObj('DebugModeService', ['handleKeyPress', 'reset', 'debugMode']);
        gameInfoSubject = new Subject<any>();
        currentPlayerSocketIdSubject = new Subject<string>();
        isPlayerTurnSubject = new Subject<boolean>();
        putTimerSubject = new Subject<boolean>();
        onTurnEndedSubject = new Subject<{ playerSocketId: string }>();
        onInventoryFullSubject = new Subject<{ items: string[] }>();
        onUpdateInventorySubject = new Subject<{ inventory: string[] }>();

        debugModeSubject = new BehaviorSubject<boolean>(false);
        mockDebugModeService.debugModeSubject = debugModeSubject;

        Object.defineProperty(mockSubscriptionService, 'gameInfo$', {
            get: () => gameInfoSubject.asObservable(),
        });
        Object.defineProperty(mockSubscriptionService, 'currentPlayerSocketId$', {
            get: () => currentPlayerSocketIdSubject.asObservable(),
        });
        Object.defineProperty(mockSubscriptionService, 'isPlayerTurn$', {
            get: () => isPlayerTurnSubject.asObservable(),
        });
        Object.defineProperty(mockSubscriptionService, 'putTimer$', {
            get: () => putTimerSubject.asObservable(),
        });

        mockGamePageFacade.onTurnEnded.and.returnValue(onTurnEndedSubject.asObservable());
        mockGamePageFacade.onInventoryFull.and.returnValue(onInventoryFullSubject.asObservable());
        mockGamePageFacade.onUpdateInventory.and.returnValue(onUpdateInventorySubject.asObservable());

        await TestBed.configureTestingModule({
            declarations: [GamePageComponent, MockDiceComponent],
            providers: [
                { provide: SubscriptionService, useValue: mockSubscriptionService },
                { provide: SessionService, useValue: mockSessionService },
                { provide: GamePageFacade, useValue: mockGamePageFacade },
                { provide: DebugModeService, useValue: mockDebugModeService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;

        (component as any).faChevronDown = faChevronDown;
        (component as any).faChevronUp = faChevronUp;
        (component as any).faFistRaised = faFistRaised;
        (component as any).faShieldAlt = faShieldAlt;
        (component as any).faTachometerAlt = faTachometerAlt;
        (component as any).faHeart = faHeart;
        (component as any).faCrown = faCrown;
        (component as any).faFlag = faFlag;
        (component as any).faUserCircle = faUserCircle;
        (component as any).faWalking = faWalking;
        (component as any).faBolt = faBolt;

        fixture.detectChanges();
    });

    afterEach(() => {
        gameInfoSubject.complete();
        currentPlayerSocketIdSubject.complete();
        isPlayerTurnSubject.complete();
        putTimerSubject.complete();
        onTurnEndedSubject.complete();
        onInventoryFullSubject.complete();
        onUpdateInventorySubject.complete();
        debugModeSubject.complete();
    });

    describe('Initialization', () => {
        it('should create the component', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('Getters', () => {
        it('should return sessionCode from sessionService', () => {
            expect(component.sessionCode).toBe('ABC123');
        });

        it('should return gameName from sessionService', () => {
            expect(component.gameName).toBe('Test Game');
        });

        it('should return gameDescription from sessionService', () => {
            expect(component.gameDescription).toBe('A game for testing');
        });

        it('should return gameSize from sessionService', () => {
            expect(component.gameSize).toBe('Medium');
        });

        it('should return playerCount from sessionService', () => {
            expect(component.playerCount).toBe(1);
        });

        it('should return playerName from sessionService', () => {
            expect(component.playerName).toBe('Player1');
        });

        it('should return playerAvatar from sessionService', () => {
            expect(component.playerAvatar).toBe('avatar1.png');
        });

        it('should return leaveSessionPopupVisible from sessionService', () => {
            expect(component.leaveSessionPopupVisible).toBeFalse();
        });

        it('should return leaveSessionMessage from sessionService', () => {
            expect(component.leaveSessionMessage).toBe('Are you sure?');
        });

        it('should return isOrganizer from sessionService', () => {
            expect(component.isOrganizer).toBeFalse();
        });
    });

    describe('ngOnInit', () => {
        it('should initialize component state and subscribe to observables', () => {
            component.ngOnInit();

            expect(mockSessionService.leaveSessionPopupVisible).toBeFalse();
            expect(mockSessionService.initializeGame).toHaveBeenCalled();
            expect(mockSessionService.subscribeToPlayerListUpdate).toHaveBeenCalled();
            expect(mockSessionService.subscribeToOrganizerLeft).toHaveBeenCalled();
            expect(mockSubscriptionService.initSubscriptions).toHaveBeenCalled();
            expect(component.speedPoints).toBe(10);
            expect(mockGamePageFacade.onTurnEnded).toHaveBeenCalled();
            expect(mockSubscriptionService.action).toBe(1);
        });

        it('should handle onInventoryFull event', () => {
            const items = ['Item1', 'Item2'];
            onInventoryFullSubject.next({ items });

            expect(component.inventoryFullItems).toEqual(items);
            expect(component.inventoryFullPopupVisible).toBeTrue();
        });

        it('should handle onUpdateInventory event', () => {
            const newInventory = ['Item3', 'Item4'];
            const player = {
                socketId: '0',
                name: 'test',
                avatar: 'test.png',
                isOrganizer: false,
                inventory: ['Item1'],
                statistics: {
                    combats: 0,
                    evasions: 0,
                    victories: 0,
                    defeats: 0,
                    totalLifeLost: 0,
                    totalLifeRemoved: 0,
                    uniqueItems: new Set<string>(),
                    tilesVisited: new Set<string>(),
                    uniqueItemsArray: [],
                    tilesVisitedArray: [],
                },
                attributes: {},
            };
            mockSessionService.getCurrentPlayer.and.returnValue(player);
            onUpdateInventorySubject.next({ inventory: newInventory });

            expect(mockSessionService.getCurrentPlayer).toHaveBeenCalled();
            expect(player.inventory).toEqual(newInventory);
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe all subscriptions and reset services', () => {
            component.ngOnDestroy();

            expect(component['subscriptions'].closed).toBeTrue();
            expect(mockSubscriptionService.unsubscribeAll).toHaveBeenCalled();
            expect(mockGamePageFacade.leaveSession).not.toHaveBeenCalled();
            expect(mockSessionService.reset).toHaveBeenCalled();
            expect(mockDebugModeService.reset).toHaveBeenCalled();
        });
    });

    describe('handleActionPerformed', () => {
        it('should set action to 0 and isActive to false, and subscribe to onTurnEnded', () => {
            component.isActive = true;
            component.handleActionPerformed();

            expect(mockSubscriptionService.action).toBe(0);
            expect(component.isActive).toBeFalse();
            expect(mockGamePageFacade.onTurnEnded).toHaveBeenCalled();
            onTurnEndedSubject.next({ playerSocketId: 'socket123' });
            expect(mockSubscriptionService.action).toBe(1);
            expect(component.isActive).toBeFalse();
        });
    });

    describe('leaveSession', () => {
        it('should call sessionService.leaveSession', () => {
            component.leaveSession();
            expect(mockSessionService.leaveSession).toHaveBeenCalled();
        });
    });

    describe('confirmLeaveSession', () => {
        it('should call sessionService.confirmLeaveSession', () => {
            component.confirmLeaveSession();
            expect(mockSessionService.confirmLeaveSession).toHaveBeenCalled();
        });
    });

    describe('cancelLeaveSession', () => {
        it('should call sessionService.cancelLeaveSession', () => {
            component.cancelLeaveSession();
            expect(mockSessionService.cancelLeaveSession).toHaveBeenCalled();
        });
    });

    describe('toggleExpand', () => {
        it('should toggle isExpanded', () => {
            const initial = component.isExpanded;
            component.toggleExpand();
            expect(component.isExpanded).toBe(!initial);
        });
    });

    describe('toggleActive', () => {
        it('should toggle isActive', () => {
            const initial = component.isActive;
            component.toggleActive();
            expect(component.isActive).toBe(!initial);
        });
    });

    describe('startCombat', () => {
        it('should emit start combat with correct parameters', () => {
            component.opposentPlayer = 'opponent1';
            component.startCombat();

            expect(mockGamePageFacade.emitStartCombat).toHaveBeenCalledWith('ABC123', 'avatar1.png', 'opponent1');
        });
    });

    describe('handleDataFromChild', () => {
        it('should set isActive to false, set opposentPlayer, and start combat', () => {
            spyOn(component, 'startCombat');

            component.isActive = true;
            component.handleDataFromChild('opponent2');

            expect(component.isActive).toBeFalse();
            expect(component.opposentPlayer).toBe('opponent2');
            expect(component.startCombat).toHaveBeenCalled();
        });
    });

    describe('onFightStatusChanged', () => {
        it('should set subscriptionService.isFight to event value', () => {
            (mockSubscriptionService as any).isFight = false;
            component.onFightStatusChanged(true);
            expect((mockSubscriptionService as any).isFight).toBeTrue();

            component.onFightStatusChanged(false);
            expect((mockSubscriptionService as any).isFight).toBeFalse();
        });
    });

    describe('handleKeyPress', () => {
        it('should delegate key press to debugModeService', () => {
            const event = new KeyboardEvent('keydown', { key: 'a' });
            component.handleKeyPress(event);
            expect((mockDebugModeService as any).handleKeyPress).toHaveBeenCalledWith(event);
        });
    });

    describe('reset', () => {
        it('should reset subscriptionService, debugModeService, and sessionService', () => {
            component.reset();

            expect(mockSubscriptionService.reset).toHaveBeenCalled();
            expect(mockDebugModeService.reset).toHaveBeenCalled();
            expect(mockSessionService.reset).toHaveBeenCalled();
        });
    });

    describe('discardItem', () => {
        it('should discard item and update inventory', () => {
            const discardedItem = 'Item1';
            component.inventoryFullItems = ['Item1', 'Item2'];
            const player: any = {
                inventory: ['Item1'],
            };
            mockSessionService.getCurrentPlayer.and.returnValue(player);

            component.discardItem(discardedItem);

            expect(mockGamePageFacade.discardItem).toHaveBeenCalledWith('ABC123', discardedItem, 'Item2');
            expect(component.inventoryFullPopupVisible).toBeFalse();
        });
    });

    describe('hasFlagInInventory', () => {
        it('should return true if player has flag in inventory', () => {
            const player = {
                inventory: ['Item1', 'assets/objects/Flag.png'],
            } as any;

            expect(component.hasFlagInInventory(player)).toBeTrue();
        });

        it('should return false if player does not have flag in inventory', () => {
            const player = {
                inventory: ['Item1'],
            } as any;

            expect(component.hasFlagInInventory(player)).toBeFalse();
        });
    });

    describe('findDescriptionObject', () => {
        it('should return description of object if found', () => {
            const object = 'object1';
            const description = 'description1';
            spyOn(OBJECTS_LIST, 'find').and.returnValue({ name: 'test', link: object, description, isDragAndDrop: false, count: 1 });

            expect(component.findDescriptionObject(object)).toBe(description);
        });

        it('should return empty string if object not found', () => {
            const object = 'object2';
            spyOn(OBJECTS_LIST, 'find').and.returnValue(undefined);

            expect(component.findDescriptionObject(object)).toBe('');
        });
    });
});
