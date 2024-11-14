/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GameGridComponent } from './game-grid.component';
import { GameGridService } from '@app/services/game-grid/gameGrid.service';
import { GridFacadeService } from '@app/services/facade/gridFacade.service';
import { ChangeDetectorRef, ElementRef, QueryList } from '@angular/core';
import { of } from 'rxjs';

describe('GameGridComponent', () => {
    let component: GameGridComponent;
    let fixture: ComponentFixture<GameGridComponent>;
    let gameGridServiceMock: jasmine.SpyObj<GameGridService>;
    let gridFacadeMock: jasmine.SpyObj<GridFacadeService>;
    let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;

    beforeEach(async () => {
        gameGridServiceMock = jasmine.createSpyObj('GameGridService', [
            'setSessionCode',
            'setPlayerAvatar',
            'updateTileDimensions',
            'calculateHoverPath',
            'getTilePosition',
            'rotateAvatar',
            'updateAvatarPosition',
            'hasTopBorder',
            'hasRightBorder',
            'hasBottomBorder',
            'hasLeftBorder',
            'handleTileClick',
            'toggleDoorState',
            'startCombatWithOpponent',
            'getPlayerPosition',
        ]);

        gridFacadeMock = jasmine.createSpyObj('GridFacadeService', [
            'getGridArrayChange$',
            'onDoorStateUpdated',
            'getAccessibleTiles',
            'onPlayerMovement',
            'onCombatStarted',
            'onAvatarInfo',
            'onTileInfo',
            'emitAvatarInfoRequest',
            'emitTileInfoRequest',
        ]);

        cdrMock = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

        await TestBed.configureTestingModule({
            declarations: [GameGridComponent],
            providers: [
                { provide: GameGridService, useValue: gameGridServiceMock },
                { provide: GridFacadeService, useValue: gridFacadeMock },
                { provide: ChangeDetectorRef, useValue: cdrMock },
            ],
        }).compileComponents();

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

    it('should initialize session code and player avatar on ngOnInit', () => {
        component.ngOnInit();
        expect(gameGridServiceMock.setSessionCode).toHaveBeenCalledWith('testSession');
        expect(gameGridServiceMock.setPlayerAvatar).toHaveBeenCalledWith('assets/avatars/playerAvatar.png');
    });

    it('should call updateGrid when receiving grid array change event', () => {
        const newGrid = [[{ images: ['assets/tiles/Door.png'], isOccuped: false }]];
        gridFacadeMock.getGridArrayChange$.and.returnValue(of({ sessionCode: 'testSession', grid: newGrid }));
        component.ngOnInit();
        expect(component.gridTiles).toEqual(newGrid);
    });

    it('should update accessible tiles when isActive changes', () => {
        spyOn(component, 'updateAccessibleTilesBasedOnActive');
        component.isActive = true;
        component.ngOnChanges({ isActive: {
            previousValue: false, currentValue: true, firstChange: false,
            isFirstChange: function (): boolean {
                throw new Error('Function not implemented.');
            }
        } });
        expect(component.updateAccessibleTilesBasedOnActive).toHaveBeenCalled();
    });

    it('should update grid tiles when calling updateGrid', () => {
        const newGrid = [[{ images: ['newImage.png'], isOccuped: true }]];
        component.updateGrid(newGrid);
        expect(component.gridTiles).toEqual(newGrid);
        expect(cdrMock.detectChanges).toHaveBeenCalled();
    });

    it('should update accessible tiles when calling updateAccessibleTiles', () => {
        const newAccessibleTiles = [{ position: { row: 1, col: 1 }, path: [] }];
        component.updateAccessibleTiles(newAccessibleTiles);
        expect(component.accessibleTiles).toEqual(newAccessibleTiles);
        expect(cdrMock.detectChanges).toHaveBeenCalled();
    });

    it('should call updateTileDimensions and set tileWidth/tileHeight on updateTileDimensions', () => {
        const tileElements = new QueryList<ElementRef>();
        gameGridServiceMock.updateTileDimensions.and.returnValue({ tileWidth: 50, tileHeight: 50 });
        component.tileElements = tileElements;
        component.updateTileDimensions();
        expect(gameGridServiceMock.updateTileDimensions).toHaveBeenCalledWith(tileElements);
        expect(component.tileWidth).toEqual(50);
        expect(component.tileHeight).toEqual(50);
    });

    it('should calculate hover path on tile hover', () => {
        component.tileWidth = 50;
        component.tileHeight = 50;
        const mockPath = [{ x: 10, y: 20 }];
        gameGridServiceMock.calculateHoverPath.and.returnValue(mockPath);
        component.onTileHover(1, 1);
        expect(component.hoverPath).toEqual(mockPath);
        expect(cdrMock.detectChanges).toHaveBeenCalled();
    });

    it('should toggle door state using gameGridService', () => {
        component.toggleDoorState(1, 1);
        expect(gameGridServiceMock.toggleDoorState).toHaveBeenCalledWith(1, 1);
    });

    it('should start combat with opponent using gameGridService', () => {
        const opponentAvatar = 'assets/avatars/opponentAvatar.png';
        component.startCombatWithOpponent(opponentAvatar);
        expect(gameGridServiceMock.startCombatWithOpponent).toHaveBeenCalledWith(opponentAvatar);
    });

    it('should clear hover path when calling clearPath', () => {
        component.hoverPath = [{ x: 0, y: 0 }];
        component.clearPath();
        expect(component.hoverPath.length).toBe(0);
    });

    it('should detect top border correctly using gameGridService', () => {
        gameGridServiceMock.hasTopBorder.and.returnValue(true);
        const result = component.hasTopBorder(1, 1);
        expect(result).toBeTrue();
        expect(gameGridServiceMock.hasTopBorder).toHaveBeenCalledWith(1, 1, component.accessibleTiles);
    });

    it('should detect right border correctly using gameGridService', () => {
        gameGridServiceMock.hasRightBorder.and.returnValue(true);
        const result = component.hasRightBorder(1, 1);
        expect(result).toBeTrue();
        expect(gameGridServiceMock.hasRightBorder).toHaveBeenCalledWith(1, 1, component.accessibleTiles);
    });

    it('should detect bottom border correctly using gameGridService', () => {
        gameGridServiceMock.hasBottomBorder.and.returnValue(true);
        const result = component.hasBottomBorder(1, 1);
        expect(result).toBeTrue();
        expect(gameGridServiceMock.hasBottomBorder).toHaveBeenCalledWith(1, 1, component.accessibleTiles);
    });

    it('should detect left border correctly using gameGridService', () => {
        gameGridServiceMock.hasLeftBorder.and.returnValue(true);
        const result = component.hasLeftBorder(1, 1);
        expect(result).toBeTrue();
        expect(gameGridServiceMock.hasLeftBorder).toHaveBeenCalledWith(1, 1, component.accessibleTiles);
    });

    it('should call gameGridService to handle tile click', () => {
        const tile = { images: ['assets/avatars/opponentAvatar.png'], isOccuped: false };
        const event = new MouseEvent('click');
        component.handleTileClick(tile, 0, 1, event);
        expect(gameGridServiceMock.handleTileClick).toHaveBeenCalledWith(
            component.isActive,
            component.accessibleTiles,
            component.gridTiles,
            tile,
            0,
            1,
            event,
        );
    });

    it('should rotate avatar using gameGridService and update view', () => {
        component.rotateAvatar('avatar.png', 1, 1);
        expect(gameGridServiceMock.rotateAvatar).toHaveBeenCalledWith('avatar.png', 1, 1, component.tileElements, component.playerAvatar);
        expect(cdrMock.detectChanges).toHaveBeenCalled();
    });

    it('should update avatar position using gameGridService and call detectChanges', () => {
        const avatar = 'assets/avatars/playerAvatar.png';
        const row = 0;
        const col = 1;
        component.updateAvatarPosition(avatar, row, col);
        expect(gameGridServiceMock.updateAvatarPosition).toHaveBeenCalledWith(avatar, row, col, component.gridTiles, cdrMock);
    });

    it('should return correct player position from gameGridService', () => {
        gameGridServiceMock.getPlayerPosition.and.returnValue({ row: 0, col: 0 });
        const result = component['getPlayerPosition']();
        expect(result).toEqual({ row: 0, col: 0 });
        expect(gameGridServiceMock.getPlayerPosition).toHaveBeenCalledWith(component.gridTiles);
    });

    it('should show tile info on right-click if tile is a normal tile', () => {
        const event = new MouseEvent('contextmenu', { clientX: 100, clientY: 200 });
        const tile = { images: ['assets/tiles/Floor.png'], isOccuped: false };
        component.gridTiles = [[tile]];
        spyOn(component, 'showInfo');

        component.onRightClickTile(0, 0, event);

        expect(gridFacadeMock.emitTileInfoRequest).toHaveBeenCalledWith('testSession', 0, 0);
        gridFacadeMock.onTileInfo().subscribe((data) => {
            expect(component.showInfo).toHaveBeenCalledWith(`Coût: ${data.cost}, Effet: ${data.effect}`, 100, 200);
        });
    });

    it('should show avatar info on right-click if tile contains an avatar', () => {
        const event = new MouseEvent('contextmenu');
        const tile = { images: ['assets/avatars/opponentAvatar.png'], isOccuped: false };
        component.gridTiles = [[tile]];
        spyOn(component, 'showInfo');

        component.onRightClickTile(0, 0, event);

        expect(gridFacadeMock.emitAvatarInfoRequest).toHaveBeenCalledWith('testSession', 'assets/avatars/opponentAvatar.png');
        gridFacadeMock.onAvatarInfo().subscribe((data) => {
            expect(component.showInfo).toHaveBeenCalledWith(`Nom: ${data.name}, Avatar: ${data.avatar}`, event.clientX, event.clientY);
        });
    });

    it('should show info message at specified position with delay', fakeAsync(() => {
        spyOn(window, 'setTimeout').and.callThrough();
        component.showInfo('Test Message', 100, 200);

        expect(component.infoMessage).toBe('Test Message');
        expect(component.infoPosition).toEqual({ x: 100, y: 200 });
        expect(component.isInfoActive).toBeTrue();

        tick(2000);
        expect(component.isInfoActive).toBeFalse();
    }));

    it('should unsubscribe from subscriptions on destroy', () => {
        spyOn(component['subscriptions'], 'unsubscribe');
        component.ngOnDestroy();
        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });
});
