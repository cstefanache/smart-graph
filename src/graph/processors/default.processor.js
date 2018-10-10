export default function (instance) {

  const {nodes, config} = instance;
  const {getSize} = config;
  nodes.forEach(node => {
    const [width, length, height] = getSize(node)
    node.__sg = {
      ...node.__sg,
      width,
      length,
      height,
      hyperSize: undefined
    };
  });

  return {nodes};

}
