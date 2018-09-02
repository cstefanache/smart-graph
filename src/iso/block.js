import D3Element from './d3element';
import Util from '../common/utils';

export default class Block extends D3Element {

  constructor(parent, attrs, props) {
    super(parent, attrs, props)
    this.poly = {};
  }

  getFaces() {
    const {
      x,
      y,
      z,
      length,
      height,
      width
    } = this;

    const fb = Util.iso(x - width, y, z),
      mlb = Util.iso(x + width, y, z),
      nb = Util.iso(x + width, y + length, z),
      mrb = Util.iso(x, y + length, z),
      ft = Util.iso(x, y, z + height),
      mlt = Util.iso(x + width, y, z + height),
      nt = Util.iso(x + width, y + length, z + height),
      mrt = Util.iso(x, y + length, z + height);

    return {
      // shadow: [
      //   fb,
      //   mrb,
      //   nb,
      //   Util.iso([
      //     x, y + length + 55,
      //     z
      //   ]),
      //   mlb
      // ],
      face_left: [
        mlb, mlt, nt, nb
      ],
      face_right: [
        nt, mrt, mrb, nb
      ],
      face_top: [
        ft, mrt, nt, mlt
      ],
      inline: [
        mrt, nt, nb, nt, mlt
      ],
      outline: [
        ft,
        mrt,
        mrb,
        nb,
        mlb,
        mlt,
        ft
      ]
    };

  }

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

    const {r, g, b, a} = this,
      iso = this.getFaces(),
      color = Util.isoColor(r, g, b, a);

    Object.keys(iso).forEach(key => {
      const item = iso[key],
        path = this.root.append('polyline')
        // .attr('d', () => this.pathGenerator(item))
          .attr('points', () => Util.generatePoints(item)).attr('class', key);
      if (key !== 'outline' && key !== 'inline') {
        path.attr('fill', color[key]);
        if (key === 'shadow') {
          path.attr('style', 'filter:url("#blur")');
        }
        // if (key === 'face_bottom') {
        //   path.attr('stroke', 'rgba(0,0,0,.4)');
        // }
      } else {
        path.attr('stroke', color[key]).attr('fill', 'rgba(0,0,0,0)');
      }

      this.poly[key] = path;
    });
  }

  animate(model, duration = 200, delay = 0) {
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

    }

  }
