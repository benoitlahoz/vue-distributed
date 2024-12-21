export abstract class AbstractModuleImporter {
  public abstract import(path: string, ...args: any[]): Promise<any>;
}
