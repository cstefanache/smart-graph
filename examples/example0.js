import {Block, SmartGraph} from '../src';

const svg = document.querySelector('#svg');

const config = {
  render: (svgRoot, node) => {
    let root = new Block(svgRoot);
    root.build({
      x: 0,
      y: -90,
      z: 0,
      width: 20,
      length: 90,
      height: 4,
      radius: 20,
      a: 0.9,
      r: node.r || 155,
      g: node.g || 155,
      b: node.b || 155
    });

  },
  locationFn: 'iso',
  getSize: node => [
    90, 20, 5
  ],
  id: 'id'
}

export default() => {

  const nodes = [
      {
        id: 1
      }, {
        id: 2
      }, {
        id: 3
      }
    ],
    links = [[1, 2], [1, 3]];

  const graph = new SmartGraph(svg, config);
  graph.setData({nodes, links});
}
