import {inject} from 'aurelia-framework';
import {Api} from '../api';
import {Draft, GameMap} from 'models';
import * as R from 'ramda';

const DEFAULT_VOTE_SECS = 60;
const DEFAULT_BREAK_SECS = 3;

@inject(Api)
export class Admin {
  api: Api;
  draft: Draft;
  draftCreated: boolean;
  maps: GameMap[];

  constructor(api) {
    this.api = api;
    this.draft = {
      setup: {
        blueName: "Blue",
        mapName: "Map",
        name: "My new Draft",
        redName: "Red",
        votingSecs: [DEFAULT_VOTE_SECS, DEFAULT_VOTE_SECS, DEFAULT_VOTE_SECS, DEFAULT_VOTE_SECS, DEFAULT_VOTE_SECS],
        phaseDelaySecs: DEFAULT_BREAK_SECS,
      },
      ids: {
        admin: "",
        blue: "",
        red: "",
        results: ""
      }
    };
    this.api.getMaps().then(v => this.maps = v);
  }

  onCreate() {
    /* number input converts bound value to string, cast is to make TS happy. woo */
    const toNum = v => parseFloat(String(v));
    this.draft.setup.votingSecs = R.map(toNum, this.draft.setup.votingSecs);
    const d = this.api.createDraft(this.draft.setup);
    d.then(v => {
      this.draft = v;
      this.draftCreated = true;
    });
  }

  resetDraft() {
    this.draftCreated = false;
  }

  getParticipantLink(code) {
    // !! buildurl
    return `#/v/${code}`;
  }

  getViewLink(code) {
    // !! buildurl
    return `#/v/${code}`;
  }
}
