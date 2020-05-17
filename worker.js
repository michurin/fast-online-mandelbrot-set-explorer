/* eslint-disable no-plusplus */

self.onmessage = (evnt) => { // eslint-disable-line no-restricted-globals
  const { data } = evnt;
  const {
    w, h, xo, yo, step,
  } = data.task;
  const arr = new Uint8ClampedArray(w * h * 4);
  let cx;
  let cy;
  let zx;
  let zy;
  let zxx;
  let zyy;
  let r2;
  let v;
  let t;
  let sin;
  let color;
  let colorValue;
  let i;
  let j;
  let k;
  let s;
  s = 0;
  for (j = 0; j < h; j++) {
    for (i = 0; i < w; i++) {
      // TODO vars
      cx = xo + i * step;
      cy = yo + j * step;
      zx = 0.0;
      zy = 0.0;
      zxx = 0.0;
      zyy = 0.0;
      color = 0.0;
      for (k = 0; k < 10000; k++) {
        zy = 2.0 * zx * zy + cy;
        zx = zxx - zyy + cx; // here zxx and zyy from prev step
        zxx = zx * zx;
        zyy = zy * zy;
        r2 = zxx + zyy; // zxx ans zyy from current step
        if (r2 > 1000000) {
          v = (0.5 ** (k + 1)) * Math.log(r2);
          t = Math.log(v);
          sin = Math.sin(1.000000000 * Math.PI * t); // TODO color rotation factor
          color = sin * sin;
          break;
        }
      }
      colorValue = Math.floor(color * 256) % 256;
      arr[s++] = colorValue;
      arr[s++] = colorValue;
      arr[s++] = colorValue;
      arr[s++] = 255;
    }
  }
  data.result = arr;
  self.postMessage(data); // eslint-disable-line no-restricted-globals
};
