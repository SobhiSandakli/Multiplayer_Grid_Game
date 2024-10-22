import { Session } from '@app/interfaces/session/session.interface';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { SessionsGateway } from './sessions.gateway';

describe('SessionsGateway', () => {
    let gateway: SessionsGateway;
    let sessionsService: SessionsService;
    let mockClient: Partial<Socket>;
    let mockServer: Partial<Server>;

    const mockSession: Session = {
        organizerId: 'client123',
        locked: false,
        maxPlayers: 4,
        players: [{ socketId: 'client123', name: 'Player1', avatar: 'avatar1', attributes: {}, isOrganizer: true }],
        selectedGameID: 'game123',
    };

    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionsGateway,
                {
                    provide: SessionsService,
                    useValue: {
                        createNewSession: jest.fn(),
                        validateCharacterCreation: jest.fn(),
                        addPlayerToSession: jest.fn(),
                        getSession: jest.fn(),
                        getTakenAvatars: jest.fn(),
                        terminateSession: jest.fn(),
                        removePlayerFromSession: jest.fn(),
                        isOrganizer: jest.fn(),
                        toggleSessionLock: jest.fn(),
                    },
                },
            ],
        }).compile();

        gateway = module.get<SessionsGateway>(SessionsGateway);
        sessionsService = module.get<SessionsService>(SessionsService);
        mockClient = {
            id: 'client123',
            join: jest.fn(),
            emit: jest.fn(),
            leave: jest.fn(),
        };

        // Inject the mock server into the gateway
        gateway['server'] = mockServer as Server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleCreateNewSession', () => {
        it('should create a new session and join the client to it', () => {
            const mockData = { maxPlayers: 4, selectedGameID: 'game123' };
            jest.spyOn(sessionsService, 'createNewSession').mockReturnValue('session123');
            gateway.handleCreateNewSession(mockClient as Socket, mockData);
            expect(sessionsService.createNewSession).toHaveBeenCalledWith(mockClient.id, mockData.maxPlayers, mockData.selectedGameID);
            expect(mockClient.join).toHaveBeenCalledWith('session123');
            expect(mockClient.emit).toHaveBeenCalledWith('sessionCreated', { sessionCode: 'session123' });
        });
    });

    describe('handleCreateCharacter', () => {
        it('should emit error if character creation validation fails', () => {
            const mockData = { sessionCode: 'session123', characterData: { name: 'hero', avatar: 'avatar1', attributes: {} } };
            jest.spyOn(sessionsService, 'validateCharacterCreation').mockReturnValue({ error: 'Invalid character' });
            gateway.handleCreateCharacter(mockClient as Socket, mockData);
            expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Invalid character' });
        });

        it('should add player to session and emit characterCreated', () => {
            const mockData = { sessionCode: 'session123', characterData: { name: 'hero', avatar: 'avatar1', attributes: {} } };
            const mockValidationResult = {
                session: mockSession,
                finalName: 'hero',
            };
            jest.spyOn(sessionsService, 'validateCharacterCreation').mockReturnValue(mockValidationResult);
            jest.spyOn(sessionsService, 'addPlayerToSession');

            gateway.handleCreateCharacter(mockClient as Socket, mockData);
            expect(sessionsService.addPlayerToSession).toHaveBeenCalledWith(mockValidationResult.session, mockClient, 'hero', mockData.characterData);
            expect(mockClient.join).toHaveBeenCalledWith('session123');
            expect(mockClient.emit).toHaveBeenCalledWith('characterCreated', { name: 'hero', sessionCode: 'session123' });
            expect(mockServer.to).toHaveBeenCalledWith('session123');
            expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockValidationResult.session.players });
        });
    });

    // describe('handleJoinGame', () => {
    //     it('should emit error if session is locked or invalid', () => {
    //         jest.spyOn(sessionsService, 'getSession').mockReturnValue({
    //             locked: true,
    //             organizerId: '',
    //             maxPlayers: 4,
    //             players: [],
    //             selectedGameID: 'game123',
    //         });
    //         gateway.handleJoinGame(mockClient as Socket, { secretCode: 'secret123' });
    //         expect(mockClient.emit).toHaveBeenCalledWith('joinGameResponse', { success: false, message: 'La salle est verrouillée.' });
    //     });

    //     it('should allow client to join a session', () => {
    //         const session = { ...mockSession, locked: false };
    //         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);
    //         gateway.handleJoinGame(mockClient as Socket, { secretCode: 'secret123' });
    //         expect(mockClient.join).toHaveBeenCalledWith('secret123');
    //         expect(mockClient.emit).toHaveBeenCalledWith('joinGameResponse', { success: true });
    //         expect(mockServer.to).toHaveBeenCalledWith('secret123');
    //         expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });
    //     });
    // });

    describe('handleDeleteSession', () => {
        it('should terminate session if client is the organizer', () => {
            jest.spyOn(sessionsService, 'getSession').mockReturnValue(mockSession);

            gateway.handleDeleteSession(mockClient as Socket, { sessionCode: 'session123' });
            expect(sessionsService.terminateSession).toHaveBeenCalledWith('session123');
            expect(mockServer.to).toHaveBeenCalledWith('session123');
            expect(mockServer.emit).toHaveBeenCalledWith('sessionDeleted', { message: "La session a été supprimée par l'organisateur." });
        });

        it('should emit error if client is not the organizer', () => {
            const mockOtherSession = { ...mockSession, organizerId: 'otherClient' };
            jest.spyOn(sessionsService, 'getSession').mockReturnValue(mockOtherSession);

            gateway.handleDeleteSession(mockClient as Socket, { sessionCode: 'session123' });
            expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Impossible de supprimer la session.' });
        });
    });

    describe('handleLeaveSession', () => {
        it('should remove player from session and emit playerListUpdate', () => {
            jest.spyOn(sessionsService, 'getSession').mockReturnValue(mockSession);
            jest.spyOn(sessionsService, 'removePlayerFromSession').mockReturnValue(true);

            gateway.handleLeaveSession(mockClient as Socket, { sessionCode: 'session123' });
            expect(mockClient.leave).toHaveBeenCalledWith('session123');
            expect(mockServer.to).toHaveBeenCalledWith('session123');
            expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
        });

        it('should terminate session if organizer leaves', () => {
            jest.spyOn(sessionsService, 'getSession').mockReturnValue(mockSession);
            jest.spyOn(sessionsService, 'removePlayerFromSession').mockReturnValue(true);
            jest.spyOn(sessionsService, 'isOrganizer').mockReturnValue(true);

            gateway.handleLeaveSession(mockClient as Socket, { sessionCode: 'session123' });
            expect(sessionsService.terminateSession).toHaveBeenCalledWith('session123');
            expect(mockServer.to).toHaveBeenCalledWith('session123');
            expect(mockServer.emit).toHaveBeenCalledWith('sessionDeleted', { message: "L'organisateur a quitté la session, elle est terminée." });
        });
    });
});
