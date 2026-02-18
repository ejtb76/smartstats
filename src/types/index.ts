export interface Player {
  id: string;
  firstName: string;
  lastName?: string;
  number?: string;
  position?: string;
}

export interface PlayerGameStats {
  playerId: string;
  playerName: string;
  battingOrder: number;
  isSubstitute: boolean;
  substituteFor?: string;
  PA: number;
  AB: number;
  R: number;
  H: number;
  "2B": number;
  "3B": number;
  HR: number;
  BB: number;
  K: number;
  RBI: number;
  AVG: number;
  OBP: number;
  SLG: number;
}

export interface Game {
  id: string;
  date: string;
  opponent: string;
  score?: string;
  notes: string;
  playerStats: PlayerGameStats[];
  opponentStats?: PlayerGameStats[];
  rawImageBase64?: string;
  createdAt: string;
}

export interface SeasonPlayerStats {
  playerId: string;
  playerName: string;
  games: number;
  PA: number;
  AB: number;
  R: number;
  H: number;
  "2B": number;
  "3B": number;
  HR: number;
  BB: number;
  K: number;
  RBI: number;
  AVG: number;
  OBP: number;
  SLG: number;
}
