window.One = {
  hostWidth: 200, // they have to be calculated according actual window size?
  hostHeight: 100,
};
window.Two = {
  hostWidth: 200,
  hostHeight: 300,
};

$(() => {
  const dpp = window.devicePixelRatio || 2;
  $('div.live').each(function () { // don't use "=>" here
    const host = $(this);
    const canvas = $('canvas', host); // we assume we have one canvas per ctl-div
    const ctl = window[$(host).data('live-obj')];
    let prevX;
    let prevY;
    host.attr({ tabindex: 0 }); // make it focusable
    const setHostSize = (w, h) => {
      host.width(w);
      host.height(h);
      canvas.css({
        top: 0,
        left: 0,
      });
      const bitmapWidth = w * dpp;
      const bitmapHeight = h * dpp;
      canvas.width = bitmapWidth;
      canvas.height = bitmapHeight;
      canvas.css({ width: w, height: h });
      console.log('ctl.recalc: canvas', bitmapWidth, bitmapHeight); // TODO
    };
    const zoomin = () => {
      console.log(host.width(), host.height());
    };
    host.mousemove((e) => {
      e.preventDefault();
      if (e.buttons === 0) {
        prevX = undefined;
      } else {
        if (prevX !== undefined) {
          const dx = e.pageX - prevX;
          const dy = e.pageY - prevY;
          const p = canvas.position();
          canvas.css({
            top: p.top + dy,
            left: p.left + dx,
          });
        }
        prevX = e.pageX;
        prevY = e.pageY;
      }
    });
    host.keydown((e) => {
      console.log(e.keyCode);
      if (e.keyCode === 13) {
        zoomin();
      }
    });
    setHostSize(ctl.hostWidth, ctl.hostHeight);
  });
});
