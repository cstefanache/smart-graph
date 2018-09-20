import lo from 'lodash';
const DEFAULTS = {}
export default function (instance) {

  const {nodes, links, nodesMap, config} = instance;
  const tree = {};
  const layout = {
    numCols: 0,
    numRows: 0
  };

  const cfg = {
    ...DEFAULTS
  }

  nodes.forEach(node => {

    node.__sg = {
      ...node.__sg,
      toNodes: [],
      fromLinks: [],
      toLinks: [],
      fromNodes: [],
      children: []
    };
  });

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const [from, to] = link;
    const fromNode = nodesMap[from],
      toNode = nodesMap[to];
    if (fromNode && toNode) {
      fromNode.__sg.children.pushUnique(toNode);
      fromNode.__sg.toNodes.pushUnique(toNode);
      fromNode.__sg.toLinks.pushUnique(link);

      toNode.__sg.fromNodes.pushUnique(fromNode);
      toNode.__sg.fromLinks.pushUnique(link);
    } else {
      if (!fromNode) {
        console.warn(`Missing node ${from}`)
      }
      if (!toNode) {
        console.warn(`Missing node ${to}`)
      }
    }
  }

  return {nodes: lo.sortBy(nodes, node => node.__sg.toNodes.length), links, layout, tree};

}
