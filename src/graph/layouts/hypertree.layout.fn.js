import processors from '../processors';

export const processorExecution = [
  'nodesMapper',
  'processGraph',
  'childrenAggregator',
  'groupBuilder',
  'layerGroup',
  'nodesMapper',
  'processGraph',
  'autoCollapse',
  'nodesMapper',
  'processGraph',
  'treeOrder'
]

let nodeSize = 20;
let padding = 10;
let logged = false;
export default function (instance) {
  let nodes,
    links,
    tree;
  const {getSize} = instance;
  function force(_) {
    const log = what => {
      if (!logged) {
        console.log(what);
      }
    }

    log('------------------------');
    const calculateNodeSize = node => {
      const {__sg} = node;
      const {children} = __sg;
      const [w, h] = getSize(node);
      // if (!__sg.hyperSize) {
        __sg.hyperSize = Math.sqrt(w * w + h * h);
        if (children && children.length > 0) {
          __sg.hyperSize = children.reduce((memo, child) => memo + calculateNodeSize(child), 0)
        }
      // }

      return __sg.hyperSize;
    }
    const visited = Math.random();
    const positionChildrenAroundCenter = (cx, cy, children, pAngle = 0) => {
      const {length} = children;
      const circleLength = (
        length === 1
        ? 100
        : 0) + children.reduce((memo, item) => memo + calculateNodeSize(item), 0);
      const radius = circleLength / Math.PI * 2;
      let angle = pAngle + (
        length > 1
        ? Math.PI / 2
        : 0);
      children.forEach(node => {
        if (node.visited !== visited) {
          node.visited = visited;
          const dx = cx + (radius * Math.cos(angle) - node.x);
          const dy = cy + (radius * Math.sin(angle) - node.y);
          node.vx = dx * (1 - _);
          node.vy = dy * (1 - _);
          const lAngle = angle;
          angle += 2 * Math.PI * node.__sg.hyperSize / circleLength;
          const nodeChilds = node.__sg.children;
          if (nodeChilds) {
            positionChildrenAroundCenter(cx + radius * Math.cos(lAngle), cy + radius * Math.sin(lAngle), nodeChilds, lAngle);
          }
        }
      });
    }

    positionChildrenAroundCenter(0, 0, tree[0].children);
    log(tree);
    logged = true;

  }

  force.setNodes = function (n, data) {
    nodes = n;
    tree = data.tree;
  }

  force.setLinks = function (l, data) {
    links = l;
    tree = data.tree;
  }

  force.processors = processorExecution.reduce((memo, item) => memo.concat(processors[item]), []);

  return force;
}
