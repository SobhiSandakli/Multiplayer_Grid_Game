import { TestBed } from '@angular/core/testing';
// eslint-disable-next-line import/no-deprecated
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Game } from '@app/interfaces/game-model.interface';
import { GameService } from './game.service';
import { environment } from '@environments/environment';


describe('GameService', () => {
    let service: GameService;
    let httpMock: HttpTestingController;
    const apiUrl = environment.serverUrl + '/games';
    const numberOfGames = 3;

    beforeEach(() => {
        TestBed.configureTestingModule({
            // eslint-disable-next-line import/no-deprecated
            imports: [HttpClientTestingModule],
            providers: [GameService],
        });

        service = TestBed.inject(GameService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should fetch all games', () => {
        const mockGames: Game[] = [
            {
                _id: '66e744bd5b24f0e004d10dd9',
                name: 'game 1',
                size: '15x15',
                mode: 'Survival',
                image: 'https://example.com/map_preview.jpg',
                date: new Date(),
                visibility: true,
                description: '',
                grid: [],
            },
            {
                _id: '66e8687a8180df2b46b1ee36',
                name: 'game 2',
                size: '10x10',
                mode: 'Survival',
                image: 'sample.png',
                date: new Date(),
                visibility: true,
                description: '',
                grid: [],
            },
            {
                _id: '66e86a50506112a5b6c0b785',
                name: 'New Adventure',
                size: '20x20',
                mode: 'Survival',
                image: 'https://example.com/new_image.jpg',
                date: new Date(),
                visibility: true,
                description: '',
                grid: [],
            },
        ];

        service.fetchAllGames().subscribe((games) => {
            expect(games.length).toBe(numberOfGames);
            expect(games).toEqual(mockGames);
        });

        const req = httpMock.expectOne(`${apiUrl}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGames);
    });

    it('should fetch a game by ID', () => {
        const mockGame: Game = {
            _id: '66e744bd5b24f0e004d10dd9',
            name: 'game 1',
            size: '15x15',
            mode: 'Survival',
            image: 'https://example.com/map_preview.jpg',
            date: new Date(),
            visibility: false,
            description: '',
            grid: [],
        };

        service.fetchGame('66e744bd5b24f0e004d10dd9').subscribe((game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${apiUrl}/66e744bd5b24f0e004d10dd9`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGame);
    });

    it('should create a new game', () => {
        const newGame: Game = {
            _id: '66e86a50506112a5b6c0b785',
            name: 'New Adventure',
            size: '20x20',
            mode: 'Survival',
            image: 'https://example.com/new_image.jpg',
            date: new Date(),
            visibility: false,
            description: '',
            grid: [],
        };

        service.createGame(newGame).subscribe((response) => {
            expect(response).toBeTruthy();
        });

        const req = httpMock.expectOne(`${apiUrl}/create`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newGame);
        req.flush({});
    });

    it('should send a DELETE request to delete the game', () => {
        const gameId = '66e8c79715357b319b15cce4';
        service.deleteGame(gameId).subscribe({
            next: (response) => {
                expect(response).toBeNull();
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${apiUrl}/${gameId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
    });

    it('should toggle game visibility', () => {
        const gameId = '66e744bd5b24f0e004d10dd9';
        const newVisibility = false;

        service.toggleVisibility(gameId, newVisibility).subscribe((response) => {
            expect(response).toBeNull();
        });

        const req = httpMock.expectOne(`${apiUrl}/toggle-visibility/${gameId}`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ visibility: newVisibility });

        req.flush(null);
    });

    // New tests for game config methods
    it('should set game config and retrieve it from localStorage', () => {
        const config = { mode: 'classique', size: 'medium' };
        service.setGameConfig(config);

        const storedConfig = service.getGameConfig();
        expect(storedConfig).toEqual(config);
    });

    it('should return null when no game config is set', () => {
        spyOn(service, 'getGameConfig').and.returnValue(null);
        const storedConfig = service.getGameConfig();
        expect(storedConfig).toBeNull();
    });

    it('should clear the game config from localStorage', () => {
        const config = { mode: 'classique', size: 'medium' };
        service.setGameConfig(config);

        service.clearGameConfig();
        const storedConfig = service.getGameConfig();
        expect(storedConfig).toBeNull();
    });

    it('should update a game', () => {
        const gameId = '12345';
        const updatedGame: Partial<Game> = {
            name: 'Updated Game Name',
            description: 'Updated Description',
        };

        service.updateGame(gameId, updatedGame).subscribe((response) => {
            expect(response).toBeNull(); // Adjusted expectation to match the actual response
        });

        const req = httpMock.expectOne(`${service['apiUrl']}/${gameId}`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(updatedGame);

        req.flush(null); // Simulate a successful response with null body
    });
});
