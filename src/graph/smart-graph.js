/* eslint no-extend-native: 0 */
Array.prototype.pushUnique = function (item) {
  if (this.indexOf(item) === -1) {
    this.push(item);
  }
}

import {forceCenter, forceLink, forceManyBody, forceSimulation} from 'd3-force';

import Utils from '../common/utils';
import lo from 'lodash';
import panZoom from './layers/panzoom.layer';
import {select} from 'd3-selection';
import treeFn from './tree.layout.fn';
import uuid from 'uuid4';

const DEFAULTS = {
  link: {
    color: 'rgb(125,125,125)'
  },
  locationFn: (x, y, z = 0) => [
    x, y - z
  ],

  layers: [panZoom],
  getAnchor: (node, out) => {
    const {width, length} = node.__sg;
    return [
      node.x + width / 2,
      node.y + (
        out
        ? length
        : 0),
      0,
      0
    ];

  }
}

export default class SmartGraph {

  constructor(svgRoot, config) {
    this.config = {
      ...DEFAULTS,
      ...config
    };

    const {id} = this.config;

    if (!id) {
      throw new Error('missing id property [fn/string]');
    }

    const isFunction = typeof id === 'function';
    this.idFn = isFunction
      ? id
      : node => node[id];

    this.getNode = props => {
      const node = {
        ...props,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        __sg: {}
      };

      const uid = uuid();
      if (isFunction) {
        node.id = function () {
          return uid
        };
      } else {
        node[id] = uid
      }
      return node;
    }

    this.listeners = {};

    this.treeFn = treeFn(config);
    this.config.processors = this.treeFn.processors;

    if (config.locationFn === 'iso') {
      this.config.locationFn = Utils.revIso;
    }

    let parent = select(svgRoot);

    this.config.layers.forEach(layer => {
      parent = layer(parent, this);
    })

    this.linksLayer = parent.append('g').attr('class', 'links').selectAll('.link');
    this.nodesLayer = parent.append('g').attr('class', 'nodes').selectAll('.nodes');

    this.restartSimulation = Utils.debounce(() => {

      if (!this.simulation) {
        this.simulation = forceSimulation().force('treeFn', this.treeFn).nodes(this.nodes);
        this.simulation.nodes(this.nodes).on('tick', () => {
          // let alpha = this.simulation.alpha();
          this.nodesLayer.attr('transform', (d, index) => {
            const [x, y] = this.config.locationFn(d.x, d.y, d.z);
            if (isNaN(x)) {
              return `translate(0, 0)`;
            }
            return `translate(${x}, ${y})`;
          });
          this.linksLayer.attr('d', d => {
            const [from, to] = d;
            const fromNode = this.nodesMap[from],
              toNode = this.nodesMap[to];

            if (!fromNode) {
              return 'M0,0';
            }

            if (!toNode) {
              return 'M0,0';
            }
            // const [fx, fy] = this.config.locationFn(fromNode.x, fromNode.y, fromNode.z);
            // const [tx, ty] = this.config.locationFn(toNode.x, toNode.y, toNode.z);
            const [fromX, fromY, fromZ] = this.config.getAnchor(fromNode, true);
            const [toX, toY, toZ] = this.config.getAnchor(toNode, false);
            const [fx, fy] = this.config.locationFn(fromX, fromY, fromZ);
            const [cfx, cfy] = this.config.locationFn(fromX, fromY + 30, fromZ);
            const [tx, ty] = this.config.locationFn(toX, toY, toZ);
            const [ctx, cty] = this.config.locationFn(toX, toY - 30, toZ);
            return `M${fx},${fy} C${cfx},${cfy} ${ctx},${cty}  ${tx},${ty}`;

          });
        });
      }

      this.simulation.alpha(1).restart();
      const restartFn = this.listeners.restart;
      if (restartFn) {
        restartFn();
      }
    }, 150);
  }

  on(event, fn) {
    this.listeners[event] = fn;
  }

