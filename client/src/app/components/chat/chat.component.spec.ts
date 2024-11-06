/* eslint-disable @typescript-eslint/no-magic-numbers */
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatMemoryService } from '@app/services/chat/chatMemory.service';
import { EventsService } from '@app/services/events/events.service';
import { SocketService } from '@app/services/socket/socket.service';
import { of } from 'rxjs';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let socketServiceMock: jasmine.SpyObj<SocketService>;
    let chatMemoryServiceMock: jasmine.SpyObj<ChatMemoryService>;
    let eventsServiceMock: jasmine.SpyObj<EventsService>;

    beforeEach(async () => {
        socketServiceMock = jasmine.createSpyObj('SocketService', ['onRoomMessage', 'onMessage', 'joinRoom', 'sendRoomMessage']);
        chatMemoryServiceMock = jasmine.createSpyObj('ChatMemoryService', ['getMessages', 'saveMessage']);
        eventsServiceMock = jasmine.createSpyObj('EventsService', ['onNewEvent']);

        await TestBed.configureTestingModule({
            declarations: [ChatComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceMock },
                { provide: ChatMemoryService, useValue: chatMemoryServiceMock },
                { provide: EventsService, useValue: eventsServiceMock },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;

        component.room = 'testRoom';
        component.sender = 'testUser';
        component.isWaitingPage = false;

        const mockMessages = [
            { sender: 'user1', message: 'Hello', date: '10:00:00' },
            { sender: 'user2', message: 'Hi', date: '10:01:00' },
        ];

        chatMemoryServiceMock.getMessages.and.returnValue(mockMessages);
        socketServiceMock.onRoomMessage.and.returnValue(of());
        socketServiceMock.onMessage.and.returnValue(of());
        eventsServiceMock.onNewEvent.and.returnValue(of());

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize messages from chatMemoryService', () => {
        expect(chatMemoryServiceMock.getMessages).toHaveBeenCalledWith('testRoom');
        expect(component.messages).toEqual([
            { sender: 'user1', message: 'Hello', date: '10:00:00' },
            { sender: 'user2', message: 'Hi', date: '10:01:00' },
        ]);
    });

    it('should join room in ngOnInit', () => {
        expect(socketServiceMock.joinRoom).toHaveBeenCalledWith('testRoom', 'testUser', false);
        expect(component.connected).toBeTrue();
    });

    it('should add received room messages to messages array', () => {
        const messageData = 'user1:Hello there';
        socketServiceMock.onRoomMessage.and.returnValue(of(messageData));
        chatMemoryServiceMock.getMessages.and.returnValue([]);

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.messages.length).toBe(1);
        expect(component.messages[0].sender).toBe('user1');
        expect(component.messages[0].message).toBe('Hello there');
        expect(component.messages[0].date).toBeDefined();
    });

    it('should add received system messages to messages array', () => {
        const messageData = 'System message';
        socketServiceMock.onMessage.and.returnValue(of(messageData));
        chatMemoryServiceMock.getMessages.and.returnValue([]);

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.messages.length).toBe(1);
        expect(component.messages[0].sender).toBe('Système');
        expect(component.messages[0].message).toBe('System message');
        expect(component.messages[0].date).toBeDefined();
    });

    it('should send message when sendMessage is called and message is not empty', () => {
        component.connected = true;
        component.room = 'testRoom';
        component.sender = 'testUser';
        component.message = 'Hello world';

        component.sendMessage();

        expect(socketServiceMock.sendRoomMessage).toHaveBeenCalledWith('testRoom', 'Hello world', 'testUser');
        expect(component.message).toBe('');
    });

    it('should not send message when message is empty', () => {
        component.connected = true;
        component.room = 'testRoom';
        component.sender = 'testUser';
        component.message = '   ';

        component.sendMessage();

        expect(socketServiceMock.sendRoomMessage).not.toHaveBeenCalled();
        expect(component.message).toBe('   ');
    });

    it('should add message and save it in chatMemory', () => {
        spyOn(component, 'formatTime').and.returnValue('12:00:00');

        component.addMessage('user1', 'Test message');

        expect(component.messages.length).toBe(3);
        expect(component.messages[2]).toEqual({ sender: 'user1', message: 'Test message', date: '12:00:00' });
        expect(chatMemoryServiceMock.saveMessage).toHaveBeenCalledWith('testRoom', 'user1', 'Test message', '12:00:00');
    });

    it('should format time correctly', () => {
        const date = new Date(2020, 0, 1, 9, 5, 3);
        const formattedTime = component.formatTime(date);
        expect(formattedTime).toBe('09:05:03');
    });

    it('should filter messages by sender when filterBySender is true', () => {
        component.messages = [
            { sender: 'user1', message: 'Hello', date: '10:00:00' },
            { sender: 'testUser', message: 'Hi', date: '10:01:00' },
            { sender: 'user2', message: 'Hey', date: '10:02:00' },
        ];
        component.sender = 'testUser';
        component.filterBySender = true;

        const filteredMessages = component.filteredMessages;

        expect(filteredMessages.length).toBe(1);
        expect(filteredMessages[0].sender).toBe('testUser');
    });

    it('should return all messages when filterBySender is false', () => {
        component.messages = [
            { sender: 'user1', message: 'Hello', date: '10:00:00' },
            { sender: 'testUser', message: 'Hi', date: '10:01:00' },
            { sender: 'user2', message: 'Hey', date: '10:02:00' },
        ];
        component.sender = 'testUser';
        component.filterBySender = false;

        const filteredMessages = component.filteredMessages;

        expect(filteredMessages.length).toBe(3);
    });

    it('should switch active tab', () => {
        component.activeTab = 'chat';
        component.switchTab('events');
        expect(component.activeTab).toBe('events');
    });

    it('should set isHidden to true when closeChat is called', () => {
        component.isHidden = false;
        component.closeChat();
        expect(component.isHidden).toBeTrue();
    });

    it('should set isHidden to false when showChat is called', () => {
        component.isHidden = true;
        component.showChat();
        expect(component.isHidden).toBeFalse();
    });

    it('should return true for shouldDisplayEvent if recipients include "everyone"', () => {
        const event: [string, string[]] = ['Event message', ['everyone']];
        expect(component['shouldDisplayEvent'](event)).toBeTrue();
    });

    it('should return true for shouldDisplayEvent if recipients include sender', () => {
        component.sender = 'testUser';
        const event: [string, string[]] = ['Event message', ['testUser']];
        expect(component['shouldDisplayEvent'](event)).toBeTrue();
    });

    it('should return false for shouldDisplayEvent if recipients do not include sender or "everyone"', () => {
        component.sender = 'testUser';
        const event: [string, string[]] = ['Event message', ['user1']];
        expect(component['shouldDisplayEvent'](event)).toBeFalse();
    });

    it('should add event to events when received and shouldDisplayEvent returns true', () => {
        component.sender = 'testUser';
        const event: [string, string[]] = ['Event message', ['testUser']];
        eventsServiceMock.onNewEvent.and.returnValue(of(event));

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.events.length).toBe(1);
        expect(component.events[0]).toEqual(event);
    });

    it('should not add event to events when shouldDisplayEvent returns false', () => {
        component.sender = 'testUser';
        const event: [string, string[]] = ['Event message', ['user1']];
        eventsServiceMock.onNewEvent.and.returnValue(of(event));

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.events.length).toBe(0);
    });

    it('should unsubscribe from subscriptions on ngOnDestroy', () => {
        spyOn(component['subscriptions'], 'unsubscribe');

        component.ngOnDestroy();

        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });
});
