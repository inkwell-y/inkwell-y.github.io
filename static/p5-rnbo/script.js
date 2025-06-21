let canvas, w, h, sketchStarted = false, context, synth
let rain = [];

// setup RNBO and connect to p5 context
async function rnboSetup(context) { // pass in context from p5
  const outputNode = context.createGain()
  outputNode.connect(context.destination)

  // load reverb patch
  response = await fetch("export/rnbo.shimmerev.json")
  const reverbPatcher = await response.json()

  const reverbDevice = await RNBO.createDevice({ context, patcher: reverbPatcher })

  // establish signal chain: p5 Synth → Reverb Patch → Output
  // connect synth to reverb patch
  synth.connect(reverbDevice.node)

  // connect reverb patch to output
  reverbDevice.node.connect(outputNode)
  context.suspend()
}

// this gets called once during initialization
function setup() {
  w = window.innerWidth // width of the browser window
  h = window.innerHeight // height of the browser window

  // create a canvas for drawing, with dimensions 500x500px
  canvas = createCanvas(w, h) 

  // make the background of the canvas yellow
  background(0) 

  // fill any shapes that you draw on screen with red
  fill('#00FFFF') 

  // don't add any strokes/outlines to shapes
  // by default they have a black stroke
  noStroke() 

  // create button - the text inside the function call
  // is the text displayed on screen
  startButton = createButton('Start Sketch') 

  // position the button at the center of the screen
  startButton.position(w/2 - startButton.width/2, h/2 - startButton.height/2)


  // tell the button what function to call when it is pressed
  startButton.mousePressed(resumeAudio) 

  context = getAudioContext() // get p5 audio context

  synth = new p5.MonoSynth() // create a synth
  synth.setADSR(10, 1, 1, 5) // set an envelope
  synth.amp(0.1) // set a lower amplitude to be careful with volumes

  rnboSetup(context) // call RNBO setup function and pass in context
}


// built-in p5 function that is called when the mouse is pressed
function mousePressed() {
  // check that the audio is started
  if(sketchStarted == true) {
    // mouseX gets the X-coordinate of the mouse press
    // and maps the value from the range 0 - 500
    // to 12 (C0) - 108 (C8)
    let note = map(mouseX, 0, w, 12, 108)

    // play the note above, with 90 velocity
    // right now, for 0.1 seconds
    // the duration gets compounded with the envelope
    synth.play(midiToFreq(note), 90, 0, 0.1)

    // draw an ellipse at the X and Y coordinates
    // with a random size between 0 and 200px
    ellipse(mouseX, mouseY, random(200))
  }
}


// function that will be called when startButton is pressed
function resumeAudio() {
  sketchStarted = true // audio is now started

  // change CSS of button to hide it
  // since we don't need it anymore
  startButton.style('opacity', '0') 

  // get the audio context from p5
  if (getAudioContext().state !== 'running') {
    // and resume it if it's not running already 
    context.resume() 
  }
}


// this gets called every render frame
// (which is usually 60 times per second
function draw() {
  // 重绘背景
  background('rgba(11, 20, 28, 0.05)');

  // 只在启动音频后显示标尺点
  if (sketchStarted) {
    // 设置标尺点的样式
    stroke(0);
    strokeWeight(2);

    // 绘制X轴标尺点（MIDI音符）
    for (let i = 0; i <= 10; i++) {
      let x = map(i, 0, 10, 0, w);
      let noteVal = map(i, 0, 10, 12, 108);
      point(x, h - 10); // 在底部绘制点
      
      // 显示MIDI音符值
      noStroke();
      fill(0);
      textAlign(CENTER);
      textSize(10);
      text(Math.round(noteVal), x, h - 20);
    }

    // 每 10 帧生成一个雨滴
    if (frameCount % 10 === 0) {
      rain.push(new RainDrop());
    }

    // 更新雨滴
    for (let i = rain.length - 1; i >= 0; i--) {
      rain[i].update();
      if (rain[i].offScreen()) {
        rain.splice(i, 1);
      }
    }    
    // 显示当前鼠标位置对应的参数
    if (mouseX > 0 && mouseX < w && mouseY > 0 && mouseY < h) {
      let currentNote = map(mouseX, 0, w, 12, 108);
      fill('#00FFFF');
      noStroke();
      textAlign(LEFT);
      textSize(12);
      text(`MIDI音符: ${Math.round(currentNote)}`, 20, 20);
    }
  }
}

class RainDrop {
  constructor() {
    this.x = random(width);
    this.y = 0;
    this.speed = map(mouseY, 0, height, 1, 10);
    this.diameter = random(10, 20);
    this.note = map(this.x, 0, width, 36, 96) - 28;
    this.played = false;
  }

  update() {
    this.y += this.speed;
    this.display();

    if (this.y > height - 10 && !this.played) {
      let velocity = map(this.speed, 3, 10, 40, 127);
      synth.play(midiToFreq(this.note), velocity, 0, 0.15);
      this.played = true;
    }
  }

  display() {
    noStroke();
    fill(100, 150, 255, 180);
    ellipse(this.x, this.y, this.diameter);
  }

  offScreen() {
    return this.y > height + this.diameter;
  }
}