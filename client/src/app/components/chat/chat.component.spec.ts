import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatMemoryService } from '@app/services/chat/chatMemory.service';
import { EventsService } from '@app/services/events/events.service';
import { ChatSocket } from '@app/services/socket/chatSocket.service';
import { Subject } from 'rxjs';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let chatMemorySpy: jasmine.SpyObj<ChatMemoryService>;
    let eventsServiceSpy: jasmine.SpyObj<EventsService>;
    let chatSocketSpy: jasmine.SpyObj<ChatSocket>;
    const messageSubject = new Subject<string>();
    const roomMessageSubject = new Subject<string>();
    const eventSubject = new Subject<[string, string[]]>();

    beforeEach(() => {
        chatMemorySpy = jasmine.createSpyObj('ChatMemoryService', ['getMessages', 'saveMessage']);
        eventsServiceSpy = jasmine.createSpyObj('EventsService', ['onNewEvent']);
        chatSocketSpy = jasmine.createSpyObj('ChatSocket', [
            'onMessage',
            'onRoomMessage',
            'joinRoom',
            'sendRoomMessage',
        ]);

        chatMemorySpy.getMessages.and.returnValue([]);
        chatSocketSpy.onMessage.and.returnValue(messageSubject.asObservable());
        chatSocketSpy.onRoomMessage.and.returnValue(roomMessageSubject.asObservable());
        eventsServiceSpy.onNewEvent.and.returnValue(eventSubject.asObservable());

        TestBed.configureTestingModule({
            declarations: [ChatComponent],
            providers: [
                { provide: ChatMemoryService, useValue: chatMemorySpy },
                { provide: EventsService, useValue: eventsServiceSpy },
                { provide: ChatSocket, useValue: chatSocketSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        component.room = 'test-room';
        component.sender = 'test-sender';
        component.isWaitingPage = false;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize messages from chatMemory', () => {
        expect(chatMemorySpy.getMessages).toHaveBeenCalledWith('test-room');
    });

    it('should subscribe to room messages and add message', () => {
        roomMessageSubject.next('test-sender:Hello');
        expect(component.messages.length).toBe(1);
        expect(component.messages[0]).toEqual({
            sender: 'test-sender',
            message: 'Hello',
            date: jasmine.any(String),
        });
    });

    it('should subscribe to system messages and add message', () => {
        messageSubject.next('System message');
        expect(component.messages.length).toBe(1);
        expect(component.messages[0]).toEqual({
            sender: 'Système',
            message: 'System message',
            date: jasmine.any(String),
        });
    });

    it('should join room on ngOnInit', () => {
        expect(chatSocketSpy.joinRoom).toHaveBeenCalledWith('test-room', 'test-sender', false);
        expect(component.connected).toBeTrue();
    });

    it('should unsubscribe from all subscriptions on ngOnDestroy', () => {
        spyOn(component['subscriptions'], 'unsubscribe');
        component.ngOnDestroy();
        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });

    it('should add message correctly', () => {
        component.addMessage('test-sender', 'Hello');
        expect(component.messages.length).toBe(1);
        expect(component.messages[0]).toEqual({
            sender: 'test-sender',
            message: 'Hello',
            date: jasmine.any(String),
        });
        expect(chatMemorySpy.saveMessage).toHaveBeenCalled();
    });

    it('should send message and clear input', () => {
        component.message = 'Hello';
        component.connected = true;
        component.sendMessage();
        expect(chatSocketSpy.sendRoomMessage).toHaveBeenCalledWith('test-room', 'Hello', 'test-sender');
        expect(component.message).toBe('');
    });

    it('should not send empty message', () => {
        component.message = '  ';
        component.connected = true;
        component.sendMessage();
        expect(chatSocketSpy.sendRoomMessage).not.toHaveBeenCalled();
    });

    it('should filter messages by sender', () => {
        component.messages = [
            { sender: 'test-sender', message: 'Hello', date: '12:00' },
            { sender: 'other-sender', message: 'Hi', date: '12:01' },
        ];
        component.filterBySender = true;
        expect(component.filteredMessages.length).toBe(1);
        expect(component.filteredMessages[0].sender).toBe('test-sender');
    });

    it('should format time correctly', () => {
        const date = new Date('2024-11-13T12:34:56');
        const formattedTime = component.formatTime(date);
        expect(formattedTime).toBe('12:34:56');
    });

    it('should switch tab correctly', () => {
        component.switchTab('events');
        expect(component.activeTab).toBe('events');
    });

    it('should close chat', () => {
        component.closeChat();
        expect(component.isHidden).toBeTrue();
    });

    it('should show chat', () => {
        component.showChat();
        expect(component.isHidden).toBeFalse();
    });

    it('should display event if it includes sender', () => {
        const event: [string, string[]] = ['Event message', ['test-sender']];
        expect(component['shouldDisplayEvent'](event)).toBeTrue();
    });

    it('should not display event if it does not include sender', () => {
        const event: [string, string[]] = ['Event message', ['other-sender']];
        expect(component['shouldDisplayEvent'](event)).toBeFalse();
    });
    it('should add event to events array if shouldDisplayEvent returns true', () => {
        const event: [string, string[]] = ['Test Event', ['test-sender']];
        spyOn(component as any, 'shouldDisplayEvent').and.returnValue(true);
        const eventSubject = new Subject<[string, string[]]>();
        eventsServiceSpy.onNewEvent.and.returnValue(eventSubject.asObservable());
        component.ngOnInit();
        eventSubject.next(event);
        expect(component.events.length).toBe(1);
        expect(component.events[0]).toEqual(event);
    });
    
    it('should not add event to events array if shouldDisplayEvent returns false', () => {
        const event: [string, string[]] = ['Test Event', ['test-sender']];
        spyOn(component as any, 'shouldDisplayEvent').and.returnValue(false);
        const eventSubject = new Subject<[string, string[]]>();
        eventsServiceSpy.onNewEvent.and.returnValue(eventSubject.asObservable());
        component.ngOnInit();
        eventSubject.next(event);
        expect(component.events.length).toBe(0);
    });
});
