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

    it('devrait créer le composant CreatePageComponent', () => {
        expect(component).toBeTruthy();
    });

    it('devrait initialiser avec les valeurs par défaut', () => {
        expect(component.games.length).toBeGreaterThan(0);
        expect(component.selectedGame).toBeNull();
        expect(component.showCharacterCreation).toBeFalse();
    });

    it('devrait sélectionner un jeu lorsque onGameSelected est appelé', () => {
        const gameName = 'Jeu 1';
        component.onGameSelected(gameName);
        expect(component.selectedGame).toEqual(gameName);
    });

    it("devrait activer la validation lorsqu'un jeu est sélectionné", () => {
        expect(component.enableValidation()).toBeFalse();
        component.selectedGame = 'Jeu 1';
        expect(component.enableValidation()).toBeTrue();
    });

    it('devrait afficher le formulaire de création de personnage lorsque showCharacterCreationForm est appelé', () => {
        spyOn(component, 'enableValidation').and.returnValue(true);
        component.showCharacterCreationForm();
        expect(component.showCharacterCreation).toBeTrue();
    });

    it('ne devrait pas afficher le formulaire de création si la validation est désactivée', () => {
        spyOn(component, 'enableValidation').and.returnValue(false);
        component.showCharacterCreationForm();
        expect(component.showCharacterCreation).toBeFalse();
    });

    it("devrait gérer l'événement de création de personnage", () => {
        const characterData = { name: 'Héros', avatar: 'avatar1.png' };
        spyOn(console, 'log');
        component.onCharacterCreated(characterData);
        expect(console.log).toHaveBeenCalledWith('Personnage créé :', characterData);
    });

    it("devrait réinitialiser l'état lors du retour à la sélection du jeu", () => {
        component.showCharacterCreation = true;
        component.selectedGame = 'Jeu 1';
        component.onBackToGameSelection();
        expect(component.showCharacterCreation).toBeFalse();
        expect(component.selectedGame).toBeNull();
    });

    it("devrait afficher la liste des jeux lorsque le formulaire de création n'est pas affiché", () => {
        component.showCharacterCreation = false;
        fixture.detectChanges();
        const gameListDebugElement = fixture.debugElement.query(By.css('app-game-list'));
        expect(gameListDebugElement).toBeTruthy();
    });

    it('devrait afficher le formulaire de création de personnage lorsque showCharacterCreation est vrai', () => {
        component.showCharacterCreation = true;
        fixture.detectChanges();
        const characterCreationDebugElement = fixture.debugElement.query(By.css('app-character-creation'));
        expect(characterCreationDebugElement).toBeTruthy();
    });
});
