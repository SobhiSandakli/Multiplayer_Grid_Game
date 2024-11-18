/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionService } from '@app/services/session/session.service';
import { ImportComponent } from './import.component';

describe('ImportComponent', () => {
    let component: ImportComponent;
    let fixture: ComponentFixture<ImportComponent>;
    let sessionServiceMock: jasmine.SpyObj<SessionService>;

    beforeEach(async () => {
        sessionServiceMock = jasmine.createSpyObj('SessionService', {
            openSnackBar: jasmine.createSpy('openSnackBar'),
        });

        await TestBed.configureTestingModule({
            declarations: [ImportComponent],
            providers: [{ provide: SessionService, useValue: sessionServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(ImportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should update the selected file and file name when a file is selected', () => {
        const mockFile = new File(['contenu du fichier'], 'jeu-test.json', { type: 'application/json' });
        const event = {
            target: { files: [mockFile] },
        } as unknown as Event;

        component.onFileSelected(event);

        expect(component.selectedFile).toEqual(mockFile);
        expect(component.fileName).toBe('jeu-test.json');
    });

    it('should emit importGameEvent and closeModalEvent on successful import', () => {
        const mockFileContent = JSON.stringify({ name: 'Jeu Test' });
        const mockFile = new File([mockFileContent], 'jeu-test.json', { type: 'application/json' });
        component.selectedFile = mockFile;

        spyOn(component.importGameEvent, 'emit');
        spyOn(component.closeModalEvent, 'emit');

        const fileReaderMock = jasmine.createSpyObj('FileReader', ['readAsText']);
        fileReaderMock.result = mockFileContent;

        spyOn(window, 'FileReader').and.returnValue(fileReaderMock);

        component.onImport();
        fileReaderMock.onload(new Event('load'));

        expect(component.importGameEvent.emit).toHaveBeenCalledWith(JSON.parse(mockFileContent));
        expect(component.closeModalEvent.emit).toHaveBeenCalled();
    });

    it('should handle an error when importing an invalid JSON file', () => {
        const mockFileContent = 'contenu invalide';
        const mockFile = new File([mockFileContent], 'jeu-test.json', { type: 'application/json' });
        component.selectedFile = mockFile;

        spyOn(component as any, 'handleError');

        const fileReaderMock = jasmine.createSpyObj('FileReader', ['readAsText']);
        fileReaderMock.result = mockFileContent;

        spyOn(window, 'FileReader').and.returnValue(fileReaderMock);

        component.onImport();
        fileReaderMock.onload(new Event('load'));

        expect((component as any).handleError).toHaveBeenCalledWith(jasmine.any(Error), 'Failed to import game');
    });

    it('should not proceed with import if no file is selected', () => {
        component.selectedFile = null;

        spyOn(component.importGameEvent, 'emit');

        component.onImport();

        expect(component.importGameEvent.emit).not.toHaveBeenCalled();
    });
    it('should emit closeModalEvent when onCancel is called', () => {
        spyOn(component.closeModalEvent, 'emit');

        component.onCancel();

        expect(component.closeModalEvent.emit).toHaveBeenCalled();
    });

    it('should handle an error and call openSnackBar with the error message', () => {
        const mockError = new Error('Erreur simulée');
        const fallbackMessage = 'Message de secours';

        (component as any).handleError(mockError, fallbackMessage);

        expect(sessionServiceMock.openSnackBar).toHaveBeenCalledWith('Erreur simulée');
    });

    it('should handle an error and call openSnackBar with the fallback message if the error message is empty', () => {
        const mockError = new Error('');
        const fallbackMessage = 'Message de secours';

        (component as any).handleError(mockError, fallbackMessage);

        expect(sessionServiceMock.openSnackBar).toHaveBeenCalledWith(fallbackMessage);
    });
});
