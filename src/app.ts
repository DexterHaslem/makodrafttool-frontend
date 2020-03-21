import {Router, RouterConfiguration} from 'aurelia-router';
import {PLATFORM} from "aurelia-framework";

export class App {
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router): void {
    this.router = router;
    config.title = 'brdraft';
    config.map([
      {route: '', name: 'home', moduleId: PLATFORM.moduleName('home'), title: "home"},
      {
        route: 'admin',
        name: 'admin',
        moduleId: PLATFORM.moduleName('admin/admin'),
        title: "Create Draft",
      },
      {route: 'v/:id/', name: 'view', moduleId: PLATFORM.moduleName('view/view'), title: "BR Draft view"},
    ]);
  }
}
