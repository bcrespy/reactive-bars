import Creenv from "@creenv/core";

// ui elements
import HUD from "@creenv/hud";
import GUI from "@creenv/gui";
import Stats from "@creenv/stats";

// config + user controls 
import config from "./config";
import controls from "./user-controls";

import AudioManager from "@creenv/audio/manager";


import Renderer from "./renderer";

class MyProject extends Creenv {
  init() {
    super.init();
    super.framerate(60);

    this.stats = new Stats();
    this.guiControls = new GUI(controls);
    this.hud = new HUD();
    this.hud.add(this.stats);
    this.hud.add(this.guiControls);

    // we initialize our renderer
    this.renderer = new Renderer();

    this.audio = new AudioManager(AudioManager.SOURCE_TYPE.FILE, {
      filepath: "owl-vision_warhogz.mp3",
      analyser: {
        peakDetection: {
          options: {
            threshold: 1.8
          }
        }
      }
    });

    return new Promise(resolve => {
      this.renderer.init().then(() => {
        this.audio.init().then(resolve);
      });
    });
  }

  /**
   * will be called at each frame 
   */
  render() {
    this.stats.begin();
    this.renderer.render(this.deltaT, this.elapsedTime, this.audio.getAnalysedAudioData(this.deltaT, this.elapsedTime));
    this.stats.end();
  }
}

let project = new MyProject();
project.bootstrap(); 
