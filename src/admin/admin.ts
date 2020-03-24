import {inject} from 'aurelia-framework';
import {Api} from '../api';
import {Draft, GameMap} from 'models';
import * as R from 'ramda';

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
        votingSecs: [30, 30, 30, 30, 30],
        phaseDelaySecs: 2,
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

  getViewLink(code) {
    /* NOTE: relies on webpack.config.js baseUrl .. which isnt exported. blah */
    const baseUrl = 'static/';
    return this.api.getURL(`${baseUrl}#/v/${code}`);
  }
}
