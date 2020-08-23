function init(canvasElementID, canvasSize, superPixelFactor, power, mode) {
  const canvas = document.getElementById(canvasElementID);
  canvas.width = canvasSize * superPixelFactor;
  canvas.height = canvasSize * superPixelFactor;
  canvas.style.width = `${canvasSize}px`;
  canvas.style.height = `${canvasSize}px`;

  const gl = canvas.getContext('webgl');

  const vertex_shader_text = `
attribute vec4 a_position;
varying vec2 v_coord;
void main() {
  v_coord = a_position.xy;
  gl_Position = a_position;
}`;

  const fragment_shader_text = `
#define MODE ${mode}
#define POWER ${power}

#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

precision mediump float;

uniform vec2 u_center;
uniform float u_scale;
uniform vec3 u_color_waves;
uniform float u_color_factor;

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
  c = vec2(-1.1347509765625, 0.20691650390625);
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

  function createShader(gl, type, text) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, text);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
    gl.deleteShader(shader);
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
    gl.deleteProgram(program);
  }

  const vertex_shader = createShader(gl, gl.VERTEX_SHADER, vertex_shader_text);
  const fragment_shader = createShader(gl, gl.FRAGMENT_SHADER, fragment_shader_text);

  const program = createProgram(gl, vertex_shader, fragment_shader);

  const positions = [
    -1, -1,
    -1, 1,
    1, 1,
    -1, -1,
    1, 1,
    1, -1,
  ];
  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const centerLoc = gl.getUniformLocation(program, 'u_center'); // get locations on initialization step
  const scaleLoc = gl.getUniformLocation(program, 'u_scale');
  const colorWavesLoc = gl.getUniformLocation(program, 'u_color_waves');
  const colorFactorLoc = gl.getUniformLocation(program, 'u_color_factor');

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // ---------------------------- events

  const infoElement = $('<p>');
  const scaleRate = .8;
  const colorRate = .9;
  let centerX = 0;
  let centerY = 0;
  let scale = 3;
  let colorFactor = 1;
  let colorWaves = [1, 1.41, 3.14];

  function redraw() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2fv(centerLoc, [centerX, centerY]);
    gl.uniform1f(scaleLoc, scale);
    gl.uniform3fv(colorWavesLoc, colorWaves);
    gl.uniform1f(colorFactorLoc, colorFactor);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    infoElement.text(`p1 = (${centerX - scale}, ${centerY - scale}), p2 = (${centerX + scale}, ${centerY + scale}), rgbWL = (${colorWaves[0]}, ${colorWaves[1]}, ${colorWaves[2]}), colorFactor = ${colorFactor}`);
  }

  redraw();

  $(`#${canvasElementID}`).click((e) => {
    e.preventDefault();

    const offset = $(`#${canvasElementID}`).offset();
    const ux = 2 * (e.pageX - offset.left) / canvasSize - 1; // [-1, 1]
    const uy = 1 - 2 * (e.pageY - offset.top) / canvasSize; // [1, -1]

    if (e.ctrlKey || e.metaKey || e.altKey) {
      console.log('CTL:', ux * scale + centerX, uy * scale + centerY); // TODO call Julia here!
      return false;
    }

    console.log(e)
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
    colorWaves = [1 + Math.random(), 1 + Math.random(), 1 + Math.random()];
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
  $(`#${canvasElementID}ctl`).width(canvasSize).append(
    infoElement,
    randomColorElement,
    wlIncrElement,
    wlDecrElement
  );
}

$(() => {
  init('m2', 400, 2, 2, 1);
  init('j2', 400, 2, 2, 2);
  init('m3', 400, 2, 3, 1);
  init('j3', 400, 2, 3, 2);
  init('m4', 400, 2, 4, 1);
  init('j4', 400, 2, 4, 2);
});
