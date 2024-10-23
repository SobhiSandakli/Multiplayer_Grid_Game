import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MainPageComponent } from './main-page.component';
// eslint-disable-next-line import/no-deprecated
import { RouterTestingModule } from '@angular/router/testing';
import { routes } from 'src/main';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            // eslint-disable-next-line import/no-deprecated
            imports: [CommonModule, RouterTestingModule.withRoutes(routes), BrowserAnimationsModule],
            declarations: [MainPageComponent],
        }).compileComponents();

        router = TestBed.inject(Router);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
    it('should contain the "Joindre une partie " button and redirect to the home view', async () => {
        const createButton = fixture.debugElement.query(By.css('button:nth-child(1)')).nativeElement;
        createButton.click();
        fixture.detectChanges();

        await fixture.whenStable();
        expect(router.url).toBe('/join-game');
    });

    it('should contain the "Create a game" button and redirect to the creation view', async () => {
        const createButton = fixture.debugElement.query(By.css('button:nth-child(2)')).nativeElement;
        createButton.click();
        fixture.detectChanges();

        await fixture.whenStable();
        expect(router.url).toBe('/create-page');
    });

    it('should contain the "Manage games" button and redirect to the admin view', async () => {
        const manageButton = fixture.debugElement.query(By.css('button:nth-child(3)')).nativeElement;
        manageButton.click();
        fixture.detectChanges();

        await fixture.whenStable();
        expect(router.url).toBe('/admin-page');
    });
});
