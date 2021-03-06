import Creenv from "@creenv/core";

// ui elements
import HUD from "@creenv/hud";
import GUI from "@creenv/gui";
import Stats from "@creenv/stats";

// config + user controls 
import config from "./config";
import controls from "./user-controls";

import Capture from "@creenv/capture";

import AudioManager from "@creenv/audio/manager";


import Visualizer from "./visualizer";

class MyProject extends Creenv {
  init() {
    super.init();
    super.framerate(60);

    //this.stats = new Stats();
    this.guiControls = new GUI(controls);
    this.hud = new HUD();
    //this.hud.add(this.stats);
    this.hud.add(this.guiControls);

    // we initialize our renderer
    this.visualizer = new Visualizer();

    this.audio = new AudioManager(AudioManager.SOURCE_TYPE.FILE, {
      filepath: "owl-vision_warhogz.mp3",
      analyser: {
        peakDetection: {
          options: {
            threshold: 1.07
          }
        }
      }
    }, true);

    return new Promise(resolve => {
      this.visualizer.init().then(() => {
        this.audio.init().then(resolve);
      });
    });
  }

  /**
   * will be called at each frame 
   */
  render() {
    //this.stats.begin();
    this.visualizer.render(this.deltaT, this.elapsedTime, this.audio.getAnalysedAudioData(this.deltaT, this.elapsedTime));
    //this.stats.end();
  }
}

let project = new MyProject();
//project.bootstrap(); 

new Capture(project, {
  framerate: 60,
  export: {
    type: "webm",
    framerate: 60,
    filename: "render.webm"
  }
})