import { join, resolve } from 'node:path';
import {
  createWriteStream,
  createReadStream,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import type { PluginOption, Logger } from 'vite';
import { createLogger } from 'vite';
import { cyan, green, yellow } from 'kolorist';
import ZipArchiver from 'archiver';

import { parse } from './entry-parser';

const SRI_FILE_EXTENSION = 'sri';

const pluginName = 'vite-plugin-vue-distributed';
const logPrefix = cyan(`[${pluginName}]`);
const logger: Logger = createLogger('info', {
  allowClearScreen: false,
});

const VitePluginVueDistributed = (
  options = {
    archive: true,
  }
): PluginOption => {
  const { archive } = options;

  let entry: string;

  let outputDir: string;
  let outputFile: string;
  let outputJson: Record<string, any>;

  return {
    name: pluginName,
    apply: 'build',
    enforce: 'pre',

    config(config) {
      if (!config.build || !config.build.lib || !config.build.lib.entry) {
        throw new Error(`Vue distributed plugin must be built as library.`);
      }

      if (typeof config.build.lib.entry !== 'string') {
        throw new Error(
          `Vue distributed plugin accepts only one entry (string).`
        );
      }

      entry = config.build.lib.entry;
    },

    async transform(this: any, src: string, id: string) {
      let code = src;
      if (id === entry) {
        logger.info(
          green(`\n${logPrefix} Injecting identifiers in entry file...`)
        );

        const parseResult = parse(entry);
        if (parseResult.err) {
          logger.warn(
            yellow(
              `\n${logPrefix} Entry file could not be parsed. JSON file will be empty.`
            )
          );
          outputJson = {};
        } else {
          const res = parseResult.res!;

          outputJson = {
            exports: {
              ...res,
            },
            // Warning: do NOT remove, 'vue-distributed' version data will be injected at its build time.
            build: '/**----$_vue-distributed-build-inject_$----**/',
          };
        }
      }

      return {
        code,
        map: null,
      };
    },

    renderChunk(this: any, code: string) {
      const idsArray = Array.from(this.getModuleIds());
      const hashInput = `${idsArray.join('')}${Date.now()}`;
      const hash = createHash('sha256').update(hashInput).digest('hex');
      // This string must be hard-coded as this file will be replaced by 'vite-plugin-vue-distributed-internal' on vue-distributed build.
      code = code.replace('/**----$_plugin-hash-inject_$----**/', hash);

      return {
        code,
        map: null,
      };
    },

    writeBundle({ dir }, bundle) {
      if (Object.keys(bundle).length !== 1) {
        throw new Error(`'vue-distributed' build must output only one file.`);
      }

      if (typeof dir === 'undefined') {
        throw new Error(`Unable to resolve output folder.`);
      }

      const bundleObj: any = bundle[Object.keys(bundle)[0]];
      outputDir = dir;
      outputFile = bundleObj.fileName;
      const code = bundleObj.code;

      const hash = createHash('sha384')
        .update(code)
        .digest()
        .toString('base64');

      writeFileSync(
        resolve(outputDir, `${outputFile}.${SRI_FILE_EXTENSION}`),
        `sha384-${hash}`
      );

      outputJson = {
        ...outputJson,
        sri: `sha384-${hash}`,
      };

      writeFileSync(
        resolve(outputDir, `${outputFile}.json`),
        JSON.stringify(outputJson, null, 2)
      );

      if (archive) {
        // Compress.
        zip(outputDir, outputFile);
      }
    },
  };
};

const zip = async (dir: string, file: string): Promise<void> => {
  logger.info(green(`\n${logPrefix} Compressing files...`));

  const output = createWriteStream(join(dir, `${file}.zip`));
  const archive = ZipArchiver('zip', {
    zlib: { level: 9 },
  });

  output.on('close', () => {
    logger.info(
      green(
        `\n${logPrefix} Bundle was compressed and written to output folder. (${archive.pointer()} total bytes)`
      )
    );
    resolve();
  });

  archive.on('warning', (err) => {
    logger.warn(yellow(`\n${logPrefix} ${err}`));
  });

  archive.on('error', (err) => {
    throw err;
  });

  // Pipe archive data to the file.
  archive.pipe(output);

  const files = readdirSync(dir, { withFileTypes: true });
  for (const item of files) {
    if (!item.isDirectory() && item.name.startsWith(file)) {
      archive.append(createReadStream(join(dir, item.name)), {
        name: item.name,
      });
    }
  }

  archive.finalize();
};

export { VitePluginVueDistributed as default };
