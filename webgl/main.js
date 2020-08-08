const canvas = document.getElementById('m');
canvas.width = 800 * 4;
canvas.height = 800 * 4;
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
precision mediump float;
varying vec2 v_coord;
void main() {
  float zr;
  float zi;
  float z2;
  float tr;
  float ti;
  float cr;
  float ci;
  vec2 point_a; // (-1, -1) TODO param
  vec2 point_b; // (1, 1) TODO
  vec2 trans_k;
  vec2 trans_b;
  vec2 c;
  vec3 color;
  vec3 color_wave; // TODO attr
  float ln2v;
  //
  color_wave = vec3(1, 1.1, 1.2);
  point_a = vec2(-2.2, -1.5);
  point_b = vec2(.8, 1.5);
  //
  trans_k = (point_b - point_a) / 2.;
  trans_b = (point_b + point_a) / 2.;
  //
  color = vec3(0.);
  zr = 0.;
  zi = 0.;
  //cr = v_coord.x * 2. - .5;
  //ci = v_coord.y * 2.;
  c = v_coord * trans_k + trans_b;
  cr = c.x;
  ci = c.y;
  for (int i = 0; i < 1000; i++) {
    tr = zr;
    ti = zi;
    zr = tr * tr - ti * ti + cr;
    zi = 2. * tr * ti + ci;
    z2 = zr * zr + zi * zi;
    if (z2 > 100000.) { // it is enough assuming |c|<1 and color has 256 levels
      // V = log(r2)/pow(n,2) => log2(V) = log2(log(r2)) - n
      ln2v = log2(log(z2)) - float(i);
      color = (1. - cos(color_wave * ln2v)) / 2.;
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

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);

gl.enableVertexAttribArray(positionAttributeLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); // ONE MORE TIME?? After use program?
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

gl.drawArrays(gl.TRIANGLES, 0, 6);
