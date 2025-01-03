import { ScriptId } from '@/core/types';
import JSZip from 'jszip';
import { AbstractModuleImporter } from './module-importer.abstract';

class _ZipModuleImporter implements AbstractModuleImporter {
  /**
   * Import a bundled library from an URL pointing to a zip file.
   *
   * @param { string } url The URL to get the library from.
   * @param { ScriptId[] } cache An optional existing cache of already loaded scripts ids.
   * @returns { Promise<any> } A module loaded via a `script` tag.
   */
  public async import(
    url: string,
    libraryName: string,
    cache?: ScriptId[]
  ): Promise<any> {
    let content: string | undefined;
    let sri: string | undefined;

    try {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const blob = await res.blob();
      const zip = await JSZip.loadAsync(blob);

      // TODO: Read the json to get files.
      content = await zip.file(`${libraryName}.umd.js`)?.async('string');
      sri = await zip.file(`${libraryName}.umd.js.sri`)?.async('string');

      if (!content || !sri) {
        throw new Error(`Could not get valid content from loaded 'zip' file.`);
      }
    } catch (_err: unknown) {
      throw _err;
    }

    return new Promise(async (resolve, reject) => {
      try {
        const existing = document.getElementById(libraryName);

        if (!existing) {
          // Verify signatures.

          const encoder = new TextEncoder();
          const data = encoder.encode(content);
          const hash = await crypto.subtle.digest('sha-384', data);
          const str = btoa(
            // @ts-ignore
            String.fromCharCode.apply(null, new Uint8Array(hash))
          );

          if (`sha384-${str}` !== sri) {
            throw new Error(
              `Signatures of imported library and loaded hash don't match. Library is potentially insecure.`
            );
          }

          // Script doesn't exist yet with this library name as id.

          const script = document.createElement('script');
          script.id = libraryName;
          script.textContent = content;
          script.integrity = sri;

          document.head.appendChild(script);

          if (cache) cache.push(libraryName);

          resolve((window as any)[libraryName]);
        } else {
          // Script exists with the library name as id.
          resolve((window as any)[libraryName]);
        }
      } catch (err: unknown) {
        reject(err);
      }
    });
  }
}

const importer = new _ZipModuleImporter();
Object.seal(importer);

export { importer as ZipModuleImporter };
