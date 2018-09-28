import lo from 'lodash';

const DEFAULTS = {
  layers: 8
}
let executed = false;

export default function (instance) {

  if (executed) {
    return
  }

  const {nodes, links, config} = instance;
  const {linksReducer} = config;
  const filteredLinks = [];

  const cfg = {
    ...DEFAULTS,
    ...linksReducer
  }

  let min = 1e10;
  let max = 0;

  nodes.forEach(node => {
    const {__sg} = node;
    const {fromNodes} = __sg;
    const {length} = fromNodes;
    min = Math.min(min, length);
    max = Math.max(max, length);
  });

  const groupSize = max / cfg.layers;
  const groups = {}
  const getGroupFor = num => {
    const groupIdx = Math.abs(cfg.layers - Math.floor(num / groupSize));
    let group = groups[groupIdx];
    if (!group) {
      group = groups[groupIdx] = [];
    }
    return {group, groupIdx};
  };

  nodes.forEach(node => {
    const {__sg} = node;
    const {fromNodes} = __sg;
    const {length} = fromNodes;
    const group = getGroupFor(length);
    __sg.groupIndex = group.groupIdx;
    __sg.positionInGroup = group.group.length;
    __sg.groupRef = group.group;
    group.group.push(node);
  });
  executed = true;
  return {
    nodes: lo.sortBy(nodes, node => node.__sg.groupIndex * 1e5 + node.__sg.positionInGroup),
    links: filteredLinks,
    relGroups: groups
  };

}
