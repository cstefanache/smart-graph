import {SmartGraph} from '../src';
import props from './data/example2.data.json';

const svg = document.querySelector('#svg');

const config = {
  render: (svgRoot, node) => {
    svgRoot.append('circle').attr('r', 5)
  },
  getSize: node => [
    5, 5, 1
  ],
  id: 'oid'
}

export default() => {
  const graph = new SmartGraph(svg, config);
  graph.setData(props);
  graph.zoomToExtent(0.8, 300, 500)
}
