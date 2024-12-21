import { ScriptId } from '@/core/types';
import { AbstractModuleImporter } from './module-importer.abstract';
import { Formatter } from '../formatter';

class _URLModuleImporter implements AbstractModuleImporter {
  /**
   * Import a bundled library from an URL.
   *
   * @param { string } url The URL to get the library from.
   * @param { string } sri A Subresource Integrity hash.
   * @param { ScriptId[] } cache An optional existing cache of already loaded scripts ids.
   * @returns { Promise<any> } A module loaded via a `script` tag.
   */
  public async import(
    url: string,
    sri: string,
    cache?: ScriptId[]
  ): Promise<any> {
    let libraryName: string | undefined;

    try {
      libraryName = Formatter.libraryNameFromUrl(url, 'umd');

      if (!libraryName) {
        throw new Error(
          `URL is not valid: imported modules must be bundled with 'umd' suffix.`
        );
      }
    } catch (_err: unknown) {
      throw _err;
    }

    return new Promise((resolve, reject) => {
      const existing = document.getElementById(libraryName);

      if (!existing) {
        // Script doesn't exist yet with this library name as id.

        const script = document.createElement('script');
        script.id = libraryName;
        script.async = true;
        script.type = 'module';
        script.src = url;
        script.integrity = sri;

        // Add listeners passing cache.
        this.addListeners(script, libraryName, url, resolve, reject, cache);

        document.head.appendChild(script);
      } else {
        // Script exists with the library name as id.

        this.addListeners(existing, libraryName, url, resolve, reject);
      }
    });
  }

  /**
   * Add listeners to inserted or existing script element.
   *
   * @param { HTMLElement } script The script element.
   * @param { string } name The library name.
   * @param { string } url The URL at which the library is loaded.
   * @param { (value: any) => void } resolve The importer Promise resolve function.
   * @param { reject: (reason?: any) => void } reject The importer Promise reject function.
   * @param { ScriptId[] | undefined } cache An optional cache for the script's id.
   */
  private addListeners(
    script: HTMLElement,
    name: string,
    url: string,
    resolve: (value: any) => void,
    reject: (reason?: any) => void,
    cache?: ScriptId[]
  ) {
    script.addEventListener('load', () => {
      if (cache) cache.push(name);

      resolve((window as any)[name]);
    });
    script.addEventListener('error', () => {
      reject(`Error loading script for '${name}' at '${url}'.`);
    });
    script.addEventListener('abort', () => {
      reject(`Script loading aborted for '${name}' at '${url}'.`);
    });
  }
}

const importer = new _URLModuleImporter();
Object.seal(importer);

export { importer as URLModuleImporter };
