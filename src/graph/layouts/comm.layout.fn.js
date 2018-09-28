import lo from 'lodash';
import processors from '../processors';

export const processorExecution = ['defaultProcessor', 'nodesMapper', 'relationship', 'linksReducer']

let nodeSize = 20 * 1.8;
let padding = 40;

export default function (instance) {
  let nodes,
    links,
    inst,
    groupWidths;

  const {getSize} = instance;
  function force(_) {
    let cx = 0;
    let maxNodes = 10;
    let cGx = nodes[0].__sg.groupIndex;
    let radius = 0;
    let maxHeight = 0;
    let i = 0;
    let cAngle = 0;
    let currentX = 0;
    let currentY = 0;
    let latestSize;
    let angle = 0;
    let pos = 0;
    nodes.forEach(node => {
      const {__sg} = node;
      const [width, length, height] = getSize(node);

      const radial = () => {
        // const angle = i++ / (maxNodes /2) * Math.PI;
        // if (i === maxNodes) {
        //   i = 0;
        //   radius += 150;
        //   maxNodes += 5;
        // }
        // cx += width;
        // node.vx = (radius * Math.cos(angle) - node.x) * (1 - _);
        // node.vy = (radius * Math.sin(angle) - node.y) * (1 - _);
      }

      const grid = () => {
        node.vx = (currentX - node.x) * (1 - _);
        node.vy = (currentY - node.y) * (1 - _);
        if (currentX > 1000) {
          currentX = 0;
          currentY += 100 + maxHeight;
          maxHeight = 0;
        } else {
          maxHeight = Math.max(height);
          currentX += width + 100;
        }
      }

      const groupLayering = () => {
        const {groupIndex, positionInGroup, groupRef} = __sg;
        if (groupIndex === 3) {
          // debugger
        }
        if (cGx !== groupIndex) {
          radius += nodeSize + padding;
          latestSize = groupRef.length;
          cGx = groupIndex;
          pos = 1;
          angle = 0;
        }
        const maxNodesAtRadius = Math.floor(Math.min(radius * Math.PI / (nodeSize + padding), latestSize - 1));
        // const maxNodesAtRadius = Math.floor(radius * Math.PI / (nodeSize + padding));
        node.vx = (radius * Math.cos(angle) - node.x) * (1 - _);
        node.vy = (radius * Math.sin(angle) - node.y) * (1 - _);
        angle = pos / (maxNodesAtRadius || 1) * Math.PI;

        if (pos > maxNodesAtRadius) {
          radius += nodeSize + padding;
          latestSize -= maxNodesAtRadius;
          pos = 0;
          angle = 0;
        }

        pos++;
      }

      groupLayering();

      node.x += node.vx;
      node.y += node.vy;

    })
  }

  force.setNodes = function (n, data) {
    nodes = n;
  }

  force.setLinks = function (l, data) {
    links = l;
  }

  force.processors = processorExecution.reduce((memo, item) => memo.concat(processors[item]), []);

  return force;
}
