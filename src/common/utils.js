function iso(px, py, pz = 0) {
  const x = Math.round((-Math.sqrt(3) / 2 * py + Math.sqrt(3) / 2 * px) * 100) / 100,
    y = Math.round((+ 0.5 * py + 0.5 * px - pz) * 100) / 100;
  return [x, y];
}

function isoArr(arr) {
  const [px, py, pz] = arr;
  return iso(px, py, pz);
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

export default {debounce, iso, isoArr}
