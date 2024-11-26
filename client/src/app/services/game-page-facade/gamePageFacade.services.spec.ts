import { TestBed } from '@angular/core/testing';
import { CombatSocket } from '@app/services/combat-socket/combatSocket.service';
import { MovementSocket } from '@app/services/movement-socket/movementSocket.service';
import { SessionSocket } from '@app/services/session-socket/sessionSocket.service';
import { TurnSocket } from '@app/services/turn-socket/turnSocket.service';
import { of } from 'rxjs';
import { GamePageFacade } from './gamePageFacade.service';

describe('GamePageFacade', () => {
    let service: GamePageFacade;
    let mockSessionSocket: jasmine.SpyObj<SessionSocket>;
    let mockTurnSocket: jasmine.SpyObj<TurnSocket>;
    let mockMovementSocket: jasmine.SpyObj<MovementSocket>;
    let mockCombatSocket: jasmine.SpyObj<CombatSocket>;

    beforeEach(() => {
        mockSessionSocket = jasmine.createSpyObj('SessionSocket', ['leaveSession']);
        mockTurnSocket = jasmine.createSpyObj('TurnSocket', ['onTurnEnded']);
        mockMovementSocket = jasmine.createSpyObj('MovementSocket', ['onInventoryFull', 'onUpdateInventory', 'discardItem']);
        mockCombatSocket = jasmine.createSpyObj('CombatSocket', ['emitStartCombat']);
        TestBed.configureTestingModule({
            providers: [
                GamePageFacade,
                { provide: SessionSocket, useValue: mockSessionSocket },
                { provide: TurnSocket, useValue: mockTurnSocket },
                { provide: MovementSocket, useValue: mockMovementSocket },
                { provide: CombatSocket, useValue: mockCombatSocket },
            ],
        });

        service = TestBed.inject(GamePageFacade);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call leaveSession on SessionSocket', () => {
        const sessionCode = 'test-session';
        service.leaveSession(sessionCode);
        expect(mockSessionSocket.leaveSession).toHaveBeenCalledWith(sessionCode);
    });

    it('should call onTurnEnded on TurnSocket and return an observable', (done) => {
        const turnData = { playerSocketId: 'player1' };
        mockTurnSocket.onTurnEnded.and.returnValue(of(turnData));

        service.onTurnEnded().subscribe((data) => {
            expect(data).toEqual(turnData);
            done();
        });

        expect(mockTurnSocket.onTurnEnded).toHaveBeenCalled();
    });

    it('should call onInventoryFull on MovementSocket and return an observable', (done) => {
        const inventoryData = { items: ['item1', 'item2'] };
        mockMovementSocket.onInventoryFull.and.returnValue(of(inventoryData));

        service.onInventoryFull().subscribe((data) => {
            expect(data).toEqual(inventoryData);
            done();
        });

        expect(mockMovementSocket.onInventoryFull).toHaveBeenCalled();
    });

    it('should call onUpdateInventory on MovementSocket and return an observable', (done) => {
        const inventoryUpdate = { inventory: ['item1', 'item2'] };
        mockMovementSocket.onUpdateInventory.and.returnValue(of(inventoryUpdate));

        service.onUpdateInventory().subscribe((data) => {
            expect(data).toEqual(inventoryUpdate);
            done();
        });

        expect(mockMovementSocket.onUpdateInventory).toHaveBeenCalled();
    });

    it('should call discardItem on MovementSocket', () => {
        const sessionCode = 'test-session';
        const discardedItem = 'item1';
        const pickedUpItem = 'item2';

        service.discardItem(sessionCode, discardedItem, pickedUpItem);

        expect(mockMovementSocket.discardItem).toHaveBeenCalledWith(sessionCode, discardedItem, pickedUpItem);
    });

    it('should call emitStartCombat on CombatSocket', () => {
        const sessionCode = 'test-session';
        const avatar1 = 'avatar1';
        const avatar2 = 'avatar2';

        service.emitStartCombat(sessionCode, avatar1, avatar2);

        expect(mockCombatSocket.emitStartCombat).toHaveBeenCalledWith(sessionCode, avatar1, avatar2);
    });
});
