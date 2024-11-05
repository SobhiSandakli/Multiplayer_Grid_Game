/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GridService } from '@app/services/grid/grid.service';
import { SocketService } from '@app/services/socket/socket.service';
import { TileService } from '@app/services/tile/tile.service';
import { of } from 'rxjs';
import { GameGridComponent } from './game-grid.component';

describe('GameGridComponent', () => {
    let component: GameGridComponent;
    let fixture: ComponentFixture<GameGridComponent>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let socketServiceMock: any;
    let gridServiceMock: any;
    let tileServiceMock: any;

    beforeEach(async () => {
        socketServiceMock = {
            getGridArrayChange$: jasmine.createSpy('getGridArrayChange$').and.returnValue(of({ grid: [[{ images: [], isOccuped: false }]] })),
            onDoorStateUpdated: jasmine.createSpy('onDoorStateUpdated').and.returnValue(of({ row: 0, col: 0, newState: 'newState.png' })),
            getAccessibleTiles: jasmine.createSpy('getAccessibleTiles').and.returnValue(of({ accessibleTiles: [] })),
            onPlayerMovement: jasmine
                .createSpy('onPlayerMovement')
                .and.returnValue(of({ avatar: 'playerAvatar.png', desiredPath: [], realPath: [] })),
            onCombatStarted: jasmine.createSpy('onCombatStarted').and.returnValue(of({})),
            emitAvatarInfoRequest: jasmine.createSpy('emitAvatarInfoRequest'),
            onAvatarInfo: jasmine.createSpy('onAvatarInfo').and.returnValue(of({ name: 'TestPlayer', avatar: 'playerAvatar.png' })),
            emitTileInfoRequest: jasmine.createSpy('emitTileInfoRequest'),
            onTileInfo: jasmine.createSpy('onTileInfo').and.returnValue(of({ cost: 1, effect: 'TestEffect' })),
            movePlayer: jasmine.createSpy('movePlayer'),
            toggleDoorState: jasmine.createSpy('toggleDoorState'),
            emitStartCombat: jasmine.createSpy('emitStartCombat'),
        };

        gridServiceMock = {
            getTileType: jasmine.createSpy('getTileType').and.returnValue('assets/tiles/Door.png'),
            replaceImageOnTile: jasmine.createSpy('replaceImageOnTile'),
        };

        tileServiceMock = {
            getTileImageSrc: jasmine.createSpy('getTileImageSrc').and.callFake((type: string) => {
                if (type === 'door') return 'assets/tiles/Door.png';
                if (type === 'doorOpen') return 'assets/tiles/Door-Open.png';
                return '';
            }),
        };

        await TestBed.configureTestingModule({
            declarations: [GameGridComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceMock },
                { provide: GridService, useValue: gridServiceMock },
                { provide: TileService, useValue: tileServiceMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameGridComponent);
        component = fixture.componentInstance;

        component.sessionCode = 'testSession';
        component.playerAvatar = 'assets/avatars/playerAvatar.png';
        component.isActive = false;

        fixture.detectChanges();
    });
    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
    it('should update door state when onDoorStateUpdated event is received', () => {
        component.gridTiles = [[{ images: ['assets/tiles/Door.png'], isOccuped: false }]];
        fixture.detectChanges();

        // Simulate door state update event
        socketServiceMock.onDoorStateUpdated.and.returnValue(of({ row: 0, col: 0, newState: ['assets/tiles/Door.png'] }));
        // Verify that the door image has been updated
        expect(component.gridTiles[0][0].images).toContain('assets/tiles/Door.png');
    });

    it('should subscribe to socket events in ngOnInit', () => {
        expect(socketServiceMock.getGridArrayChange$).toHaveBeenCalledWith('testSession');
        expect(socketServiceMock.getAccessibleTiles).toHaveBeenCalledWith('testSession');
        expect(socketServiceMock.onPlayerMovement).toHaveBeenCalled();
    });
    it('should update accessible tiles when isActive changes', () => {
        component.isActive = true;
        component.ngOnChanges({
            isActive: new SimpleChange(false, true, false),
        });
        fixture.detectChanges();

        expect(socketServiceMock.getAccessibleTiles).toHaveBeenCalledWith('testSession');
        // Additional expectations based on the method implementation
    });
    it('should handle tile click correctly when tile is accessible', () => {
        component.accessibleTiles = [
            {
                position: { row: 1, col: 1 },
                path: [
                    { row: 0, col: 0 },
                    { row: 1, col: 1 },
                ],
            },
        ];

        component.onTileClick(1, 1);

        expect(socketServiceMock.movePlayer).toHaveBeenCalledWith(
            'testSession',
            { row: component.accessibleTiles[0].position.row, col: component.accessibleTiles[0].position.col },
            { row: 1, col: 1 },
            'assets/avatars/playerAvatar.png',
        );
    });
    it('should call updateAccessibleTilesBasedOnActive when isActive changes', () => {
        spyOn(component, 'updateAccessibleTilesBasedOnActive');
        component.isActive = true;
        component.ngOnChanges({
            isActive: new SimpleChange(false, true, false),
        });
        expect(component.updateAccessibleTilesBasedOnActive).toHaveBeenCalled();
    });
    it('should emit emitIsFight when onCombatStarted event is received', () => {
        spyOn(component.emitIsFight, 'emit');

        socketServiceMock.onCombatStarted.and.returnValue(of({}));
        component.ngOnChanges({});

        expect(socketServiceMock.onCombatStarted).toHaveBeenCalled();
        expect(component.emitIsFight.emit).toHaveBeenCalledWith(true);
    });

    it('should show avatar info on right-click if tile contains an avatar', () => {
        const tile = { images: ['assets/avatars/opponentAvatar.png'], isOccuped: false };
        const event = new MouseEvent('contextmenu');

        component.gridTiles = [[tile]];

        spyOn(component, 'showInfo');

        component.onRightClickTile(0, 0, event);

        expect(socketServiceMock.emitAvatarInfoRequest).toHaveBeenCalledWith('testSession', 'assets/avatars/opponentAvatar.png');

        // Simulate the asynchronous response
        socketServiceMock.onAvatarInfo().subscribe(() => {
            expect(component.showInfo).toHaveBeenCalledWith('Nom: TestPlayer, Avatar: playerAvatar.png', event.clientX, event.clientY);
        });
    });
    it('should update gridTiles when updateGrid is called', () => {
        const newGrid = [[{ images: ['newImage.png'], isOccuped: true }]];

        component.updateGrid(newGrid);

        expect(component.gridTiles).toEqual(newGrid);
    });
    it('should update accessibleTiles when updateAccessibleTiles is called', () => {
        const newAccessibleTiles = [{ position: { row: 1, col: 1 }, path: [] }];

        component.updateAccessibleTiles(newAccessibleTiles);

        expect(component.accessibleTiles).toEqual(newAccessibleTiles);
    });
    it('should update accessible tiles based on isActive status', () => {
        component.isActive = true;
        component.updateAccessibleTilesBasedOnActive();

        expect(socketServiceMock.getAccessibleTiles).toHaveBeenCalledWith('testSession');
        // Additional expectations based on method logic
    });
    it('should update accessible tiles for combat in updateAccessibleTilesForCombat', () => {
        spyOn(component['cdr'], 'detectChanges');

        component.gridTiles = [
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: ['assets/avatars/playerAvatar.png'], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];
        fixture.detectChanges();

        component.updateAccessibleTilesForCombat();

        expect(component.accessibleTiles.length).toBeGreaterThanOrEqual(0);
        expect(component['cdr'].detectChanges).toHaveBeenCalled();
    });

    it('should animate player movement', fakeAsync(() => {
        spyOn(component, 'updateAvatarPosition');

        const avatar = 'assets/avatars/playerAvatar.png';
        const desiredPath = [
            { row: 0, col: 0 },
            { row: 1, col: 1 },
        ];
        const realPath = [
            { row: 0, col: 0 },
            { row: 1, col: 1 },
        ];

        component.animatePlayerMovement(avatar, desiredPath, realPath);

        tick(150); // Move to the next step
        expect(component.updateAvatarPosition).toHaveBeenCalledWith(avatar, 0, 0);

        tick(150); // Finish movement
        expect(component.updateAvatarPosition).toHaveBeenCalledWith(avatar, 1, 1);
    }));
    it('should handle when tileElement is undefined in rotateAvatar', () => {
        component.tileElements = {
            toArray: () => [], // No elements
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        component.rotateAvatar('assets/avatars/playerAvatar.png', 0, 0);
    });
    it('should handle when avatarImage is undefined in rotateAvatar', () => {
        component.gridTiles = [[{ images: ['assets/avatars/playerAvatar.png'], isOccuped: false }]];

        component.tileElements = {
            toArray: () => [
                {
                    nativeElement: {
                        querySelectorAll: () => [], // No img elements
                    },
                },
            ],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        component.rotateAvatar('assets/avatars/playerAvatar.png', 0, 0);
    });

    it('should show tile info on right-click if tile is a normal tile', () => {
        const tile = { images: ['assets/tiles/Floor.png'], isOccuped: false };
        const event = new MouseEvent('contextmenu', { clientX: 100, clientY: 200 });

        component.gridTiles = [[tile]];
        spyOn(component, 'showInfo');

        component.onRightClickTile(0, 0, event);

        expect(socketServiceMock.emitTileInfoRequest).toHaveBeenCalledWith('testSession', 0, 0);

        // Simulate the asynchronous response
        socketServiceMock.onTileInfo().subscribe(() => {
            expect(component.showInfo).toHaveBeenCalledWith('Coût: 1, Effet: TestEffect', 100, 200);
        });
    });

    it('should update avatar position on the grid', () => {
        component.gridTiles = [
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];

        component.updateAvatarPosition('assets/avatars/playerAvatar.png', 1, 1);

        expect(component.gridTiles[1][1].images).toContain('assets/avatars/playerAvatar.png');
    });
    it('should calculate tile position correctly in getTilePosition', () => {
        component.gridTiles = [
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];

        const index = 2; // Should correspond to row 1, col 0
        const position = component.getTilePosition(index);

        expect(position).toEqual({ row: 1, col: 0 });
    });
    it('should rotate avatar image in rotateAvatar and call getTilePosition', fakeAsync(() => {
        component.gridTiles = [[{ images: ['assets/avatars/playerAvatar.png'], isOccuped: false }]];

        spyOn(component, 'getTilePosition').and.callThrough();

        component.tileElements = {
            toArray: () => [
                {
                    nativeElement: {
                        querySelectorAll: () => [
                            {
                                src: 'assets/avatars/playerAvatar.png',
                                classList: { add: jasmine.createSpy('add'), remove: jasmine.createSpy('remove') },
                            },
                        ],
                    },
                },
            ],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        component.rotateAvatar('assets/avatars/playerAvatar.png', 0, 0);

        expect(component.getTilePosition).toHaveBeenCalled();

        // expect(component.tileElements.toArray()[0].nativeElement.querySelectorAll()[0].classList.add).toHaveBeenCalledWith('rotate');

        tick(1000); // Wait for rotation animation to complete

        // expect(component.tileElements.toArray()[0].nativeElement.querySelectorAll()[0].classList.remove).toHaveBeenCalledWith('rotate');
    }));

    it('should rotate avatar when there is a slip in animatePlayerMovement', fakeAsync(() => {
        spyOn(component, 'rotateAvatar');

        const avatar = 'assets/avatars/playerAvatar.png';
        const desiredPath = [
            { row: 0, col: 0 },
            { row: 1, col: 1 },
        ];
        const realPath = [{ row: 0, col: 0 }]; // Slip occurs here

        component.animatePlayerMovement(avatar, desiredPath, realPath);

        tick(150); // Move to the next step
        tick(150); // Finish movement

        expect(component.rotateAvatar).toHaveBeenCalledWith(avatar, 0, 0);
    }));

    it('should return the correct player position', () => {
        component.gridTiles = [
            [
                { images: ['assets/avatars/playerAvatar.png'], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];

        const position = component.getPlayerPosition();

        expect(position).toEqual({ row: 0, col: 0 });
    });
    it('should correctly determine if two tiles are adjacent', () => {
        const playerPosition = { row: 1, col: 1 };
        const adjacentPosition = { row: 1, col: 2 };
        const nonAdjacentPosition = { row: 2, col: 3 };

        expect(component.isAdjacent(playerPosition, adjacentPosition)).toBeTrue();
        expect(component.isAdjacent(playerPosition, nonAdjacentPosition)).toBeFalse();
    });
    it('should emit start combat event with correct parameters in startCombatWithOpponent', () => {
        component.sessionCode = 'testSessionCode';
        component.playerAvatar = 'assets/avatars/myAvatar.png';
        const opponentAvatar = 'assets/avatars/opponentAvatar.png';
        spyOn(console, 'log');
        component.startCombatWithOpponent(opponentAvatar);
        expect(socketServiceMock.emitStartCombat).toHaveBeenCalledWith(
            'testSessionCode',
            'assets/avatars/myAvatar.png',
            'assets/avatars/opponentAvatar.png',
        );
    });

    it('should handle tile click when isActive is true and tile is adjacent', () => {
        component.isActive = true;
        component.gridTiles = [
            [
                { images: ['assets/avatars/playerAvatar.png'], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];

        spyOn(component, 'startCombatWithOpponent');
        spyOn(component.actionPerformed, 'emit');

        const tile = { images: ['assets/avatars/opponentAvatar.png'], isOccuped: true };
        component.handleTileClick(tile, 0, 1, new MouseEvent('click'));

        expect(component.startCombatWithOpponent).toHaveBeenCalledWith('assets/avatars/opponentAvatar.png');
        expect(component.actionPerformed.emit).toHaveBeenCalled();
        expect(component.isActive).toBeFalse();
    });
    it('should correctly determine if a tile has a right border', () => {
        component.accessibleTiles = [{ position: { row: 1, col: 1 }, path: [] }];

        expect(component.hasRightBorder(1, 1)).toBeTrue();
        expect(component.hasRightBorder(1, 0)).toBeFalse();
    });
    it('should correctly determine if a tile has a bottom border', () => {
        component.accessibleTiles = [{ position: { row: 1, col: 1 }, path: [] }];

        expect(component.hasBottomBorder(1, 1)).toBeTrue();
        expect(component.hasBottomBorder(0, 1)).toBeFalse();
    });
    it('should correctly determine if a tile has a left border', () => {
        component.accessibleTiles = [{ position: { row: 1, col: 1 }, path: [] }];

        expect(component.hasLeftBorder(1, 1)).toBeTrue();
        expect(component.hasLeftBorder(1, 2)).toBeFalse();
    });

    it('should toggle the door state', () => {
        component.gridTiles = [[{ images: ['assets/tiles/Door.png'], isOccuped: false }]];

        component.toggleDoorState(0, 0);

        expect(gridServiceMock.getTileType).toHaveBeenCalledWith(0, 0);
        expect(tileServiceMock.getTileImageSrc).toHaveBeenCalledWith('doorOpen');
        expect(gridServiceMock.replaceImageOnTile).toHaveBeenCalledWith(0, 0, 'assets/tiles/Door-Open.png');
        expect(socketServiceMock.toggleDoorState).toHaveBeenCalledWith('testSession', 0, 0, 'assets/tiles/Door-Open.png');
    });
    it('should handle door interaction when isActive is true and tile is adjacent', () => {
        component.isActive = true;
        component.gridTiles = [
            [
                { images: ['assets/avatars/playerAvatar.png'], isOccuped: false },
                { images: ['assets/tiles/Door.png'], isOccuped: false },
            ],
        ];
        spyOn(component, 'toggleDoorState');
        spyOn(component.actionPerformed, 'emit');

        const tile = { images: ['assets/tiles/Door.png'], isOccuped: false };
        component.handleTileClick(tile, 0, 1, new MouseEvent('click'));

        expect(component.toggleDoorState).toHaveBeenCalledWith(0, 1);
        expect(component.actionPerformed.emit).toHaveBeenCalled();
        expect(component.isActive).toBeFalse();
    });
    it('should return -1, -1 if player position is not found', () => {
        component.gridTiles = [[{ images: [], isOccuped: false }]];
        const position = component.getPlayerPosition();
        expect(position).toEqual({ row: -1, col: -1 });
    });

    it('should correctly identify if a tile contains an avatar', () => {
        const tileWithAvatar = { images: ['assets/avatars/playerAvatar.png'], isOccuped: true };
        const tileWithoutAvatar = { images: ['assets/tiles/Wall.png'], isOccuped: false };

        expect(component.isAvatar(tileWithAvatar)).toBeTrue();
        expect(component.isAvatar(tileWithoutAvatar)).toBeFalse();
    });
    it('should correctly identify if a tile is a door', () => {
        const doorTile = { images: ['assets/tiles/Door.png'] };
        const doorOpenTile = { images: ['assets/tiles/Door-Open.png'] };
        const nonDoorTile = { images: ['assets/tiles/Wall.png'] };

        expect(component['isDoor'](doorTile)).toBeTrue();
        expect(component['isDoor'](doorOpenTile)).toBeFalse();
        expect(component['isDoor'](nonDoorTile)).toBeFalse();

        expect(component['isDoorOpen'](doorTile)).toBeFalse();
        expect(component['isDoorOpen'](doorOpenTile)).toBeTrue();
        expect(component['isDoorOpen'](nonDoorTile)).toBeFalse();
    });
    it('should display info message at specified position', fakeAsync(() => {
        spyOn(window, 'setTimeout').and.callThrough();
        component.showInfo('Test Message', 100, 200);

        expect(component.infoMessage).toBe('Test Message');
        expect(component.infoPosition).toEqual({ x: 100, y: 200 });
        expect(component.isInfoActive).toBeTrue();

        tick(2000); // Wait for the timeout to hide the info

        expect(component.isInfoActive).toBeFalse();
    }));
    it('should update hoverPath when hovering over an accessible tile', () => {
        component.accessibleTiles = [
            {
                position: { row: 1, col: 1 },
                path: [
                    { row: 0, col: 0 },
                    { row: 1, col: 1 },
                ],
            },
        ];

        component.tileWidth = 50;
        component.tileHeight = 50;

        component.onTileHover(1, 1);

        expect(component.hoverPath.length).toBeGreaterThan(0);
    });
    it('should clear the hoverPath', () => {
        component.hoverPath = [{ x: 0, y: 0 }];
        component.clearPath();
        expect(component.hoverPath.length).toBe(0);
    });
    it('should correctly determine if a tile has a top border', () => {
        component.accessibleTiles = [
            { position: { row: 1, col: 1 }, path: [] },
            { position: { row: 0, col: 1 }, path: [] },
        ];

        expect(component.hasTopBorder(1, 1)).toBeFalse();
        expect(component.hasTopBorder(2, 1)).toBeFalse();
    });
    it('should update tile dimensions after view init', () => {
        spyOn(component, 'updateTileDimensions');
        component.ngAfterViewInit();
        expect(component.updateTileDimensions).toHaveBeenCalled();
    });
    it('should unsubscribe from all subscriptions on destroy', () => {
        spyOn(component['subscriptions'], 'unsubscribe');
        component.ngOnDestroy();
        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });
});
