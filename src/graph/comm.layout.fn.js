import defaultProcessor from './processors/default.processor';
import lo from 'lodash';
import nodesMapper from './processors/node.mapper';
import relationship from './processors/relationship.builder';

export const processors = {
  defaultProcessor,
  nodesMapper,
  relationship
}

export const processorExecution = ['defaultProcessor', 'nodesMapper', 'relationship']

export default function (instance) {
  let nodes,
    links;

  const {getSize} = instance;
  function force(_) {
    let cx = 0;
    let maxNodes = 10;
    let radius = 150;
    let i = 0;
    nodes.forEach(node => {
      const angle = i++ / (maxNodes / 2) * Math.PI;
      if (i === maxNodes) {
        i = 0;
        radius += 150;
        maxNodes += 5;
      }
      const {__sg} = node;
      const [width, length, height] = getSize(node);
      cx += width;
      node.vx = (radius * Math.cos(angle) - node.x) * (1 - _);
      node.vy = (radius * Math.sin(angle) - node.y) * (1 - _);
      node.x += node.vx;
      node.y += node.vy;
    })
  }

  force.setNodes = function (n, data) {
    nodes = n;
    console.log(data);
  }

  force.setLinks = function (l, data) {
    links = l;
  }

  force.processors = processorExecution.reduce((memo, item) => memo.concat(processors[item]), []);

  return force;
}
