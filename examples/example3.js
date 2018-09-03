import {Block, SmartGraph} from '../src';

import props from './data/example2.data.json';

const svg = document.querySelector('#svg');

const config = {
  render: (svgRoot, node) => {
    let root = new Block(svgRoot);
    root.build({
      x: 0,
      y: -20,
      z: 0,
      width: 20,
      length: 20,
      height: 4,
      radius: 20,
      a: 0.9,
      r: node.r || 155,
      g: node.g || 155,
      b: node.b || 155
    });

    return root;
  },
  locationFn: 'iso',
  getSize: node => [
    20, 20, 4
  ],
  id: 'oid'
}

export default() => {
  const graph = new SmartGraph(svg, config);
  graph.setData(props);
  graph.zoomToExtent(0.8, 300, 500)
}
