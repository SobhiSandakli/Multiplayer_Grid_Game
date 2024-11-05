import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let service: SessionsService;
  let turnService: TurnService;
  let changeGridService: ChangeGridService;
  const session: Session = {
    organizerId: '',
    players: [{ socketId: '1', name: 'Player1', avatar: 'avatar1', attributes: {}, isOrganizer: false, position: { row: 0, col: 0 }, accessibleTiles: [] }],
    grid: [],
    maxPlayers: 4,
    selectedGameID: '',
    locked: false,
    turnOrder: [],
    currentTurnIndex: 0,
    currentPlayerSocketId: null,
    turnTimer: null,
    timeLeft: 0,
    combat: [],
    combatTurnIndex: 0,
    combatTurnTimer: null,
    combatTimeLeft: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: TurnService, useValue: {} },
        { provide: ChangeGridService, useValue: { removePlayerAvatar: jest.fn() } },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    turnService = module.get<TurnService>(TurnService);
    changeGridService = module.get<ChangeGridService>(ChangeGridService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateUniqueSessionCode', () => {
    it('should generate a unique session code', () => {
      const code = service.generateUniqueSessionCode();
      expect(code).toBeDefined();
      expect(code).toHaveLength(4);
      expect(Number(code)).toBeGreaterThanOrEqual(1000);
      expect(Number(code)).toBeLessThanOrEqual(9000);
    });
  });

  describe('createNewSession', () => {
    it('should create a new session and return the session code', () => {
      const clientId = 'test-client-id';
      const maxPlayers = 4;
      const selectedGameID = 'game-id-123';
      const sessionCode = service.createNewSession(clientId, maxPlayers, selectedGameID);

      expect(sessionCode).toBeDefined();
      const session = service.getSession(sessionCode);
      expect(session).toBeDefined();
      expect(session?.organizerId).toEqual(clientId);
      expect(session?.maxPlayers).toEqual(maxPlayers);
      expect(session?.selectedGameID).toEqual(selectedGameID);
    });
  });

  describe('validateCharacterCreation', () => {
    it('should return an error if the session code is invalid', () => {
      const characterData: CharacterData = {
        name: 'CharacterName',
        avatar: 'avatar1',
        attributes: {
          speed: { name: 'Speed', description: 'Character speed attribute', baseValue: 10, currentValue: 10 },
          life: { name: 'Life', description: 'Character life attribute', baseValue: 100, currentValue: 100 },
        },
      };
      const result = service.validateCharacterCreation('invalid-code', characterData, new Server());

      expect(result.error).toBe('Session introuvable ou code de session manquant.');
    });

    it('should return an error if the avatar is taken', () => {
      const sessionCode = service.createNewSession('client-1', 4, 'game-123');
      const characterData: CharacterData = {
        name: 'Player1',
        avatar: 'avatar1',
        attributes: {
          speed: { name: 'Speed', description: 'Character speed attribute', baseValue: 10, currentValue: 10 },
          life: { name: 'Life', description: 'Character life attribute', baseValue: 100, currentValue: 100 },
        },
      };
      service.addPlayerToSession(service.getSession(sessionCode)!, { id: 'socket-1' } as any, 'Player1', characterData);

      const result = service.validateCharacterCreation(sessionCode, characterData, new Server());
      expect(result.error).toBe('Avatar déjà pris.');
    });

    it('should return an error if the session is full', () => {
      const sessionCode = service.createNewSession('client-1', 1, 'game-123');
      const characterData: CharacterData = {
        name: 'Player1',
        avatar: 'avatar1',
        attributes: {
          speed: { name: 'Speed', description: 'Character speed attribute', baseValue: 10, currentValue: 10 },
          life: { name: 'Life', description: 'Character life attribute', baseValue: 100, currentValue: 100 },
        },
      };
      service.addPlayerToSession(service.getSession(sessionCode)!, { id: 'socket-1' } as any, 'Player1', characterData);
      const newCharacterData: CharacterData = {
        name: 'Player2',
        avatar: 'avatar2',
        attributes: {
          speed: { name: 'Speed', description: 'Character speed attribute', baseValue: 12, currentValue: 12 },
          life: { name: 'Life', description: 'Character life attribute', baseValue: 90, currentValue: 90 },
        },
      };

      const server = new Server();
      const result = service.validateCharacterCreation(sessionCode, newCharacterData, server);
      expect(result.error).toBe('Le nombre maximum de joueurs est atteint.');
      expect(service.getSession(sessionCode)?.locked).toBe(true);
    });
  });

  describe('removePlayerFromSession', () => {
    it('should remove the player from the session', () => {
      const sessionCode = service.createNewSession('client-1', 4, 'game-123');
      const session = service.getSession(sessionCode)!;
      service.addPlayerToSession(session, { id: 'socket-1' } as any, 'Player1', {
        name: 'Player1',
        avatar: 'avatar1',
        attributes: {
          speed: { name: 'Speed', description: 'Character speed attribute', baseValue: 10, currentValue: 10 },
          life: { name: 'Life', description: 'Character life attribute', baseValue: 100, currentValue: 100 },
        },
      });

      const removed = service.removePlayerFromSession(session, 'socket-1');
      expect(removed).toBe(true);
      expect(session.players.length).toBe(0);
      expect(changeGridService.removePlayerAvatar).toHaveBeenCalled();
    });

    it('should return false if the player is not in the session', () => {
      const sessionCode = service.createNewSession('client-1', 4, 'game-123');
      const session = service.getSession(sessionCode)!;
      const removed = service.removePlayerFromSession(session, 'non-existent-socket-id');
      expect(removed).toBe(false);
    });
  });
  it('should check if a client is the organizer', () => {
    session.organizerId = 'client-123';
    expect(service.isOrganizer(session, 'client-123')).toBe(true);
    expect(service.isOrganizer(session, 'client-456')).toBe(false);
  });

  it('should terminate a session', () => {
    const sessionCode = 'session-123';
    service['sessions'][sessionCode] = {} as Session;
    service.terminateSession(sessionCode);
    expect(service['sessions'][sessionCode]).toBeUndefined();
  });

  it('should toggle session lock', () => {
    session.locked = false;
    service.toggleSessionLock(session, true);
    expect(session.locked).toBe(true);

    service.toggleSessionLock(session, false);
    expect(session.locked).toBe(false);
  });

  it('should update session grid', () => {
    const sessionCode = 'session-123';
    const newGrid = [[{ images: ['image1'], isOccuped: true }]];
    service['sessions'][sessionCode] = { grid: [] } as Session;

    service.updateSessionGrid(sessionCode, newGrid);
    expect(service['sessions'][sessionCode].grid).toEqual(newGrid);
  });

  it('should get taken avatars', () => {
    const avatars = service.getTakenAvatars(session);
    expect(avatars).toEqual(['avatar1']);
  });

  it('should check if an avatar is taken', () => {
    expect(service['isAvatarTaken'](session, 'avatar1')).toBe(true);
    expect(service['isAvatarTaken'](session, 'avatar2')).toBe(false);
  });

  it('should generate a unique player name', () => {
    const uniqueName = service['getUniquePlayerName'](session, 'Player1');
    expect(uniqueName).toBe('Player1-2');
  });

  it('should send time left', () => {
    const sessionCode = 'session-123';
    session.timeLeft = 30;
    session.currentPlayerSocketId = 'socket-1';
    const server = new Server();
    jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);
    service['sessions'][sessionCode] = session;

    service.sendTimeLeft(sessionCode, server);
    expect(server.to).toHaveBeenCalledWith(sessionCode);
    expect(server.to(sessionCode).emit).toHaveBeenCalledWith('timeLeft', {
      timeLeft: 30,
      playerSocketId: 'socket-1',
    });
  });

  it('should find a player by socket ID', () => {
    const player = service.findPlayerBySocketId(session, '1');
    expect(player).toBeDefined();
    expect(player?.name).toBe('Player1');

    const nonExistentPlayer = service.findPlayerBySocketId(session, '2');
    expect(nonExistentPlayer).toBeUndefined();
  });

});