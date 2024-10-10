import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { GameEditorPageComponent } from './game-editor-page.component';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { SaveService } from '@app/services/save/save.service';
import { Game } from '@app/interfaces/game-model.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('GameEditorPageComponent', () => {
    let component: GameEditorPageComponent;
    let fixture: ComponentFixture<GameEditorPageComponent>;
    let mockGameFacade: jasmine.SpyObj<GameFacadeService>;
    let mockDragDropService: jasmine.SpyObj<DragDropService>;
    let mockSaveService: jasmine.SpyObj<SaveService>;
    let mockRoute: any;

    beforeEach(async () => {
        mockGameFacade = jasmine.createSpyObj('GameFacadeService', ['fetchGame', 'resetDefaultGrid']);
        mockDragDropService = jasmine.createSpyObj('DragDropService', ['setInvalid']);
        mockSaveService = jasmine.createSpyObj('SaveService', ['onNameInput', 'onDescriptionInput', 'onSave']);
        
        mockRoute = {
            queryParams: of({ gameId: '123' }),
        };

        await TestBed.configureTestingModule({
            declarations: [GameEditorPageComponent, ObjectContainerComponent],
            providers: [
                { provide: GameFacadeService, useValue: mockGameFacade },
                { provide: DragDropService, useValue: mockDragDropService },
                { provide: SaveService, useValue: mockSaveService },
                { provide: ActivatedRoute, useValue: mockRoute },
            ],
            imports: [FontAwesomeModule]
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load the game when gameId is present in query params', () => {
        const mockGame: Game = {
            name: 'Test Game', description: 'Test Description', _id: '123', grid: [],
            size: '',
            mode: '',
            image: '',
            date: new Date(),
            visibility: false
        };
        mockGameFacade.fetchGame.and.returnValue(of(mockGame));

        component.ngOnInit();
        expect(mockGameFacade.fetchGame).toHaveBeenCalledWith('123');
        expect(component.gameName).toBe(mockGame.name);
        expect(component.gameDescription).toBe(mockGame.description);
        expect(mockDragDropService.setInvalid).toHaveBeenCalledWith(component.objectContainer.startedPointsIndexInList);
    });

    it('should call onNameInput from saveService when onNameInput is triggered', () => {
        const event = new Event('input');
        component.gameName = 'Old Name';

        mockSaveService.onNameInput.and.returnValue('New Name');
        component.onNameInput(event);

        expect(mockSaveService.onNameInput).toHaveBeenCalledWith(event, 'Old Name');
        expect(component.gameName).toBe('New Name');
    });

    it('should call onDescriptionInput from saveService when onDescriptionInput is triggered', () => {
        const event = new Event('input');
        component.gameDescription = 'Old Description';

        mockSaveService.onDescriptionInput.and.returnValue('New Description');
        component.onDescriptionInput(event);

        expect(mockSaveService.onDescriptionInput).toHaveBeenCalledWith(event, 'Old Description');
        expect(component.gameDescription).toBe('New Description');
    });

    it('should call saveService.onSave when saveGame is called', () => {
        component.gameName = 'Test Name';
        component.gameDescription = 'Test Description';

        component.saveGame();
        expect(mockSaveService.onSave).toHaveBeenCalledWith('Test Name', 'Test Description');
    });

    it('should reset the game if confirmReset is called', () => {
        spyOn(component, 'reset');
        component.showCreationPopup = true;

        component.confirmReset();
        expect(component.showCreationPopup).toBe(false);
        expect(component.reset).toHaveBeenCalled();
    });

    it('should close the popup if cancelReset is called', () => {
        component.showCreationPopup = true;
        component.cancelReset();
        expect(component.showCreationPopup).toBe(false);
    });

    it('should open the popup when openPopup is called', () => {
        component.showCreationPopup = false;
        component.openPopup();
        expect(component.showCreationPopup).toBe(true);
    });

    it('should reset the game to default when no gameId is provided', () => {
        component.gameId = '';
        spyOn(component.objectContainer, 'resetDefaultContainer');
        
        component.reset();
        expect(component.gameName).toBe('');
        expect(component.gameDescription).toBe('');
        expect(mockGameFacade.resetDefaultGrid).toHaveBeenCalled();
        expect(component.objectContainer.resetDefaultContainer).toHaveBeenCalled();
    });
});
