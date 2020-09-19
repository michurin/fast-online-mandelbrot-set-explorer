function createShader(gl, type, text) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, text);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  const log = gl.getShaderInfoLog(shader);
  gl.deleteShader(shader);
  throw Error(`Can not create shader: ${log}`);
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  const log = gl.getProgramInfoLog(program);
  gl.deleteProgram(program);
  throw Error(`Can not link program: ${log}`);
}

function init(canvasElementID, canvasSize, superPixelFactor, power, juliaSetter) {
  const mandelbrotMode = !!juliaSetter; // tricky: consider Mandelbrot if Julia setter is present
  const canvas = document.getElementById(canvasElementID);
  canvas.width = Math.floor(canvasSize * superPixelFactor);
  canvas.height = Math.floor(canvasSize * superPixelFactor);
  canvas.style.width = `${canvasSize}px`;
  canvas.style.height = `${canvasSize}px`;

  const gl = canvas.getContext('webgl');

  const vertexShaderText = `
attribute vec4 a_position;
varying vec2 v_coord;
void main() {
  v_coord = a_position.xy;
  gl_Position = a_position;
}`;

  const fragmentShaderText = `
#define MODE ${mandelbrotMode ? 1 : 0}
#define POWER ${power}

precision highp float;

uniform vec2 u_center;
uniform float u_scale;
uniform vec3 u_color_waves;
uniform float u_color_factor;
uniform vec2 u_constant; // used in Julia set only; present in Mandelbrot for compat only

varying vec2 v_coord;

const float logp = log(float(POWER));

void main() {
  vec2 c;
  vec2 z;
  vec3 color;
  float xx;
  float yy;
  float zz;
  float ln_v;

  color = vec3(0.);

#if (MODE == 1)
  // Mandelbrot set
  z = vec2(0);
  c = v_coord * u_scale + u_center;
#else
  // Julia set
  z = v_coord * u_scale + u_center;
  c = u_constant;
#endif

  for (int i = 0; i < 3000; i++) {
    xx = z.x * z.x;
    yy = z.y * z.y;
    zz = xx + yy;
    if (zz > 100000.) { // it is enough assuming |c|<1 and color has 256 levels
      ln_v = log(log(zz)) - float(i) * logp; // V = log(r2)/pow(2,n) => log2(V) = log2(log(r2)) - n
      color = (1. - cos(u_color_waves * u_color_factor * ln_v)) / 2.;
      break;
    }

#if (POWER == 4)
    z = vec2(xx * xx - 6. * xx * yy + yy * yy, 4. * z.x * z.y * (xx - yy)) + c;
#elif (POWER == 3)
    z = vec2(xx * z.x - 3. * yy * z.x, 3. * z.y * xx - yy * z.y) + c;
#else
    z = vec2(xx - yy, 2. * z.x * z.y) + c;
#endif

  }
  gl_FragColor = vec4(color, 1);
}`;

  const program = createProgram(
    gl,
    createShader(gl, gl.VERTEX_SHADER, vertexShaderText),
    createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText),
  );

  const positions = [
    -1, -1,
    -1, 1,
    1, 1,
    -1, -1,
    1, 1,
    1, -1,
  ];

  const positionAttributeLoc = gl.getAttribLocation(program, 'a_position');
  const centerLoc = gl.getUniformLocation(program, 'u_center'); // get locations on initialization step
  const scaleLoc = gl.getUniformLocation(program, 'u_scale');
  const colorWavesLoc = gl.getUniformLocation(program, 'u_color_waves');
  const colorFactorLoc = gl.getUniformLocation(program, 'u_color_factor');
  const constantLoc = gl.getUniformLocation(program, 'u_constant');

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionAttributeLoc);
  gl.vertexAttribPointer(positionAttributeLoc, 2, gl.FLOAT, false, 0, 0);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.useProgram(program);

  // ---------------------------- events

  const infoElement = $('<p>');
  const scaleRate = 0.8;
  const colorRate = 0.9;

  let centerX;
  let centerY;
  let scale;
  let colorFactor;
  let colorWaves;
  let constant = { // actual for Julia set only
    2: [-0.0756, -0.672792],
    3: [0.51121146624, 0.47696256768],
    4: [0.6008026983401629, 0.10638350580552834],
  }[power];

  function redraw() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2fv(centerLoc, [centerX, centerY]);
    gl.uniform1f(scaleLoc, scale);
    gl.uniform3fv(colorWavesLoc, colorWaves);
    gl.uniform1f(colorFactorLoc, colorFactor);
    gl.uniform2fv(constantLoc, constant); // Julia only

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    infoElement.text(`p1 = (${centerX - scale}, ${centerY - scale}), p2 = (${centerX + scale}, ${centerY + scale}), rgbWL = (${colorWaves[0]}, ${colorWaves[1]}, ${colorWaves[2]}), colorFactor = ${colorFactor}${mandelbrotMode ? '' : ` c=(${constant[0]}, ${constant[1]})`}`);
  }

  function reset() {
    centerX = 0;
    centerY = 0;
    scale = 3;
    colorFactor = 1;
    colorWaves = [1, 1.41, 3.14];
    redraw();
  }

  reset();

  $(`#${canvasElementID}`).off().click((e) => {
    e.preventDefault();

    const offset = $(`#${canvasElementID}`).offset();
    const ux = (2 * (e.pageX - offset.left)) / canvasSize - 1; // [-1, 1]
    const uy = 1 - (2 * (e.pageY - offset.top)) / canvasSize; // [1, -1]

    if ((e.ctrlKey || e.metaKey || e.altKey) && mandelbrotMode) {
      juliaSetter([ux * scale + centerX, uy * scale + centerY]);
      return false;
    }

    if (!e.shiftKey) {
      centerX += scale * ux * (1 - scaleRate);
      centerY += scale * uy * (1 - scaleRate);
      scale *= scaleRate;
    } else {
      scale /= scaleRate;
      centerX -= scale * ux * (1 - scaleRate);
      centerY -= scale * uy * (1 - scaleRate);
    }

    redraw();
    return false;
  });
  const randomColorElement = $('<button>').text('random color').click(() => {
    colorWaves = [0.3 + 0.7 * Math.random(), 0.3 + 0.7 * Math.random(), 0.3 + 0.7 * Math.random()];
    redraw();
  });
  const wlIncrElement = $('<button>').text('color wave incr').click(() => {
    colorFactor *= colorRate;
    redraw();
  });
  const wlDecrElement = $('<button>').text('color wave decr').click(() => {
    colorFactor /= colorRate;
    redraw();
  });
  $(`#${canvasElementID}ctl`).width(canvasSize).empty().append(
    infoElement,
    randomColorElement,
    wlIncrElement,
    wlDecrElement,
    $('<button>').text('reset').click(reset),
  );
  if (mandelbrotMode) {
    return undefined;
  }
  return (cxy) => {
    constant = cxy;
    redraw();
  };
}

function initPair(power, mSize, jSize, mSuperPixel, jSuperPixel, next) {
  // we split literally this:
  // init(`m${power}`, mSize, mSuperPixel, power, init(`j${power}`, jSize, jSuperPixel, power));
  setTimeout(() => {
    const f = init(`j${power}`, jSize, jSuperPixel, power);
    setTimeout(() => {
      init(`m${power}`, mSize, mSuperPixel, power, f);
      if (next) {
        next();
      }
    }, 0);
  }, 0);
}

$(() => {
  const s = Math.floor($(window).width() * 0.48);
  const dpr = window.devicePixelRatio || 1;
  initPair(2, s, s, dpr, dpr, () => initPair(3, s, s, dpr, dpr, () => initPair(4, s, s, dpr, dpr)));
});
