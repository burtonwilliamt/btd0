//Aliases
const Application = PIXI.Application,
  loader = PIXI.Loader.shared,
  resources = PIXI.Loader.shared.resources,
  Graphics = PIXI.Graphics,
  Container = PIXI.Container,
  Sprite = PIXI.Sprite,
  Text = PIXI.Text,
  TextStyle = PIXI.TextStyle;

const app = new Application({
  width: 960,
  height: 512,
  antialias: false,
  transparent: false,
  resolution: 1
}
);
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoDensity = true;
app.resizeTo = window;

document.body.appendChild(app.view);

// Main game state.
const state = {
  currentMode: play,
  targets: [],
  targetContainer: null,
  targetDelay: 60,
  targetMax: 10,
  bounciness: 1.0,
  score: 0,
  clicks: 0,
  scoreText: null,
  tickNum: 0,
  tink: null,
  pointer: null,
  reticule: null,
  dust: null,
  popSfx: null,
  pauseText: null,
}

// ***************Utility functions******************
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}

function applyGravity(obj) {
  impactHeight = app.renderer.view.height - (obj.height / 2);
  distanceToImpact = impactHeight - obj.y;
  obj.vy += 0.15;
  if (obj.vy > distanceToImpact) { // bounce
    // Assume obj goes all the way to the edge, how much is left after bounce?
    remainingDistance = state.bounciness * (Math.abs(obj.vy) - distanceToImpact);
    obj.y = impactHeight - remainingDistance;
    obj.vy = -state.bounciness * obj.vy;
  } else {
    obj.y = obj.y + obj.vy;
  }
}

// ***************Graphics functions******************
function graphicsSetup() {
  state.targetContainer = new Container();
  app.stage.addChild(state.targetContainer);
}

function drawRectangle(x, y, width, height, color) {
  const rect = new Graphics();
  rect.beginFill(color);
  rect.drawRect(0, 0, width, height);
  rect.endFill();
  rect.x = x;
  rect.y = y;
  return rect;
}

function drawCircle(x, y, radius, color) {
  const circ = new Graphics();
  circ.beginFill(color);
  circ.drawCircle(0, 0, radius);
  circ.endFill();
  circ.x = x;
  circ.y = y;
  return circ;
}

function drawText(x, y, content) {
  txt = new Text(content, new TextStyle({ fill: "#ffffff" }));
  txt.position.set(x, y);
  return txt;
}

function drawSprite(x, y, width, height, imagePath) {
  sprt = new Sprite(resources[imagePath].texture);
  sprt.width = width;
  sprt.height = height;
  sprt.x = x;
  sprt.y = y;
  return sprt;
}

function makeTarget() {
  const x = Math.floor(Math.random() * app.renderer.view.width),
    y = Math.floor(Math.random() * app.renderer.view.height),
    target = drawSprite(x, y, 64, 64, "img/sphere_44.png");
  target.anchor.set(0.5, 0.5);
  target.tint = 0xffffff;
  target.vx = 0;
  target.vy = 0;
  state.targetContainer.addChild(target);
  state.targets.push(target);
}

function makePop(target) {
  const bubbles = state.dust.create(target.x, target.y, () => drawSprite(0, 0, 64, 64, "img/sphere_44.png"), state.targetContainer, 30);
  state.popSfx = new Audio('./audio/plop.mp3');
  state.popSfx.play();
}

function drawReticule() {
  const line1 = drawRectangle(0, 30, 64, 4, 0xa30c00),
    line2 = drawRectangle(30, 0, 4, 64, 0xa30c00),
    reticule = new Container();
  reticule.addChild(line1);
  reticule.addChild(line2);
  reticule.pivot.set(reticule.width / 2, reticule.height / 2);
  reticule.position.set(128, 128);
  app.stage.addChild(reticule);
  state.reticule = reticule;
}

function updateReticule() {
  state.reticule.x = state.pointer.x;
  state.reticule.y = state.pointer.y;
}

function updateScore() {
  if (state.scoreText === null) {
    state.scoreText = drawText(0, 0, "");
    app.stage.addChild(state.scoreText);
  }
  state.scoreText.text = `Score: ${state.score}\nAccuracy: ${state.score / state.clicks}\nDPS: ${state.score * 60 / state.tickNum}`;
}


// ***************Game logic functions******************
function updatePhysics() {
  for (const target of state.targets) {
    applyGravity(target);
  }
}

function handleClick() {
  if (state.currentMode == pause) {
    return;
  }
  const x = state.pointer.x, y = state.pointer.y;
  state.clicks += 1;
  for (let i = 0; i < state.targets.length; i++) {
    const target = state.targets[i];
    if (distance(x, y, target.x, target.y) < 32) {
      //if (state.pointer.hitTestSprite(target)) {
      makePop(target);
      target.destroy();
      state.targets.splice(i, 1);
      state.score += 1;
      break;
    }
  }
}

function togglePause() {
  if (state.currentMode === play) {
    state.pauseText = drawText(0, 0, "PAUSED\nPress esc to resume.");
    state.pauseText.pivot.set(state.pauseText.width / 2, state.pauseText.height / 2);
    state.pauseText.position.set(app.renderer.view.width / 2, app.renderer.view.height / 2);
    state.pauseText.style.align = "center";
    app.stage.addChild(state.pauseText);
    state.currentMode = pause;
  } else {
    state.pauseText.destroy();
    state.pauseText = null;
    state.currentMode = play;
  }
}

// ***************Game Loop functions******************
function pause(delta) {
  updateReticule();
}

function play(delta) {
  if (state.targets.length < state.targetMax && state.tickNum % state.targetDelay == 0) {
    makeTarget();
  }
  updatePhysics();
  updateReticule();
  state.dust.update();
  updateScore();
  state.tickNum += 1;
}

function gameLoop(delta) {
  // Execute a step for whatever mode we're in.
  state.currentMode(delta);
  state.tink.update();
}

function pointerSetup() {
  state.tink = new Tink(PIXI, app.renderer.view);
  state.pointer = state.tink.makePointer();
  state.pointer.press = handleClick;
  state.pointer.visible = true;
  drawReticule();
}

function dustSetup() {
  state.dust = new Dust(PIXI);
}

function controlsSetup() {
  const escKey = state.tink.keyboard(27); // esc key
  escKey.press = togglePause;
}

function setup() {
  graphicsSetup();
  pointerSetup();
  dustSetup();
  controlsSetup();
  app.ticker.add((delta) => gameLoop(delta));
}

//load an image and run the `setup` function when it's done
loader
  .add("img/sphere_44.png")
  .load(setup);
