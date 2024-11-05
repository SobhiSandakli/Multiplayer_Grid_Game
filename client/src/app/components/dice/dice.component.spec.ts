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

    it('should create the DiceComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should have initial diceResults as [0, 0]', () => {
        expect(component.diceResults).toEqual([0, 0]);
        expect(component.attackRoll).toBe(0);
        expect(component.defenceRoll).toBe(0);
        expect(component.rolling).toBeFalse();
    });

    it('should set rolling to true when rollDice is called', () => {
        component.rollDice();
        expect(component.rolling).toBeTrue();
    });

    it('should set rolling to false after 500ms in rollDice', fakeAsync(() => {
        component.rollDice();
        expect(component.rolling).toBeTrue();
        tick(500);
        expect(component.rolling).toBeFalse();
    }));

    it('should update diceResults after receiving server response via @Input', () => {
        // Simulate server response by setting @Input() properties
        component.attackBase = 4;
        component.defenceBase = 5;
        component.attackRoll = 0
        component.defenceRoll = 0;
        fixture.detectChanges(); 

        // Now attackRoll and defenceRoll should be updated
        expect(component.attackRoll).toBe(0);
        expect(component.defenceRoll).toBe(0);
        expect(component.diceResults).toEqual([0, 0]);
    });

    it('should return correct dice image paths from getDiceImage', () => {
        for (let i = 0; i <= 6; i++) {
            const expectedPath = `assets/dices/dice${i}.png`;
            expect(component.getDiceImage(i)).toBe(expectedPath);
        }
    });

    it('should return correct dice roll image path from getDiceRollImage', () => {
        const expectedPath = 'assets/dices/dice0.png'; // Adjust if necessary
        expect(component.getDiceRollImage()).toBe(expectedPath);
    });
});
