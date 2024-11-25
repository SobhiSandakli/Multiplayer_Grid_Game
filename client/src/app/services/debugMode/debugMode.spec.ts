import { TestBed } from '@angular/core/testing';
import { GameSocket } from '@app/services/game-socket/gameSocket.service';
import { SessionSocket } from '@app/services/session-socket/sessionSocket.service';
import { SessionService } from '@app/services/session/session.service';
import { Subject } from 'rxjs';
import { DebugModeService } from './debug-mode.service';

describe('DebugModeService', () => {
    let service: DebugModeService;
    let sessionSocketMock: jasmine.SpyObj<SessionSocket>;
    let sessionServiceMock: jasmine.SpyObj<SessionService>;
    let gameSocketMock: jasmine.SpyObj<GameSocket>;
    let onDebugModeToggled$: Subject<{ isDebugMode: boolean }>;
    let onOrganizerLeft$: Subject<void>;

    beforeEach(() => {
        sessionServiceMock = jasmine.createSpyObj('SessionService', [], { sessionCode: null });
        onDebugModeToggled$ = new Subject<{ isDebugMode: boolean }>();
        onOrganizerLeft$ = new Subject<void>();
        sessionSocketMock = jasmine.createSpyObj('SessionSocket', ['onDebugModeToggled']);
        sessionSocketMock.onDebugModeToggled.and.returnValue(onDebugModeToggled$.asObservable());

        sessionServiceMock = jasmine.createSpyObj('SessionService', ['isOrganizer']);
        Object.defineProperty(sessionServiceMock, 'isOrganizer', { value: true });

        gameSocketMock = jasmine.createSpyObj('GameSocket', ['onOrganizerLeft']);
        gameSocketMock.onOrganizerLeft.and.returnValue(onOrganizerLeft$.asObservable());

        TestBed.configureTestingModule({
            providers: [
                DebugModeService,
                { provide: SessionSocket, useValue: sessionSocketMock },
                { provide: SessionService, useValue: sessionServiceMock },
                { provide: GameSocket, useValue: gameSocketMock },
            ],
        });

        service = TestBed.inject(DebugModeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update debugModeSubject when onDebugModeToggled emits', () => {
        const debugModeSubjectSpy = spyOn(service.debugModeSubject, 'next');
        const debugModeData = { isDebugMode: true };

        onDebugModeToggled$.next(debugModeData);

        expect(debugModeSubjectSpy).toHaveBeenCalledWith(debugModeData.isDebugMode);
    });

    it('should set debugMode to false when organizer leaves', () => {
        service.debugModeSubject.next(true); 
        onOrganizerLeft$.next();

        expect(service.debugModeSubject.value).toBe(false);
    });

    it('should add keydown event listener if user is organizer', () => {
        const addEventListenerSpy = spyOn(document, 'addEventListener');
        new DebugModeService(sessionSocketMock, sessionServiceMock, gameSocketMock);
    
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', jasmine.any(Function));
    });

    it('should add keydown event listener if user is organizer', () => {
        const addEventListenerSpy = spyOn(document, 'addEventListener');
    
       
        new DebugModeService(sessionSocketMock, sessionServiceMock, gameSocketMock);
    
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', jasmine.any(Function));
    });

    it('should remove keydown listener on destroy', () => {
        const removeEventListenerSpy = spyOn(document, 'removeEventListener');
        service.ngOnDestroy();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', jasmine.any(Function));
    });
    it('should reset debugModeSubject to false when reset is called', () => {
        service.debugModeSubject.next(true);
        service.reset();
        expect(service.debugModeSubject.value).toBe(false);
    });
    it('should return sessionCode from sessionService', () => {
        const mockSessionCode = '1234';
        sessionServiceMock.sessionCode = mockSessionCode;
        expect(service.sessionCode).toBe(mockSessionCode);
    });
});
