import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridFacadeService } from '@app/services/facade/gridFacade.service';
import { GameGridService } from '@app/services/game-grid/gameGrid.service';
import { Subject } from 'rxjs';
import { GameGridComponent } from './game-grid.component';

describe('GameGridComponent', () => {
    let component: GameGridComponent;
    let fixture: ComponentFixture<GameGridComponent>;
    let mockGameGridService: jasmine.SpyObj<GameGridService>;
    let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;
    let mockGridFacade: jasmine.SpyObj<GridFacadeService>;
    const infoMessageSubject = new Subject<any>();
    const doorStateSubject = new Subject<any>();
    const accessibleTilesSubject = new Subject<any>();
    const playerMovementSubject = new Subject<any>();
    const gridArrayChangeSubject = new Subject<any>();
    beforeEach(() => {
        mockGameGridService = jasmine.createSpyObj('GameGridService', [
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
            'setSessionCode',
            'setPlayerAvatar',
            'infoMessage$',
        ]);
        mockGridFacade = jasmine.createSpyObj('GridFacadeService', [
            'getGridArrayChange$',
            'onDoorStateUpdated',
            'getAccessibleTiles',
            'onPlayerMovement',
            'onCombatStarted',
            'onAvatarInfo',
            'onTileInfo',
        ])
        mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
        mockGameGridService.infoMessage$ = infoMessageSubject.asObservable();
        mockGridFacade.getGridArrayChange$.and.returnValue(gridArrayChangeSubject.asObservable());
        mockGridFacade.onDoorStateUpdated.and.returnValue(doorStateSubject.asObservable());
        mockGridFacade.getAccessibleTiles.and.returnValue(accessibleTilesSubject.asObservable());
        mockGridFacade.onPlayerMovement.and.returnValue(playerMovementSubject.asObservable());
        TestBed.configureTestingModule({
            declarations: [GameGridComponent],
            providers: [
                { provide: GameGridService, useValue: mockGameGridService },
                { provide: ChangeDetectorRef, useValue: mockCdr },
                { provide: GridFacadeService, useValue: mockGridFacade }
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameGridComponent);
        component = fixture.componentInstance;
        component.sessionCode = 'testSessionCode';
        component.playerAvatar = 'testAvatar';
    });
    it('should call updateTileDimensions on window resize', () => {
        spyOn(component, 'updateTileDimensions');
        window.dispatchEvent(new Event('resize'));
        expect(component.updateTileDimensions).toHaveBeenCalled();
    });

    it('should set sessionCode and playerAvatar in ngOnInit', () => {
        spyOn(component, 'updateAccessibleTilesBasedOnActive');

        component.ngOnInit();

        expect(mockGameGridService.setSessionCode).toHaveBeenCalledWith('testSessionCode');
        expect(mockGameGridService.setPlayerAvatar).toHaveBeenCalledWith('testAvatar');
        expect(component.updateAccessibleTilesBasedOnActive).toHaveBeenCalled();
    });

    it('should handle grid array change in ngOnInit', () => {
        spyOn(component, 'updateGrid');

        component.ngOnInit();

        const gridData = { grid: [[{ images: [], isOccuped: false }]] };
        gridArrayChangeSubject.next(gridData);

        expect(component.updateGrid).toHaveBeenCalledWith(gridData.grid);
    });

    it('should show info message when infoMessage$ emits', () => {
        spyOn(component, 'showInfo');

        component.ngOnInit();

        const messageData = { message: 'Test message', x: 100, y: 200 };
        infoMessageSubject.next(messageData);

        expect(component.showInfo).toHaveBeenCalledWith('Test message', 100, 200);
    });

    it('should update accessible tiles when getAccessibleTiles emits', () => {
        spyOn(component, 'updateAccessibleTiles');

        component.ngOnInit();

        const accessibleTilesData = { accessibleTiles: [] };
        accessibleTilesSubject.next(accessibleTilesData);

        expect(component.updateAccessibleTiles).toHaveBeenCalledWith([]);
    });

    it('should animate player movement when onPlayerMovement emits', () => {
        spyOn(component, 'animatePlayerMovement');

        component.ngOnInit();

        const movementData = { avatar: 'avatar1', desiredPath: [], realPath: [] };
        playerMovementSubject.next(movementData);

        expect(component.animatePlayerMovement).toHaveBeenCalledWith('avatar1', [], []);
    });

    it('should update tile dimensions in ngAfterViewInit', () => {
        spyOn(component, 'updateTileDimensions');

        component.ngAfterViewInit();

        expect(component.updateTileDimensions).toHaveBeenCalled();
    });
    it('should call getGridArrayChange$ with sessionCode', () => {
        component.getGridArrayChange$;
        expect(mockGridFacade.getGridArrayChange$).toHaveBeenCalledWith('testSessionCode');
    });

    it('should call onDoorStateUpdated', () => {
        component.onDoorStateUpdated;
        expect(mockGridFacade.onDoorStateUpdated).toHaveBeenCalled();
    });

    it('should call getAccessibleTiles with sessionCode', () => {
        component.getAccessibleTiles;
        expect(mockGridFacade.getAccessibleTiles).toHaveBeenCalledWith('testSessionCode');
    });

    it('should call onPlayerMovement', () => {
        component.onPlayerMovement;
        expect(mockGridFacade.onPlayerMovement).toHaveBeenCalled();
    });

    it('should call onCombatStarted', () => {
        component.onCombatStarted;
        expect(mockGridFacade.onCombatStarted).toHaveBeenCalled();
    });

    it('should call onAvatarInfo', () => {
        component.onAvatarInfo;
        expect(mockGridFacade.onAvatarInfo).toHaveBeenCalled();
    });

    it('should call onTileInfo', () => {
        component.onTileInfo;
        expect(mockGridFacade.onTileInfo).toHaveBeenCalled();
    });
    it('should get tile position', () => {
        component.gridTiles = [[{ images: [], isOccuped: false }]]; 
        mockGameGridService.getTilePosition.and.returnValue({ row: 0, col: 1 });
        const result = component.getTilePosition(5);
    
        expect(result).toEqual({ row: 0, col: 1 });
        expect(mockGameGridService.getTilePosition).toHaveBeenCalledWith(5, component.gridTiles[0].length);
    });
    it('should clear hover path', () => {
        component.hoverPath = [{ x: 1, y: 1 }];
        component.clearPath();
        expect(component.hoverPath).toEqual([]);
    });

    it('should check if tile has top border', () => {
        mockGameGridService.hasTopBorder.and.returnValue(true);
        const result = component.hasTopBorder(1, 2);
        expect(result).toBeTrue();
        expect(mockGameGridService.hasTopBorder).toHaveBeenCalledWith(1, 2, component.accessibleTiles);
    });

    it('should check if tile has right border', () => {
        mockGameGridService.hasRightBorder.and.returnValue(true);
        const result = component.hasRightBorder(1, 2);
        expect(result).toBeTrue();
        expect(mockGameGridService.hasRightBorder).toHaveBeenCalledWith(1, 2, component.accessibleTiles);
    });

    it('should check if tile has bottom border', () => {
        mockGameGridService.hasBottomBorder.and.returnValue(false);
        const result = component.hasBottomBorder(1, 2);
        expect(result).toBeFalse();
        expect(mockGameGridService.hasBottomBorder).toHaveBeenCalledWith(1, 2, component.accessibleTiles);
    });

    it('should check if tile has left border', () => {
        mockGameGridService.hasLeftBorder.and.returnValue(true);
        const result = component.hasLeftBorder(1, 2);
        expect(result).toBeTrue();
        expect(mockGameGridService.hasLeftBorder).toHaveBeenCalledWith(1, 2, component.accessibleTiles);
    });

    it('should handle tile click', () => {
        const tile = { images: ['image1'], isOccuped: false };
        const event = new MouseEvent('click');
        component.handleTileClick(tile, 1, 2, event);
        expect(mockGameGridService.handleTileClick).toHaveBeenCalledWith(
            {
                isActive: component.isActive,
                accessibleTiles: component.accessibleTiles,
                gridTiles: component.gridTiles,
            },
            {
                tile: tile,
                position: { row: 1, col: 2 },
            },
            event,
        );
    });

    it('should toggle door state', () => {
        component.toggleDoorState(1, 2);
        expect(mockGameGridService.toggleDoorState).toHaveBeenCalledWith(1, 2);
    });

    it('should start combat with opponent', () => {
        component.startCombatWithOpponent('opponentAvatar');
        expect(mockGameGridService.startCombatWithOpponent).toHaveBeenCalledWith('opponentAvatar');
    });
    it('should reset accessibleTiles', () => {
        mockGameGridService.getPlayerPosition.and.returnValue({ row: 1, col: 1 });
        component.accessibleTiles = [{ position: { row: 0, col: 0 }, path: [] }];
        component.updateAccessibleTilesForCombat();
        expect(component.accessibleTiles.length).toBe(0);
    });
});
