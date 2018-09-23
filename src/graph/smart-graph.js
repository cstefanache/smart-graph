/* eslint no-extend-native: 0 */
Array.prototype.pushUnique = function(item) {
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
import commFn from './comm.layout.fn';
import uuid from 'uuid4';

const DEFAULTS = {
  debugging: false,
  link: {
    curved: true,
    color: 'rgb(125,125,125)',
    layerFirst: false
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

    this.root = select(svgRoot);

    const defs = this.root.append('defs');
    defs.append('filter').attr('id', 'blur').append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 1.2);
    const gradient = defs.append('linearGradient').attr('id', 'gradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%').attr('spreadMethod', 'pad');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#000').attr('stop-opacity', 0.4);
    gradient.append('stop').attr('offset', '80%').attr('stop-color', '#000').attr('stop-opacity', 0.2);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#000').attr('stop-opacity', 0.2);
    const marker = defs.append('marker');
    marker.attr('id', 'link').attr('viewBox', '0 -5 10 10').attr('refX', 5).attr('refY', 0).attr('markerWidth', 4).attr('markerHeight', 4).attr('orient', 'auto')

    marker.append('path').attr('d', 'M0,-5L10,0L0,5').attr('class', 'arrowHead');

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
        node.id = () => {
          return uid
        };
      } else {
        node[id] = uid
      }
      return node;
    }

    this.listeners = {};

    this.treeFn = commFn(config);
    this.config.processors = this.treeFn.processors;

    if (config.locationFn === 'iso') {
      this.config.locationFn = Utils.revIso;
    }

    let parent = select(svgRoot);

    this.config.layers.forEach(layer => {
      parent = layer(parent, this);
    })

    if (this.config.link.layerFirst) {
      this.nodesLayer = parent.append('g').attr('class', 'nodes').selectAll('.nodes');
      this.linksLayer = parent.append('g').attr('class', 'links').selectAll('.link');
    } else {
      this.linksLayer = parent.append('g').attr('class', 'links').selectAll('.link');
      this.nodesLayer = parent.append('g').attr('class', 'nodes').selectAll('.nodes');
    }

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

            const [fromX, fromY, fromZ] = this.config.getAnchor(fromNode, true);
            const [toX, toY, toZ] = this.config.getAnchor(toNode, false);

            if (this.config.link.curved) {
              // const [fx, fy] = this.config.locationFn(fromNode.x, fromNode.y, fromNode.z); const [tx, ty] = this.config.locationFn(toNode.x, toNode.y, toNode.z);
              const [fx, fy] = this.config.locationFn(fromX, fromY, fromZ);
              const [cfx, cfy] = this.config.locationFn(fromX, fromY + 30, fromZ);
              const [tx, ty] = this.config.locationFn(toX, toY, toZ);
              const [ctx, cty] = this.config.locationFn(toX, toY - 30, toZ);
              return `M${fx},${fy} C${cfx},${cfy} ${ctx},${cty}  ${tx},${ty}`;
            } else {
              const [fx, fy] = this.config.locationFn(fromX, fromY, fromZ);
              const [tx, ty] = this.config.locationFn(toX, toY, toZ);
              return `M${fx},${fy}  ${tx},${ty}`;
            }

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

  toggle(node, config) {
    const cfg = {
      collapseAll: false,
      runPlugins: true,
      restart: true,
      ...config
    }

    const {__sg} = node;
    const {children, collapsedChildren} = __sg;
    const shouldCollapseAll = cfg.collapseAll || children.length === 1;

    if (collapsedChildren) {
      node.__sg.blockRender = false;
      node.__sg.collapsedChildren.forEach(nd => {
        nd.x = node.x;
        nd.y = node.y;
        nd.vx = node.vx;
        nd.vy = node.vy;
      });
      this.nodes = this.nodes.concat(node.__sg.collapsedChildren);
      this.links = lo.difference(this.links, node.__sg.createdLinks).concat(node.__sg.collapsedLinks);
      delete node.__sg.collapsedChildren;
      delete node.__sg.createdLinks;
      delete node.__sg.collapsedLinks;
    } else {
      const nodesList = [];
      const linksList = [];
      const revLinksList = [];
      const alreadyCreated = [];
      const nodeId = this.idFn(node);
      node.__sg.blockRender = false;

      const parseChildren = childsList => {
        childsList.forEach(nd => {
          if (nodesList.indexOf(nd) === -1) {
            nodesList.push(nd);
            nd.__sg.blockRender = false;
            nd.__sg.fromLinks.forEach(link => {
              linksList.pushUnique(link);
            });

            if (shouldCollapseAll) {
              parseChildren(nd.__sg.children);
            } else {
              nd.__sg.fromLinks.forEach(link => {
                linksList.pushUnique(link);
              });
              nd.__sg.toLinks.forEach(link => {
                linksList.pushUnique(link);
                const id = `${nodeId}-${link[1]}`;
                if (alreadyCreated.indexOf(id) === -1) {
                  revLinksList.pushUnique([
                    nodeId, link[1]
                  ]);
                  alreadyCreated.push(id)
                }
              });
            }
          }
        });
      };

      parseChildren(children);
      node.__sg.collapsedChildren = nodesList;
      node.__sg.collapsedLinks = linksList;
      node.__sg.createdLinks = revLinksList;
      this.nodes = lo.difference(this.nodes, nodesList);
      this.links = lo.difference(this.links, linksList).concat(revLinksList);
    }

    if (cfg.runPlugins) {
      this.runPlugins();
    }

    if (cfg.restart) {
      this.restart();
    }
  }

  updateFeatures(obj, cfg) {
    const config = {
      runPlugins: true,
      restart: true,
      ...cfg
    };
    const {addNodes, addLinks, removeNodes, removeLinks} = obj;

    if (addNodes) {
      this.nodes = this.nodes.concat(addNodes);
    }

    if (addLinks) {
      this.links = this.links.concat(addLinks);
    }

    if (removeNodes) {
      this.nodes = lo.difference(this.nodes, removeNodes);
    }

    if (removeLinks) {
      this.links = lo.difference(this.links, removeLinks);
    }

    if (config.runPlugins) {
      this.runPlugins();
    }

    if (config.restart) {
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

    this.nodesLayer.nodes().forEach(function(d, i) {
      const node = nodes[i];
      if (!node.__sg.blockRender) {
        const root = select(d);
        root.html('');
        node.iso = config.render(root, node);
        node.__sg.blockRender = true;
      }
    });
    this.linksLayer = this.linksLayer.data(links, d => {
      return `${d[0]}-${d[1]}`
    });

    this.linksLayer.exit().remove();
    this.linksLayer = this.linksLayer.enter().append('path').attr('id', function(d) {
      return `${d[0]}-${d[1]}`
    }).attr('class', 'link').attr('marker-end', 'url(#link)').attr('stroke', this.config.link.color).attr('fill', 'transparent').attr('stroke-width', 1).merge(this.linksLayer);

    this.restartSimulation();
  }

}
