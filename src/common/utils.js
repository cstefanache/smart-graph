import {rgb} from 'd3-color';

function iso(px, py, pz = 0) {
  const x = Math.round((-Math.sqrt(3) / 2 * py + Math.sqrt(3) / 2 * px) * 100) / 100,
    y = Math.round((+ 0.5 * py + 0.5 * px - pz) * 100) / 100;
  return [x, y];
}

function revIso(px, py, pz = 0) {
  return iso(py, -px, pz);
}

function isoArr(arr) {
  const [px, py, pz] = arr;
  return iso(px, py, pz);
}

function generatePath(pointsArr) {
  return `M${pointsArr.map(p => p.join(' ')).join('L')}z`;
}

function generatePoints(d) {
  return d.reduce((memo, item) => `${memo}${item[0]}, ${item[1]} `, '');
}

function isoColor(r, g, b, a) {
  const col = {
    shadow: a !== 1
      ? 'rgba(0,0,0,0)'
      : 'rgba(0,0,0,.2)',
    face_left: rgb(r, g, b).darker(0.5),
    face_right: rgb(r, g, b).darker(0.7),
    face_top: rgb(r, g, b),
    outline: rgb(r, g, b).darker(0.9),
    inline: rgb(r, g, b).darker(-0.6)
  };

  if (a !== 1) {
    col.face_top.opacity = a;
    col.face_left.opacity = a;
    col.face_right.opacity = a;
  }

  return col;
}

function debounce(func, wait = 300, immediate = false, maxTicks = -1) {
  let timeout;
  let currentTicks = maxTicks;
  return function () {
    const context = this,
      args = arguments;
    const later = () => {
      timeout = null;
      if (!immediate) {
        currentTicks = maxTicks;
        func.apply(context, args);
      }
    };
    const callNow = currentTicks-- === 0 || immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      currentTicks = maxTicks;
      func.apply(context, args);
    }
  };
}

export default {
  debounce,
  iso,
  isoArr,
  generatePath,
  generatePoints,
  isoColor,
  revIso
}
