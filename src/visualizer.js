import * as THREE from "three";
import AudioData from "@creenv/audio/audio-analysed-data";

// the values of the config object will be modifier by user controls 
import config from "./config";
import imageToBytes from "./image-to-byte";

import GlowyShader from "./shaddy";
import { EffectComposer, RenderPass, BloomEffect, EffectPass, RealisticBokehEffect,
         BrightnessContrastEffect, BlendFunction, PixelationEffect, NoiseEffect } from "postprocessing";


const images = [
  "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg"
]

const colors = [
  new THREE.Vector3(1.0, 0, 1.0),
  new THREE.Vector3(1.0, 0, 0),
  new THREE.Vector3(0.0, 1.0, 1.0),
  new THREE.Vector3(0.0, 1.0, 0.0)
];


class Visualizer {
  init () {
    // setup de la scène 
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.camera.position.x = config.pseudoDistance;
    this.camera.position.y = config.pseudoDistance*1.5;
    this.camera.position.z = config.pseudoDistance;
    this.camera.lookAt(new THREE.Vector3(0,0,0));

    this.light = new THREE.DirectionalLight(0xffffff, 1.0);
    this.light.position.set(config.x, config.y, config.z);
    this.scene.add(this.light);

    this.scene.fog = new THREE.Fog(0x000000, 0.1, 400);

    // high grid
    this.grid = new Float32Array(config.gridsize*config.gridsize);
    this.grid.fill(0);

    this.gridImages = [];
    this.gridImage = null;
    this.lastChange = 0;

    // la texture glowy
    this.texture = null;
    this.heightMAP = null;
    this.loadTextures();

    /**
     * @type {Array.<THREE.Mesh>}
     */
    this.rectangles = new Array(config.gridsize*config.gridsize);
    this.fillRectangles();

    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);

    // EFFECT COMPOSER
    this.composer = new EffectComposer(this.renderer, { depthTexture: true });
    
    this.bloomEffect = new BloomEffect();
    /*this.bookehEffect = new RealisticBokehEffect({
      manualDoF: true
    });*/
    this.brightnessEffect = new BrightnessContrastEffect({
      blendFunction: BlendFunction.SCREEN
    });
    this.pixelEffect = new PixelationEffect(40);
    this.noiseEffect = new NoiseEffect({
      premultiply: true
    });

    this.pixelScenar = 0;

    this.effectPass = new EffectPass(this.camera, this.bloomEffect, /*this.bookehEffect,*/ this.brightnessEffect, this.noiseEffect);
    this.effectPass2 = new EffectPass(this.camera, this.pixelEffect);
    
    this.effectPass.renderToScreen = true;

    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(this.effectPass2);
    this.composer.addPass(this.effectPass);

