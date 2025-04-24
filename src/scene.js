import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.137.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.137.0/examples/jsm/loaders/GLTFLoader.js";
import {
    CSS2DRenderer,
    CSS2DObject,
} from "https://cdn.jsdelivr.net/npm/three@0.167.0/examples/jsm/renderers/CSS2DRenderer.js";

import { getParticleSystem } from "./getParticleSystem.js";
import Stats from "https://cdn.jsdelivr.net/npm/stats-js@1.0.1/+esm";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.137.0/examples/jsm/controls/OrbitControls.js";

import {loadMessages} from './chatbotScript.js';

const contentArray = [
    {
        name: "about",
        text: "about about about about about about about about about about about about about about about about about about about about about ",
    },
    {
        name: "framework",
        text: "framework framework framework framework framework framework framework framework framework framework framework framework framework ",
    },
    {
        name: "roadmap",
        text: "roadmap roadmap roadmap roadmap roadmap  text text text text text text text text text text text text text text text text text text text text text text text text text text  ",
    },
    {
        name: "use-case",
        text: "use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case use-case  ",
    },
    {
        name: "tokenomics",
        text: "tokenomics tokenomics tokenomics text text text text text text text text text text text text text text text text text text text text text text text text text text ",
    },
];
const content = Object.fromEntries(
    contentArray.map((item) => [item.name, item.text])
);

const TRANSITION_DURATION = 2;
const FIRE_SPEED = 0.6;
const SNOW_SPEED = 0.15;
let isAtStarterPos = true;
const DONT_SHOW_PAPER = false;
const SHOW_PAPER = true;
const CAMERA_MOVEMENT_INTENCITY = 0.002;
const CAMERA_TILT_SPEED = 0.004;

const CAMERA_START_POS_DESKTOP = new THREE.Vector3(4.73, 3.11, 21.76);
const CAMERA_START_POS_MOBILE = new THREE.Vector3(7.49, 9.41, 51.19);

const CAMERA_START_ROT_DESKTOP = new THREE.Vector3(-0.074, 0.33, 0.024);
const CAMERA_START_ROT_MOBILE = new THREE.Vector3(-0.13, 0.183, 0.024);

let CAMERA_START_POS;
let CAMERA_START_ROT;

let penelopeIsZoomed = false;

const cursorPos = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
};
const smoothPos = {
    x: 0,
    y: 0,
};

const sceneData = {};

window.onload = function () {
    window.scrollTo(0, 0);
};
let WINDOW_IS_OPEN = false;

var mousePos = new THREE.Vector2();

// ---> audio
var fire_sound = new Audio("audio/fire_sound.mp3");

fire_sound.volume = 0.1;

var window_sound = new Audio("audio/window_sound.mp3");
window_sound.volume = 0.05;

var wind_sound = new Audio("audio/wind_sound.mp3");
wind_sound.volume = 0.005;
// <---

// invisible material
const invisible_mat = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0,
    depthTest: false,
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    35,
    innerWidth / innerHeight,
    0.01,
    200
);

/// renderer --->
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas: document.querySelector("#canvas3d"),
});
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 0);
/// renderer <-----

// const controls = new OrbitControls(camera, renderer.domElement);

//---> window_model collider
const window_model_collider_geometry = new THREE.BoxGeometry(1, 1, 1);
const window_model_collider = new THREE.Mesh(
    window_model_collider_geometry,
    invisible_mat
);
scene.add(window_model_collider);
//adjust colider position to window_model position
window_model_collider.position.x = -5.5;
window_model_collider.position.y = 2.3;
window_model_collider.position.z = 0;
window_model_collider.scale.y = 4;
window_model_collider.scale.x = 2.2;
//<--- window_model collider

window.addEventListener("mousemove", (event) => {
    cursorPos.x = event.clientX;
    cursorPos.y = event.clientY;
});

