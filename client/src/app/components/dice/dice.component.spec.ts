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

  it('should have initial diceResults as [1, 1]', () => {
    expect(component.diceResults).toEqual([1, 1]);
  });

  it('should have initial rolling as false', () => {
    expect(component.rolling).toBeFalse();
  });

  it('should have initial displayRoleDice as true', () => {
    expect(component.displayRoleDice).toBeTrue();
  });

  it('should set rolling and displayRoleDice to true when rollDice is called', () => {
    component.rollDice();
    expect(component.rolling).toBeTrue();
    expect(component.displayRoleDice).toBeTrue();
  });

  it('should update diceResults and set rolling to false after timeout', fakeAsync(() => {
    component.rollDice();
    tick(300); // Simulate the passage of 300ms
    expect(component.rolling).toBeFalse();
    expect(component.displayRoleDice).toBeFalse();
    expect(component.diceResults.length).toBe(2);
    component.diceResults.forEach((result) => {
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });
  }));

  it('should return correct dice image paths from getDiceImage', () => {
    for (let i = 1; i <= 6; i++) {
      const expectedPath = `assets/dices/dice${i}.png`;
      expect(component.getDiceImage(i)).toBe(expectedPath);
    }
  });

  it('should return correct dice roll image path from getDiceRollImage', () => {
    const expectedPath = 'assets/dices/dice-roll.png';
    expect(component.getDiceRollImage()).toBe(expectedPath);
  });

  it('should not set diceResults to values outside 1-6 range', fakeAsync(() => {
    const testRuns = 100; // Run multiple times to cover randomness
    for (let i = 0; i < testRuns; i++) {
      component.rollDice();
      tick(300);
      component.diceResults.forEach((result) => {
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      });
    }
  }));
});
