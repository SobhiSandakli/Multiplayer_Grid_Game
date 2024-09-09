import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainPageComponent } from './main-page.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { routes } from 'src/main';  // Import your routes
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';  // Optional if you're using animations

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,  // Ensure you're using CommonModule instead of BrowserModule
        RouterTestingModule.withRoutes(routes),  // Use RouterTestingModule for route-related tests
        BrowserAnimationsModule,  // Import if your component uses animations
      ],
      declarations: [MainPageComponent],
      // Note: Do not include MaterialPageComponent in the declarations or imports
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();  // Trigger initial data binding
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the "Create a game" button and redirect to the creation view', async () => {
    const createButton = fixture.debugElement.query(By.css('button:nth-child(2)')).nativeElement;
    createButton.click();
    fixture.detectChanges();

    await fixture.whenStable();  // Wait for the router to resolve the navigation
    expect(router.url).toBe('/create-page');  // Check the URL using router.url
  });

  it('should contain the "Manage games" button and redirect to the admin view', async () => {
    const manageButton = fixture.debugElement.query(By.css('button:nth-child(3)')).nativeElement;
    manageButton.click();
    fixture.detectChanges();

    await fixture.whenStable();  // Wait for the router to resolve the navigation
    expect(router.url).toBe('/admin-page');  // Check the URL using router.url
  });
});
