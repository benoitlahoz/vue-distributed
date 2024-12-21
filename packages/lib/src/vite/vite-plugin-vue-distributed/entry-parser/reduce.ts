// Slightly adapted from https://gist.github.com/DanielOrtel/d258d2cf2af0cb3d359a3fa1f1bd03f5

import {
  ts,
  Project,
  SyntaxKind,
  ObjectLiteralExpression,
  Identifier,
  ArrayLiteralExpression,
  CallExpression,
  AsExpression,
  SpreadAssignment,
  ParenthesizedExpression,
  PropertyAccessExpression,
  ClassDeclaration,
  ThisExpression,
  PropertyAssignment,
  MethodDeclaration,
  PropertyDeclaration,
  ShorthandPropertyAssignment,
  Node,
} from 'ts-morph';

export function reducePropertyToPrimitive(input: any, project: Project): any {
  switch (input.getKind()) {
    case SyntaxKind.Identifier:
      return resolveIdentifierValue(input, project);
    case SyntaxKind.StringLiteral:
      return input.getText().slice(1, -1); // Remove quotes
    case SyntaxKind.NumericLiteral:
      return parseFloat(input.getText());
    case SyntaxKind.TrueKeyword:
      return true;
    case SyntaxKind.FalseKeyword:
      return false;
    case SyntaxKind.NullKeyword:
      return null;
    case SyntaxKind.UndefinedKeyword:
      return undefined;
    case SyntaxKind.AsExpression:
      return reduceAsExpression(input, project);
    case SyntaxKind.ParenthesizedExpression:
      return reduceParenthesizedExpression(input, project);
    case SyntaxKind.ObjectLiteralExpression:
      return reduceObjectLiteralToPrimitive(input, project);
    case SyntaxKind.ArrayLiteralExpression:
      return reduceArrayLiteralToPrimitive(input, project);
    case SyntaxKind.CallExpression:
    case SyntaxKind.FunctionExpression:
    case SyntaxKind.ArrowFunction:
      return resolveCallExpressionValue(input, project);
    case SyntaxKind.ThisKeyword:
      return resolveThisKeyword(input, project);
    case SyntaxKind.PropertyAccessExpression:
      return resolvePropertyAccessExpression(input, project);
    case SyntaxKind.PropertyDeclaration:
    case SyntaxKind.VariableDeclaration:
    case SyntaxKind.PropertyAssignment:
      const initializer = input.getInitializer();
      if (!initializer) {
        return null;
      }
      return reducePropertyToPrimitive(initializer, project);
    case SyntaxKind.ShorthandPropertyAssignment:
      return resolveShorthandProperty(input, project);
    case SyntaxKind.NoSubstitutionTemplateLiteral:
      return input.getLiteralValue();
    case SyntaxKind.TypeReference:
      return;
    default:
      throw new Error(
        `Unsupported initializer kind: ${input.getKindName()}. For ${input.getText()}`
      );
  }
}

function reduceKeyToPrimitive(key: any, project: Project) {
  switch (key.getKind()) {
    case SyntaxKind.Identifier:
      return key.getText();
    case SyntaxKind.ComputedPropertyName:
      const expression = key.getExpression();

      return reducePropertyToPrimitive(expression, project);
    default:
    /*
      throw new Error(
        `Unsupported ObjectLiteral key: ${key.getKindName()}. For ${key.getText()}`
      );
      */
  }
}

function reduceObjectLiteralToPrimitive(
  objectLiteral: ObjectLiteralExpression,
  project: Project
): any {
  let result: any = {};
  objectLiteral.getProperties().forEach((prop) => {
    if (prop.getKind() === SyntaxKind.PropertyAssignment) {
      const name = reduceKeyToPrimitive(
        (prop as PropertyAssignment).getNameNode(),
        project
      );
      const value = (prop as any).getInitializer();
      result[name] = reducePropertyToPrimitive(value, project);
    }
    if (prop.getKind() === SyntaxKind.SpreadAssignment) {
      const spreadAssignment = prop as SpreadAssignment;
      const expression = spreadAssignment.getExpression();
      const spreadObject = reducePropertyToPrimitive(expression, project);
      result = { ...result, ...spreadObject };
    }
  });
  return result;
}

