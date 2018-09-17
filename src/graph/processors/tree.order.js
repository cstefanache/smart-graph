import lo from 'lodash';
import uuid4 from 'uuid4';

export default function (instance) {

  const {nodes, links, tree, nodesMap} = instance;

  const orderedNodes = [];
  const visitId = uuid4();
  let childIndex = 0;

  const stepInto = collection => {
    collection.forEach(node => {
      const {__sg} = node;
      if (visitId !== __sg.visitId) {
        const {children} = __sg;
        __sg.visitId = visitId;
        __sg.childIndex = ++childIndex;
        stepInto(children);
      }
    })
  }

  const keys = Object.keys(tree);

  if (keys.length > 0) {
    stepInto(tree[keys[0]].children)
  }

  Object.keys(tree).forEach(key => {
    tree[key].children = lo.orderBy(tree[key].children, nd => nd.__sg.childIndex);
  });

  return {nodes, links}
}
