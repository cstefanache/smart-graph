import lo from 'lodash';

let executed = false;

const DEFAULT = {
  minNumToCollapse: 5,
  collapseAll: false,
  execute: false
}

export default function (instance) {

  const {
    nodes,
    links,
    idFn,
    getNode,
    config,
    toggle
  } = instance;

  const cfg = {
    ...DEFAULT,
    ...config.autoCollapse
  }

  if (executed || !cfg.execute) {
    return {}
  }

  let updatedNodes = nodes;
  let updatedLinks = links;

  const alreadyCreated = [];

  nodes.forEach(node => {
    const orCond = cfg.or && cfg.or(node);
    if (node.sgAutoGroup || node.forceGroup || cfg.collapseAll || orCond) {
      const {length} = node.__sg.children;

      if (length > cfg.minNumToCollapse || node.forceGroup || orCond) {
        toggle.apply(instance, [
          node, {
            collapseAll: true,
            runPlugins: false,
            restart: false
          }
        ]);
      }
    }
  });

  executed = true;
  return {};

}
