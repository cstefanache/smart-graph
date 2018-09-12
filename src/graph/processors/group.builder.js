import {crc16} from 'js-crc';
import lo from 'lodash';

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

/* eslint no-loop-func: 0 */
const DEFAULTS = {
  minNodes: 4,
  groupThreshold: 0.3,
  skipProps: ['__sg', 'forceRender']
}

let executed = false;

export default function (instance) {
  const {nodes, links, tree, config, idFn} = instance;
  const {groupBuilder} = config;
  if (executed || !groupBuilder || !groupBuilder.active) {
    return {nodes, links};
  }

  executed = true;

  const cfg = {
    ...DEFAULTS,
    ...groupBuilder,
    skipProps: DEFAULTS.skipProps.concat(groupBuilder.skipProps)
  }

  const layerKeys = Object.keys(tree);
  let nodesToAdd = [];
  let linksToAdd = [];
  let linksToRemove = [];

  for (let i = 1; i < layerKeys.length; i++) {
    const prevLayer = tree[layerKeys[i - 1]];
    const nextLayer = tree[layerKeys[i + 1]];
    const processData = {};
    if (!nextLayer || !nextLayer.children) {
      break;
    }

    const numChildren = nextLayer.children.length;

    const keys = [];

    // Build array of possible keys
    nextLayer.children.forEach(child => {
      Object.keys(child).forEach(childKey => {
        if (keys.indexOf(childKey) === -1) {
          keys.push(childKey);
        }
      });
    });

    keys.forEach(key => processData[key] = {});

    nextLayer.children.forEach(child => {
      keys.forEach(childKey => {
        const crc = `${child[childKey]}`.trim(); // crc16(child[childKey]);
        if (!processData[childKey][crc]) {
          processData[childKey][crc] = {
            children: [child],
            num: 1
          };
        } else {
          const ref = processData[childKey][crc];
          ref.num++;
          ref.children.push(child);
        }
      });
    });

    let result = [];
    // Filter out single groups or groups that pass threshold
    Object.keys(processData).forEach(dataKey => {
      const objKeys = Object.keys(processData[dataKey]);
      const num = objKeys.length;
      if (num === 1 || nextLayer.children.length * cfg.groupThreshold < num) {
        delete processData[dataKey];
      } else {
        let median = 0;
        objKeys.forEach(key => {
          const n = processData[dataKey][key].num;
          // const diff = numChildren - processData[dataKey][key];
          median += n * n / 2;
        });
        // console.log(`${dataKey}: ${median} ${num}`);
        result.push({dataKey, median, num});
      }
    });
    result = lo.sortBy(result, item => item.median * item.num);
    // insertLayerFor(processData, result[0]);

    const res = result[0];
    const {dataKey, median, num} = res;

    const brake = {};
    Object.keys(processData[dataKey]).forEach(key => {
      const {children} = processData[dataKey][key];
      const id = guid();
      const node = {
        [dataKey]: key,
        [config.id]: id
      };

      brake[key] = node[config.id];
      nodesToAdd.push(node);

      children.forEach(child => {
        const childId = idFn(child);
        links.forEach(link => {
          const [from, to] = link;
          if (to === childId) {
            linksToAdd.push([from, id]);
            linksToAdd.push([id, childId]);
            linksToRemove.push(link);
          }
        });
      });
    });
  }

  return {
    nodes: nodes.concat(nodesToAdd),
    links: lo.filter(links, link => linksToRemove.indexOf(link) === -1).concat(linksToAdd)
  };
}
