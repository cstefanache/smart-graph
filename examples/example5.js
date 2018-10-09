import {Block, SmartGraph} from '../src';

import props from './data/example5.data.json';

const svg = document.querySelector('#svg');

const config = {
  link: {
    curved: false,
    fn: data => {
      let {
        fromNode,
        toNode,
        fromX,
        fromY,
        fromZ,
        toX,
        toY,
        toZ
      } = data;
      const fr = fromNode.r;
      const tr = toNode.r;
      if (toNode.oid === 14) {
        debugger;
      }
      return [
        fromX, fromY, toX + Math.sign(fromX - toX) * tr,
        toY + Math.sign(fromY - toY) * tr
      ];
    }
  },
  updateNode: (root, node, alpha) => {
    const {__sg, x, y} = node;

    const {hyperSize, circle, circle2, bounds} = __sg;
    const sizeX = (bounds.minX + bounds.maxX) / 2;
    const sizeY = (bounds.minY + bounds.maxY) / 2
    const cx = sizeX - x;
    const cy = sizeY - y;
    const dx = bounds.maxX - sizeX;
    const dy = bounds.maxY - sizeY;
    const r = Math.sqrt(dx * dx + dy * dy);
    node.r = r;

    circle.attrs({
      cx,
      cy,
      r: [1, 10, 6].indexOf(node.oid) !== -1
        ? r
        : r
    });

    circle2.attrs({
      cx: 0,
      cy: 0,
      r: [1, 6].indexOf(node.oid) !== -1
        ? 3
        : 0
    });
  },
  render: (svgRoot, node) => {
    let g = svgRoot.append('g');

    svgRoot.on('mouseenter', d => {
      console.log(node);
    });

    svgRoot.on('click', d => {
      window.graph.toggle(d, {collapseAll: true});
    });

    const {__sg} = node;
    const {hyperSize} = __sg;
    g.append('circle').attrs({
      cx: 0,
      cy: 0,
      r: 5,
      fill: 'none',
      stroke: 'rgb(255,120,120)',
      'stroke-width': 1
    });

    __sg.circle = g.append('circle');
    __sg.circle2 = g.append('circle');
    __sg.circle.attrs({
      cx: 0, cy: 0, r: 6, fill: 'none', // rgba(125,0,0,.2)',
      stroke: 'rgba(0,0,0, .2)',
      'stroke-width': 1
    });
    __sg.circle2.attrs({
      cx: 0, cy: 0, r: 6, fill: 'none', // rgba(125,0,0,.2)',
      stroke: 'rgba(250,120,0, .2)',
      'stroke-width': 1
    });
    return g;
  },
  layout: 'hypertreeFn',
  // locationFn: 'iso',
  getSize: node => node.isCollapsed
    ? [20, 20, 20]
    : [
      node.r || 15,
      node.r || 15,
      node.r || 15
    ],
  id: 'oid'
}

export default() => {
  const graph = new SmartGraph(svg, config);
  window.graph = graph;
  graph.setData(props);
  graph.zoomToExtent(0.8, 300, 500)
}
