/* globals Pool, $ */
/* eslint max-len: 0, no-console: 0 */
class Arena {
  constructor(/* TODO: pool (all (possible) arenas have to share one pool), canvas */) {
    // TODO: fill all attributes
    this.pool = new Pool(this); // TODO: extract separate class Processor?
  }

  setup(canvas, width, height, dpp, x1, y1, x2, y2) {
    // TODO: have to be splited to: setCanvas (set canvas and context), resize (phisical size), recalc (dpp, ...area)
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
    this.bitmapWidth = Math.floor(width * dpp);
    this.bitmapHeight = Math.floor(height * dpp);
    canvas.width = this.bitmapWidth; // eslint-disable-line no-param-reassign
    canvas.height = this.bitmapHeight; // eslint-disable-line no-param-reassign
    canvas.style.width = `${width}px`; // eslint-disable-line no-param-reassign
    canvas.style.height = `${height}px`; // eslint-disable-line no-param-reassign
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
    this.recalc();
  }

  recalc() {
    const step = (this.x2 - this.x1) / this.bitmapWidth; // we assume that stepX === stepY
    const tasks = [];
    const stepJ = Math.ceil(this.bitmapHeight / 32); // round up
    for (let j = 0; j < this.bitmapHeight; j += stepJ) {
      tasks.push({
        w: this.bitmapWidth,
        h: stepJ,
        io: 0,
        jo: j,
        xo: this.x1,
        yo: this.y1 + j * step,
        step,
      });
    }
    this.pool.setQueue(tasks); // TODO shuffle
  }

  zoomIn(pageX, pageY) { // TODO: oh, way too dirty
    // TODO fast transform image to show draft using exiting pixels
    const xo = (pageX / this.width) * (this.x2 - this.x1) + this.x1;
    const yo = (pageY / this.height) * (this.y2 - this.y1) + this.y1;
    const dx = (this.x2 - this.x1) / 3; // zoom 2/3
    const dy = (this.y2 - this.y1) / 3;
    this.x1 = xo - dx;
    this.x2 = xo + dx;
    this.y1 = yo - dy;
    this.y2 = yo + dy;
    console.log('zoomin', pageX, pageY);
    this.recalc();
  }

  process(task, result) { // processor interface for Pool
    const id = new ImageData(result, task.w, task.h);
    this.ctx.putImageData(id, task.io, task.jo);
  }
}

$(() => {
  const arena = new Arena();
  arena.setup($('canvas')[0], 400, 300, window.devicePixelRatio, -3, -1.5, 1, 1.5);

  $(window).click((e) => {
    const { pageX, pageY } = e;
    console.log(pageX, pageY);
    arena.zoomIn(pageX, pageY);
  });
});
