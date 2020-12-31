import { NotImplementedException } from '../exceptions';
import { Constructor } from '../utils';
import { Context } from './constants';
import { Container } from './container';
import { ContainerScanner } from './container-scanner';
import { Provider } from './provider';

export class AppContext {
  private _scanner!: ContainerScanner;
  private _isInitialized = false;

  private constructor(private readonly _container: Container) {}

  static async create(metatype: Constructor): Promise<AppContext> {
    const container = await Container.from(metatype);
    return new AppContext(container);
  }

  get isInitialized() {
    return this._isInitialized;
  }

  public async init(): Promise<void> {
    if (this._isInitialized) return;

    await this._container.init();
    this._scanner = new ContainerScanner(this._container);

    await this.callOnInit();
    await this.callOnDidInit();

    this._isInitialized = true;
  }

  public get<T = any, R = T>(token: Constructor<T> | string | symbol): R {
    if (!this._isInitialized) {
      throw new Error('AppContext not initialized');
    }

    return this._scanner.find<T, R>(token);
  }

  public async resolve<T = any, R = T>(
    token: Constructor<T> | string | symbol,
    context: Context,
  ): Promise<R> {
    if (!this._isInitialized) {
      throw new Error('AppContext not initialized');
    }

    return await this._scanner.resolve<T, R>(token, context);
  }

  public addGlobalProvider(provider: Provider): void {
    if (this.isInitialized) {
      throw new Error('AppContext already initialized.');
    }

    this._container.addGlobalProvider(provider);
  }

  private async callOnInit() {
    const { modules } = this._container;
    for (const module of modules.values()) {
      await module.callOnInit();
    }
  }

  private async callOnDidInit() {
    const { modules } = this._container;
    for (const module of modules.values()) {
      await module.callOnDidInit();
    }
  }
}