/// snow  particles -->
const bgParticleMat = new THREE.PointsMaterial({
    color: "#aaa",
    size: 0.3,
    transparent: true,
});
const particleGeometry = new THREE.BufferGeometry();
const particleCount = 10000;
const posArray = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 3;
}
particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
);
const particleMesh = new THREE.Points(particleGeometry, bgParticleMat);
particleMesh.position.y = 11;
particleMesh.position.z = -19;
particleMesh.position.x = -50;
particleMesh.scale.x = 44;
particleMesh.scale.z = 4;
particleMesh.scale.y = 44;
particleMesh.rotation.x = -0.5;
scene.add(particleMesh);
/// snow particles <---

const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = () => startScene();

loadingManager.onError = (url) => {
    console.error(`Error loading ${url}`);
};

// load 3d models
const gltfloader = new GLTFLoader(loadingManager);

gltfloader.load("3d/room.glb", function (gltf) {
    sceneData.room = gltf.scene;
});

gltfloader.load("3d/window.glb", function (gltf) {
    sceneData.window_model = gltf.scene;
    sceneData.windowAnimations = gltf.animations;
});

gltfloader.load("3d/firewood.glb", function (gltf) {
    sceneData.firewood = gltf.scene;
});
gltfloader.load("3d/parts.glb", function (gltf) {
    sceneData.parts = gltf.scene;
});
gltfloader.load("3d/girl.glb", function (gltf) {
    sceneData.girl = gltf.scene;
    sceneData.girlAnimations = gltf.animations;
});

