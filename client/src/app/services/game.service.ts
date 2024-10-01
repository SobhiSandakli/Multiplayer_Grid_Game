import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Game } from '../interfaces/game-model.interface';
interface GameOption {
    mode: string;
    size: string;
}
@Injectable({
    providedIn: 'root',
})
export class GameService {
    private apiUrl = 'http://localhost:3000/api/games';
    private gameConfig = 'gameConfig';

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
        localStorage.setItem(this.gameConfig, JSON.stringify(config));
    }

    getGameConfig(): GameOption | null {
        const config = localStorage.getItem(this.gameConfig);
        return config ? JSON.parse(config) : null;
    }

    clearGameConfig(): void {
        localStorage.removeItem(this.gameConfig);
    }
    updateGame(id: string, game: Partial<Game>): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}`, game);
    }
}
