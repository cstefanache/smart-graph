import lo from 'lodash';

let executed = false;

const DEFAULT = {
  minNumToCollapse: 5,
  collapseAll: false,
  execute: false
}

export default function(instance) {

  const {
    nodes,
    links,
    idFn,
    getNode,
    config,
    toggle
  } = instance;

  const cfg = {
    ...DEFAULT,
    ...config.autoCollapse
  }

  if (executed || !cfg.execute) {
    return {}
  }

  let updatedNodes = nodes;
  let updatedLinks = links;

  const alreadyCreated = [];

  /*
  const toggle = node => {
    const {__sg} = node;
    const {children} = __sg;
    const nodeId = idFn(node);
    const newNode = getNode({sgGroup: true, count: children.length, collapseParent: node});
    const newNodeId = idFn(newNode);
    const nodesList = [];
    const linksList = [];
    const revLinksList = [];

    const parseChildren = childsList => {
      childsList.forEach(nd => {
        if (nodesList.indexOf(nd) === -1) {
          nodesList.push(nd);
          nd.__sg.blockRender = false;
          nd.__sg.fromLinks.forEach(link => {
            linksList.pushUnique(link);
          });

          nd.__sg.fromLinks.forEach(link => {
            linksList.pushUnique(link);
            const test = `${link[0]}-${newNodeId}`;
            if (alreadyCreated.indexOf(test) === -1) {
              revLinksList.pushUnique([link[0], newNodeId]);
              alreadyCreated.push(test);
            }
          });
          nd.__sg.toLinks.forEach(link => {
            linksList.pushUnique(link);
            const test = `${newNodeId}-${link[1]}`;
            if (alreadyCreated.indexOf(test) === -1) {
              revLinksList.pushUnique([
                newNodeId, link[1]
              ]);
              alreadyCreated.push(test);
            }
          });
        }
      })
    };

    parseChildren(children);
    node.__sg.collapsedChildren = nodesList;
    node.__sg.collapsedLinks = linksList;
    node.__sg.createdLinks = revLinksList;
    node.__sg.ghostNode = newNode;
    updatedNodes = lo.difference(updatedNodes, nodesList);
    updatedNodes.push(newNode);
    updatedLinks = lo.difference(updatedLinks, linksList).concat(revLinksList);
  }
  */

  nodes.forEach(node => {
    if (node.sgAutoGroup || cfg.collapseAll) {
      const {length} = node.__sg.children;

      if (length > cfg.minNumToCollapse) {
        toggle.apply(instance, [
          node, {
            runPlugins: false,
            restart: false
          }
        ]);
      }
    }
  });

  executed = true;
  return {};

}
