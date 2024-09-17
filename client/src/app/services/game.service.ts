import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game } from '../game.model'; // Ensure this path is correct

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'http://localhost:3000/api/games'; // Replace with your API endpoint

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
}
