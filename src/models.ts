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
  voteSecs: number;
  countdownSecs: number;
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
  sessionType,
  voteAction,
}

export class WebsocketMessage {
  msgType: WebsocketMessageType;
}
