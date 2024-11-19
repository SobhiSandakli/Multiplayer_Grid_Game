export interface TurnData {
    turnOrder: string[];
    currentTurnIndex: number;
    currentPlayerSocketId: string;
    turnTimer: NodeJS.Timeout | null;
    timeLeft: number;
}