function startScene() {
    handleOrientationChange();

    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    camera.position.set(
        CAMERA_START_POS.x,
        CAMERA_START_POS.y,
        CAMERA_START_POS.z
    );
    camera.rotation.set(
        CAMERA_START_ROT.x,
        CAMERA_START_ROT.y,
        CAMERA_START_ROT.z
    );

    let room = sceneData.room;
    scene.add(sceneData.firewood);
    scene.add(sceneData.parts);

    let girlMixer, girlAction;
    girlMixer = new THREE.AnimationMixer(sceneData.girl);

    girlAction = girlMixer.clipAction(sceneData.girlAnimations[0]);
    girlAction.loop = THREE.LoopRepeat;
    girlAction.clampWhenFinished = false;
    scene.add(sceneData.girl);
    girlAction.play();

    scene.add(room);

    let window_modelAnimations, window_modelMixer, window_modelAction;
    let window_model = sceneData.window_model;
    // animations for window_model
    window_modelAnimations = sceneData.windowAnimations;
    window_modelMixer = new THREE.AnimationMixer(window_model);

    window_modelAction = window_modelMixer.clipAction(
        window_modelAnimations[0]
    );
    window_modelAction.clampWhenFinished = true;
    window_modelAction.loop = THREE.LoopOnce;
    // window_modelAction.play()

    scene.add(window_model);

    function open_window() {
        window_sound.play();
        wind_sound.volume = 0.03;
        //adjust colider pos
        window_model_collider.position.x = -7.5;
        window_model_collider.position.z = 1;
        window_model_collider.rotation.y = 1;
        WINDOW_IS_OPEN = true;
        //play/replay animation
        window_modelAction.play();
        window_modelAction.timeScale = 1;
        window_modelAction.paused = false;
    }
    function close_window() {
        // stop wind sound after window is fully closed
        setTimeout(function () {
            wind_sound.volume = 0.005;
            window_sound.play();
        }, 500);
        //adjust colider pos
        window_model_collider.position.x = -5.5;
        window_model_collider.position.z = 0;
        window_model_collider.rotation.y = 0;
        WINDOW_IS_OPEN = false;
        //reverse animation
        window_modelAction.timeScale = -1;
        window_modelAction.paused = false;
    }

    // ---> click animations
    const raycaster = new THREE.Raycaster();
    window.addEventListener("click", (event) => {
        fire_sound.play();
        wind_sound.play();
        mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
        mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mousePos, camera);
        const intersects = raycaster.intersectObjects(scene.children);
        if (
            intersects.length > 0 &&
            intersects[0].object == window_model_collider
        ) {
            if (WINDOW_IS_OPEN) {
                close_window();
            } else {
                open_window();
            }
        }
    });
    // <--- click animations

    // --> fire
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.position.set(0, 0.1, 0.5);

    const fireEffect = getParticleSystem({
        camera,
        emitter: cube,
        parent: scene,
        rate: 200,
        texture: "images/fire.png",
    });

    //  fire <---

    // ---> labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.pointerEvents = "none";
    labelRenderer.domElement.style.zIndex = "222";
    document.body.appendChild(labelRenderer.domElement);

    scene.add(
        createButton("talk to penelope", new THREE.Vector3(-4.8, -0.5, 5.5))
    );
    scene.add(createButton("framework", new THREE.Vector3(0, -0.5, 7)));
    scene.add(createButton("about", new THREE.Vector3(0, 0.2, 2)));
    scene.add(createButton("tokenomics", new THREE.Vector3(-6, -0.4, 11)));
    scene.add(createButton("use-case", new THREE.Vector3(5.5, 0.8, 0.5)));
    scene.add(createButton("roadmap", new THREE.Vector3(4.1, 4.9, 0.5)));

    function showHeader() {
        let headerEl = document.getElementById("header-wrapper");
        headerEl.classList.remove("fade-out");
    }
    function hideHeader() {
        let headerEl = document.getElementById("header-wrapper");
        headerEl.classList.add("fade-out");
    }
    function showBackBtn() {
        let el = document.getElementById("back-btn-wrapper");
        el.classList.remove("fade-out");
        el.classList.add("fade-in");
    }

    function hideBackBtn() {
        let el = document.getElementById("back-btn-wrapper");
        el.classList.add("fade-out");
        el.classList.remove("fade-in");
    }

    function animateCamera(
        targetPos,
        targetRot,
        shoulShowPaper,
        backing = false
    ) {
        isAtStarterPos = false;

        if (backing) {
            // showSceneButtons();
            // showHeader();
            hideBackBtn();
        } else {
            hideSceneButtons();
            hideHeader();
            // showBackBtn();
        }

        // Animate camera rotation (assuming Euler angles)
        gsap.to(camera.rotation, {
            x: targetRot.x,
            y: targetRot.y,
            z: targetRot.z,
            duration: TRANSITION_DURATION,
            ease: "power2.inOut",
        });
        // Animate camera position
        gsap.to(camera.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: TRANSITION_DURATION,
            ease: "power2.inOut",
            onComplete: () => {
                if (shoulShowPaper) {
                    showPaper();
                }
                if (backing) {
                    isAtStarterPos = true;
                    smoothPos.x = window.innerWidth / 2;
                    smoothPos.y = window.innerHeight / 2;
                }
                if (backing) {
                    showSceneButtons();
                    showHeader();
                    // hideBackBtn();
                } else {
                    // hideSceneButtons();
                    // hideHeader();
                    showBackBtn();
                }
            },
        });
    }

    setTimeout(() => {
        document.getElementById("roadmap").addEventListener("click", () => {
            setPaperText(content["roadmap"]);
            animateCamera(
                new THREE.Vector3(4.59, 3.275, 9.499),
                new THREE.Euler(0.23, 0.07, -0.016),
                SHOW_PAPER
            );
        });
        document.getElementById("framework").addEventListener("click", () => {
            setPaperText(content["framework"]);
            animateCamera(
                new THREE.Vector3(-0.28, 7.458, 10.845),
                new THREE.Euler(-1.051, 0, 0),
                SHOW_PAPER
            );
        });
        document.getElementById("tokenomics").addEventListener("click", () => {
            setPaperText(content["tokenomics"]);
            animateCamera(
                new THREE.Vector3(-1.562, 3.715, 10.891),
                new THREE.Euler(-1.582, 0.794, 1.587),
                SHOW_PAPER
            );
        });
        document.getElementById("about").addEventListener("click", () => {
            setPaperText(content["about"]);
            animateCamera(
                new THREE.Vector3(0, 6.112, 10),
                new THREE.Euler(-0.495, 0, 0),
                SHOW_PAPER
            );
        });
        document.getElementById("use-case").addEventListener("click", () => {
            setPaperText(content["use-case"]);
            animateCamera(
                new THREE.Vector3(5.77, 3, 10.166),
                new THREE.Euler(-0.059, 0.0245, 0),
                SHOW_PAPER
            );
        });
        document
            .getElementById("talk to penelope")
            .addEventListener("click", () => {
                animateCamera(
                    new THREE.Vector3(-3.139, 2.102, 10.139),
                    new THREE.Euler(-0.219, 0.2107, 0.046),
                    DONT_SHOW_PAPER
                );
                setTimeout(() => {
                    showChat();
                    penelopeIsZoomed = true;
                }, TRANSITION_DURATION * 1000);
            });
        document.getElementById("back-btn").addEventListener("click", () => {
            document
                .getElementById("paper-wrapper")
                .classList.remove("paper-wrapper-on");
            animateCamera(
                CAMERA_START_POS,
                CAMERA_START_ROT,
                DONT_SHOW_PAPER,
                true
            );
            if (penelopeIsZoomed) {
                hideChat();
                penelopeIsZoomed = false;
            }
        });
    }, 1);

    function hideSceneButtons() {
        labelRenderer.domElement.style.display = "none";
    }
    function showSceneButtons() {
        labelRenderer.domElement.style.display = "block";
    }

    function setPaperText(text) {
        const paperTextEl = document.getElementById("paper-text");
        paperTextEl.textContent = text;
    }

    // ///stats
    // const stats = new Stats();
    // stats.showPanel(2); // 0: fps, 1: ms (milliseconds per frame), 2: memory
    // document.body.appendChild(stats.dom);

    let clock = new THREE.Clock();
    function animate() {
        // stats.begin();
        let delta = clock.getDelta();
        //animate window
        if (window_modelMixer) window_modelMixer.update(delta);
        if (girlMixer) girlMixer.update(delta);

        particleMesh.rotation.z -= delta * SNOW_SPEED;
        fireEffect.update(delta * FIRE_SPEED);

        // console.log(camera.position);
        // console.log(camera.rotation);

        smoothPos.x += (cursorPos.x - smoothPos.x) * CAMERA_TILT_SPEED;
        smoothPos.y += (cursorPos.y - smoothPos.y) * CAMERA_TILT_SPEED;
        if (camera && isAtStarterPos) {
            // console.log(cursorPos);
            camera.position.set(
                CAMERA_START_POS.x +
                    CAMERA_MOVEMENT_INTENCITY *
                        (smoothPos.x - window.innerWidth / 2),
                CAMERA_START_POS.y -
                    CAMERA_MOVEMENT_INTENCITY *
                        (smoothPos.y - window.innerHeight / 2),
                CAMERA_START_POS.z
            );
        }

        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        // stats.end();
    }
    animate();
}

