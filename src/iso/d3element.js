export default class D3Element {

  constructor(parent, attributes, properties) {
    this.parent = parent;
    this.root = this.getRoot(this.parent).append('g');
    if (attributes || properties) {
      this.define(this.root, attributes, properties);
    }
  }

  remove() {
    this.root.remove();
  }

  getRoot(who) {
    const rootElem = who || this;
    if (rootElem.root) {
      return rootElem.root;
    } else {
      return rootElem;
    }
  }

  appendNode(tagName, attributes, properties) {
    const node = this.root.append(tagName);
    this.define(node, attributes, properties);
    return node;
  }

  attr(name, value) {
    this.getRoot().attr(name, value);
  }

  define(element, attributes, properties) {
    if (attributes) {
      this.attributes(element, attributes);
    }

    if (properties) {
      this.properties(element, properties);
    }
  }

  properties(target, properties) {
    Object.keys(properties).forEach(prop => {
      target[prop](properties[prop]);
    });
  }

  attributes(target, attributes) {
    Object.keys(attributes).forEach(attr => {
      target.attr(attr, attributes[attr]);
    });
  }

  transition(element, duration, attributes) {
    this.attributes(element.transition().duration(duration), attributes);
  }

}
