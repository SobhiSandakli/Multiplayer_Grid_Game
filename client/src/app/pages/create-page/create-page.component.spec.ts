import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CharacterCreationComponent } from '@app/components/character-creation/character-creation.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { CreatePageComponent } from './create-page.component';

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, CreatePageComponent, GameListComponent, CharacterCreationComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the CreatePageComponent component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.games.length).toBeGreaterThan(0);
        expect(component.selectedGame).toBeNull();
        expect(component.showCharacterCreation).toBeFalse();
    });

    it('should select a game when onGameSelected is called', () => {
        const gameName = 'Game 1';
        component.onGameSelected(gameName);
        expect(component.selectedGame).toEqual(gameName);
    });

    it('should enable validation when a game is selected', () => {
        expect(component.enableValidation()).toBeFalse();
        component.selectedGame = 'Game 1';
        expect(component.enableValidation()).toBeTrue();
    });

    it('should display the character creation form when showCharacterCreationForm is called', () => {
        spyOn(component, 'enableValidation').and.returnValue(true);
        component.showCharacterCreationForm();
        expect(component.showCharacterCreation).toBeTrue();
    });

    it('should not display the creation form if validation is disabled', () => {
        spyOn(component, 'enableValidation').and.returnValue(false);
        component.showCharacterCreationForm();
        expect(component.showCharacterCreation).toBeFalse();
    });

    it('should reset the state when returning to game selection', () => {
        component.showCharacterCreation = true;
        component.selectedGame = 'Game 1';
        component.onBackToGameSelection();
        expect(component.showCharacterCreation).toBeFalse();
        expect(component.selectedGame).toBeNull();
    });

    it('should display the game list when the creation form is not displayed', () => {
        component.showCharacterCreation = false;
        fixture.detectChanges();
        const gameListDebugElement = fixture.debugElement.query(By.css('app-game-list'));
        expect(gameListDebugElement).toBeTruthy();
    });

    it('should display the character creation form when showCharacterCreation is true', () => {
        component.showCharacterCreation = true;
        fixture.detectChanges();
        const characterCreationDebugElement = fixture.debugElement.query(By.css('app-character-creation'));
        expect(characterCreationDebugElement).toBeTruthy();
    });
});
