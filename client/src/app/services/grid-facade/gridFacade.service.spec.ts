import { TestBed } from '@angular/core/testing';
import { Player } from '@app/interfaces/player.interface';
import { CombatSocket } from '@app/services/socket/combatSocket.service';
import { GameSocket } from '@app/services/socket/gameSocket.service';
import { MovementSocket } from '@app/services/socket/movementSocket.service';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';
import { of } from 'rxjs';
import { GridFacadeService } from './gridFacade.service';

describe('GridFacadeService', () => {
    let service: GridFacadeService;
    let movementSocketSpy: jasmine.SpyObj<MovementSocket>;
    let combatSocketSpy: jasmine.SpyObj<CombatSocket>;
    let gameSocketSpy: jasmine.SpyObj<GameSocket>;
    let playerSocketSpy: jasmine.SpyObj<PlayerSocket>;

    beforeEach(() => {
        movementSocketSpy = jasmine.createSpyObj('MovementSocket', [
            'onDoorStateUpdated',
            'getAccessibleTiles',
            'onPlayerMovement',
            'movePlayer',
            'toggleDoorState',
        ]);
        combatSocketSpy = jasmine.createSpyObj('CombatSocket', ['onCombatStarted', 'emitStartCombat']);
        gameSocketSpy = jasmine.createSpyObj('GameSocket', ['getGridArrayChange$', 'emitTileInfoRequest', 'onTileInfo']);
        playerSocketSpy = jasmine.createSpyObj('PlayerSocket', ['emitAvatarInfoRequest', 'onAvatarInfo']);

        TestBed.configureTestingModule({
            providers: [
                GridFacadeService,
                { provide: MovementSocket, useValue: movementSocketSpy },
                { provide: CombatSocket, useValue: combatSocketSpy },
                { provide: GameSocket, useValue: gameSocketSpy },
                { provide: PlayerSocket, useValue: playerSocketSpy },
            ],
        });

        service = TestBed.inject(GridFacadeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should return player movement observable', (done) => {
        const mockData = {
            avatar: 'player-avatar',
            desiredPath: [
                { row: 1, col: 1 },
                { row: 2, col: 2 },
            ],
            realPath: [
                { row: 1, col: 1 },
                { row: 1, col: 2 },
            ],
            slipOccurred: false,
        };

        movementSocketSpy.onPlayerMovement.and.returnValue(of(mockData));

        service.onPlayerMovement().subscribe((data) => {
            expect(data).toEqual(mockData);
            expect(movementSocketSpy.onPlayerMovement).toHaveBeenCalled();
            done();
        });
    });
    it('should return combat started observable', (done) => {
        const mockPlayer: Player = {
            socketId: 'opponent-socket',
            name: 'Opponent Player',
            avatar: 'opponent-avatar',
            attributes: {},
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
        };

        const mockData = {
            startsFirst: true,
            opponentPlayer: mockPlayer,
        };

        combatSocketSpy.onCombatStarted.and.returnValue(of(mockData));

        service.onCombatStarted().subscribe((data) => {
            expect(data).toEqual(mockData);
            expect(combatSocketSpy.onCombatStarted).toHaveBeenCalled();
            done();
        });
    });
    it('should return grid array change observable', () => {
        const sessionCode = 'test-session';
        const mockData = { sessionCode, grid: [[{ images: ['grass.png'], isOccuped: false }]] };

        gameSocketSpy.getGridArrayChange$.and.returnValue(of(mockData));

        service.getGridArrayChange$(sessionCode).subscribe((data) => {
            expect(data).toEqual(mockData);
        });

        expect(gameSocketSpy.getGridArrayChange$).toHaveBeenCalledWith(sessionCode);
    });
    it('should return door state updated observable', () => {
        const mockData = { row: 1, col: 2, newState: 'open' };
        movementSocketSpy.onDoorStateUpdated.and.returnValue(of(mockData));

        service.onDoorStateUpdated().subscribe((data) => {
            expect(data).toEqual(mockData);
        });

        expect(movementSocketSpy.onDoorStateUpdated).toHaveBeenCalled();
    });
    it('should return accessible tiles observable', () => {
        const sessionCode = 'test-session';
        const mockData = { accessibleTiles: [{ position: { row: 1, col: 2 }, path: [{ row: 1, col: 2 }] }] };

        movementSocketSpy.getAccessibleTiles.and.returnValue(of(mockData));

        service.getAccessibleTiles(sessionCode).subscribe((data) => {
            expect(data).toEqual(mockData);
        });

        expect(movementSocketSpy.getAccessibleTiles).toHaveBeenCalledWith(sessionCode);
    });
    it('should call emitStartCombat on combatSocket', () => {
        const sessionCode = 'test-session';
        const avatar1 = 'avatar1';
        const avatar2 = 'avatar2';

        service.emitStartCombat(sessionCode, avatar1, avatar2);

        expect(combatSocketSpy.emitStartCombat).toHaveBeenCalledWith(sessionCode, avatar1, avatar2);
    });
    it('should call movePlayer on movementSocket', () => {
        const sessionCode = 'test-session';
        const source = { row: 1, col: 1 };
        const destination = { row: 2, col: 2 };
        const movingImage = 'avatar.png';

        service.movePlayer(sessionCode, source, destination, movingImage);

        expect(movementSocketSpy.movePlayer).toHaveBeenCalledWith(sessionCode, source, destination, movingImage);
    });
    it('should call emitAvatarInfoRequest on playerSocket', () => {
        const sessionCode = 'test-session';
        const avatar = 'avatar1';

        service.emitAvatarInfoRequest(sessionCode, avatar);

        expect(playerSocketSpy.emitAvatarInfoRequest).toHaveBeenCalledWith(sessionCode, avatar);
    });
    it('should return avatar info observable', () => {
        const mockData = { name: 'Player 1', avatar: 'avatar1.png' };
        playerSocketSpy.onAvatarInfo.and.returnValue(of(mockData));

        service.onAvatarInfo().subscribe((data) => {
            expect(data).toEqual(mockData);
        });

        expect(playerSocketSpy.onAvatarInfo).toHaveBeenCalled();
    });
    it('should call toggleDoorState on movementSocket', () => {
        const sessionCode = 'test-session';
        const row = 1;
        const col = 2;
        const newState = 'closed';

        service.toggleDoorState(sessionCode, row, col, newState);

        expect(movementSocketSpy.toggleDoorState).toHaveBeenCalledWith(sessionCode, row, col, newState);
    });
    it('should return onTileInfo observable', (done) => {
        const mockTileInfo = { cost: 10, effect: 'freeze' };
        gameSocketSpy.onTileInfo.and.returnValue(of(mockTileInfo));

        service.onTileInfo().subscribe((data) => {
            expect(data).toEqual(mockTileInfo);
            expect(gameSocketSpy.onTileInfo).toHaveBeenCalled();
            done();
        });
    });
});
