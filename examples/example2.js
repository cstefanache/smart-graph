import {SmartGraph} from '../src';
import props from './data/example2.data.json';

const svg = document.querySelector('#svg');
let clickFn;
const config = {
  render: (svgRoot, node) => {
    svgRoot.append('circle').attr('r', 5).style(
      'fill', node.sgGroup
      ? 'rgb(255, 125, 125)'
      : 'rgb(125,255,255)');

    svgRoot.append('text').style('font-size', 6).text(node.oid);
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
    graph.toggle(d, false);
  }
  graph.setData(props);
  graph.zoomToExtent(0.8, 300, 500);
}
