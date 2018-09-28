import lo from 'lodash';

let executed = false;
export default function (instance) {

  const {
    nodes,
    links,
    tree,
    idFn,
    getNode,
    config
  } = instance;
  const {layerGroup} = config;
  if (executed || !layerGroup || !layerGroup.active) {
    return
  }
  console.log(layerGroup);

  const {props} = layerGroup;

  if (!props) {
    throw new Error('missing props: [] property from configuration of layerGroup');
  }
  const newNodes = [];
  const linksToAdd = [];
  const linksToRemove = [];

  const breakTo = (toNode, newNodeId, toChild) => {
    if (!toChild.__sg.syntheticLinks) {
      toChild.__sg.syntheticLinks = [];
    }
    links.forEach(link => {
      const [from, to] = link;
      if (to === toNode) {
        if (layerGroup.breakLinks) {
          linksToRemove.push(link);
        }
        linksToAdd.push([from, newNodeId]);
        const newlyCreated = [newNodeId, to];
        if (!layerGroup.breakLinks) {
          toChild.__sg.syntheticLinks.push(newlyCreated);
        }
        linksToAdd.push(newlyCreated);
      }

    })
  }

  const buildMap = (children, prop) => {
    const map = {};

    children.forEach(child => {
      const key = child[prop];
      let group = map[key];
      if (!group) {
        group = map[key] = [];
      }

      group.push(child)
    });

    return map;
  }

  const drillInto = (layer, depth) => {
    if (depth < props.length) {
      layer.children.forEach(child => {
        const {__sg} = child;
        const prop = props[depth + 1];

        if (prop && prop !== null) {
          const {children} = __sg;
          const gr = buildMap(children, prop)

          Object.keys(gr).forEach(key => {
            if (key !== 'undefined') {
              const chld = gr[key];
              if (chld.length > 1) {
                const newNode = getNode({key, forceGroup: true});
                const newNodeId = idFn(newNode);
                newNodes.push(newNode);
                chld.forEach(toChild => {
                  const toChildId = idFn(toChild);
                  breakTo(toChildId, newNodeId, toChild);
                })
              }
            }
          });

        }

        drillInto(__sg, depth + 1)
      })
    }
  }

  drillInto(tree[0], 0);

  executed = true;

  return {
    nodes: nodes.concat(newNodes),
    links: lo.filter(links, link => linksToRemove.indexOf(link) === -1).concat(linksToAdd)
  }

}
