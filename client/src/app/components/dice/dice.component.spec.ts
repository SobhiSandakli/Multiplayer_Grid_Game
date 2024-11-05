import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DiceComponent } from './dice.component';

describe('DiceComponent', () => {
    let component: DiceComponent;
    let fixture: ComponentFixture<DiceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DiceComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DiceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
        expect(component.isCombatTurn).toBeFalse();
        expect(component.attackBase).toBeNull();
        expect(component.defenceBase).toBeNull();
        expect(component.attackRoll).toBe(0);
        expect(component.defenceRoll).toBe(0);
        expect(component.success).toBeNull();
    });

    it('should set rolling to true when rollDice is called', fakeAsync(() => {
        component.rollDice();
        expect(component.rolling).toBeTrue();

        tick(500); // Simulate 500ms
        expect(component.rolling).toBeFalse();
    }));

    it('should update attackRoll and defenceRoll when showDiceRoll is called', fakeAsync(() => {
        component.showDiceRoll(4, 6);
        expect(component.rolling).toBeTrue();

        tick(300); // Simulate 300ms
        expect(component.attackRoll).toBe(4);
        expect(component.defenceRoll).toBe(6);
        expect(component.rolling).toBeFalse();
    }));

    it('should return correct dice image path from getDiceImage', () => {
        const diceNumber = 5;
        const imagePath = component.getDiceImage(diceNumber);
        expect(imagePath).toBe('assets/dices/dice5.png');
    });

    it('should return correct rolling dice image path from getDiceRollImage', () => {
        const imagePath = component.getDiceRollImage();
        expect(imagePath).toBe('assets/dices/dice0.png');
    });

    it('should display dice roll images based on attackRoll and defenceRoll', () => {
        component.attackRoll = 3;
        component.defenceRoll = 2;

        const attackDiceImage = component.getDiceImage(component.attackRoll);
        const defenceDiceImage = component.getDiceImage(component.defenceRoll);

        expect(attackDiceImage).toBe('assets/dices/dice3.png');
        expect(defenceDiceImage).toBe('assets/dices/dice2.png');
    });
});
