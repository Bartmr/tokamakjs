import React, { ReactElement, useContext, useMemo } from 'react';
import join from 'url-join';

import { RouteContext } from '../route-context';
import { RouteObject } from '../types';
import { matchRoutes } from '../utils';
import { useLocation } from './use-location';

export function useRoutes(routes: Array<RouteObject>, basename = ''): ReactElement | null {
  const { pathname, params: parentParams } = useContext(RouteContext);
  const location = useLocation();

  if (location == null) {
    throw new Error('LocationContext not initialized.');
  }

  basename = join(pathname, basename);

  const matches = useMemo(() => matchRoutes(routes, location, basename), [
    routes,
    location,
    basename,
  ]);

  if (matches == null) return null;

  return matches.reduceRight((outlet, match) => {
    const { route, params, pathname } = match;

    return (
      <RouteContext.Provider
        value={{
          outlet,
          params: { ...parentParams, ...params },
          pathname: join(basename, pathname),
          route,
        }}>
        {route.element}
      </RouteContext.Provider>
    );
  }, null as ReactElement | null);
}
