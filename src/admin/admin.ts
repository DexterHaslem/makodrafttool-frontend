import {inject} from 'aurelia-framework';
import {Api} from '../api';
import {Draft} from 'models';

@inject(Api)
export class Admin {
  api: Api;
  draft: Draft;
  draftCreated: boolean;

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
  }

  onCreate() {
    let d = this.api.createDraft(this.draft.setup);
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
