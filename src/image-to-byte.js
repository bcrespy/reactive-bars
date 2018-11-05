/**
 * transforme une image en input en une grille de 1 et de 0 en fonction des niveaux de gris 
 */
import config from "./config";



/**
 * 
 * @param {HTMLImageElement} image 
 */
function imageToBytes (image) {
  let ret = new Uint8Array(config.gridsize*config.gridsize);

  let canvas = document.createElement("canvas");
  let context = canvas.getContext("2d");

  let size = Math.min(image.width, image.height);
  canvas.width = size;
  canvas.height = size;

  let xOffset = image.width - size;
  let yOffset = image.height - size;

  context.drawImage(image, xOffset, yOffset, size, size, 0, 0, size, size);
  let imgPixels = context.getImageData(0, 0, size, size);

  let cellsize = Math.floor(size/config.gridsize);

  // sampling
  for (let x = 0; x < config.gridsize; x++) {
    for (let y = 0; y < config.gridsize; y++) {
      // super simple sampling
      let ax = x*cellsize + Math.floor(cellsize/2);
      let ay = y*cellsize + Math.floor(cellsize/2);
      let i = (ay*4)*size + ax*4;
      ret[x+config.gridsize*y] = (imgPixels.data[i]+imgPixels.data[i+1]+imgPixels.data[i+2])/3;
    }
  }

  return ret;
}

export default imageToBytes;