function reduceAsExpression(asExpression: AsExpression, project: Project): any {
  const expression = asExpression.getExpression();
  return reducePropertyToPrimitive(expression, project);
}

function reduceParenthesizedExpression(
  parenthesizedExpression: ParenthesizedExpression,
  project: Project
): any {
  const expression = parenthesizedExpression.getExpression();
  return reducePropertyToPrimitive(expression, project);
}

function reduceArrayLiteralToPrimitive(
  arrayLiteral: ArrayLiteralExpression,
  project: Project
): any[] {
  return arrayLiteral
    .getElements()
    .map((element) => reducePropertyToPrimitive(element, project));
}

function resolveIdentifierValue(identifier: Identifier, project: Project): any {
  const definition = identifier.getDefinitions()[0];

  const sourceFile = project.getSourceFileOrThrow(
    definition.getSourceFile().getFilePath()
  );

  let variableDeclaration;

  switch (definition.getKind()) {
    case ts.ScriptElementKind.constElement:
    case ts.ScriptElementKind.letElement:
    case ts.ScriptElementKind.variableElement:
      variableDeclaration = sourceFile.getVariableDeclarationOrThrow(
        identifier.getText()
      );
      const initializer = variableDeclaration.getInitializer();
      // external import probably, can't deal with it
      if (!initializer) {
        return null;
      }

      return reducePropertyToPrimitive(initializer, project);
    case ts.ScriptElementKind.classElement:
    case ts.ScriptElementKind.localClassElement:
      variableDeclaration = sourceFile.getClassOrThrow(identifier.getText());
      return `class ${identifier.getText()}`;
    case ts.ScriptElementKind.alias:
      // For Vue component, not compiled yet.
      // TODO: enhance this to get component.
      return `${identifier.getText()}`;
    default:
      throw new Error(
        `Unsupported identifier kind: ${definition.getKind()}. For ${identifier.getText()}`
      );
  }
}

function resolveShorthandProperty(
  shorthand: ShorthandPropertyAssignment,
  project: Project
): any {
  const references = shorthand.findReferences();
  let declaration: Node | undefined;

  if (references.length > 0) {
    declaration = references[0].getDefinition().getDeclarationNode();
  }

  if (declaration) {
    return reducePropertyToPrimitive(declaration, project);
  }

  return null;
}

function resolvePropertyAccessExpression(
  expression: PropertyAccessExpression,
  project: Project
) {
  const resolvedObject = reducePropertyToPrimitive(
    expression.getExpression(),
    project
  );
  const propertyName = expression.getName();

  if (resolvedObject === null) {
    return null;
  }

  if (
    resolvedObject &&
    typeof resolvedObject === 'object' &&
    propertyName in resolvedObject
  ) {
    return resolvedObject[propertyName];
  }

  throw new Error(`Property ${propertyName} not found on resolved object.`);
}

