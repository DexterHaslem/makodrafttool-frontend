import {inject} from 'aurelia-framework';
import {Api} from '../api';
import {Draft, GameMap} from 'models';

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
        countdownSecs: 3,
        mapName: "Map",
        name: "My new Draft",
        redName: "Red",
        voteSecs: 30
      },
      ids: {
        admin: "",
        blue: "",
        red: "",
        results: ""
      }
    }
    this.api.getMaps().then(v => this.maps = v);
  }

  onCreate() {
    /* number input converts bound value to string, cast is to make TS happy. woo */
    const voteSecs = parseFloat(String(this.draft.setup.voteSecs));
    this.draft.setup.voteSecs = voteSecs;
    const d = this.api.createDraft(this.draft.setup);
    d.then(v => {
      this.draft = v;
      this.draftCreated = true;
    });
  }

  getLink(v) {
    /* TODO: figure out way to do this proper from router */
    return "#/v/" + v;
  }
}
