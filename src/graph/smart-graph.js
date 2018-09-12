import {forceCenter, forceLink, forceManyBody, forceSimulation} from 'd3-force';

import Utils from '../common/utils';
import childrenAggregator from './processors/children.aggregator';
import groupBuilder from './processors/group.builder';
import lo from 'lodash';
import nodesMapper from './processors/node.mapper';
import panZoom from './layers/panzoom.layer';
import processGraph from './processors/tree.builder';
import {select} from 'd3-selection';
import treeFn from './tree.fn';

const processors = {
  nodesMapper,
  processGraph,
  childrenAggregator,
  groupBuilder
}

const DEFAULTS = {
  locationFn: (x, y, z = 0) => [
    x, y - z
  ],
  processors: [
    'nodesMapper', 'processGraph'
    // 'childrenAggregator'
    // 'groupBuilder',
    // 'nodesMapper',
    // 'processGraph'
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

    this.listeners = {};

    this.treeFn = treeFn(config);

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

  toggle(node) {
    const {__sg} = node;
    const {children, collapsedChildren} = __sg;
    const nodesList = [];
    let linksList = [];
    const parseChildren = childsList => {
      childsList.forEach(nd => {
        if (nodesList.indexOf(nd) === -1) {
          nodesList.push(nd);
          if (!collapsedChildren) {
            nd.__sg.blockRender = false;
          }
          // linksList = linksList.concat(nd.__sg.fromLinks);
          nd.__sg.fromLinks.forEach(link => {
            if (linksList.indexOf(link) === -1) {
              linksList.push(link);
            }
          });

          parseChildren(nd.__sg.children);
        }
      })
    };

    if (!collapsedChildren) {
      parseChildren(children);
      node.__sg.collapsedChildren = nodesList;
      this.nodes = lo.difference(this.nodes, nodesList);
      this.links = lo.difference(this.links, linksList);
    } else {
      parseChildren(collapsedChildren);
      delete node.__sg.collapsedChildren;
      this.nodes = this.nodes.concat(nodesList);
      this.links = this.links.concat(linksList);
    }

    // this.runPlugins();
    this.restart();
  }

  setData(data) {

    Object.assign(this, data);

    const {id} = this.config;
    const isFunction = typeof id === 'function';
    this.idFn = isFunction
      ? id
      : node => node[id];

    this.runPlugins();
    this.restart();
  }

  runPlugins() {
    this.config.processors.forEach(processorName => {
      const processor = processors[processorName];
      if (processor) {
        Object.assign(this, processor(this))
      } else {
        throw new Error(`Processor ${processorName} does not exist or it was not initialized`);
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
    }).attr('class', 'link').attr('stroke', '#808080').attr('fill', 'transparent').attr('stroke-width', 1).merge(this.linksLayer);

    this.restartSimulation();
  }

}
