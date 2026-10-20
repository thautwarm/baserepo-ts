// ts-to-zod uses the TypeScript 5 AST; the workspace's tsc is TypeScript 7.
import ts from "typescript-parser";

export function publicModelNames(sourceText: string): Set<string> {
  const source = ts.createSourceFile("types.ts", sourceText, ts.ScriptTarget.Latest, true);
  const declarations = new Map(
    source.statements
      .filter((node) => ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node))
      .map((node) => [node.name.text, node]),
  );
  const selected = new Set<string>();

  function select(name: string) {
    const declaration = declarations.get(name);
    if (!declaration || selected.has(name)) return;
    selected.add(name);
    visit(declaration);
  }

  function visit(node: ts.Node) {
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) select(node.typeName.text);
    if (ts.isExpressionWithTypeArguments(node) && ts.isIdentifier(node.expression)) {
      select(node.expression.text);
    }
    ts.forEachChild(node, visit);
  }

  select("PublicModels");
  return selected;
}
