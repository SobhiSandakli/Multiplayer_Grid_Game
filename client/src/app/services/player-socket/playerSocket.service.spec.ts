/* eslint-disable */
import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/socket/socket.service';
import { PlayerSocket } from './playerSocket.service';

import { Attribute, CharacterInfo } from '@app/interfaces/attributes.interface';
import { CharacterCreatedData, PlayerListUpdate, TakenAvatarsResponse } from '@app/interfaces/socket.interface';

interface HandlerMap {
    [event: string]: ((...args: any[]) => void)[];
}

class MockSocket {
    private handlers: HandlerMap = {};

    emit(event: string, data?: any): void {
        
    }

    on(event: string, handler: (...args: any[]) => void): void {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    }

    off(event: string, handler: (...args: any[]) => void): void {
        if (this.handlers[event]) {
            this.handlers[event] = this.handlers[event].filter((h) => h !== handler);
        }
    }

    trigger(event: string, data?: any): void {
        if (this.handlers[event]) {
            this.handlers[event].forEach((handler) => handler(data));
        }
    }
}

class MockSocketService {
    socket = new MockSocket();
}

describe('PlayerSocket', () => {
    let service: PlayerSocket;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [PlayerSocket, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(PlayerSocket);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should receive data from onUpdateLifePoints observable when updateLifePoints event is triggered', (done) => {
        const testData = { playerLife: 80, opponentLife: 70 };
        service.onUpdateLifePoints().subscribe((data: { playerLife: number; opponentLife: number }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('updateLifePoints', testData);
    });

    it('should receive data from onPlayerListUpdate observable when playerListUpdate event is triggered', (done) => {
        const testData: PlayerListUpdate = {
            players: [
                {
                    name: 'Player1',
                    avatar: 'Avatar1',
                    socketId: '',
                    isOrganizer: false,
                    inventory: [],
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
                },
            ],
        };
        service.onPlayerListUpdate().subscribe((data: PlayerListUpdate) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('playerListUpdate', testData);
    });

    it('should receive data from onPlayerInfo observable when playerInfo event is triggered', (done) => {
        const testData = { name: 'Player1', avatar: 'Avatar1' };
        service.onPlayerInfo().subscribe((data: { name: string; avatar: string }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('playerInfo', testData);
    });

    it('should emit avatarInfoRequest event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';
        const avatar = 'Avatar1';

        service.emitAvatarInfoRequest(sessionCode, avatar);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('avatarInfoRequest', { sessionCode, avatar });
    });

    it('should receive data from onAvatarInfo observable when avatarInfo event is triggered', (done) => {
        const testData = { name: 'Player1', avatar: 'Avatar1' };
        service.onAvatarInfo().subscribe((data: { name: string; avatar: string }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('avatarInfo', testData);
    });

    it('should emit createCharacter event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';
        const characterData: CharacterInfo = {
            name: 'Character1',
            avatar: 'Avatar1',
            attributes: {
                strength: {
                    name: 'Strength',
                    description: 'Physical power',
                    baseValue: 10,
                    currentValue: 10,
                },
                agility: {
                    name: 'Agility',
                    description: 'Speed and reflexes',
                    baseValue: 8,
                    currentValue: 8,
                },
                intelligence: {
                    name: 'Intelligence',
                    description: 'Mental acuity',
                    baseValue: 7,
                    currentValue: 7,
                },
            },
        };

        service.createCharacter(sessionCode, characterData);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('createCharacter', { sessionCode, characterData });
    });

    it('should receive data from onCharacterCreated observable when characterCreated event is triggered', (done) => {
        const testData: CharacterCreatedData & { gameId: string; attributs: { [key: string]: Attribute } } = {
            name: 'Character1',
            sessionCode: '',
            gameId: 'game123',
            attributs: {
                strength: {
                    name: 'Strength',
                    description: 'Physical power',
                    baseValue: 10,
                    currentValue: 10,
                },
            },
            avatar: '',
            attributes: {},
        };

        service.onCharacterCreated().subscribe((data) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('characterCreated', testData);
    });

    it('should emit getTakenAvatars event with correct data and receive takenAvatars event', (done) => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';
        const testData: TakenAvatarsResponse = {
            takenAvatars: ['Avatar1', 'Avatar2'],
        };

        service.getTakenAvatars(sessionCode).subscribe((data: TakenAvatarsResponse) => {
            expect(data).toEqual(testData);
            done();
        });

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('getTakenAvatars', { sessionCode });
        mockSocketService.socket.trigger('takenAvatars', testData);
    });
});
