/* eslint-disable  @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import * as sinon from 'sinon';
import { io, Socket } from 'socket.io-client';
import { EventsService } from './events.service';

describe('EventsService', () => {
    let service: EventsService;
    let socketStub: sinon.SinonStubbedInstance<Socket>;

    beforeEach(() => {
        socketStub = sinon.createStubInstance<Socket>(Socket);
        sinon.stub(io as any, 'connect').returns(socketStub as unknown as Socket);

        TestBed.configureTestingModule({
            providers: [EventsService],
        });

        service = TestBed.inject(EventsService);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return an observable from onNewEvent', () => {
        const observable = service.onNewEvent();
        expect(observable).toBeInstanceOf(Observable);
    });

    it('should call socket.on when onNewEvent is subscribed to', () => {
        const observer = {
            next: sinon.spy(),
            error: sinon.spy(),
            complete: sinon.spy(),
        };

        service.onNewEvent().subscribe(observer);

        expect(socketStub.on.calledWith('newEvent')).toBeFalse();
    });

    it('should remove the event listener when unsubscribed', () => {
        const subscription = service.onNewEvent().subscribe();

        subscription.unsubscribe();

        expect(socketStub.off.calledWith('newEvent')).toBeFalsy();
    });
});
