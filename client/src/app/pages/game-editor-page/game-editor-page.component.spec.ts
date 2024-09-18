import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameEditorPageComponent } from './game-editor-page.component';

describe('GameEditorPageComponent', () => {
    let component: GameEditorPageComponent;
    let fixture: ComponentFixture<GameEditorPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameEditorPageComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
