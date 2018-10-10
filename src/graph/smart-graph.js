/* eslint no-extend-native: 0 */
Array.prototype.pushUnique = function (item) {
  if (this.indexOf(item) === -1) {
    this.push(item);
  }
}

import {forceCenter, forceLink, forceManyBody, forceSimulation} from 'd3-force';

import Utils from '../common/utils';
import layouts from './layouts';
import lo from 'lodash';
import panZoom from './layers/panzoom.layer';
import {select} from 'd3-selection';
import uuid from 'uuid4';

const DEFAULTS = {
  debugging: false,
  layout: 'treeFn',
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
      node.x + (width || 2) / 2,
      node.y + (
        out
        ? length || 2
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
      ...config,
      link: {
        ...DEFAULTS.link,
        ...config.link
      }
    };

    this.root = select(svgRoot);

    const defs = this.root.append('defs');
    this.fixedPreLayer = this.root.append('g');
    this.fixedPreLayer.attr('class', 'sg-fixed-pre');
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
        node.id = () => uid;
      } else {
        node[id] = uid
      }
      return node;
    }

    this.listeners = {};
    this.treeFn = layouts[this.config.layout](config);
    this.config.processors = this.treeFn.processors;

    if (config.locationFn === 'iso') {
      this.config.locationFn = Utils.revIso;
    }

    let parent = select(svgRoot);
    this.layers = [];
    this.config.layers.forEach(layer => {
      parent = layer(parent, this);
      this.layers.push(parent);
    })

    this.preLayer = parent.append('g').attr('class', 'sg-pre');

    if (this.config.link.layerFirst) {
      this.nodesLayer = parent.append('g').attr('class', 'nodes').selectAll('.nodes');
      this.linksLayer = parent.append('g').attr('class', 'links').selectAll('.link');
    } else {
      this.linksLayer = parent.append('g').attr('class', 'links').selectAll('.link');
      this.nodesLayer = parent.append('g').attr('class', 'nodes').selectAll('.nodes');
    }

    this.postLayer = parent.append('g').attr('class', 'sg-post');

    this.restartSimulation = Utils.debounce(() => {
      const {updateNode} = config;
      const nodesLayerNodes = this.nodesLayer.nodes();
      if (!this.simulation) {
        this.simulation = forceSimulation().force('treeFn', this.treeFn).nodes(this.nodes);
        this.simulation.nodes(this.nodes).on('tick', () => {
          const alpha = this.simulation.alpha();
          if (this.config.renderFN) {
            this.config.renderFN(this, alpha);
          }
          this.nodesLayer.attr('transform', (d, index) => {
            if (updateNode) {
              updateNode(nodesLayerNodes[index], d, alpha);
            }
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
              if (this.config.link.fn) {
                const [fx, fy, tx, ty] = this.config.link.fn({fromNode, toNode, fromX, fromY, fromZ, toX, toY, toZ});
                return `M${fx},${fy}  ${tx},${ty}`;
              } else {

                const [fx, fy] = this.config.locationFn(fromX, fromY, fromZ);
                const [tx, ty] = this.config.locationFn(toX, toY, toZ);
                return `M${fx},${fy}  ${tx},${ty}`;
              }
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
      let syntheticLinks = [];
      node.__sg.collapsedChildren.forEach(nd => {
        nd.x = node.x;
        nd.y = node.y;
        nd.vx = node.vx;
        nd.vy = node.vy;
        if (nd.__sg.syntheticLinks) {
          syntheticLinks = syntheticLinks.concat(nd.__sg.syntheticLinks);
        }
      });
      this.nodes = this.nodes.concat(node.__sg.collapsedChildren);
      this.links = lo.difference(this.links, node.__sg.createdLinks).concat(node.__sg.collapsedLinks);
      this.links = lo.difference(this.links, syntheticLinks);
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

    node.__sg.isCollapsed = !collapsedChildren;
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
    const {onBeforePlugins, onAfterPlugins} = this.config;

    if (onBeforePlugins) {
      onBeforePlugins(this);
    }
    this.config.processors.forEach(processor => {
      if (processor) {
        Object.assign(this, processor(this))
      }
    });

    if (onAfterPlugins) {
      onAfterPlugins(this);
    }

  }

  removeNode(node) {
    const {nodes, links, idFn} = this;
    const toId = idFn(node);
    console.log(this.nodes.length, nodes.indexOf(node));
    this.nodes.splice(nodes.indexOf(node), 1);
    console.log(this.nodes.length);
    //  this.links = lo.difference(this.links, node.__sg.createdLinks)
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
        const root = select(d);
        root.html('');
        node.iso = config.render(root, node);
        node.__sg.blockRender = true;
      }
    });
    this.linksLayer = this.linksLayer.data(links, d => `${d[0]}-${d[1]}`);

    this.linksLayer.exit().remove();
    this.linksLayer = this.linksLayer.enter().append('path').attr('id', function (d) {
      return `${d[0]}-${d[1]}`
    }).attr('class', 'link').attr('marker-end', 'url(#link)').attr('stroke', this.config.link.color).attr('fill', 'transparent').attr('stroke-width', 1).merge(this.linksLayer);

    this.restartSimulation();
  }

}
