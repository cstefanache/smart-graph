import {Block, SmartGraph} from '../src';

import props from './data/example2.data.json';

let nextProps = {
  nodes: [],
  links: []
};
props.nodes.forEach(node => {
  nextProps.nodes.push({
    ...node,
    region: 'US',
    oid: `us-${node.oid}`
  });
  nextProps.nodes.push({
    ...node,
    region: 'EU',
    oid: `eu-${node.oid}`
  })
});

props.links.forEach(link => {
  const [from, to] = link;

  nextProps.links.push([`us-${from}`, `us-${to}`]);
  nextProps.links.push([`eu-${from}`, `eu-${to}`]);
})

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
  getSize: node => node.isCollapsed
    ? [20, 20, 4]
    : [20, 20, 4],
  id: 'oid'
}

export default() => {
  const graph = new SmartGraph(svg, config);
  graph.setData(nextProps);
  graph.zoomToExtent(0.8, 300, 500)
}
