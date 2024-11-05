import { Test, TestingModule } from '@nestjs/testing';
import { FightService } from './fight.service';
import { Player } from '@app/interfaces/player/player.interface';

describe('FightService', () => {
    let service: FightService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FightService],
        }).compile();

        service = module.get<FightService>(FightService);
    });

    describe('determineFirstAttacker', () => {
        it('should return initiating player when their speed is higher', () => {
            const initiatingPlayer: Player = {
                attributes: {
                    speed: { baseValue: 10 },
                },
            } as any;

            const opponentPlayer: Player = {
                attributes: {
                    speed: { baseValue: 5 },
                },
            } as any;

            const result = service.determineFirstAttacker(initiatingPlayer, opponentPlayer);
            expect(result).toBe(initiatingPlayer);
        });

        it('should return opponent player when their speed is higher', () => {
            const initiatingPlayer: Player = {
                attributes: {
                    speed: { baseValue: 5 },
                },
            } as any;

            const opponentPlayer: Player = {
                attributes: {
                    speed: { baseValue: 10 },
                },
            } as any;

            const result = service.determineFirstAttacker(initiatingPlayer, opponentPlayer);
            expect(result).toBe(opponentPlayer);
        });

        it('should return initiating player when speeds are equal', () => {
            const initiatingPlayer: Player = {
                attributes: {
                    speed: { baseValue: 7 },
                },
            } as any;

            const opponentPlayer: Player = {
                attributes: {
                    speed: { baseValue: 7 },
                },
            } as any;

            const result = service.determineFirstAttacker(initiatingPlayer, opponentPlayer);
            expect(result).toBe(initiatingPlayer);
        });
    });

    describe('calculateEvasion', () => {
        beforeEach(() => {
            jest.spyOn(Math, 'random').mockReturnValue(0.3); // For predictable results
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should return true when player has evasion attempts and random chance is successful', () => {
            const player: Player = {
                attributes: {
                    nbEvasion: { currentValue: 2 },
                },
            } as any;

            const result = service.calculateEvasion(player);
            expect(result).toBe(true);
            expect(player.attributes['nbEvasion'].currentValue).toBe(1);
        });

        it('should return false when player has evasion attempts but random chance fails', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.5);
            const player: Player = {
                attributes: {
                    nbEvasion: { currentValue: 2 },
                },
            } as any;

            const result = service.calculateEvasion(player);
            expect(result).toBe(false);
            expect(player.attributes['nbEvasion'].currentValue).toBe(1);
        });

        it('should return false when player has no evasion attempts left', () => {
            const player: Player = {
                attributes: {
                    nbEvasion: { currentValue: 0 },
                },
            } as any;

            const result = service.calculateEvasion(player);
            expect(result).toBe(false);
            expect(player.attributes['nbEvasion'].currentValue).toBe(0);
        });

        it('should handle undefined nbEvasion attribute gracefully', () => {
            const player: Player = {
                attributes: {},
            } as any;

            const result = service.calculateEvasion(player);
            expect(result).toBe(false);
        });
    });

    describe('calculateAttack', () => {
        beforeEach(() => {
            jest.spyOn(Math, 'random').mockImplementation(() => 0.5); // Return middle value
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should calculate attack success correctly when total attack > total defense', () => {
            const attacker: Player = {
                attributes: {
                    attack: { currentValue: 10, dice: 'D6' },
                },
            } as any;

            const defender: Player = {
                attributes: {
                    defence: { currentValue: 5, dice: 'D6' },
                },
            } as any;

            const result = service.calculateAttack(attacker, defender);
            expect(result.success).toBe(true);
            expect(result.attackBase).toBe(10);
            expect(result.defenceBase).toBe(5);
            expect(result.attackRoll).toBe(4);
            expect(result.defenceRoll).toBe(4);
        });

        it('should calculate attack failure correctly when total attack <= total defense', () => {
            const attacker: Player = {
                attributes: {
                    attack: { currentValue: 5, dice: 'D4' },
                },
            } as any;

            const defender: Player = {
                attributes: {
                    defence: { currentValue: 8, dice: 'D6' },
                },
            } as any;

            const result = service.calculateAttack(attacker, defender);
            expect(result.success).toBe(false);
            expect(result.attackBase).toBe(5);
            expect(result.defenceBase).toBe(8);
            expect(result.attackRoll).toBe(3); // Corrected from 2 to 3
            expect(result.defenceRoll).toBe(4); // Corrected from 3 to 4
        });

        it('should handle unknown dice types as 0 roll', () => {
            const attacker: Player = {
                attributes: {
                    attack: { currentValue: 5, dice: 'D10' },
                },
            } as any;

            const defender: Player = {
                attributes: {
                    defence: { currentValue: 5, dice: 'D8' },
                },
            } as any;

            const result = service.calculateAttack(attacker, defender);
            expect(result.success).toBe(false);
            expect(result.attackRoll).toBe(0);
            expect(result.defenceRoll).toBe(0);
        });
    });
});
