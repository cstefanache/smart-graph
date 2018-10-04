import {Block, SmartGraph} from '../src';

import props from './data/example5.data.json';

const svg = document.querySelector('#svg');

const config = {
  link: {
    curved: false
  },
  updateNode: (root, node, alpha) => {
    const {__sg} = node;
    const {hyperSize, circle} = __sg;
    circle.attrs({
      r: Math.round(hyperSize) * (1 - alpha)
    })
  },
  render: (svgRoot, node) => {
    let g = svgRoot.append('g');
    console.log(node);
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
    __sg.circle.attrs({
      cx: 0,
      cy: 0,
      r: 6,
      fill: 'none',
      stroke: 'rgba(0,0,0, .2)',
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
