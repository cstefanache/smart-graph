import {Block, SmartGraph} from '../src';

import props from './data/ex.iq.json';

const svg = document.querySelector('#svg');
let clickFn;
const config = {
  render: (svgRoot, node) => {
    let root = new Block(svgRoot);
    console.log(node);
    root.build({
      x: 0,
      y: -20,
      z: 0,
      width: 20,
      length: 20,
      height: 4,
      radius: 20,
      a: 0.9,
      r: node.r || node.sgGroup ? 255 : 155,
      g: node.g || node.sgAutoGroup ? 255 : 155,
      b: node.b || 155
    });
    svgRoot.on('click', d => {
      console.log(d);
      clickFn(d);
    })
    return root;
  },
  // locationFn: 'iso',
  getSize: node => [
    20, 20, 4
  ],
  groupBuilder: {
    active: true,
    skipProps: ['oid']
  },
  id: 'oid'
}

export default() => {
  const graph = new SmartGraph(svg, config);
  graph.setData(props);
  clickFn = d => {
    console.log(d);
    graph.toggle(d, false);
  }
  graph.zoomToExtent(0.8, 300, 500)
}
