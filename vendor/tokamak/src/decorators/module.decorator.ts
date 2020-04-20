import { ModuleDefinition } from '../interfaces/module-definition';
import { RouteDefinition } from '../routing';

export interface ModuleMetadata {
  routing?: Array<RouteDefinition>;
  providers?: Array<any>;
  imports?: Array<ModuleDefinition>;
  exports?: Array<any>;
}

export function module(metadata: ModuleMetadata): ClassDecorator {
  return (target: Function): void => {
    Reflect.ownKeys(metadata).forEach((key) => {
      Reflect.defineMetadata(key, metadata[key as keyof ModuleMetadata], target);
    });
  };
}
