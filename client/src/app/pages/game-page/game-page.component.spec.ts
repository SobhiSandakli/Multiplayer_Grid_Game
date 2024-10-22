import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GamePageComponent],
            imports: [RouterTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set showCreationPopup to true when openPopup is called', () => {
        component.openPopup();
        expect(component.showCreationPopup).toBe(true);
    });
});
