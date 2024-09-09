import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainPageComponent } from './main-page.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule], // Mock the routerLink functionality
      declarations: [MainPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // Test 1: Initial View contains "Join a game"
  it('should contain the "Join a game" button and it should be disabled', () => {
    const joinButton = fixture.debugElement.query(By.css('button:nth-child(1)')).nativeElement;
    expect(joinButton.textContent).toContain('Join');
    expect(joinButton.disabled).toBeTrue(); // Ensure it's disabled for Sprint 1
  });

  // Test 2: Initial View contains "Create a game" and redirects correctly
  it('should contain the "Create a game" button and redirect to the creation view', () => {
    const createButton = fixture.debugElement.query(By.css('button:nth-child(2)')).nativeElement;
    expect(createButton.textContent).toContain('Create a game');
    expect(createButton.getAttribute('routerLink')).toEqual('/create-page');
  });

  // Test 3: Initial View contains "Manage games" and redirects correctly
  it('should contain the "Manage games" button and redirect to the admin view', () => {
    const manageButton = fixture.debugElement.query(By.css('button:nth-child(3)')).nativeElement;
    expect(manageButton.textContent).toContain('Manage games');
    expect(manageButton.getAttribute('routerLink')).toEqual('/admin-page');
  });

  // Test 4: Initial View contains the game name and logo
  it('should display the game logo and name', () => {
    const logoElement = fixture.debugElement.query(By.css('.logo-image')).nativeElement;
    const gameTitle = fixture.debugElement.query(By.css('.header-item')).nativeElement;
    
    expect(logoElement).toBeTruthy(); // Ensure logo is present
    expect(logoElement.getAttribute('alt')).toBe('Logo Projet'); // Check logo alt text
    expect(gameTitle.textContent).toContain('Warriors of the Grid');
  });

  // Test 5: Initial View contains team number and member names
  it('should display the team number and members', () => {
    const teamElement = fixture.debugElement.query(By.css('.team-name')).nativeElement;
    const memberNames = fixture.debugElement.query(By.css('footer')).nativeElement.textContent;

    expect(teamElement.textContent).toContain('Équipe 213'); // Check team number
    expect(memberNames).toContain('Sobhi Sandakli');
    expect(memberNames).toContain('Rama Shannis');
    expect(memberNames).toContain('Noëla Panier');
    expect(memberNames).toContain('Mouneïssa Cisse');
    expect(memberNames).toContain('Ali El-Akhras');
  });
});
