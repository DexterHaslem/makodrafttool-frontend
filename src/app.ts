import { RouterConfiguration, Router } from 'aurelia-router';
import { PLATFORM } from "aurelia-framework";

export class App {
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router): void {
    this.router = router;
    config.title = 'brdraft';
    config.map([
      { route: '', name: 'home', moduleId: PLATFORM.moduleName('home'), title: "home" },
      { route: 'admin', name: 'admin', moduleId: PLATFORM.moduleName('admin/admin'), title: "BR Draft admin" },
      { route: 'a/:id/',        name: 'adminlive',      moduleId: PLATFORM.moduleName('admin/adminlive'), title: "BR Draft admin" },
      //{ route: 'c/:id/',        name: 'captian', moduleId: 'captain/view' },
      //{ route: 'r/:id/',        name: 'results', moduleId: 'readonly/view' },
    ]);
  }
}
