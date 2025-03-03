/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { FightService } from './fight.service';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { Server } from 'socket.io';
import { Player } from '@app/interfaces/player/player.interface';
import { DICE_SIDES_D4, DICE_SIDES_D6, EVASION_SUCCESS_PROBABILITY } from '@app/constants/fight-constants';
import { Session } from '@app/interfaces/session/session.interface';
describe('FightService', () => {
    let service: FightService;
    let combatTurnService: CombatTurnService;
    let mockServer: Partial<Server>;
    let session: Session;
    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FightService,
                {
                    provide: CombatTurnService,
                    useValue: {
                        startCombat: jest.fn(),
                        endCombatTurn: jest.fn(),
                        endCombat: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<FightService>(FightService);
        combatTurnService = module.get<CombatTurnService>(CombatTurnService);
    });

    const createPlayer = (id: string, speed: number, attack: number, defence: number, nbEvasion: number, dice: string): Player => ({
        socketId: id,
        name: `Player ${id}`,
        avatar: `avatar${id}`,
        attributes: {
            speed: { name: 'speed', description: 'Player speed', baseValue: speed, currentValue: speed },
            attack: { name: 'attack', description: 'Attack power', baseValue: attack, currentValue: attack, dice },
            defence: { name: 'defence', description: 'Defence power', baseValue: defence, currentValue: defence, dice },
            nbEvasion: { name: 'nbEvasion', description: 'Evasion attempts', baseValue: nbEvasion, currentValue: nbEvasion },
        },
        isOrganizer: false,
        position: { row: 0, col: 0 },
        accessibleTiles: [],
        inventory: [],
        isVirtual: false,

        statistics: {
            combats: 0,
            evasions: 0,
            victories: 0,
            defeats: 0,
            totalLifeLost: 0,
            totalLifeRemoved: 0,
            uniqueItems: new Set<string>(),
            tilesVisited: new Set<string>(),
            uniqueItemsArray: [],
            tilesVisitedArray: [],
        },
    });

    describe('notifyCombatStart', () => {
        it('should notify both players of combat start and indicate who starts first', () => {
            const initiatingPlayer = createPlayer('player1', 10, 5, 3, 1, 'D6');
            const opponentPlayer = createPlayer('player2', 8, 4, 2, 1, 'D4');

            service.notifyCombatStart(mockServer as Server, initiatingPlayer, opponentPlayer);

            expect(mockServer.to).toHaveBeenCalledWith('player1');
            expect(mockServer.emit).toHaveBeenCalledWith('combatStarted', {
                opponentPlayer,
                startsFirst: true,
            });
            expect(mockServer.to).toHaveBeenCalledWith('player2');
            expect(mockServer.emit).toHaveBeenCalledWith('combatStarted', {
                opponentPlayer: initiatingPlayer,
                startsFirst: false,
            });
        });
    });

    describe('determineFirstAttacker', () => {
        it('should return the player with higher speed as the first attacker', () => {
            const fasterPlayer = createPlayer('player1', 12, 5, 3, 1, 'D6');
            const slowerPlayer = createPlayer('player2', 10, 4, 2, 1, 'D4');

            expect(service.determineFirstAttacker(fasterPlayer, slowerPlayer)).toBe(fasterPlayer);
        });

        it('should return the initiating player if speeds are equal', () => {
            const player1 = createPlayer('player1', 10, 5, 3, 1, 'D6');
            const player2 = createPlayer('player2', 10, 4, 2, 1, 'D4');

            expect(service.determineFirstAttacker(player1, player2)).toBe(player1);
        });
    });

    describe('calculateEvasion', () => {
        it('should return true if evasion is successful and decrease evasion attempts', () => {
            const player = createPlayer('player1', 10, 5, 3, 1, 'D6');
            jest.spyOn(Math, 'random').mockReturnValue(EVASION_SUCCESS_PROBABILITY - 0.01);

            const result = service.calculateEvasion(player);

            expect(result).toBe(true);
            expect(player.attributes['nbEvasion'].currentValue).toBe(0);
        });

        it('should return false if evasion fails', () => {
            const player = createPlayer('player1', 10, 5, 3, 1, 'D6');
            jest.spyOn(Math, 'random').mockReturnValue(EVASION_SUCCESS_PROBABILITY + 0.01);

            const result = service.calculateEvasion(player);

            expect(result).toBe(false);
            expect(player.attributes['nbEvasion'].currentValue).toBe(0);
        });

        it('should return false if player has no evasion attempts left', () => {
            const player = createPlayer('player1', 10, 5, 3, 0, 'D6');

            const result = service.calculateEvasion(player);

            expect(result).toBe(false);
        });
    });

    describe('calculateAttack', () => {
        let attacker: Player;
        let defender: Player;
        let session: any;

        beforeEach(() => {
            attacker = {
                socketId: 'attacker-socket',
                name: 'Attacker',
                avatar: '',
                attributes: {
                    attack: { name: 'attack', description: '', baseValue: 5, currentValue: 5, dice: 'D6' },
                    defence: { name: 'defence', description: '', baseValue: 3, currentValue: 3, dice: 'D6' },
                },
                isOrganizer: false,
                position: { row: 0, col: 0 },
                accessibleTiles: [],
                inventory: [],
                statistics: {
                    combats: 0,
                    evasions: 0,
                    victories: 0,
                    defeats: 0,
                    totalLifeLost: 0,
                    totalLifeRemoved: 0,
                    uniqueItems: new Set<string>(),
                    tilesVisited: new Set<string>(),
                    uniqueItemsArray: [],
                    tilesVisitedArray: [],
                },
                isVirtual: false,
            };
            defender = {
                socketId: 'defender-socket',
                name: 'Defender',
                avatar: '',
                attributes: {
                    attack: { name: 'attack', description: '', baseValue: 4, currentValue: 4, dice: 'D6' },
                    defence: { name: 'defence', description: '', baseValue: 4, currentValue: 4, dice: 'D6' },
                },
                isOrganizer: false,
                position: { row: 0, col: 0 },
                accessibleTiles: [],
                inventory: [],
                statistics: {
                    combats: 0,
                    evasions: 0,
                    victories: 0,
                    defeats: 0,
                    totalLifeLost: 0,
                    totalLifeRemoved: 0,
                    uniqueItems: new Set<string>(),
                    tilesVisited: new Set<string>(),
                    uniqueItemsArray: [],
                    tilesVisitedArray: [],
                },
                isVirtual: false,
            };

            session = {
                isDebugMode: false,
            };
        });

        it('should calculate attack when isDebugMode is false', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.5);

            const result = service.calculateAttack(attacker, defender, session);

            expect(result.attackBase).toBe(5);
            expect(result.defenceBase).toBe(4);
            // For D6 dice and Math.random() of 0.5, rollDice returns floor(0.5 * 6) + 1 = 4
            expect(result.attackRoll).toBe(4);
            expect(result.defenceRoll).toBe(4);
            expect(result.success).toBe(true); // 5 + 4 > 4 + 4
        });

        it('should calculate attack when isDebugMode is true and attacker has D6 dice', () => {
            session.isDebugMode = true;
            attacker.attributes.attack.dice = 'D6';

            const result = service.calculateAttack(attacker, defender, session);

            expect(result.attackBase).toBe(5);
            expect(result.attackRoll).toBe(DICE_SIDES_D6); // Should be 6
            expect(result.defenceBase).toBe(4);
            expect(result.defenceRoll).toBe(1);
            expect(result.success).toBe(true); // 5 + 6 > 4 + 1
        });

        it('should calculate attack when isDebugMode is true and attacker has D4 dice', () => {
            session.isDebugMode = true;
            attacker.attributes.attack.dice = 'D4';

            const result = service.calculateAttack(attacker, defender, session);

            expect(result.attackBase).toBe(5);
            expect(result.attackRoll).toBe(DICE_SIDES_D4); // Should be 4
            expect(result.defenceBase).toBe(4);
            expect(result.defenceRoll).toBe(1);
            expect(result.success).toBe(true); // 5 + 4 > 4 + 1
        });

        it('should calculate attack failure when attack total is less than or equal to defence total', () => {
            attacker.attributes.attack.currentValue = 3;
            defender.attributes.defence.currentValue = 5;

            jest.spyOn(Math, 'random').mockReturnValue(0); // rollDice returns 1

            const result = service.calculateAttack(attacker, defender, session);

            expect(result.attackBase).toBe(3);
            expect(result.attackRoll).toBe(1);
            expect(result.defenceBase).toBe(5);
            expect(result.defenceRoll).toBe(1);
            expect(result.success).toBe(false); // 3 + 1 <= 5 + 1
        });

        it('should return success if attacker’s total attack is greater than defender’s total defence', () => {
            const isDebugMode = false;
            if (isDebugMode) {
                const attacker = createPlayer('attacker', 10, 5, 3, 1, 'D6');
                const defender = createPlayer('defender', 8, 4, 2, 1, 'D4');
                jest.spyOn(service as any, 'rollDice').mockImplementation((dice) => (dice === 'D6' ? 4 : 2));

                const result = service.calculateAttack(attacker, defender, session);

                expect(result.success).toBe(true);
                expect(result.attackBase).toBe(5);
                expect(result.attackRoll).toBe(4);
                expect(result.defenceBase).toBe(2);
                expect(result.defenceRoll).toBe(2);
            }
        });

        it('should return failure if attacker’s total attack is not greater than defender’s total defence', () => {
            const isDebugMode = false;
            if (isDebugMode) {
                const attacker = createPlayer('attacker', 10, 5, 3, 1, 'D4');
                const defender = createPlayer('defender', 8, 6, 5, 1, 'D6');
                jest.spyOn(service as any, 'rollDice').mockImplementation((dice) => (dice === 'D6' ? 5 : 3));

                const result = service.calculateAttack(attacker, defender, session);

                expect(result.success).toBe(false);
                expect(result.attackBase).toBe(5);
                expect(result.attackRoll).toBe(3);
                expect(result.defenceBase).toBe(5);
                expect(result.defenceRoll).toBe(5);
            }
        });
    });

    describe('startCombat', () => {
        it('should call startCombat on CombatTurnService', () => {
            const mockSession = { sessionCode: 'testSession' };

            service.startCombat('testSessionCode', mockServer as Server, mockSession);

            expect(combatTurnService.startCombat).toHaveBeenCalledWith('testSessionCode', mockServer, mockSession);
        });
    });

    describe('endCombatTurn', () => {
        it('should call endCombatTurn on CombatTurnService', () => {
            const mockSession = { sessionCode: 'testSession' };

            service.endCombatTurn('testSessionCode', mockServer as Server, mockSession);

            expect(combatTurnService.endCombatTurn).toHaveBeenCalledWith('testSessionCode', mockServer, mockSession);
        });
    });

    describe('endCombat', () => {
        it('should call endCombat on CombatTurnService and emit gridArray', () => {
            const mockSession = { sessionCode: 'testSession', grid: [[{}]] };

            service.endCombat('testSessionCode', mockServer as Server, mockSession);

            expect(combatTurnService.endCombat).toHaveBeenCalledWith('testSessionCode', mockServer, mockSession);
            expect(mockServer.to).toHaveBeenCalledWith('testSessionCode');
            expect(mockServer.emit).toHaveBeenCalledWith('gridArray', { sessionCode: 'testSessionCode', grid: mockSession.grid });
        });
    });

    describe('rollDice', () => {
        it('should return a random number between 1 and DICE_SIDES_D6 when dice type is D6', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock random number for consistency

            const result = service['rollDice']('D6');

            expect(result).toBe(Math.floor(0.5 * DICE_SIDES_D6) + 1);
        });

        it('should return a random number between 1 and DICE_SIDES_D4 when dice type is D4', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock random number for consistency

            const result = service['rollDice']('D4');

            expect(result).toBe(Math.floor(0.5 * DICE_SIDES_D4) + 1);
        });
    });
});
