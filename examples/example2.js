import {SmartGraph} from '../src';
import props from './data/example2.data.json';

const svg = document.querySelector('#svg');
let clickFn;
const config = {
  render: (svgRoot, node) => {
    svgRoot.append('circle').attr('r', 5);
    svgRoot.on('click', clickFn);
  },
  getSize: node => [
    5, 5, 1
  ],
  id: 'oid'
}

export default() => {
  const graph = new SmartGraph(svg, config);
  clickFn = d => {
    graph.toggle(d);
  }
  graph.setData(props);
  graph.zoomToExtent(0.8, 300, 500);
}
