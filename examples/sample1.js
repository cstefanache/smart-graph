import {SmartGraph} from '../src';

const svg = document.querySelector('#svg');

const config = {
  renderNode: (data, svgRoot) => {
    svgRoot.append('circle').attr('r', 5)
  },
  id: 'guid'
}

export default () => {
  new SmartGraph(svg, config);
}
