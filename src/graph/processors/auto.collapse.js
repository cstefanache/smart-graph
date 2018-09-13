import lo from 'lodash';

let executed = false;

export default function(instance) {

  const {nodes, links, idFn, getNode} = instance;

  if (executed) {
    return {}
  }


  let updatedNodes = nodes;
  let updatedLinks = links;


  const toggle = node => {
    const {__sg} = node;
    const {children} = __sg;
    const nodeId = idFn(node);
    const newNode = getNode({sgGroup: true, count: children.length});
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
            revLinksList.pushUnique([link[0], newNodeId]);
          });
          nd.__sg.toLinks.forEach(link => {
            linksList.pushUnique(link);
            // revLinksList.pushUnique([nodeId, newNodeId]);
            revLinksList.pushUnique([
              newNodeId, link[1]
            ]);
          });
        }
      })
    };

    parseChildren(children);
    node.__sg.collapsedChildren = nodesList;
    node.__sg.createdLinks = revLinksList;
    node.__sg.ghostNode = newNode;
    updatedNodes = lo.difference(updatedNodes, nodesList);
    updatedNodes.push(newNode);
    updatedLinks = lo.difference(updatedLinks, linksList).concat(revLinksList);
  }


  nodes.forEach(node => {
    if (node.sgAutoGroup) {
      const {length} = node.__sg.children;

      if (length > 5) {
        toggle(node);
      }
    }
  });


  executed = true;
  return {nodes: updatedNodes, links: updatedLinks};

}
