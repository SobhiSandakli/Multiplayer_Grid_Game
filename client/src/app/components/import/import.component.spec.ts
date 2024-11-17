/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportComponent } from './import.component';

describe('ImportComponent', () => {
    let component: ImportComponent;
    let fixture: ComponentFixture<ImportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ImportComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ImportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
    it('should return if selectedFile is null', () => {
        component.selectedFile = null;
        spyOn(component.importGameEvent, 'emit');
        spyOn(component.closeModalEvent, 'emit');

        component.onImport();

        expect(component.importGameEvent.emit).not.toHaveBeenCalled();
        expect(component.closeModalEvent.emit).not.toHaveBeenCalled();
    });
    it('should emit importGameEvent and closeModalEvent with valid JSON content', () => {
        const fileContent = '{"name": "Test Game"}';
        const mockFile = new File([fileContent], 'test.json', { type: 'application/json' });
        component.selectedFile = mockFile;

        spyOn(component.importGameEvent, 'emit');
        spyOn(component.closeModalEvent, 'emit');

        const mockFileReader = {
            result: null as string | null,
            onload: null as unknown as () => void,
            readAsText() {
                this.result = fileContent;
                if (this.onload) {
                    this.onload();
                }
            },
        };

        spyOn(window as any, 'FileReader').and.returnValue(mockFileReader);

        component.onImport();

        expect(component.importGameEvent.emit).toHaveBeenCalledWith({ name: 'Test Game' });
        expect(component.closeModalEvent.emit).toHaveBeenCalled();
    });
    it('should handle invalid JSON content and not emit importGameEvent', () => {
        const fileContent = 'invalid json';
        const mockFile = new File([fileContent], 'test.json', { type: 'application/json' });
        component.selectedFile = mockFile;

        spyOn(component.importGameEvent, 'emit');
        spyOn(component.closeModalEvent, 'emit');
        spyOn(console, 'error');

        spyOn(window, 'FileReader').and.returnValue({
            readAsText() {
                this.onload({ target: { result: fileContent } });
            },
        } as any);

        component.onImport();
        expect(component.importGameEvent.emit).not.toHaveBeenCalled();
        expect(component.closeModalEvent.emit).not.toHaveBeenCalled();
    });

    it('should update fileName and selectedFile when a file is selected', () => {
        const file = new File(['content'], 'test-file.json', { type: 'application/json' });
        const event = { target: { files: [file] } } as unknown as Event;

        component.onFileSelected(event);

        expect(component.selectedFile).toEqual(file);
        expect(component.fileName).toBe('test-file.json');
    });

    it('should not update fileName and selectedFile if no file is selected', () => {
        const event = { target: { files: [] } } as unknown as Event;

        component.onFileSelected(event);

        expect(component.selectedFile).toBeNull();
        expect(component.fileName).toBeNull();
    });
    it('should emit closeModalEvent on cancel', () => {
        spyOn(component.closeModalEvent, 'emit');
        component.onCancel();

        expect(component.closeModalEvent.emit).toHaveBeenCalled();
    });
});
