import autoCollapse from './processors/auto.collapse';
import childrenAggregator from './processors/children.aggregator';
import groupBuilder from './processors/group.builder';
import lo from 'lodash';
import nodesMapper from './processors/node.mapper';
import processGraph from './processors/tree.builder';
import treeOrder from './processors/tree.order';

export const processors = {
  nodesMapper,
  processGraph,
  childrenAggregator,
  groupBuilder,
  treeOrder,
  autoCollapse
}

export const processorExecution = [
  'nodesMapper',
  'processGraph',
  'childrenAggregator',
  'groupBuilder',
  'nodesMapper',
  'processGraph',
  'autoCollapse',
  'nodesMapper',
  'processGraph',
  'treeOrder'
]

const OFFSET = 50;
const DEFAULTS = {
  vGutter: OFFSET * 2,
  hGutter: OFFSET
}
class Grid {

  constructor(config) {
    this.config = {
      ...DEFAULTS,
      ...config
    };
  }

  setNodes(nodes, conf) {
    const {layout, tree, config} = conf, {getSize} = config, {numCols, numRows} = layout,
      rows = [],
      cols = [];

    for (let i = 0; i < numCols; i++) {
      cols.push({x: 0, width: 0});
    }

    for (let i = 0; i < numRows; i++) {
      rows.push({y: 0, width: 0});
    }
    Object.keys(tree).forEach((row, rowIndex) => {
      const {children} = tree[row];
      children.forEach((node, index) => {
        const {__sg} = node,
          [width, length, height] = getSize(node)
        rows[row].width = Math.max(rows[row].width, length);
        cols[index].width = Math.max(cols[index].width, width);

        Object.assign(__sg, {width, length, height});
        node.__sg = {
          ...node.__sg,
          gridRow: rows[rowIndex],
          gridColumn: cols[Math.floor((cols.length - children.length) / 2) + index]
        }
      });

    });

    let currentY = 0,
      currentX = 0;

    rows.forEach(row => {
      currentY += row.width + this.config.vGutter;
      row.y = currentY;
    });

    cols.forEach(col => {
      currentX += col.width + this.config.hGutter;
      col.x = currentX;
    });
  }
}

export default function (instance) {
  let nodes,
    links,
    grid = new Grid(instance);
  const {getSize} = instance;
  function force(_) {
    nodes.forEach(node => {
      const {__sg} = node, {gridColumn, gridRow} = __sg;
      const [width, length, height] = getSize(node);
      node.vx = (gridColumn.x - node.x + (gridColumn.width - width) / 2) * (1 - _);
      node.vy = (gridRow.y - node.y + (gridRow.width - length)) * (1 - _);
      node.x += node.vx;
      node.y += node.vy;
    })
  }

  force.setNodes = function (n, data) {
    nodes = n;
    grid.setNodes(nodes, data);
  }

  force.setLinks = function (l, data) {
    links = l;
    grid.setNodes(nodes, data);
  }

  force.processors = processorExecution.reduce((memo, item) => memo.concat(processors[item]), []);

  return force;
}