function createButton(buttonText, position) {
    const button = document.createElement("button");
    button.textContent = buttonText;
    button.style.pointerEvents = "auto";
    button.classList.add("scene-button");
    button.id = buttonText;

    const label = new CSS2DObject(button);
    label.position.copy(position);

    return label;
}

function showPaper() {
    const paperWrapper = document.getElementById("paper-wrapper");
    paperWrapper.classList.add("paper-wrapper-on");
}

/// orientation
let orientationIsLandscape = isLandscape();
if (orientationIsLandscape) {
    switchToLandscape();
} else {
    switchToPortrait();
}

function handleOrientationChange() {
    if (isLandscape()) {
        if (!orientationIsLandscape) switchToLandscape();
        orientationIsLandscape = true;
    } else {
        if (orientationIsLandscape) switchToPortrait();
        orientationIsLandscape = false;
    }
}
function isLandscape() {
    return window.innerWidth > 700;
}

window.addEventListener("resize", function () {
    handleOrientationChange();
});

function switchToLandscape() {
    CAMERA_START_POS = CAMERA_START_POS_DESKTOP;
    CAMERA_START_ROT = CAMERA_START_ROT_DESKTOP;
    console.log("toLandscape");
}
function switchToPortrait() {
    CAMERA_START_POS = CAMERA_START_POS_MOBILE;
    CAMERA_START_ROT = CAMERA_START_ROT_MOBILE;

    console.log("toPortrait");
}

////////////////////////////////
const chatContainer = document.getElementsByClassName("main-chat-container")[0];

function showChat() {
    console.log("showChat called!");
    chatContainer.style.display = "flex"
    loadMessages()
}
function hideChat() {
    console.log("hideChat called!");

    chatContainer.style.display = "none"
}
