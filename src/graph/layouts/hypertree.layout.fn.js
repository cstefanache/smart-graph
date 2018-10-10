import processors from '../processors';

export const processorExecution = [
  'defaultProcessor',
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

export default function (instance) {
  let nodes,
    links,
    tree;
  const {getSize} = instance;
  function force(_) {
    const visited = Math.random();

    const calculateNodeSize = node => {
      const {__sg} = node;
      const {children} = __sg;
      const [w, h] = getSize(node);
      if (!__sg.hyperSize) {
        __sg.hyperSize = Math.sqrt(w * w + h * h) + children.reduce((memo, child) => memo + calculateNodeSize(child), 0);
      }

      return __sg.hyperSize;
    }

    const positionChildrenAroundCenter = (cx, cy, children, pAngle = 0, pRadi = 0) => {
      const {length} = children;
      const circleLength = children.reduce((memo, item) => memo + calculateNodeSize(item), 0);
      const radius = pRadi + circleLength / Math.PI * 2;
      let angle = pAngle + Math.PI / 4 / length;

      children.forEach(node => {
        node.__sg.bounds = {
          minX: node.x,
          maxX: node.x,
          minY: node.y,
          maxY: node.y
        };
        if (node.visited !== visited) {
          node.visited = visited;
          let radi = pRadi + node.__sg.hyperSize * 2;
          const dx = cx + (radi * Math.cos(angle) - node.x);
          const dy = cy + (radi * Math.sin(angle) - node.y);
          node.vx = dx * (1 - _);
          node.vy = dy * (1 - _);
          const lAngle = angle;
          angle += 2 * Math.PI / length;
          const nodeChilds = node.__sg.children;
          const centerX = cx + radi * Math.cos(lAngle);
          const centerY = cy + radi * Math.sin(lAngle)
          if (nodeChilds && nodeChilds.length > 0) {
            positionChildrenAroundCenter(centerX, centerY, nodeChilds, lAngle, node.__sg.hyperSize);
            nodeChilds.forEach(nd => {
              node.__sg.bounds.minX = node.__sg.bounds.minX
                ? Math.min(node.__sg.bounds.minX, nd.__sg.bounds.minX)
                : nd.__sg.bounds.minX;
              node.__sg.bounds.minY = node.__sg.bounds.minY
                ? Math.min(node.__sg.bounds.minY, nd.__sg.bounds.minY)
                : nd.__sg.bounds.minY;
              node.__sg.bounds.maxX = node.__sg.bounds.maxX
                ? Math.max(node.__sg.bounds.maxX, nd.__sg.bounds.maxX)
                : nd.__sg.bounds.maxX;
              node.__sg.bounds.maxY = node.__sg.bounds.maxY
                ? Math.max(node.__sg.bounds.maxY, nd.__sg.bounds.maxY)
                : nd.__sg.bounds.maxY;
            })
          }
        }
      });

      return radius;
    }

    positionChildrenAroundCenter(0, 0, tree[0].children);
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
