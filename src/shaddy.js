export default {

  vertex: `
    uniform float grid_x;
    uniform float grid_z;
    uniform sampler2D heightMap;
    uniform float gridSize;

    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 p2 = position;
      p2.y+= texture2D(heightMap, vec2(grid_x/gridSize, grid_z/gridSize)).x;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p2, 1.0);
    }
  `,

  fragment: `
    uniform float height;
    uniform sampler2D heightMap;
    uniform float intensity;
    uniform vec3 color;

    varying vec2 vUv;

	  float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}

    void main() {
      vec2 uvD = vec2(vUv.x, vUv.y);
      float nn = 0.1 * random( vec3( 1. ), length( gl_FragCoord ) );
      // float v = distance(vec2(.5,.5), uvD);
      float h = texture2D(heightMap, vec2(vUv.x+nn, vUv.y+nn)).x;
      vec4 clr = vec4(h*color.rgb, 1.0); 
      gl_FragColor = vec4(clr.rgb*intensity, 1.0);
    }
  `

};