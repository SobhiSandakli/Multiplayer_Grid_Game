import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GridService } from '@app/services/grid/grid.service';
import { GameGridComponent } from './game-grid.component';

describe('GameGridComponent', () => {
    let component: GameGridComponent;
    let fixture: ComponentFixture<GameGridComponent>;
    let gridServiceSpy: jasmine.SpyObj<GridService>;

    beforeEach(async () => {
        // Create a mock GridService with a spy on the gridTiles$ observable
        gridServiceSpy = jasmine.createSpyObj('GridService', ['gridTiles$']);
        gridServiceSpy.gridTiles$ = of([[{ images: ['image1.png'], isOccuped: false }]]); // Mock data

        await TestBed.configureTestingModule({
            declarations: [GameGridComponent],
            providers: [{ provide: GridService, useValue: gridServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameGridComponent);
        component = fixture.componentInstance;
    });

    describe('Component Initialization', () => {
        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should subscribe to gridTiles$ and populate gridTiles', () => {
            fixture.detectChanges(); // Trigger ngOnInit

            // Check if gridTiles were set correctly
            expect(component.gridTiles).toEqual([[{ images: ['image1.png'], isOccuped: false }]]);
            expect(gridServiceSpy.gridTiles$).toBeTruthy();
        });
    });

    describe('Subscription Management', () => {
        it('should add gridTiles$ subscription to the subscriptions collection', () => {
            fixture.detectChanges(); // Trigger ngOnInit

            // Check that the subscription is not closed after initialization
            expect(component['subscriptions'].closed).toBe(false);
        });

        it('should unsubscribe from all subscriptions on component destruction', () => {
            fixture.detectChanges(); // Trigger ngOnInit
            component.ngOnDestroy();

            // After ngOnDestroy, the subscription should be closed
            expect(component['subscriptions'].closed).toBe(true);
        });
    });
});
