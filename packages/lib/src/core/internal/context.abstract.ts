import type { App, Ref, Plugin } from 'vue';
import { LogLevel } from './logger';
import { ComponentDefinition } from '../types';
import { RegisteredModule } from './registered-module';

export abstract class AbstractContext {
  public abstract app: App;

  public abstract modules: Ref<RegisteredModule[]>;
  public abstract dependencies: Ref<Record<string, any>>;
  public abstract components: ComponentDefinition[];
  public abstract componentsNames: string[];

  public abstract provide(injected?: Record<string, any>): this;
  public abstract pluginByURL(url: string, suffix?: string): Promise<Plugin>;
  public abstract hasComponent(name: string): boolean;
  public abstract clear(): void;
  public abstract dispose(): void;

  public abstract logLevel: keyof typeof LogLevel;
  public abstract log(...args: any[]): this;
  public abstract info(...args: any[]): this;
  public abstract warn(...args: any[]): this;
  public abstract error(...args: any[]): this;
}
