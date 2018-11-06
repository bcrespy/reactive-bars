/**
 * This file defines the user controls, and their constraints
 * If you want to learn more about this, 
 * [https://github.com/bcrespy/creenv-gui]
 */

import config from './config';

/**
 * The controls object needs to follow specific rules in order to work
 * Those rules are explained here 
 * [https://github.com/bcrespy/creenv-gui#structure-of-the-controls-object]
 */
let userControls = {

  object: config,

  // the controls property is an array of items
  controls: [
    [
      "Bokeh", 
      {
        property: "focus",
        min: 0, max: 10, step: 0.0001
      },
      {
        property: "focalLength",
        min: -100, max: 200, step: 1
      }
    ]
  ]

};


export default userControls;