function resolveThisKeyword(
  thisExpression: ThisExpression,
  project: Project
): any {
  const classDeclaration = thisExpression.getFirstAncestorByKind(
    SyntaxKind.ClassDeclaration
  ) as ClassDeclaration;
  if (!classDeclaration) {
    throw new Error('ThisKeyword used outside of a class.');
  }
  const propertyAccessExpression = thisExpression.getParentIfKind(
    SyntaxKind.PropertyAccessExpression
  ) as PropertyAccessExpression;
  if (!propertyAccessExpression) {
    throw new Error(
      'Unable to resolve property or method name from ThisKeyword.'
    );
  }

  const propertyName = propertyAccessExpression.getName();
  if (!propertyName) {
    throw new Error(
      'Unable to resolve property or method name from ThisKeyword.'
    );
  }
  let property = getPropertyInInheritance(
    classDeclaration,
    propertyName,
    false,
    false
  );
  if (property) {
    const initializer = property.getInitializer();
    if (!initializer) {
      return null;
    }
    return reducePropertyToPrimitive(initializer, project);
  }

  const method = getMethodInInheritance(
    classDeclaration,
    propertyName,
    false,
    false
  );
  if (method) {
    const body = method.getBody();
    if (!body) {
      return null;
    }
    const returnStatement = body.getFirstDescendantByKind(
      SyntaxKind.ReturnStatement
    );
    if (!returnStatement) {
      return null;
    }
    const expression = returnStatement.getExpression();
    if (!expression) {
      return null;
    }
    return reducePropertyToPrimitive(expression, project);
  }
}

// don't resolve this, there can be too many complexities here, and we don't need it
function resolveCallExpressionValue(
  _callExpression: CallExpression,
  _project: Project,
  v = null
): any {
  // Implement logic to resolve the value of the call expression
  return v;
}

// generic utils

function getPropInInheritance(
  classDeclaration: ClassDeclaration,
  propertyName: string,
  required = false,
  isStatic = true,
  isMethod = false
) {
  let property: PropertyDeclaration | MethodDeclaration | undefined;

  if (isMethod) {
    if (isStatic) {
      property = classDeclaration.getStaticMethod(
        propertyName
      ) as MethodDeclaration;
    } else {
      property = classDeclaration.getInstanceMethod(propertyName);
    }
  } else {
    if (isStatic) {
      property = classDeclaration.getStaticProperty(
        propertyName
      ) as PropertyDeclaration;
    } else {
      property = classDeclaration.getProperty(propertyName);

      if (!property) {
        property = getPropertyFromConstructor(classDeclaration, propertyName);
      }
    }
  }

  if (!property) {
    const baseClass = classDeclaration.getBaseClass();

    if (!baseClass) {
      if (required) {
        throw new Error(
          `Could not find required static ${propertyName}. You need to define it in every resource or a parent abstract resource`
        );
      } else {
        return null;
      }
    }

    return getPropInInheritance(
      baseClass,
      propertyName,
      required,
      isStatic,
      isMethod
    );
  }

  return property;
}

export function getPropertyInInheritance(
  classDeclaration: ClassDeclaration,
  propertyName: string,
  required = false,
  isStatic = true
): PropertyDeclaration | null {
  return getPropInInheritance(
    classDeclaration,
    propertyName,
    required,
    isStatic,
    false
  ) as PropertyDeclaration | null;
}

export function getMethodInInheritance(
  classDeclaration: ClassDeclaration,
  propertyName: string,
  required = false,
  isStatic = true
): MethodDeclaration | null {
  return getPropInInheritance(
    classDeclaration,
    propertyName,
    required,
    isStatic,
    true
  ) as MethodDeclaration | null;
}

export function getPropertyFromConstructor(
  classDeclaration: ClassDeclaration,
  propertyName: string
): any | null {
  const constructor = classDeclaration.getConstructors()[0];
  if (!constructor) {
    return null;
  }

  // Check constructor body for property assignments
  const statements = (constructor.getBody() as any)?.getStatements() || [];

  for (const statement of statements) {
    if (statement.getKind() === SyntaxKind.ExpressionStatement) {
      const expression = statement
        .asKind(SyntaxKind.ExpressionStatement)
        ?.getExpression();
      if (expression?.getKind() === SyntaxKind.BinaryExpression) {
        const binaryExpression = expression.asKind(SyntaxKind.BinaryExpression);
        const left = binaryExpression?.getLeft().getText();
        if (left === `this.${propertyName}`) {
          return binaryExpression?.getRight();
        }
      }
    }
  }

  return null;
}
