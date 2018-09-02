import D3Element from './d3element';
import Util from '../common/utils';
import {rgb} from 'd3-color';

export default class Cylinder extends D3Element {

  build(model) {
    Object.assign(this, {
      x: 0,
      y: 0,
      z: 0,
      length: 10,
      height: 10,
      width: 10,
      r: 125,
      g: 125,
      b: 125,
      a: 1
    }, model);

    const pos = Util.iso([model.x, model.y, model.z]), {r, g, b, alpha} = model;
    this.root.append('ellipse').attr('cx', pos[0]).attr('cy', pos[1]).attr('rx', model.radius * 1.1).attr('ry', model.radius * 0.7).attr('fill', `rgba(0, 0, 0, 0.2)`).attr('style', 'filter:url("#blur")');
    this.root.append('ellipse').attr('cx', pos[0]).attr('cy', pos[1]).attr('rx', model.radius).attr('ry', model.radius * 0.6).attr('fill', rgb(model.r, model.g, model.b));
    this.root.append('ellipse').attr('cx', pos[0]).attr('cy', pos[1]).attr('rx', model.radius).attr('ry', model.radius * 0.6).style('fill', 'url(#gradient)');
    this.root.append('rect').attr('x', pos[0] - model.radius).attr('y', pos[1] - model.height).attr('width', model.radius * 2).attr('height', model.height).attr('fill', rgb(model.r, model.g, model.b));
    this.root.append('rect').attr('x', pos[0] - model.radius).attr('y', pos[1] - model.height).attr('width', model.radius * 2).attr('height', model.height).style('fill', 'url(#gradient)');
    this.root.append('ellipse').attr('cx', pos[0]).attr('cy', pos[1] - model.height).attr('rx', model.radius).attr('ry', model.radius * 0.6).attr('fill', rgb(model.r, model.g, model.b));

  }

  animate(model, duration = 200, delay = 0) {

    /*
    return new Promise(resolve => {
      Object.assign(this, model);

      const {r, g, b, a} = this;
      const color = Util.isoColor(r, g, b, a)
        const iso = this.getFaces(),
          execute = () => {
            Object.keys(iso).forEach(key => {
              this.poly[key].attr('fill', color[key]);
              this.transition(this.poly[key], duration, {
                'points': Util.generatePoints(iso[key])
              });
            });
          };

        if (delay !== 0) {
          setTimeout(execute, delay);
        } else {
          execute();
        }

        setTimeout(() => {
          resolve(this)
        }, duration + delay);
      });
*/
  }

}
