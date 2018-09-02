export default function (instance) {

  const {nodes, idFn} = instance;
  const nodesMap = {};

  nodes.forEach(node => nodesMap[idFn(node)] = node);

  return {nodes, nodesMap};

}
