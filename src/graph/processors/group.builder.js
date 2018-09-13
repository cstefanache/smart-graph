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

export default function(instance) {
  const {
    nodes,
    links,
    tree,
    config,
    idFn,
    getNode
  } = instance;
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
        result.push({dataKey, median, num});
      }
    });
    result = lo.sortBy(result, item => item.median * item.num);

    let iter = 0;
    for (iter; iter < Math.min(result.length, 3); iter++) {
      const {num} = result[iter];
    }

    result.length = iter - 1;
    const routes = {};

    const getRouteForPath = path => {
      const nodesPath = [];
      let routeRef = routes;
      let parent;
      path.forEach(pathElem => {
        const [key, value] = pathElem;

        let reference = routeRef[value];
        let node;
        if (!reference) {
          node = getNode({sgAutoGroup: true, [key]: value});
          nodesToAdd.push(node);

          if (routeRef !== routes && parent) {
            const fromId = idFn(parent);
            const toId = idFn(node);
            linksToAdd.push([fromId, toId]);
          }

          routeRef[value] = {
            node,
            children: {}
          };
          routeRef = routeRef[value].children;
        } else {
          routeRef = reference.children;
          node = reference.node;
        }
        parent = node;
        nodesPath.push(node);

      });
      return nodesPath;
    }

    if (result.length > 0) {
      nextLayer.children.forEach(child => {
        const path = [];
        result.forEach(res => {
          const {dataKey} = res;
          path.push([
            dataKey, child[dataKey]
          ]);
        });

        const nodesPath = getRouteForPath(path);
        const childId = idFn(child);
        links.forEach(link => {
          const [from, to] = link;
          if (to === childId) {
            linksToRemove.push(link);
            linksToAdd.push([
              from,
              idFn(nodesPath[0])
            ]);
            linksToAdd.push([
              idFn(nodesPath[nodesPath.length - 1]),
              to
            ]);
          }
        });
      });
    }

  }


  return {
    nodes: nodes.concat(nodesToAdd),
    links: lo.filter(links, link => linksToRemove.indexOf(link) === -1).concat(linksToAdd)
  };
}
