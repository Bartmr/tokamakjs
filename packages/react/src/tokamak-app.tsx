import { GlobalErrorsManager } from '@tokamakjs/common';
import { Class, DiContainer } from '@tokamakjs/injection';
import React, { ElementType, createContext } from 'react';
import ReactDom from 'react-dom';
import urljoin from 'url-join';

import { DiContainerProvider } from './components';
import {
  BrowserRouter,
  HashRouter,
  MemoryRouter,
  RouteObject,
  buildRoutes,
  useRoutes,
} from './routing';
import { TokamakAppConfig, TokamakCreateConfig } from './types';

const HISTORY_MODE_MAP = {
  browser: BrowserRouter,
  hash: HashRouter,
  memory: MemoryRouter,
};

export const AppContext = createContext<unknown>({});

export const PathsContext = createContext<Array<string>>([]);

export const ErrorsContext = createContext<GlobalErrorsManager | undefined>(undefined);

export class TokamakApp {
  public static async create(
    RootApp: Class,
    partialConfig: TokamakCreateConfig = {},
  ): Promise<TokamakApp> {
    const { globalProviders, ...config } = {
      historyMode: 'browser' as const,
      basePath: '',
      globalProviders: [],
      ...partialConfig,
    };

    const container = await DiContainer.from(RootApp, { globalProviders });

    return new TokamakApp(container, RootApp, config);
  }

  private readonly _Router: typeof HISTORY_MODE_MAP[keyof typeof HISTORY_MODE_MAP];
  private readonly _RootNode: ElementType;
  private readonly _paths: Array<string> = [];
  private readonly _globalErrorsManager: GlobalErrorsManager;

  private constructor(
    private readonly _container: DiContainer,
    RootApp: Class,
    private readonly _config: TokamakAppConfig,
  ) {
    const routes = buildRoutes(RootApp, _container);
    this._paths = this._extractPathsFromRoutes(routes);
    this._RootNode = () => useRoutes(routes);
    this._Router = HISTORY_MODE_MAP[_config.historyMode];
    this._globalErrorsManager = new GlobalErrorsManager();
  }

  public render(selector: string, appContext: unknown = {}): void {
    const RootNode = this._RootNode;
    const Router = this._Router;

    ReactDom.render(
      <ErrorsContext.Provider value={this._globalErrorsManager}>
        <Router basename={this._config.basePath}>
          <DiContainerProvider value={this._container}>
            <AppContext.Provider value={appContext}>
              <PathsContext.Provider value={this._paths}>
                <RootNode />
              </PathsContext.Provider>
            </AppContext.Provider>
          </DiContainerProvider>
        </Router>
      </ErrorsContext.Provider>,
      document.querySelector(selector),
    );
  }

  private _extractPathsFromRoutes(routes: Array<RouteObject>, parentPath = ''): Array<string> {
    return routes.reduce((memo, route) => {
      if (route.path == null) return memo;

      return [
        ...memo,
        urljoin(parentPath, route.path),
        ...this._extractPathsFromRoutes(route.children ?? [], route.path),
      ];
    }, [] as Array<string>);
  }
}
