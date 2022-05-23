//Aliases
const Application = PIXI.Application,
  loader = PIXI.Loader.shared,
  resources = PIXI.Loader.shared.resources,
  Sprite = PIXI.Sprite,
  Graphics = PIXI.Graphics,
  Container = PIXI.Container;

const app = new Application({
  width: 960,
  height: 512,
  antialias: true,
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
  targetDelay: 60,
  targetMax: 10,
  bounciness: 1.0,
  tickNum: 0,
  tink: null,
  pointer: null,
  reticule: null,
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

function makeTarget() {
  const x = Math.floor(Math.random() * app.renderer.view.width),
    y = Math.floor(Math.random() * app.renderer.view.height),
    target = drawCircle(x, y, 32, 0x9966FF);
  target.vx = 0;
  target.vy = 0;
  app.stage.addChild(target);
  state.targets.push(target);
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


// ***************Game logic functions******************
function handleClick() {
  const x = state.pointer.x, y = state.pointer.y;
  for (let i = 0; i < state.targets.length; i++) {
    const target = state.targets[i];
    if (distance(x, y, target.x, target.y) < 32) {
      //if (state.pointer.hitTestSprite(target)) {
      target.destroy();
      state.targets.splice(i, 1);
      break;
    }
  }
}

function updatePhysics() {
  for (const target of state.targets) {
    applyGravity(target);
  }
}

function updateReticule() {
  state.reticule.x = state.pointer.x;
  state.reticule.y = state.pointer.y;
}

// ***************Game Loop functions******************
function play(delta) {
  if (state.targets.length < state.targetMax && state.tickNum % state.targetDelay == 0) {
    makeTarget();
  }
  updatePhysics();
  updateReticule();
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

function setup() {
  pointerSetup();
  app.ticker.add((delta) => gameLoop(delta));
}

//load an image and run the `setup` function when it's done
loader
  //.add("img/grass_tile_3.png")
  .load(setup);
