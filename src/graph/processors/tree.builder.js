import lo from 'lodash';
const DEFAULTS = {
  agressiveDemoting: false
}
export default function (instance) {

  const {nodes, links, nodesMap, config} = instance;
  const tree = {};
  const layout = {
    numCols: 0,
    numRows: 0
  };

  const cfg = {
    ...DEFAULTS,
    ...config.tree
  }
  const orderedNodes = [];

  nodes.forEach(node => {

    node.__sg = {
      ...node.__sg,
      row: 0,
      children: [],
      toLinks: [],
      fromLinks: []
    };
  });

  for (let j = 0; j < links.length; j++) {
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const [from, to] = link;
      const fromNode = nodesMap[from],
        toNode = nodesMap[to];
      if (fromNode && toNode) {
        fromNode.__sg.children.pushUnique(toNode);
        fromNode.__sg.toLinks.pushUnique(link)
        toNode.__sg.fromLinks.pushUnique(link);
        if (!cfg.agressiveDemoting || toNode.__sg.row <= fromNode.__sg.row) {
          toNode.__sg.row = fromNode.__sg.row + 1;
        }
      } else {
        if (!fromNode) {
          // console.warn(`Missing node ${from}`)
        }
        if (!toNode) {
          // console.warn(`Missing node ${to}`)
        }
      }
    }
  }

  nodes.forEach(node => {
    orderedNodes.pushUnique(node);
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

  Object.keys(tree).forEach((key, index) => {
    const row = tree[key];
    delete tree[key];
    tree[index] = row;
    row.children.forEach(node => node.__sg.row = index);
  });

  console.log(tree);
  layout.numRows = Object.keys(tree).length;
  return {nodes, links, layout, tree};

}
