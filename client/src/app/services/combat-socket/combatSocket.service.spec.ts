/* eslint-disable */
import { TestBed } from '@angular/core/testing';
import { Player } from '@app/interfaces/player.interface';
import { SocketService } from '@app/services/socket/socket.service';
import { CombatSocket } from './combatSocket.service';

interface HandlerMap {
    [event: string]: ((data: any) => void)[];
}

class MockSocket {
    private handlers: HandlerMap = {};

    emit(event: string, data: any): void {
        
    }

    on(event: string, handler: (data: any) => void): void {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    }

    off(event: string, handler: (data: any) => void): void {
        if (this.handlers[event]) {
            this.handlers[event] = this.handlers[event].filter((h) => h !== handler);
        }
    }

    trigger(event: string, data: any): void {
        if (this.handlers[event]) {
            this.handlers[event].forEach((handler) => handler(data));
        }
    }
}

class MockSocketService {
    socket = new MockSocket();
}

describe('CombatSocket', () => {
    let service: CombatSocket;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [CombatSocket, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(CombatSocket);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit startCombat event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';
        const avatar1 = 'avatar1';
        const avatar2 = 'avatar2';

        service.emitStartCombat(sessionCode, avatar1, avatar2);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('startCombat', { sessionCode, avatar1, avatar2 });
    });

    it('should emit attack event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';

        service.emitAttack(sessionCode);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('attack', { sessionCode });
    });

    it('should emit evasion event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';

        service.emitEvasion(sessionCode);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('evasion', { sessionCode });
    });

    it('should receive data from onCombatStarted observable when combatStarted event is triggered', (done) => {
        const testData = {
            startsFirst: true,
            opponentPlayer: { name: 'opponent', avatar: 'avatar2' } as Player,
        };
        service.onCombatStarted().subscribe((data: { startsFirst: boolean; opponentPlayer: Player }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('combatStarted', testData);
    });

    it('should receive data from onCombatTurnStarted observable when combatTurnStarted event is triggered', (done) => {
        const testData = { playerSocketId: 'socket123', timeLeft: 30 };
        service.onCombatTurnStarted().subscribe((data: { playerSocketId: string; timeLeft: number }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('combatTurnStarted', testData);
    });

    it('should receive data from onCombatTimeLeft observable when combatTimeLeft event is triggered', (done) => {
        const testData = { timeLeft: 20, playerSocketId: 'socket123' };
        service.onCombatTimeLeft().subscribe((data: { timeLeft: number; playerSocketId: string }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('combatTimeLeft', testData);
    });

    it('should receive data from onCombatTurnEnded observable when combatTurnEnded event is triggered', (done) => {
        const testData = { playerSocketId: 'socket123' };
        service.onCombatTurnEnded().subscribe((data: { playerSocketId: string }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('combatTurnEnded', testData);
    });

    it('should receive data from onCombatEnded observable when combatEnded event is triggered', (done) => {
        const testData = { message: 'Combat has ended' };
        service.onCombatEnded().subscribe((data: { message: string }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('combatEnded', testData);
    });

    it('should receive data from onAttackResult observable when attackResult event is triggered', (done) => {
        const testData = {
            attackBase: 10,
            attackRoll: 15,
            defenceBase: 8,
            defenceRoll: 12,
            success: true,
        };
        service
            .onAttackResult()
            .subscribe((data: { attackBase: number; attackRoll: number; defenceBase: number; defenceRoll: number; success: boolean }) => {
                expect(data).toEqual(testData);
                done();
            });
        mockSocketService.socket.trigger('attackResult', testData);
    });

    it('should receive data from onDefeated observable when defeated event is triggered', (done) => {
        const testData = { message: 'You have been defeated', winner: 'opponent' };
        service.onDefeated().subscribe((data: { message: string; winner: string }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('defeated', testData);
    });

    it('should receive data from onOpponentDefeated observable when opponentDefeated event is triggered', (done) => {
        const testData = { message: 'Opponent has been defeated', winner: 'you' };
        service.onOpponentDefeated().subscribe((data: { message: string; winner: string }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('opponentDefeated', testData);
    });

    it('should receive data from onEvasionSuccess observable when evasionSuccessful event is triggered', (done) => {
        const testData = { message: 'Evasion was successful' };
        service.onEvasionSuccess().subscribe((data: { message: string }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('evasionSuccessful', testData);
    });

    it('should receive data from onOpponentEvaded observable when opponentEvaded event is triggered', (done) => {
        const testData = { playerName: 'opponent' };
        service.onOpponentEvaded().subscribe((data: { playerName: string }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('opponentEvaded', testData);
    });

    it('should receive data from onEvasionResult observable when evasionResult event is triggered', (done) => {
        const testData = { success: true };
        service.onEvasionResult().subscribe((data: { success: boolean }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('evasionResult', testData);
    });

    it('should receive data from onCombatNotification observable when combatNotification event is triggered', (done) => {
        const testData = {
            player1: { avatar: 'avatar1', name: 'player1' },
            player2: { avatar: 'avatar2', name: 'player2' },
            combat: true,
            result: 'Combat started',
        };
        service
            .onCombatNotification()
            .subscribe(
                (data: { player1: { avatar: string; name: string }; player2: { avatar: string; name: string }; combat: boolean; result: string }) => {
                    expect(data).toEqual(testData);
                    done();
                },
            );
        mockSocketService.socket.trigger('combatNotification', testData);
    });

    it('should receive data from onGameEnded observable when gameEnded event is triggered', (done) => {
        const testData = { winner: 'player1', players: [] };
        service.onGameEnded().subscribe((data: { winner: string, players : Player[] }) => {
            expect(data).toEqual(testData);
            done();
        });
        mockSocketService.socket.trigger('gameEnded', testData);
    });
});
