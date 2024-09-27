import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { FaIconComponent, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons'; // Import the solid icons

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let library: FaIconLibrary;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ButtonComponent],
      imports: [RouterTestingModule, FaIconComponent], // Import FaIconComponent
    }).compileComponents();

    library = TestBed.inject(FaIconLibrary);
    library.addIconPacks(fas); // Add the solid icons to the library
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display label text', () => {
    component.label = 'Test Button';
    component.icon = ['fas', 'arrow-left']; // Add a default icon to avoid the "icon is required" error
    fixture.detectChanges();
    const buttonElement: HTMLElement = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(buttonElement.textContent).toContain('Test Button');
  });

  it('should display an icon when provided', () => {
    component.icon = ['fas', 'arrow-left'];
    fixture.detectChanges(); // Trigger change detection
    const iconElement = fixture.debugElement.query(By.directive(FaIconComponent));
    expect(iconElement).toBeTruthy(); // Check if the icon is present in the template
  });

  it('should emit buttonClick event when button is clicked', () => {
    spyOn(component.buttonClick, 'emit'); // Spy on the emit method of buttonClick
    component.icon = ['fas', 'arrow-left']; // Ensure icon is set to avoid error
    fixture.detectChanges();
    const buttonElement = fixture.debugElement.query(By.css('button'));
    buttonElement.triggerEventHandler('click', null); // Trigger a click event
    expect(component.buttonClick.emit).toHaveBeenCalled(); // Check if the emit method was called
  });

  it('should use the routerLink input', () => {
    component.routerLink = ['/home'];
    component.icon = ['fas', 'arrow-left']; // Ensure icon is set to avoid error
    fixture.detectChanges();
    const buttonElement = fixture.debugElement.query(By.css('button'));
    expect(buttonElement.attributes['ng-reflect-router-link']).toBe('/home'); // Check if the router link is set correctly
  });

  it('should call onClick() when the button is clicked', () => {
    spyOn(component, 'onClick'); // Spy on the onClick method
    component.icon = ['fas', 'arrow-left']; // Ensure icon is set to avoid error
    fixture.detectChanges();
    const buttonElement = fixture.debugElement.query(By.css('button'));
    buttonElement.triggerEventHandler('click', null); // Trigger a click event
    expect(component.onClick).toHaveBeenCalled(); // Check if onClick was called
  });
});
