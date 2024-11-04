import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/socket/socket.service';
import { of } from 'rxjs';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let socketService: SocketService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChatComponent],
            providers: [SocketService],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        socketService = TestBed.inject(SocketService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should switch tab', () => {
        const tab = 'chat';
        component.switchTab(tab);
        expect(component.activeTab).toEqual(tab);
    });

    it('should close chat', () => {
        component.closeChat();
        expect(component.isHidden).toBeTrue();
    });

    it('should show chat', () => {
        component.showChat();
        expect(component.isHidden).toBeFalse();
    });

    it('should send room message', () => {
        const room = 'room1';
        const message = 'Hello';
        const sender = 'user1';
        spyOn(socketService, 'sendRoomMessage');
        component.room = room;
        component.message = message;
        component.sender = sender;
        component.connected = true;
        component.sendMessage();
        expect(socketService.sendRoomMessage).toHaveBeenCalledWith(room, message.trim(), sender);
        expect(component.message).toEqual('');
    });

    it('should format time', () => {
        const year = 2022;
        const month = 0;
        const day = 1;
        const hours = 10;
        const minutes = 30;
        const seconds = 0;

        const date = new Date(year, month, day, hours, minutes, seconds);
        const formattedTime = component.formatTime(date);
        expect(formattedTime).toEqual('10:30:00');
    });

    it('should handle room messages in ngOnInit', () => {
        spyOn(socketService, 'onRoomMessage').and.returnValue(of('User:Test message'));
        component.ngOnInit();
        fixture.detectChanges();

        expect(component.messages.length).toBe(1); 
        expect(component.messages[0]).toEqual({ sender: 'User', message: 'Test message', date: jasmine.any(String) });
    });
});
