/* these models correspond to the go models */

export enum SessionType {
  Admin = 1,
  Blue,
  Red,
  Results
}

export class DraftSetup {
  name: string;
  mapName: string;
  blueName: string;
  redName: string;
  votingSecs: number[];
  phaseDelaySecs: number;
}

export class DraftState {
  sessionType: SessionType;
  setup: DraftSetup;
}

export class DraftIDs {
  admin: string;
  blue: string;
  red: string;
  results: string;
}

export class Draft {
  setup: DraftSetup;
  ids: DraftIDs;
}

/* websocket types */
export enum WebsocketMessageType {
  snapshot = 1,
  voteAction,
  clientClose,
  serverClose,
  clientReady,
  startVoting,
}

export enum PhaseType {
  ban = 'ban',
  pick = 'pick'
}

export class PhaseVote {
  hasVoted: boolean;
  phaseNum: number;
  phaseType: PhaseType;
  redHasVoted: boolean;
  blueHasVoted: boolean;
  validRedValues: string[];
  validBlueValues: string[];
  voteRedValue: string;
  voteBlueValue: string;
}

export class WsMsg {
  msgType: WebsocketMessageType;
  //sessionType: SessionType;
  setup: DraftSetup;
  draftStarted: boolean;
  adminConnected: boolean;
  redConnected: boolean;
  blueConnected: boolean;
  resultsViewers: number;
  voteTimedOut: boolean;
  redReady: boolean;
  blueReady: boolean;
  voteActive: boolean;
  votePaused: boolean;
  voteTimeLeft: number;
  voteTimeLeftPretty: string;
  currentVote: PhaseVote;
  currentPhase: number;
  phases: PhaseVote[];
  draftDone: boolean;
}

export class GameEntity {
  name: string;
  displayName: string;
  asset: string;
}

export class Champion extends GameEntity {
}

export class GameMap extends GameEntity {

}

export class Champions {
  melee: Champion[];
  ranged: Champion[];
  support: Champion[];
}
