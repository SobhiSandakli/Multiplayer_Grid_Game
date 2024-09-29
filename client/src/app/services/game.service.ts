import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game } from 'src/app/game.model';
interface GameOption {
    mode: string;
    size: string;
}
@Injectable({
    providedIn: 'root',
})
export class GameService {
    private apiUrl = 'http://localhost:3000/api/games';
    private gameConfig: GameOption | null = null;

    constructor(private http: HttpClient) {}

    fetchAllGames(): Observable<Game[]> {
        return this.http.get<Game[]>(this.apiUrl);
    }

    fetchGame(id: string): Observable<Game> {
        return this.http.get<Game>(`${this.apiUrl}/${id}`);
    }

    createGame(game: Game): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/create`, game);
    }

    deleteGame(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
    toggleVisibility(id: string, visibility: boolean): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/toggle-visibility/${id}`, { visibility });
    }
    setGameConfig(config: GameOption): void {
        this.gameConfig = config;
    }
    getGameConfig(): GameOption | null {
        return this.gameConfig;
    }
    updateGame(id: string, game: Partial<Game>): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}`, game);
    }
    
}
