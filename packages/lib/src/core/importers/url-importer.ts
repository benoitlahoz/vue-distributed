import { getNameFromURL } from '@/core/utils';

/**
 * Keep a cache of imported scripts, to handle clean-up on exit.
 */
export const importedModules: Map<string, HTMLScriptElement> = new Map();

/**
 * Remove all inserted scripts elements from DOM.
 */
export const cleanImportedModules = () => {
  // Remove all scripts inserted from DOM.

  for (const [key, script] of importedModules) {
    script.remove();
    importedModules.delete(key);
  }
};

/**
 * Import a bundled library from an URL.
 *
 * @param { string } url The URL to get the library from.
 * @param { Map<string, HTMLScriptElement> } importedScript An optional `Map` to store imported
 * scripts and clean them on app 'unMount'.
 * @returns { Promise<any> } A module loaded via a `script` tag.
 */
export const importModuleFromURL = async (url: string): Promise<any> => {
  let libraryName: string;

  try {
    libraryName = getNameFromURL(url);
  } catch (_err: unknown) {
    throw new Error(
      `URL is not valid: imported scripts must be bundled with 'umd' suffix.`
    );
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
      script.addEventListener('load', () => {
        return onLibraryLoad(resolve, libraryName);
      });
      script.addEventListener('error', () =>
        onLibraryError(reject, libraryName, url)
      );
      script.addEventListener('abort', () =>
        onLibraryAbort(reject, libraryName, url)
      );
      document.head.appendChild(script);

      // Keep in cache to tear-down on unmount.
      importedModules.set(libraryName, script);
    } else {
      // Script exists with the library name as id.

      existing.addEventListener('load', () => {
        return onLibraryLoad(resolve, libraryName);
      });
      existing.addEventListener('error', () =>
        onLibraryError(reject, libraryName, url)
      );
      existing.addEventListener('abort', () =>
        onLibraryAbort(reject, libraryName, url)
      );
    }
  });
};

const onLibraryLoad = async (resolve: (value: any) => void, name: string) => {
  resolve((window as any)[name]);
};

const onLibraryError = (
  reject: (reason?: any) => void,
  library: string,
  url: string
) => {
  reject(`Error loading script for '${library}' at '${url}'.`);
};

const onLibraryAbort = (
  reject: (reason?: any) => void,
  library: string,
  url: string
) => {
  reject(`Script loading aborted for '${library}' at '${url}'.`);
};
