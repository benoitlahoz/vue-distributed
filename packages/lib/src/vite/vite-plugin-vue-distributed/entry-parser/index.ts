import { Project, SourceFile, TypeChecker, Symbol } from 'ts-morph';
import { reducePropertyToPrimitive } from './reduce';

// https://stackoverflow.com/a/72339607/1060921
// https://gist.github.com/DanielOrtel/d258d2cf2af0cb3d359a3fa1f1bd03f5

export const parse = (path: string) => {
  const project = new Project({ compilerOptions: { allowJs: true } });
  const checker = project.getTypeChecker();
  const sourceFile = project.addSourceFileAtPath(path);

  return handleExportDeclarations(sourceFile, path, project, checker);
};

const handleExportDeclarations = (
  file: SourceFile,
  path: string,
  project: Project,
  checker: TypeChecker
) => {
  try {
    const exports = file.getExportedDeclarations();
    const def = exports.get('default');
    let alias: string | undefined;

    if (def) {
      alias = getDefaultAlias(checker, file, path);
    }

    const res: Record<string, any> = {};
    for (const [name, declarations] of exports) {
      if (alias && name === alias) {
        // Bypass default export's alias if exists so we don't have a double entry.
        continue;
      }

      for (const declaration of declarations) {
        // TODO: check if conforms to ModuleDefinition (declared or not declared in the plugin).
        // console.log('TYPE %s\n', declaration.getType().getText());
        declaration.forEachChild((child) => {
          res[name] = reducePropertyToPrimitive(child, project);
        });
      }
    }

    return {
      res,
      err: null,
    };
  } catch (err: unknown) {
    return {
      res: null,
      err,
    };
  }
};

const getDefaultAlias = (
  checker: TypeChecker,
  file: SourceFile,
  path: string
) => {
  const symbol = checker.getSymbolAtLocation(file);

  if (!symbol) {
    throw new Error(
      `Unable to get typescript symbol from file at path '${path}'.`
    );
  }

  const exports = checker.getExportsOfModule(symbol);

  const exportedSymbols: Record<string, Symbol> = {};
  for (const sym of exports) {
    const name = sym.getEscapedName() as string;
    exportedSymbols[name] = sym;
  }

  try {
    // Get default or aliased symbol.
    const alias: Symbol | undefined = checker.getAliasedSymbol(
      exportedSymbols['default']
    );

    if (alias) return alias.getEscapedName();
    return;
  } catch (_err: unknown) {
    return;
  }
};
