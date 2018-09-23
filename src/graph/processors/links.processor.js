export default function(instance) {

  const {links} = instance;
  const filteredLinks = [];
  const existing = [];
  links.forEach(link => {
    const [from, to] = link;
    const id = `${from}-${to}`;
    if (existing.indexOf(id) === -1) {
      filteredLinks.push(link);
      existing.push(id);
      existing.push(`${to}-${from}`);
    }
  });


  return {links: filteredLinks};

}
