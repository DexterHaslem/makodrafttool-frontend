import {HttpClient, json} from 'aurelia-fetch-client';
import {inject} from 'aurelia-framework';

// !!buildurl
const WEBPACK_PORT = '8080';
const API_PORT = '8081';

@inject(HttpClient)
export class Api {
  http: HttpClient;

  private getBaseUrl(isWebsocket: boolean): string {
    let url = window.location.origin.replace(WEBPACK_PORT, API_PORT); //.replace("http://", "https://");

    if (isWebsocket) {
      url = url.replace(window.location.protocol, window.location.protocol === "https:" ?
        "wss:": "ws:");
    }

    // note this is just to finish root url. base url is handled by webpack in `webpack.config.js`
    return url + "/";
  }

  constructor(http) {
    this.http = http;
    http.configure(cfg =>
      cfg.withBaseUrl(this.getBaseUrl(false))
    );
  }

  // getURL(endpoint) {
  //   return `${BASE_URL}${endpoint}`;
  // }

  createDraft(nd) {
    return this.http.fetch('newdraft',
      {
        method: 'post',
        body: json(nd)
      })
      .then(resp => resp.json())
      .catch(err => console.error(err));
  }

  getDraftState(sessionCode) {
    return this.http.fetch('draftState/' + sessionCode)
      .then(resp => resp.json())
      .catch(err => console.error(err));
  }

  getChampions() {
    return this.http.fetch('champions')
      .then(resp => resp.json())
      .catch(err => console.error(err));
  }

  getMaps() {
    return this.http.fetch('maps')
      .then(resp => resp.json())
      .catch(err => console.error(err));
  }

  getWs(sessionCode) {
    let ws = new WebSocket(this.getBaseUrl(true) + "ws/" + sessionCode);
    return ws
  }
}
