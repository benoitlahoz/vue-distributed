import { basename } from 'node:path';
// import * as ts from 'typescript';
// import { TypescriptParser } from 'typescript-parser';
import { ts, Node, Project, SyntaxKind } from 'ts-morph';

// https://stackoverflow.com/a/72339607/1060921
export const extract = (file: string) => {
  const program = ts.createProgram([file], { allowJs: true });
  const source = program.getSourceFile(file);
  const checker = program.getTypeChecker();

  let sourceSymbol: ts.Symbol | undefined;
  let exports: ts.Symbol[] = [];

  if (!source) {
    throw new Error(
      `Unable to build typescript source file from file at path '${file}'.`
    );
  }

  sourceSymbol = checker.getSymbolAtLocation(source);

  if (!sourceSymbol) {
    throw new Error(
      `Unable to get typescript symbol from file at path '${file}'.`
    );
  }

  exports = checker.getExportsOfModule(sourceSymbol);

  const exportedSymbols: Record<string, ts.Symbol> = {};
  for (const symbol of exports) {
    const name = symbol.escapedName as string;
    exportedSymbols[name] = symbol;
  }

  if (exportedSymbols['default']) {
    handleDefaultExport(checker, exportedSymbols['default']);
  }

  // console.log(exportedSymbols);
};

const handleDefaultExport = (checker: ts.TypeChecker, symbol: ts.Symbol) => {
  // Get default or aliased symbol.
  let real: ts.Symbol;

  try {
    real = checker.getAliasedSymbol(symbol);
  } catch (_err: unknown) {
    real = symbol;
  }

  // Check if default is an alias and get the alias name -> discard this name entry in exports.
  console.log('HAS DEFAULT', real.escapedName);

  const declarations = real.getDeclarations() || [];
  for (const declaration of declarations) {
    console.log(declaration.kind);
  }
};

const handleNamedExport = () => {
  //
};

export const parse = async (path: string) => {
  const project = new Project({ compilerOptions: { allowJs: true } });
  const checker = project.getTypeChecker();
  const file = project.addSourceFileAtPath(path);

  const exports = file.getExportedDeclarations();

  const res: Record<string, any> = {};
  if (exports.has('default')) {
    const defaultDeclaration = exports.get('default')!;

    for (const declaration of defaultDeclaration) {
      // console.log(declaration.getChildCount());
      // console.log(declaration.getLastChild());
      declaration.forEachChild((node: Node) => {
        // if (node.getKind() === SyntaxKind.)
        console.log(node.getKindName());
        if (node.getKind() === SyntaxKind.Identifier) {
          console.log(node.getText());
          console.log(file.getVariableDeclaration(node.getText()).getText());
          // console.log(node.getSymbol()?.getInitializer());
        }
        /*
        const obj = node.getText();
        console.log(obj);
        if (obj) {
          // console.log(obj.getProperties()); // look at the properties (includes methods and such) of the object literal expression here
        }
          */
      });
    }
  }

  /*
  const exports = file.getExportSymbols();

  const exported: Record<string, any> = {};

  for (const symbol of exports) {
    console.log(
      symbol.getEscapedName(),
      symbol.isAlias(),
      symbol.getAliasedSymbol()?.getEscapedName()
    );

    const name = symbol.getEscapedName();
    if (symbol.isAlias()) {
      const alias = symbol.getAliasedSymbol();

      if (alias) {
        const declaration = alias.getValueDeclaration();
        declaration?.forEachDescendant((node: Node) => {
          console.log(checker.getTypeOfSymbolAtLocation(symbol, node));
          const kind = node.getKindName();
          // console.log(kind);
          if (kind === 'StringLiteral') {
            // console.log(node);
          }
        });
      }
    } else {
      //
    }

    exported[name] = {};
  }

  console.log(exported);
  */

  /*
  if (symbol) {
    const members = symbol.getMembers();
    console.log(members);
    const alias = symbol.getAliasedSymbol();
    console.log(alias);
    if (alias) {
      const m = alias.getMembers();
      console.log(m);
    }
  }
    */
  /*
  const root = path.substring(0, path.lastIndexOf('/'));

  const parser = new TypescriptParser();
  const file = await parser.parseFile(path, root);
  console.log(file);
  console.log(file.exports[0].specifiers);
  */
};
