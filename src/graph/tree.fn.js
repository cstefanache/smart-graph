import lo from 'lodash';

const OFFSET = 20;

class Grid {

  constructor(config = {
    vGutter: OFFSET * 2,
    hGutter: OFFSET
  }) {
    this.config = config;
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
      currentY += row.width + 60;
      row.y = currentY;
    });

    cols.forEach(col => {
      currentX += col.width + 30;
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

  return force;
}
