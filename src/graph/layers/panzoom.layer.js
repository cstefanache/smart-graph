import {event, select} from 'd3-selection';
import {zoom, zoomIdentity} from 'd3-zoom';

export default function (parent, instance) {
  const root = parent.append('g');

  const panZoom = zoom().on('zoom', () => {
    root.attr('transform', event.transform);
  });

  instance.zoomToExtent = (paddingPercent = 0.8, duration = 300, delay = 0) => new Promise(resolve => {
    setTimeout(() => {
      const node = parent.node(),
        bounds = node.getBBox(),
        fullWidth = node.clientWidth,
        fullHeight = node.clientHeight,

        width = bounds.width,
        height = bounds.height,

        midX = bounds.x + width / 2,
        midY = bounds.y + height / 2;

      if (width === 0 || height === 0) {
        return;
      } // nothing to fit

      console.log(fullWidth, width);

      const scale = (paddingPercent || 0.75) / Math.max(width / fullWidth, height / fullHeight);
      parent.call(panZoom).transition().duration(duration).call(panZoom.transform, zoomIdentity.translate(fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY).scale(scale));
      // parent.call(panZoom).transition().duration(duration).call(panZoom.transform, zoomIdentity.translate(fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY));
      setTimeout(() => {
        resolve(this);
      }, duration)
    }, delay);
  })

  parent.attr('class', 'scalable').call(panZoom).transition();
  return root;
}
