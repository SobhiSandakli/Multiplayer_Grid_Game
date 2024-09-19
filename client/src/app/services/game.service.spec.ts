import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GameService } from './game.service';
import { Game } from 'src/app/game.model';

describe('GameService', () => {
    let service: GameService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:3000/api/games';
    const numberOfGames = 3;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GameService],
        });

        service = TestBed.inject(GameService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
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
            },
            {
                _id: '66e8687a8180df2b46b1ee36',
                name: 'game 2',
                size: '10x10',
                mode: 'Survival',
                image: 'sample.png',
                date: new Date(),
                visibility: true,
            },
            {
                _id: '66e86a50506112a5b6c0b785',
                name: 'New Adventure',
                size: '20x20',
                mode: 'Survival',
                image: 'https://example.com/new_image.jpg',
                date: new Date(),
                visibility: true,
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
});
