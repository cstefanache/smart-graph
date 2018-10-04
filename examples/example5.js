import {Block, SmartGraph} from '../src';

import props from './data/example5.data.json';

const svg = document.querySelector('#svg');

const config = {
  link: {
    curved: false
  },
  updateNode: (root, node, alpha) => {
    const {__sg, x, y} = node;

    const {
      hyperSize,
      childrenRadius,
      circle,
      circle2,
      mx,
      my
    } = __sg;
    circle.attrs({
      cx: mx,
      cy: my,
      r: [0, 1, 6].indexOf(node.oid) !== -1
        ? hyperSize
        : 2
    });

    circle2.attrs({
      cx: 0,
      cy: 0,
      r: [0, 1, 6].indexOf(node.oid) !== -1
        ? hyperSize - 10
        : 2
    });
  },
  render: (svgRoot, node) => {
    let g = svgRoot.append('g');

    svgRoot.on('mouseenter', d => {
      console.log(node);
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
      cx: 0,
      cy: 0,
      r: 6,
      fill: 'none',
      stroke: 'rgba(0,0,0, .2)',
      'stroke-width': 1
    });
    __sg.circle2.attrs({
      cx: 0,
      cy: 0,
      r: 6,
      fill: 'none',
      stroke: 'rgba(250,120,0, .2)',
      'stroke-width': 1
    });
    return g;
  },
  layout: 'hypertreeFn',
  // locationFn: 'iso',
  getSize: node => node.isCollapsed
    ? [10, 10, 10]
    : [
      10, 10, 10
    ],
  id: 'oid'
}

export default() => {
  const graph = new SmartGraph(svg, config);
  graph.setData(props);
  graph.zoomToExtent(0.8, 300, 500)
}