  toggle(node, collapseAll = true, runPlugins = true) {

    if (node.collapseParent) {
      this.toggle(node.collapseParent, collapseAll, runPlugins)
    } else {

      const {__sg} = node;
      const {children, collapsedChildren} = __sg;
      const nodesList = [];
      const linksList = [];
      const revLinksList = [];
      const nodeId = this.idFn(node);
      const newNode = this.getNode({sgGroup: true, count: children.length, collapseParent: node});
      const newNodeId = this.idFn(newNode);
      const alreadyCreated = [];
      const shouldCollapseAll = collapseAll || children.length === 1;
      const parseChildren = childsList => {
        childsList.forEach(nd => {
          if (nodesList.indexOf(nd) === -1) {
            nodesList.push(nd);
            if (!collapsedChildren) {
              nd.__sg.blockRender = false;
            }
            nd.__sg.fromLinks.forEach(link => {
              linksList.pushUnique(link);
            });

            if (shouldCollapseAll) {
              parseChildren(nd.__sg.children);
            } else {
              nd.__sg.fromLinks.forEach(link => {
                linksList.pushUnique(link);
                const id = `${link[0]}-${newNodeId}`;
                if (alreadyCreated.indexOf(id) === -1) {
                  revLinksList.pushUnique([link[0], newNodeId]);
                  alreadyCreated.push(id);
                }
              });
              nd.__sg.toLinks.forEach(link => {
                linksList.pushUnique(link);
                const id = `${newNodeId}-${link[1]}`;
                if (alreadyCreated.indexOf(id) === -1) {
                  revLinksList.pushUnique([
                    newNodeId, link[1]
                  ]);
                  alreadyCreated.push(id)
                }
              });
            }
          }
        })
      };

      if (!collapsedChildren) {
        parseChildren(children);
        node.__sg.collapsedChildren = nodesList;
        node.__sg.collapsedLinks = linksList;
        node.__sg.createdLinks = revLinksList;
        node.__sg.ghostNode = newNode;
        this.nodes = lo.difference(this.nodes, nodesList);
        if (!collapseAll) {
          this.nodes.push(newNode);
        }
        this.links = lo.difference(this.links, linksList).concat(revLinksList);

      } else {
        const {ghostNode} = node.__sg;
        node.__sg.collapsedChildren.forEach(child => {
          const {x, y, vx, vy} = ghostNode;
          Object.assign(child, {x, y, vx, vy});
        })
        this.nodes = lo.without(this.nodes, ghostNode).concat(node.__sg.collapsedChildren);
        this.links = lo.difference(this.links, node.__sg.createdLinks).concat(node.__sg.collapsedLinks);
        delete node.__sg.collapsedChildren;
        delete node.__sg.createdLinks;
        delete node.__sg.collapsedLinks;
      }

      this.runPlugins();
      this.restart();
    }
  }

  setData(data) {

    Object.assign(this, data);

    this.runPlugins();
    this.restart();
  }

  runPlugins() {
    this.config.processors.forEach(processor => {
      if (processor) {
        Object.assign(this, processor(this))
      }
    });

  }

  restart() {
    const {nodes, links, config} = this;
    this.treeFn.setNodes(nodes, this);
    this.treeFn.setLinks(links, this);
    this.nodesLayer = this.nodesLayer.data(nodes, d => this.idFn(d));
    this.nodesLayer.exit().remove();
    this.nodesLayer = this.nodesLayer.enter().append('g').attr('class', 'node').merge(this.nodesLayer);

    this.nodesLayer.nodes().forEach(function (d, i) {
      const node = nodes[i];
      if (!node.__sg.blockRender) {
        node.iso = config.render(select(d), node);
        node.__sg.blockRender = true;
      }
    });
    this.linksLayer = this.linksLayer.data(links, function (d) {
      return `${d[0]}-${d[1]}`
    });

    this.linksLayer.exit().remove();
    this.linksLayer = this.linksLayer.enter().append('path').attr('id', function (d) {
      return `${d[0]}-${d[1]}`
    }).attr('class', 'link').attr('stroke', this.config.link.color).attr('fill', 'transparent').attr('stroke-width', 1).merge(this.linksLayer);

    this.restartSimulation();
  }

}
