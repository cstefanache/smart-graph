import {SmartGraph} from '../src';

const svg = document.querySelector('#svg');

const config = {
  render: (svgRoot, node) => {
    svgRoot.append('circle').attr('r', 5)
  },
  getSize: node => [
    5, 5, 1
  ],
  id: 'id'
}

export default() => {

  const nodes = [],
    links = [
      [
        0, 1
      ],
      [
        1, 2
      ],
      [
        3, 6
      ],
      [
        2, 4
      ],

      [
        2, 5
      ],

      [
        3, 7
      ],
      [
        1, 3
      ],
      [
        7, 8
      ]
    ];

  for (let i = 0; i < 9; i++) {
    nodes.push({id: i});
  }

  const graph = new SmartGraph(svg, config);
  graph.setData({nodes, links});
}
