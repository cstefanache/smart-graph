import {crc16} from 'js-crc';

const DEFAULTS = {
  minNodes: 4,
  skipProps: ['__sg', 'forceRender']
}

export default function (instance) {

  const {nodes, links, tree, config} = instance;
  const {childrenAggregator} = config;

  if (!childrenAggregator || !childrenAggregator.active) {
    return {nodes, links};
  }

  const cfg = {
    ...DEFAULTS,
    ...childrenAggregator,
    skipProps: DEFAULTS.skipProps.concat(childrenAggregator.skipProps)
  }

  const keys = Object.keys(tree);
  const layers = [];

  Object.keys(tree).forEach(key => {
    const layer = tree[key];
    const {children} = layer;
    const values = {};

    children.forEach(child => {
      Object.keys(child).forEach(childKey => {
        if (cfg.skipProps.indexOf(childKey) !== -1) {
          return;
        }
        if (!values[childKey]) {
          values[childKey] = {};
        }

        const crc = `${child[childKey]}`.trim(); // crc16(child[childKey]);
        if (!values[childKey][crc]) {
          values[childKey][crc] = 1;
        } else {
          values[childKey][crc]++;
        }
      })
    })

    console.log(values);

  });

  return {nodes, links};
}
