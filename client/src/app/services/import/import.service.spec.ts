/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game-model.interface';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { GameService } from '@app/services/game/game.service';
import { ValidateGameService } from '@app/services/validate-game/validateGame.service';
import { of } from 'rxjs';
import { ImportService } from './import.service';

describe('ImportService', () => {
    let service: ImportService;
    let mockGameService: jasmine.SpyObj<GameService>;
    let mockGameFacade: jasmine.SpyObj<GameFacadeService>;
    let mockValidateGameService: jasmine.SpyObj<ValidateGameService>;

    beforeEach(() => {
        mockGameService = jasmine.createSpyObj('GameService', ['createGame']);
        mockGameFacade = jasmine.createSpyObj('GameFacadeService', ['createImage']);
        mockValidateGameService = jasmine.createSpyObj('ValidateGameService', ['validate', 'validateAll']);
        mockValidateGameService.validateAll.and.returnValue(true);

        TestBed.configureTestingModule({
            providers: [
                ImportService,
                { provide: GameService, useValue: mockGameService },
                { provide: GameFacadeService, useValue: mockGameFacade },
                { provide: ValidateGameService, useValue: mockValidateGameService },
            ],
        });

        service = TestBed.inject(ImportService);
    });

    const completeGameData: Game = {
        _id: '123',
        name: 'Complete Game',
        description: 'A complete game data for testing',
        grid: [[]],
        image: 'base64Image',
        size: 'medium',
        mode: 'classic',
        visibility: true,
        date: new Date(),
    };

    it('should detect duplicate game names', () => {
        const existingGames: Game[] = [completeGameData];

        service.importGame(completeGameData, existingGames).subscribe({
            error: (error) => {
                expect(error.message).toBe('DUPLICATE_GAME_NAME');
            },
        });
    });
    it('should download the game as a JSON file', () => {
        const createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
        const clickSpy = jasmine.createSpy('click');
        const mockAnchorElement = {
            href: '',
            download: '',
            click: clickSpy,
        } as unknown as HTMLAnchorElement;

        spyOn(document, 'createElement').and.returnValue(mockAnchorElement);

        service.downloadGame(completeGameData);
        expect(createObjectURLSpy).toHaveBeenCalledWith(jasmine.any(Blob));
        expect(clickSpy).toHaveBeenCalled();
        expect(mockAnchorElement.download).toBe('Complete Game.json');
    });

    it('should create a new game successfully', (done) => {
        mockGameFacade.createImage.and.returnValue(Promise.resolve('base64Image'));
        mockGameService.createGame.and.returnValue(of(void 0));

        service.importGame(completeGameData, []).subscribe((result) => {
            expect(result.name).toBe('Complete Game');
            expect(result.image).toBe('base64Image');
            done();
        });
    });

    it('should handle errors during game creation', () => {
        mockGameFacade.createImage.and.returnValue(Promise.reject('Image generation failed'));

        service.importGame(completeGameData, []).subscribe({
            error: (error) => {
                expect(error).toEqual('Image generation failed');
            },
        });
    });
    it('should return an error if validation fails', () => {
        spyOn(service as any, 'validateImportedGameData').and.returnValue('Validation failed');

        service.importGame(completeGameData, []).subscribe({
            error: (error) => {
                expect(error.message).toBe('Validation failed');
            },
        });
    });

    it('should return an error if the game name is a duplicate', () => {
        spyOn(service as any, 'validateImportedGameData').and.returnValue(null);
        spyOn(service as any, 'isDuplicateGame').and.returnValue(true);

        service.importGame(completeGameData, [completeGameData]).subscribe({
            error: (error) => {
                expect(error.message).toBe('DUPLICATE_GAME_NAME');
            },
        });
    });

    it('should return an error if the grid is invalid', () => {
        spyOn(service as any, 'validateImportedGameData').and.returnValue(null);
        spyOn(service as any, 'isDuplicateGame').and.returnValue(false);
        spyOn(service as any, 'isValidGrid').and.returnValue(false);

        service.importGame(completeGameData, []).subscribe({
            error: (error) => {
                expect(error.message).toBe('INVALID_GRID');
            },
        });
    });

    it('should create a game if no errors are found', (done) => {
        spyOn(service as any, 'validateImportedGameData').and.returnValue(null);
        spyOn(service as any, 'isDuplicateGame').and.returnValue(false);
        spyOn(service as any, 'isValidGrid').and.returnValue(true);
        spyOn(service as any, 'createGameObservable').and.returnValue(of(completeGameData));

        service.importGame(completeGameData, []).subscribe((result) => {
            expect(result).toEqual(completeGameData);
            done();
        });
    });
});