    return new Promise(resolve => {
      this.loadImages().then(resolve);
    });
  }

  loadTextures () {
    this.heightMAP = new THREE.DataTexture(this.grid, config.gridsize, config.gridsize, THREE.LuminanceFormat, THREE.FloatType);
  }

  loadImages () {
    return new Promise(resolve => {
      let toLoad = images.length;
      images.forEach(filename => {
        let image = new Image();
        image.onload = data => {
          this.gridImages.push(imageToBytes(image));
          toLoad--;
          if (toLoad==0) {
            this.getRandomImage();
            resolve();
          }
        }
        image.src = "images/"+filename;
      })
    });
  }
  
  getRandomImage () {
    this.gridImage = this.gridImages[Math.floor(Math.random()*this.gridImages.length)];
  }

  changeColor () {
    let newColor = colors[Math.floor(Math.random()*colors.length)];
    for (let i = 0; i < config.gridsize*config.gridsize; i++) {
      this.rectangles[i].material.uniforms.color.value = newColor;
      this.rectangles[i].material.uniforms.color.needsUpdate = true;
    }
  }

  fillRectangles () {
    let geo = new THREE.BoxGeometry(config.squareSize, config.barHeight, config.squareSize);
    let translateX = config.gridsize*(config.squareSize+config.spaceBetween)/2;
    let translateZ = config.gridsize*(config.squareSize+config.spaceBetween)/2;

    for (let i = 0; i < config.gridsize*config.gridsize; i++) {
      let mat = new THREE.ShaderMaterial({
        uniforms: {
          height: { type: "f", value: config.barHeight },
          grid_x: { type: "f", value: i%config.gridsize },
          grid_z: { type: "f", value: Math.floor(i/config.gridsize) },
          gridSize: { type: "f", value: config.gridsize },
          heightMap: { type: "t", value: this.heightMAP },
          intensity: { type: "f", value: 0 },
          color: { type: "v3", value: new THREE.Vector3(0.0, 1.0, 0.0) }
        },
        vertexShader: GlowyShader.vertex,
        fragmentShader: GlowyShader.fragment,
        side: THREE.DoubleSide
      });

      this.rectangles[i] = new THREE.Mesh(geo, mat);
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
    let texture = new THREE.DataTexture(this.grid, config.gridsize, config.gridsize, THREE.LuminanceFormat, THREE.FloatType);
    texture.needsUpdate = true;
    for (let i in this.rectangles) {
      this.rectangles[i].material.uniforms.intensity.value = this.grid[i];
      this.rectangles[i].material.uniforms.intensity.needsUpdate = true;
      this.rectangles[i].material.uniforms.heightMap.value = texture;
      this.rectangles[i].material.uniforms.heightMap.needsUpdate = true;
    }
  }

  /**
   * 
   * @param {AudioData} audio 
   */
  updatePasses (audio, elapsed, deltaT) {
    this.bloomEffect.distinction = audio.peak.value*0.5;
    this.bloomEffect.kernelSize = Math.floor(audio.peak.value*4);

    // BOOKEH PASS
    /*var vector = new THREE.Vector3(0, 0, -1);
    vector = this.camera.localToWorld(vector);
    vector.sub(this.camera.position); // Now vector is a unit vector with the same direction as the camera
    var raycaster = new THREE.Raycaster(this.camera.position, vector);
    let intersects = raycaster.intersectObjects(this.scene.children, false)[0];
    if (intersects !== undefined && typeof intersects.point !== "undefined") {
      this.bookehEffect.uniforms.get("focus").value = intersects.distance;
      this.bookehEffect.uniforms.get("dof").value = intersects.point;
    }*/

    // BRIGHTNESS PASS
    this.brightnessEffect.uniforms.get("contrast").value = 0.5 + 0.5 * Math.cos(elapsed/4000);

    // PIXELLATION 
    if (this.pixelEffect.granularity>0) {
      this.pixelScenar+= deltaT;
      if (this.pixelScenar>2000) {
        this.pixelEffect.setGranularity(this.pixelEffect.granularity-4);
        this.pixelScenar = 0;
      }
    }
    //this.pixelEffect.setGranularity(config.focus);
  }

  /**
   * 
   * @param {AudioData} audioData  
   */
  updateGrid (audioData, elapsed) {
    let black = new THREE.Color(0,0,0);
    let gs = config.gridsize*config.gridsize;
    for (let i = 0; i < gs; i++) {
      if (this.grid[i] > 0) {
        this.grid[i] = THREE.Math.lerp(this.grid[i], 0, 0.1) + 0.1*Math.cos((i%config.gridsize)/4+elapsed/500) + 0.03*Math.sin((i/config.gridsize)/4+elapsed/500);
      }
    }

    if (audioData.peak.value > 0.5) {
      for (let x = 0; x < config.gridsize; x++) {
        for (let y = 0; y < config.gridsize; y++) {
          let i = x + config.gridsize*y;
          if (this.gridImage[i] > 20) {
            this.grid[i] = THREE.Math.lerp(this.grid[i], this.gridImage[i]/400*audioData.energy, 0.1);
          }
        } 
      }
    }
  }

  /**
   * fais tourner la caméra autour du centre et la rapproche périodiquement du centre 
   * 
   * @param {number} elapsed temps écoulé depuis le début
   */
  updateCamera (elapsed) {
    let x = Math.cos(elapsed) * config.pseudoDistance;
    let z = Math.sin(elapsed) * config.pseudoDistance;
    let y = Math.cos(elapsed/4) * (config.pseudoDistance*1.25) + config.pseudoDistance*1.5;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(new THREE.Vector3(0,0,0));
  }

  /**
   * The render method uses the time variable to "create" movement.
   * 
   * @param {number} deltaT the time elapsed since last frame call
   * @param {number} time the total elapsed time since the beginning of the app
   * @param {AudioData} audioData analysed audio data
   */
  render (deltaT, time, audioData) {
    if (time - audioData.peak.timer > 3500) {
      this.changeColor();
    }
    this.lastChange+= deltaT;
    if (this.lastChange>config.changeImageEach) {
      this.lastChange = 0;
      this.getRandomImage();  
    }
    this.updateCamera(time/2800);
    this.updateGrid(audioData, time);
    this.updateRectanglePos();
    this.updatePasses(audioData, time, deltaT);
    //this.renderer.render(this.scene, this.camera);
    this.composer.render(deltaT);
  }
}

export default Visualizer;