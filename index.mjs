import { parse } from "sql-parser-cst";
import { doc } from "prettier";

export const languages = [
  {
    extensions: [".sql"],
    name: "SQL",
    parsers: ["sql"],
  },
];

export const parsers = {
  sql: {
    parse: (text, options) =>
      moveCommentsToRoot(
        parse(text, {
          dialect: "sqlite",
          includeRange: true,
          includeComments: true,
          filename: options.filepath,
        })
      ),
    astFormat: "sql-cst",
    locStart: (node) => node.range?.[0],
    locEnd: (node) => node.range?.[1],
  },
};

export const printers = {
  "sql-cst": {
    print: printSql,
    printComment: (path) => path.node.text,
    canAttachComment: isNode,
    isBlockComment: (node) => node.type === "block_comment",
  },
};

function isNode(node) {
  return (
    node &&
    typeof node.type === "string" &&
    node.type !== "line_comment" &&
    node.type !== "block_comment"
  );
}

// Gathers all comments from the tree and moves them to the root
function moveCommentsToRoot(cst) {
  const visitAllNodes = (node, visit) => {
    visit(node);

    for (const child of Object.values(node)) {
      if (isNode(child)) {
        visitAllNodes(child, visit);
      } else if (child instanceof Array) {
        child
          .filter(isNode)
          .forEach((childNode) => visitAllNodes(childNode, visit));
      }
    }
  };

  const extractComments = (cst) => {
    const comments = [];
    visitAllNodes(cst, (node) => {
      comments.push(...(node.leading || []), ...(node.trailing || []));
      delete node.leading;
      delete node.trailing;
    });
    return comments;
  };

  return {
    ...cst,
    comments: extractComments(cst),
  };
}

const { join, group, line, fill } = doc.builders;

function printSql(path, options, print) {
  switch (path.node.type) {
    case "program":
      return path.map(print, "statements");
    case "drop_table_stmt":
      return group(
        fill(
          join(line, [
            path.call(print, "dropKw"),
            path.call(print, "tableKw"),
            path.call(print, "tables"),
          ])
        )
      );
    case "list_expr":
      return join(", ", path.map(print, "items"));
    case "keyword":
      return path.node.text;
    case "identifier":
      return path.node.text;
    default:
      throw new Error(`Unexpected node type ${path.node.type}`);
  }
}
