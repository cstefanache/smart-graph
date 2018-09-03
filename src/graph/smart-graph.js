import {forceCenter, forceLink, forceManyBody, forceSimulation} from 'd3-force';

import Utils from '../common/utils';
import lo from 'lodash';
import nodesMapper from './processors/node.mapper';
import panZoom from './layers/panzoom.layer';
import processGraph from './processors/tree.builder';
import {select} from 'd3-selection';
import treeFn from './tree.fn';

const processors = {
  nodesMapper,
  processGraph
}

const DEFAULTS = {
  locationFn: (x, y, z = 0) => [
    x, y - z
  ],
  processors: [
    'nodesMapper', 'processGraph'
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

    this.collapseData = {};
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
    }, 150);
  }

  collapse(toRemove) {
    const {nodes, links, config} = this;
    const collapseLinks = [];

    toRemove.forEach(node => {
      collapseLinks.push(this.idFn(node));
    })

    const n = lo.filter(nodes, nd => toRemove.indexOf(nd) === -1);
    const l = lo.filter(links, lk => {
      const [from, to] = lk;
      return collapseLinks.indexOf(from) === -1 && collapseLinks.indexOf(to) === -1;
    });

    this.setData({nodes: n, links: l});
    return [
      lo.difference(nodes, n),
      lo.difference(links, l)
    ];
  }

  expand(data) {
    const [eNodes, eLinks] = data;
    const {nodes, links, config} = this;
    eNodes.forEach(node => {
      node.forceRender = true;
    })
    this.setData({nodes: nodes.concat(eNodes), links: links.concat(eLinks)});

  }

  toggle(d) {
    const {config} = this;
    const toggleId = this.idFn(d);
    const toggleInfo = this.collapseData[toggleId];
    if (toggleInfo) {
      d.__sg.isCollapsed = false;
      this.expand(toggleInfo);
      delete this.collapseData[toggleId];
    } else {
      d.__sg.isCollapsed = true;
      const parsed = [];
      const parseNode = node => {
        if (parsed.indexOf(node) !== -1) {
          return [];
        }

        parsed.push(node);
        const {__sg} = node, {children} = __sg;

        let result = [...children]

        children.forEach(child => result = result.concat(parseNode(child)));

        return result;
      }

      this.collapseData[toggleId] = this.collapse(parseNode(d));
    }

  }

  setData(data) {

    Object.assign(this, data);

    const {id} = this.config;
    const isFunction = typeof id === 'function';
    this.idFn = isFunction
      ? id
      : node => node[id];

    this.config.processors.forEach(processorName => {
      const processor = processors[processorName];
      if (processor) {
        Object.assign(this, processor(this))
      } else {
        throw new Error(`Processor ${processorName} does not exist or it was not initialized`);
      }
    });

    this.restart();
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
      if (node.forceRender) {
        node.iso = config.render(select(d), node)
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
