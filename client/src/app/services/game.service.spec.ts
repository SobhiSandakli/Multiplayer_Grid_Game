import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GameService } from './game.service';
import { Game } from '../game.model'; // Adjust the path as needed

describe('GameService', () => {
  let service: GameService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GameService]
    });

    service = TestBed.inject(GameService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all games', () => {
    const mockGames: Game[] = [
      { id: '66e744bd5b24f0e004d10dd9', nom: 'game 1', taille: '15x15', mode: 'Survival', image: 'https://example.com/map_preview.jpg', date: '2024-09-15T10:30:00Z' },
      { id: '66e8687a8180df2b46b1ee36', nom: 'game 2', taille: '10x10', mode: 'Survival', image: 'sample.png', date: '2024-09-16T10:30:00.000Z' },
      { id: '66e86a50506112a5b6c0b785', nom: 'New Adventure', taille: '20x20', mode: 'Survival', image: 'https://example.com/new_image.jpg', date: '2024-09-16T10:30:00.000+00:00' }
    ];

    service.fetchAllGames().subscribe(games => {
      expect(games.length).toBe(3);
      expect(games).toEqual(mockGames);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/games'); // Adjust URL as needed
    expect(req.request.method).toBe('GET');
    req.flush(mockGames);
  });

  it('should fetch a game by ID', () => {
    const mockGame: Game = { id: '66e744bd5b24f0e004d10dd9', nom: 'game 1', taille: '15x15', mode: 'Survival', image: 'https://example.com/map_preview.jpg', date: '2024-09-15T10:30:00Z' };

    service.fetchGame('66e744bd5b24f0e004d10dd9').subscribe(game => {
      expect(game).toEqual(mockGame);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/games/66e744bd5b24f0e004d10dd9'); // Adjust URL as needed
    expect(req.request.method).toBe('GET');
    req.flush(mockGame);
  });

  it('should create a new game', () => {
    const newGame: Game = { id: '66e86a50506112a5b6c0b785', nom: 'New Adventure', taille: '20x20', mode: 'Survival', image: 'https://example.com/new_image.jpg', date: '2024-09-16T10:30:00.000+00:00' };

    service.createGame(newGame).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost:3000/api/games/create'); // Adjust URL as needed
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newGame);
    req.flush({}); // Respond with empty body
  });
});
