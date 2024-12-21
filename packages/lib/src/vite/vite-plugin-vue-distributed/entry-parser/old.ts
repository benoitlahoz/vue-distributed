import * as ts from 'typescript';

// https://stackoverflow.com/a/72339607/1060921
export const extract = (file: string) => {
  const program = ts.createProgram([file], {});
  const sourceFile = program.getSourceFile(file);
  const checker = program.getTypeChecker();

  const sourceFileSymbol = checker.getSymbolAtLocation(sourceFile!);
  const exports = checker.getExportsOfModule(sourceFileSymbol!);

  // console.log(exports[0].getDeclarations());

  // FONCTIONNE avec export { plugin as default };
  // ERREUR sur alias si export default {}
  const defaultExport = exports.find((e) => e.escapedName === 'default');

  if (defaultExport) {
    // const declarations = defaultExport.getDeclarations();
    const alias = checker.getAliasedSymbol(defaultExport);
    console.log('ALIAS', alias); // Fonctionne si on ne spécifie pas le type.
    const declarations = alias.getDeclarations();

    if (declarations) {
      for (const declaration of declarations) {
        const defaultExportType = checker.getTypeOfSymbolAtLocation(
          defaultExport,
          declaration
        );
        // console.log(defaultExportType.getProperties());

        // const obj: Record<string, any> = {};

        const configDecl = declaration as ts.VariableDeclaration;
        const objLit = configDecl.initializer as ts.ObjectLiteralExpression;

        for (const prop of objLit.properties) {
          console.log(prop); // TODO: voir la propriété 'initializer' pour les sous-objets ?
        }
        // Fonctionne si on ne spécifie pas le type dans 'plugin'.
        // const plugin = { }
        // renvoie [] si le type est spécifié;
        // const plugin: ModuleDefinition = {}

        // const alias = checker.getAliasedSymbol(defaultExport);
        // console.log('ALIAS', alias); // Fonctionne si on ne spécifie pas le type.
      }
    }
  }

  for (const symbol of exports) {
    // console.log('DEF', defaultExport);
    // const alias = checker.getAliasedSymbol(symbol);
    // console.log('ALIAS', alias);
    // getTypeOfSymbol(checker, alias);
    // getValuesForAlias(checker, alias); // ICI CA MARCHE
  }

  // test(file, ['plugin', 'default']);

  const defaultExportSymbol = exports.find((e) => e.escapedName === 'default')!;

  // console.log('EXP', exports);
  // console.log('DEFAULT', defaultExportSymbol);

  const defaultExportType = checker.getTypeOfSymbolAtLocation(
    defaultExportSymbol,
    defaultExportSymbol.declarations![0]
  );

  // console.log(defaultExportType.getProperties());

  for (const prop of defaultExportType.getProperties()) {
    const propType = checker.getTypeOfSymbolAtLocation(
      prop,
      prop.declarations![0]
    );
    // console.log(prop.name); // hello
    // console.log(checker.typeToString(propType)); // string
  }

  // const configSymbol = checker.getAliasedSymbol(defaultExport);
};

const getTypeOfSymbol = (checker: ts.TypeChecker, symbol: ts.Symbol) => {
  const declarations = symbol.getDeclarations();
  for (const declaration of declarations || []) {
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    // console.log(type.getApparentProperties());
    // console.log(type.getProperties());
  }

  // Quand un type est passéé dans le plugin -> getAliasedSymbol.
};

const getValuesForAlias = (checker: ts.TypeChecker, symbol: ts.Symbol) => {
  const obj: Record<string, any> = {};

  const configDecl = symbol.declarations![0] as ts.VariableDeclaration;
  const objLit = configDecl.initializer as ts.ObjectLiteralExpression;

  for (const prop of objLit.properties) {
    if (!prop.name) continue;

    const childCount = (
      prop as ts.PropertyAssignment
    ).initializer.getChildCount();

    const name = prop.name.getText();
    if (childCount === 0) {
      const value = (prop as ts.PropertyAssignment).initializer.getText();
      obj[name] = value;
    }

    console.log('OBJ', obj);

    /*
    parseValue(
      prop.name.getText(),
      (prop as ts.PropertyAssignment).initializer.getText()
    );
    */
    // console.log((prop as ts.PropertyAssignment).initializer.getChildCount());
  }
};

const parseValue = (name: string, value: string) => {
  console.log(name);
};

function test(file: string, identifiers: string[]): void {
  // Create a Program to represent the project, then pull out the
  // source file to parse its AST.
  let program = ts.createProgram([file], { allowJs: true });
  const sourceFile = program.getSourceFile(file);
  const checker = program.getTypeChecker();

  const sourceFileSymbol = checker.getSymbolAtLocation(sourceFile!);
  const exports = checker.getExportsOfModule(sourceFileSymbol!);
  console.log('exports', exports);

  // To print the AST, we'll use TypeScript's printer
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  // To give constructive error messages, keep track of found and un-found identifiers
  const unfoundNodes = [],
    foundNodes = [];

  // Loop through the root AST nodes of the file
  ts.forEachChild(sourceFile, (node) => {
    let name = '';

    // This is an incomplete set of AST nodes which could have a top level identifier
    // it's left to you to expand this list, which you can do by using
    // https://ts-ast-viewer.com/ to see the AST of a file then use the same patterns
    // as below
    if (ts.isFunctionDeclaration(node)) {
      name = node.name.text;
      // Hide the method body when printing
      node.body = undefined;
    } else if (ts.isVariableStatement(node)) {
      name = node.declarationList.declarations[0].name.getText(sourceFile);
    } else if (ts.isInterfaceDeclaration(node)) {
      name = node.name.text;
    }

    const container = identifiers.includes(name) ? foundNodes : unfoundNodes;
    container.push([name, node]);
  });

  // Either print the found nodes, or offer a list of what identifiers were found
  if (!foundNodes.length) {
    console.log(
      `Could not find any of ${identifiers.join(
        ', '
      )} in ${file}, found: ${unfoundNodes
        .filter((f) => f[0])
        .map((f) => f[0])
        .join(', ')}.`
    );
    process.exitCode = 1;
  } else {
    foundNodes.map((f) => {
      const [name, node] = f;
      // console.log('### ' + name + '\n');
      /*
      console.log(
        printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
      ) + '\n';
      */
    });
  }
}
