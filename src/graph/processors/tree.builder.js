export default function (instance) {

  const {nodes, links, nodesMap} = instance;
  const tree = {};
  const layout = {
    numCols: 0,
    numRows: 0
  };

  nodes.forEach(node => {
    node.forceRender = true;

    node.__sg = {
      ...node.__sg,
      row: 0,
      children: []
    };
  });

  for (let i = 0; i < links.length; i++) {
    for (let j = 0; j < links.length; j++) {
      const [from, to] = links[j];
      const fromNode = nodesMap[from],
        toNode = nodesMap[to];
      fromNode.__sg.children.push(toNode);
      toNode.__sg.row = fromNode.__sg.row + 1;
    }
  }

  nodes.forEach(node => {
    const {__sg} = node, {row} = __sg;

    let treeRow = tree[row];
    if (!treeRow) {
      treeRow = tree[row] = {
        children: []
      };
    }

    treeRow.children.push(node);
    layout.numCols = Math.max(layout.numCols, treeRow.children.length);
  });

  layout.numRows = Object.keys(tree).length;

  return {nodes, links, layout, tree};

}
