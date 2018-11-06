/**
 * This config object will have its properties controlled by the user
 * interface 
 */
import Color from '@creenv/color';

let config = {
  gridsize: 100, //100
  squareSize: 0.7,
  barHeight: 20,
  pseudoDistance: 30,
  spaceBetween: 0.2,
  z: 6.2,
  x: 7,
  y: 13,

  changeImageEach: 4000,

  focus: 0,
  focalLength: 50
};


/**
 * this allows the config object to be imported by:
 * import config from "./config.js
 */
export default config;