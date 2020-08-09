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
void main() {
  float zr;
  float zi;
  float z2;
  float tr;
  float ti;
  float cr;
  float ci;
  vec2 trans_k;
  vec2 trans_b;
  vec2 c;
  vec3 color;
  float ln2v;
  //
  //trans_k = (u_point_b - u_point_a) / 2.; // minor optimization: could be precalulate on JS side
  //trans_b = (u_point_b + u_point_a) / 2.;

  //trans_k = vec2(1, 1);
  //trans_b = vec2(0, 0.5);
  //
  color = vec3(0.);

  zr = 0.;
  zi = 0.;
  c = v_coord * u_scale + u_center;

/* Julia set
  zr = v_coord.x * u_scale + u_center.x;
  zi = v_coord.y * u_scale + u_center.y;
  c = vec2(-1.1347509765625, 0.20691650390625);
*/

  cr = c.x;
  ci = c.y;
  for (int i = 0; i < 3000; i++) {
    tr = zr;
    ti = zi;
    zr = tr * tr - ti * ti + cr;
    zi = 2. * tr * ti + ci;
    z2 = zr * zr + zi * zi;
    if (z2 > 100000.) { // it is enough assuming |c|<1 and color has 256 levels
      // V = log(r2)/pow(n,2) => log2(V) = log2(log(r2)) - n
      ln2v = log2(log(z2)) - float(i);
      color = (1. - cos(u_color_waves * ln2v)) / 2.;
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

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const positions = [
  -1, -1,
  -1, 1,
  1, 1,
  -1, -1,
  1, 1,
  1, -1,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const centerLoc = gl.getUniformLocation(program, 'u_center'); // get locations on initialization step
const scaleLoc = gl.getUniformLocation(program, 'u_scale');
const colorWavesLoc = gl.getUniformLocation(program, 'u_color_waves');

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.useProgram(program);

gl.enableVertexAttribArray(positionAttributeLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); // ONE MORE TIME?? After use program?
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
    centerX += scale * ux * (1 - k);
    centerY += scale * uy * (1 - k);
    scale *= k;

    gl.uniform2fv(centerLoc, [centerX, centerY]);
    gl.uniform1f(scaleLoc, scale);
    // gl.uniform3fv(colorWavesLoc, [1 + Math.random(), 1 + Math.random(), 1 + Math.random()]); // random color to see changes
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });
});
