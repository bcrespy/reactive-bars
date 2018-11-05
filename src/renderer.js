import * as Three from "three";
import AudioData from "@creenv/audio/audio-analysed-data";

// the values of the config object will be modifier by user controls 
import config from "./config";
import imageToBytes from "./image-to-byte";



class Renderer {
  init () {
    // setup de la scène 
    this.scene = new Three.Scene();
    this.camera = new Three.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.renderer = new Three.WebGLRenderer({
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.camera.position.x = config.pseudoDistance;
    this.camera.position.y = config.pseudoDistance*1.5;
    this.camera.position.z = config.pseudoDistance;
    this.camera.lookAt(new Three.Vector3(0,0,0));

    this.light = new Three.DirectionalLight(0xffffff, 1.0);
    this.light.position.set(config.x, config.y, config.z);
    this.scene.add(this.light);

    // high grid
    this.grid = new Float32Array(config.gridsize*config.gridsize);
    this.grid.fill(0);

    this.gridImage = null;

    /**
     * @type {Array.<Three.Mesh>}
     */
    this.rectangles = new Array(config.gridsize*config.gridsize);
    this.fillRectangles();

    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);

    return new Promise(resolve => {
      this.loadImages().then(resolve);
    });
  }

  loadImages () {
    return new Promise(resolve => {
      let image = new Image();
      image.onload = data => {
        this.gridImage = imageToBytes(image);
        resolve();
      }
      image.src = "images/3.jpeg";
    });
  }

  fillRectangles () {
    let geo = new Three.BoxGeometry(config.squareSize, config.barHeight, config.squareSize);
    let translateX = config.gridsize*(config.squareSize+config.spaceBetween)/2;
    let translateZ = config.gridsize*(config.squareSize+config.spaceBetween)/2;

    for (let i = 0; i < config.gridsize*config.gridsize; i++) {
      let mat = new Three.MeshPhongMaterial({
        color: 0xff0000,
        shininess: 100
      });
      this.rectangles[i] = new Three.Mesh(geo, mat);
      this.rectangles[i].translateY(-config.barHeight/2);
      let x = (i%config.gridsize)*(config.squareSize+config.spaceBetween) - translateX;
      let z = (Math.floor(i/config.gridsize))*(config.squareSize+config.spaceBetween) - translateZ;
      this.rectangles[i].position.setX(x).setZ(z);
      this.scene.add(this.rectangles[i]);
    }
  }

  onResize () {
    this.camera.aspect = window.innerWidth/window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateRectanglePos () {
    for (let i in this.rectangles) {
      this.rectangles[i].position.setY(-config.barHeight/2 + this.grid[i]);
    }
  }

  /**
   * 
   * @param {AudioData} audioData  
   */
  updateGrid (audioData, elapsed) {
    let black = new Three.Color(0,0,0);
    let gs = config.gridsize*config.gridsize;
    for (let i = 0; i < gs; i++) {
      this.grid[i] = Three.Math.lerp(this.grid[i], 0, 0.1) + 0.1*Math.cos((i%config.gridsize)/4+elapsed/500) + 0.03*Math.sin((i/config.gridsize)/4+elapsed/500);
      this.rectangles[i].material.color.lerp(black, 0.1);
    }

    let to = new Three.Color(1.0,0,0);

    if (audioData.peak.value == 1) {
      for (let x = 0; x < config.gridsize; x++) {
        for (let y = 0; y < config.gridsize; y++) {
          let i = x + config.gridsize*y;
          if (this.gridImage[i] > 20) {
            this.grid[i] = this.gridImage[i]/20;
          }
          this.rectangles[i].material.color.setRGB(0,0,0);
          this.rectangles[i].material.color.lerp(to, this.gridImage[i]/100);
        } 
      }
    }
  }

  /**
   * The render method uses the time variable to "create" movement.
   * 
   * @param {number} deltaT the time elapsed since last frame call
   * @param {number} time the total elapsed time since the beginning of the app
   * @param {AudioData} audioData analysed audio data
   */
  render (deltaT, time, audioData) {
    this.updateGrid(audioData, time);
    this.updateRectanglePos();
    this.renderer.render(this.scene, this.camera);
  }
}

export default Renderer;