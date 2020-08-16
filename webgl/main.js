const canvas = document.getElementById('m');
canvas.width = 800 * 2;
canvas.height = 800 * 2;
canvas.style.width = '800px';
canvas.style.height = '800px';

gl = canvas.getContext('webgl');

console.log(gl);

const vertex_shader_text = `
attribute vec4 a_position;
varying vec2 v_coord;
void main() {
  v_coord = a_position.xy;
  gl_Position = a_position;
}`;

const fragment_shader_text = `
#define MODE 1
#define POWER 2

#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

precision mediump float;

uniform vec2 u_center;
uniform float u_scale;
uniform vec3 u_color_waves;

varying vec2 v_coord;

const float logp = log(float(POWER));

void main() {
  float z2;
  vec2 c;
  vec2 z;
  vec2 s;
  vec3 color;
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
    s = vec2(z.x * z.x, z.y * z.y);
#if (POWER == 4)
    z = vec2(s.x * s.x - 6. * s.x * s.y + s.y * s.y, 4. * z.x * z.y * (s.x - s.y)) + c;
#elif (POWER == 3)
    z = vec2(s.x * z.x - 3. * s.y * z.x, 3. * z.y * s.x - s.y * z.y) + c;
#else
    z = vec2(s.x - s.y, 2. * z.x * z.y) + c;
#endif
    z2 = s.x + s.y;
    if (z2 > 100000.) { // it is enough assuming |c|<1 and color has 256 levels
      ln_v = log(log(z2)) - float(i)*logp; // V = log(r2)/pow(2,n) => log2(V) = log2(log(r2)) - n
      color = (1. - cos(u_color_waves * ln_v)) / 2.;
      break;
    }
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
  console.log(gl.getShaderInfoLog(shader));
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

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

const vertex_shader = createShader(gl, gl.VERTEX_SHADER, vertex_shader_text);
const fragment_shader = createShader(gl, gl.FRAGMENT_SHADER, fragment_shader_text);

console.log(vertex_shader, fragment_shader);

const program = createProgram(gl, vertex_shader, fragment_shader);

console.log(program);

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

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.useProgram(program);

gl.enableVertexAttribArray(positionAttributeLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

gl.uniform2fv(centerLoc, [0, 0]); // set on prepare to run step
gl.uniform1f(scaleLoc, 3);
gl.uniform3fv(colorWavesLoc, [1, 1.41, 3.14]);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.drawArrays(gl.TRIANGLES, 0, 6);

// ---------------------------- events

$(() => {
  const areaSize = 800; // let it be square
  let centerX = 0;
  let centerY = 0;
  let scale = 3;
  $(window).click((e) => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const k = 0.8;
    const ux = 2 * e.pageX / areaSize - 1; // [-1, 1]
    const uy = 1 - 2 * e.pageY / areaSize; // [1, -1]
    console.log(e)
    if (!e.shiftKey) {
      centerX += scale * ux * (1 - k);
      centerY += scale * uy * (1 - k);
      scale *= k;
    } else {
      scale /= k;
      centerX -= scale * ux * (1 - k);
      centerY -= scale * uy * (1 - k);
    }

    gl.uniform2fv(centerLoc, [centerX, centerY]);
    gl.uniform1f(scaleLoc, scale);
    // gl.uniform3fv(colorWavesLoc, [1 + Math.random(), 1 + Math.random(), 1 + Math.random()]); // random color to see changes
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });
  $(window).keypress((ev) => {
    const c = String.fromCharCode(ev.which).toLowerCase();
    if (c === ' ') {
      gl.uniform3fv(colorWavesLoc, [1 + Math.random(), 1 + Math.random(), 1 + Math.random()]); // random color
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  });
});
