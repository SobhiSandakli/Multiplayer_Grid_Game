/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable max-lines */
/* eslint-disable no-restricted-imports */
import { ElementRef, QueryList } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GridService } from '@app/services/grid/grid.service';
import { TileService } from '@app/services/tile/tile.service';
import { of, Subject } from 'rxjs';
import { GridFacadeService } from '../grid-facade/gridFacade.service';
import { GameGridService } from './gameGrid.service';

describe('GameGridService', () => {
    let service: GameGridService;
    let mockGridFacade: jasmine.SpyObj<GridFacadeService>;
    let mockGridService: jasmine.SpyObj<GridService>;
    let mockTileService: jasmine.SpyObj<TileService>;

    beforeEach(() => {
        mockGridFacade = jasmine.createSpyObj('GridFacadeService', [
            'toggleDoorState',
            'emitStartCombat',
            'movePlayer',
            'emitAvatarInfoRequest',
            'onAvatarInfo',
            'emitTileInfoRequest',
            'onTileInfo',
        ]);

        mockGridService = jasmine.createSpyObj('GridService', ['getTileType', 'replaceImageOnTile']);
        mockTileService = jasmine.createSpyObj('TileService', ['getTileImageSrc']);

        TestBed.configureTestingModule({
            providers: [
                GameGridService,
                { provide: GridFacadeService, useValue: mockGridFacade },
                { provide: GridService, useValue: mockGridService },
                { provide: TileService, useValue: mockTileService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: { sessionCode: 'test-session' },
                        },
                        paramMap: of({ get: () => 'test-session' }),
                    },
                },
            ],
        });

        service = TestBed.inject(GameGridService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Public methods', () => {
        it('should set session code', () => {
            service.setSessionCode('test-session');
            expect(service.sessionCode).toBe('test-session');
        });

        it('should set player avatar', () => {
            service.setPlayerAvatar('test-avatar');
            expect(service.playerAvatar).toBe('test-avatar');
        });

        it('should toggle door state', () => {
            mockGridService.getTileType.and.returnValue('door');
            mockTileService.getTileImageSrc.and.returnValues('door', 'doorOpen');
            service.sessionCode = 'test-session';

            service.toggleDoorState(1, 2);

            expect(mockGridService.replaceImageOnTile).toHaveBeenCalledWith(1, 2, 'doorOpen');
            expect(mockGridFacade.toggleDoorState).toHaveBeenCalledWith('test-session', 1, 2, 'doorOpen');
        });

        it('should start combat with opponent', () => {
            service.sessionCode = 'test-session';
            service.playerAvatar = 'player-avatar';

            service.startCombatWithOpponent('opponent-avatar');

            expect(mockGridFacade.emitStartCombat).toHaveBeenCalledWith('test-session', 'player-avatar', 'opponent-avatar');
        });

        it('should check if positions are adjacent', () => {
            const playerPosition = { row: 1, col: 1 };
            const targetPosition = { row: 1, col: 2 };

            expect(service.isAdjacent(playerPosition, targetPosition)).toBeTrue();
        });

        it('should update tile dimensions', () => {
            const mockElementRef = {
                nativeElement: {
                    getBoundingClientRect: () => ({ width: 50, height: 50 }),
                },
            };
            const tileElements = new QueryList<ElementRef>();
            tileElements.reset([mockElementRef]);

            const dimensions = service.updateTileDimensions(tileElements);

            expect(dimensions).toEqual({ tileWidth: 50, tileHeight: 50 });
        });

        it('should return the correct hover path for given position and path', () => {
            const rowIndex = 1;
            const colIndex = 1;
            const tileWidth = 50;
            const tileHeight = 50;
            const accessibleTiles = [
                {
                    position: { row: 1, col: 1 },
                    path: [
                        { row: 1, col: 1 },
                        { row: 2, col: 2 },
                    ],
                },
            ];

            const expectedResult = [
                { x: 75, y: 100 },
                { x: 87.5, y: 112.5 },
                { x: 100, y: 125 },
                { x: 112.5, y: 137.5 },
                { x: 125, y: 150 },
            ];

            const result = service.calculateHoverPath(rowIndex, colIndex, accessibleTiles, tileWidth, tileHeight);
            expect(result).toEqual(expectedResult);
        });

        it('should return an empty array when no matching tile is found', () => {
            const rowIndex = 99;
            const colIndex = 99;
            const tileWidth = 50;
            const tileHeight = 50;

            const accessibleTiles = [
                {
                    position: { row: 1, col: 1 },
                    path: [
                        { row: 1, col: 1 },
                        { row: 2, col: 2 },
                    ],
                },
            ];

            const result = service.calculateHoverPath(rowIndex, colIndex, accessibleTiles, tileWidth, tileHeight);
            expect(result).toEqual([]);
        });

        it('should emit avatar info on right click', () => {
            const mockEvent = new MouseEvent('contextmenu', { clientX: 100, clientY: 100 });
            const gridTiles = [[{ images: ['assets/avatars/player'], isOccuped: false }]];

            mockGridFacade.onAvatarInfo.and.returnValue(new Subject<any>().asObservable());

            service.onRightClickTile(0, 0, mockEvent, gridTiles);

            expect(mockGridFacade.emitAvatarInfoRequest).toHaveBeenCalled();
        });

        it('should emit tile info on right click', () => {
            const mockEvent = new MouseEvent('contextmenu', { clientX: 100, clientY: 100 });
            const gridTiles = [[{ images: ['tile1.png'], isOccuped: false }]];

            mockGridFacade.onTileInfo.and.returnValue(new Subject<any>().asObservable());

            service.onRightClickTile(0, 0, mockEvent, gridTiles);

            expect(mockGridFacade.emitTileInfoRequest).toHaveBeenCalled();
        });

        it('should update avatar position in the grid and call detectChanges', () => {
            const gridTiles = [
                [
                    { images: ['avatar1.png'], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: ['avatar2.png'], isOccuped: false },
                ],
            ];

            const cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
            const avatar = 'avatar1.png';
            const newRow = 1;
            const newCol = 0;
            service.updateAvatarPosition(avatar, newRow, newCol, gridTiles, cdr);

            expect(gridTiles[0][0].images).not.toContain(avatar);
            expect(gridTiles[1][0].images).toContain(avatar);
            expect(cdr.detectChanges).toHaveBeenCalled();
        });

        it('should call handleActiveTileClick if game is active', () => {
            const gameState = {
                isActive: true,
                gridTiles: [[{ images: [], isOccuped: false }]],
                accessibleTiles: [],
            };
            const tileInfo = {
                tile: { images: [], isOccuped: false },
                position: { row: 0, col: 0 },
            };
            const event = new MouseEvent('click');

            spyOn<any>(service, 'handleActiveTileClick');

            service.handleTileClick(gameState, tileInfo, event);
            expect((service as any).handleActiveTileClick).toHaveBeenCalledWith(
                gameState.gridTiles,
                tileInfo.tile,
                tileInfo.position.row,
                tileInfo.position.col,
            );
        });

        it('should call handleInactiveTileClick if game is inactive and tile is not occupied', () => {
            const gameState = {
                isActive: false,
                gridTiles: [[{ images: [], isOccuped: false }]],
                accessibleTiles: [],
            };
            const tileInfo = {
                tile: { images: [], isOccuped: false },
                position: { row: 0, col: 0 },
            };
            const event = new MouseEvent('click', { button: 0 });

            spyOn<any>(service, 'handleInactiveTileClick');

            service.handleTileClick(gameState, tileInfo, event);
            expect((service as any).handleInactiveTileClick).toHaveBeenCalledWith(
                tileInfo.position.row,
                tileInfo.position.col,
                gameState.accessibleTiles,
            );
        });

        it('should move the player if the tile is accessible', () => {
            const accessibleTiles = [
                {
                    position: { row: 0, col: 0 },
                    path: [
                        { row: 0, col: 0 },
                        { row: 1, col: 1 },
                    ],
                },
                {
                    position: { row: 1, col: 1 },
                    path: [
                        { row: 1, col: 1 },
                        { row: 2, col: 2 },
                    ],
                },
            ];
            const rowIndex = 1;
            const colIndex = 1;
            const sourceCoords = { row: 0, col: 0 };

            service.onTileClick(rowIndex, colIndex, accessibleTiles);
            expect(mockGridFacade.movePlayer).toHaveBeenCalledWith(
                service.sessionCode,
                sourceCoords,
                { row: rowIndex, col: colIndex },
                service.playerAvatar,
            );
        });

        it('should not move the player if the tile is not accessible', () => {
            const accessibleTiles = [
                {
                    position: { row: 0, col: 0 },
                    path: [
                        { row: 0, col: 0 },
                        { row: 1, col: 1 },
                    ],
                },
            ];
            const rowIndex = 2;
            const colIndex = 2;

            service.onTileClick(rowIndex, colIndex, accessibleTiles);
            expect(mockGridFacade.movePlayer).not.toHaveBeenCalled();
        });

        it('should return true for hasTopBorder when no tile is above', () => {
            const accessibleTiles = [
                { position: { row: 1, col: 0 }, path: [] },
                { position: { row: 2, col: 0 }, path: [] },
            ];
            const row = 1;
            const col = 0;
            const result = service.hasTopBorder(row, col, accessibleTiles);
            expect(result).toBe(true);
        });

        it('should return false for hasTopBorder when a tile is above', () => {
            const accessibleTiles = [
                { position: { row: 1, col: 0 }, path: [] },
                { position: { row: 2, col: 0 }, path: [] },
            ];
            const row = 2;
            const col = 0;
            const result = service.hasTopBorder(row, col, accessibleTiles);
            expect(result).toBe(false);
        });

        it('should return true for hasRightBorder when no tile is to the right', () => {
            const accessibleTiles = [
                { position: { row: 1, col: 1 }, path: [] },
                { position: { row: 2, col: 1 }, path: [] },
            ];
            const row = 1;
            const col = 1;
            const result = service.hasRightBorder(row, col, accessibleTiles);
            expect(result).toBe(true);
        });

        it('should return false for hasRightBorder when a tile is to the right', () => {
            const accessibleTiles = [
                { position: { row: 1, col: 1 }, path: [] },
                { position: { row: 1, col: 2 }, path: [] },
            ];
            const row = 1;
            const col = 1;
            const result = service.hasRightBorder(row, col, accessibleTiles);
            expect(result).toBe(false);
        });

        it('should return true for hasBottomBorder when no tile is below', () => {
            const accessibleTiles = [
                { position: { row: 1, col: 1 }, path: [] },
                { position: { row: 1, col: 2 }, path: [] },
            ];
            const row = 1;
            const col = 1;
            const result = service.hasBottomBorder(row, col, accessibleTiles);
            expect(result).toBe(true);
        });

        it('should return false for hasBottomBorder when a tile is below', () => {
            const accessibleTiles = [
                { position: { row: 1, col: 1 }, path: [] },
                { position: { row: 2, col: 1 }, path: [] },
            ];
            const row = 1;
            const col = 1;
            const result = service.hasBottomBorder(row, col, accessibleTiles);
            expect(result).toBe(false);
        });

        it('should return true for hasLeftBorder when no tile is to the left', () => {
            const accessibleTiles = [
                { position: { row: 1, col: 1 }, path: [] },
                { position: { row: 1, col: 2 }, path: [] },
            ];
            const row = 1;
            const col = 1;
            const result = service.hasLeftBorder(row, col, accessibleTiles);
            expect(result).toBe(true);
        });

        it('should return false for hasLeftBorder when a tile is to the left', () => {
            const accessibleTiles = [
                { position: { row: 1, col: 1 }, path: [] },
                { position: { row: 1, col: 0 }, path: [] },
            ];
            const row = 1;
            const col = 1;
            const result = service.hasLeftBorder(row, col, accessibleTiles);
            expect(result).toBe(false);
        });

        it('should return the correct row and column for a given index in a grid', () => {
            const numCols = 3;
            let position = service.getTilePosition(0, numCols);
            expect(position).toEqual({ row: 0, col: 0 });

            position = service.getTilePosition(4, numCols);
            expect(position).toEqual({ row: 1, col: 1 });

            position = service.getTilePosition(8, numCols);
            expect(position).toEqual({ row: 2, col: 2 });

            position = service.getTilePosition(6, numCols);
            expect(position).toEqual({ row: 2, col: 0 });
        });

        it('should add and remove rotate class to avatar image', () => {
            const row = 1;
            const col = 1;
            const playerAvatar = 'player-avatar';
            const mockElementRef = {
                nativeElement: {
                    querySelectorAll: jasmine
                        .createSpy('querySelectorAll')
                        .and.returnValue([
                            { src: 'player-avatar', classList: { add: jasmine.createSpy('add'), remove: jasmine.createSpy('remove') } },
                        ]),
                },
            };
            const tileElements = new QueryList<ElementRef>();
            tileElements.reset([mockElementRef, mockElementRef, mockElementRef, mockElementRef]);

            spyOn(service, 'getTilePosition').and.callFake((index) => {
                const positions = [
                    { row: 0, col: 0 },
                    { row: 0, col: 1 },
                    { row: 1, col: 0 },
                    { row: 1, col: 1 },
                ];
                return positions[index];
            });

            jasmine.clock().install();
            service.rotateAvatar(row, col, tileElements, playerAvatar);

            const avatarImage = mockElementRef.nativeElement.querySelectorAll()[0];
            expect(avatarImage.classList.add).toHaveBeenCalledWith('rotate');

            jasmine.clock().tick(1000);
            expect(avatarImage.classList.remove).toHaveBeenCalledWith('rotate');
            jasmine.clock().uninstall();
        });

        it('should not add rotate class if avatar image is not found', () => {
            const row = 1;
            const col = 1;
            const playerAvatar = 'player-avatar';
            const mockElementRef = {
                nativeElement: {
                    querySelectorAll: jasmine.createSpy('querySelectorAll').and.returnValue([]),
                },
            };
            const tileElements = new QueryList<ElementRef>();
            tileElements.reset([mockElementRef, mockElementRef, mockElementRef, mockElementRef]);

            spyOn(service, 'getTilePosition').and.callFake((index) => {
                const positions = [
                    { row: 0, col: 0 },
                    { row: 0, col: 1 },
                    { row: 1, col: 0 },
                    { row: 1, col: 1 },
                ];
                return positions[index];
            });

            service.rotateAvatar(row, col, tileElements, playerAvatar);

            expect(mockElementRef.nativeElement.querySelectorAll).toHaveBeenCalled();
        });

        it('should not add rotate class if tile element is not found', () => {
            const row = 2;
            const col = 2;
            const playerAvatar = 'player-avatar';
            const mockElementRef = {
                nativeElement: {
                    querySelectorAll: jasmine
                        .createSpy('querySelectorAll')
                        .and.returnValue([
                            { src: 'player-avatar', classList: { add: jasmine.createSpy('add'), remove: jasmine.createSpy('remove') } },
                        ]),
                },
            };
            const tileElements = new QueryList<ElementRef>();
            tileElements.reset([mockElementRef, mockElementRef, mockElementRef, mockElementRef]);

            spyOn(service, 'getTilePosition').and.callFake((index) => {
                const positions = [
                    { row: 0, col: 0 },
                    { row: 0, col: 1 },
                    { row: 1, col: 0 },
                    { row: 1, col: 1 },
                ];
                return positions[index];
            });

            service.rotateAvatar(row, col, tileElements, playerAvatar);

            expect(mockElementRef.nativeElement.querySelectorAll).not.toHaveBeenCalled();
        });
    });

    describe('Private methods', () => {
        it('should start combat with opponent avatar and emit actionPerformed', () => {
            spyOn<any>(service, 'isAdjacent').and.returnValue(true);
            spyOn<any>(service, 'isAvatar').and.returnValue(true);
            spyOn<any>(service, 'startCombatWithOpponent');

            const actionPerformedSpy = spyOn(service.actionPerformed, 'emit');
            const gridTiles = [[{ images: ['assets/avatar-opponent.png'], isOccuped: true }]];
            const tile = { images: ['assets/avatar-opponent.png'], isOccuped: true };

            (service as any).handleActiveTileClick(gridTiles, tile, 1, 2);

            expect((service as any).isAvatar).toHaveBeenCalledWith(tile);
            expect(service.startCombatWithOpponent).toHaveBeenCalledWith('assets/avatar-opponent.png');
            expect(actionPerformedSpy).toHaveBeenCalled();
        });

        it('should open or close the door', () => {
            spyOn<any>(service, 'isAdjacent').and.returnValue(true);
            spyOn<any>(service, 'isDoor').and.returnValue(true);
            spyOn<any>(service, 'toggleDoorState');

            const actionPerformedSpy = spyOn(service.actionPerformed, 'emit');
            const gridTiles = [[{ images: ['assets/tiles/Door.png'], isOccuped: false }]];
            const tile = { images: ['assets/tiles/Door.png'], isOccuped: false };

            (service as any).handleActiveTileClick(gridTiles, tile, 1, 2);
            expect(service.toggleDoorState).toHaveBeenCalledWith(1, 2);
            expect(actionPerformedSpy).toHaveBeenCalled();
        });

        it('should handle inactive tile click', () => {
            const accessibleTiles = [{ position: { row: 1, col: 1 }, path: [] }];
            const spy = spyOn<any>(service, 'onTileClick');

            service['handleInactiveTileClick'](1, 1, accessibleTiles);
            expect(spy).toHaveBeenCalledWith(1, 1, accessibleTiles);
        });

        it('should determine if tile contains avatar', () => {
            const tile = { images: ['assets/avatar/test'], isOccuped: false };
            expect(service['isAvatar'](tile)).toBeTrue();
        });

        it('should determine if tile is a door', () => {
            const tile = { images: ['assets/tiles/Door.png'], isOccuped: false };
            expect(service['isDoor'](tile)).toBeTrue();
        });

        it('should determine if tile is an open door', () => {
            const tile = { images: ['assets/tiles/Door-Open.png'], isOccuped: false };
            expect(service['isDoorOpen'](tile)).toBeTrue();
        });
    });
});
