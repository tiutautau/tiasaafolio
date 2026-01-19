import gsap from 'gsap';
import { Howl } from "howler";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Font } from 'three/examples/jsm/Addons.js';

//-----------------Audio setup--------------------
let isMusicFaded = false;
const MUSIC_FADE_TIME = 600;
const BACKGROUND_MUSIC_VOLUME = 0.25;
const FADED_VOLUME = 0;

const backgroundMusic = new Howl({
  src: ["/audio/music/lofi2.mp3"],
  loop: true,
  volume: 0.25,
});

const fadeOutBackgroundMusic = () => {
  if (!isMuted && !isMusicFaded) {
    backgroundMusic.fade(
      backgroundMusic.volume(),
      FADED_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = true;
  }
};

const fadeInBackgroundMusic = () => {
  if (!isMuted && isMusicFaded) {
    backgroundMusic.fade(
      FADED_VOLUME,
      BACKGROUND_MUSIC_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = false;
  }
};

const buttonSounds = {
  click: new Howl({
    src: ["/audio/sfx/twinkle.mp3"],
    preload: true,
    volume: 0.30,
  }),
};

//-----------------Scene setup--------------------
const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Scene
const scene = new THREE.Scene();
//scene.background = new THREE.Color(0xebae34); // Warm light yellow

// Lights
const ambientLight = new THREE.AmbientLight(0xfffef5, 2);
scene.add(ambientLight);

//const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//directionalLight.position.set(10, 10, 10);
//scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 45;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.update();

//camera.position.set(
//  22.15101495273898,
//  8.352946829098649,
//  23.890298979289934
//);

//controls.target.set(
//  2.5,
//  3.2,
//  -2
//);

// Event Listeners
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --------- Modal Stuff ---------------
const modals = {
  projects: document.querySelector(".modal.projects"),
  showreel: document.querySelector(".modal.showreel"),
  about: document.querySelector(".modal.about"),
  projectDetail: document.querySelector(".modal.project-detail"),
};

const overlay = document.querySelector(".overlay");

let touchHappened = false;
document.querySelectorAll(".modal-exit-button").forEach((button) => {
  button.addEventListener(
    "touchend",
    (e) => {
      touchHappened = true;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModal(modal);
    },
    { passive: false }
  );

  button.addEventListener(
    "click",
    (e) => {
      if (touchHappened) return;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModal(modal);
    },
    { passive: false }
  );
});

let isModalOpen = false;

const showModal = (modal) => {
  console.log("Opening modal:", modal);
  overlay.classList.add("active"); // <--- ENABLE overlay
  modal.style.display = "block";
  blurBackground.style.display = "block";
  document.querySelector("#experience-canvas").style.pointerEvents = "none"; // Disable canvas interactions

  isModalOpen = true;
  //controls.enabled = false; // Disable controls when a modal is open
  controls.update(); // Ensure controls are updated

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }
  document.body.style.cursor = "default";
  currentIntersects = [];

  gsap.set(modal, {
    opacity: 0,
    scale: 0,
  });

  gsap.to(modal, {
    opacity: 1,
    scale: 1,
    duration: 0.5,
  });
};

const hideModal = (modal) => {
  console.log("Closing modal:", modal);
  overlay.classList.remove("active"); // <--- DISABLE overlay
  isModalOpen = false;
  controls.update(); // Ensure controls are updated

  gsap.to(modal, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    onComplete: () => {
      modal.style.display = "none";
      blurBackground.style.display = "none"; // Ensure blur background is hidden
      blurBackgroundDetail.style.display = "none"; // Ensure blurBackgroundDetail is hidden
      document.querySelector("#experience-canvas").style.pointerEvents = "auto"; // Re-enable canvas interactions
    },
  });
};

const xAxisFans = []

// -------------  Raycaster Setup

const raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Loaders
const textureLoader = new THREE.TextureLoader();

// Model Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const manager = new THREE.LoadingManager();

const loadingScreen = document.querySelector(".loading-screen");
const loadingScreenButton = document.querySelector(".loading-screen-button");
const noSoundButton = document.querySelector(".no-sound-button");

manager.onLoad = function () { //Enter button appears when everything is loaded
  loadingScreenButton.style.color = "#8f4624";
  loadingScreenButton.textContent = "ENTER";
  loadingScreenButton.style.fontWeight = "500";
  loadingScreenButton.style.fontSize = "110px";
  loadingScreenButton.style.cursor = "pointer";
  loadingScreenButton.style.transition =
    "transform 0.4s cubic-bezier(0.3, 1.56, 0.64, 1)";
  let isDisabled = false;

  noSoundButton.textContent = "or enter without sound";
  noSoundButton.style.background = "transparent";

  function handleEnter(withSound = true) { //when enter button is clicked
    if (isDisabled) return;

    noSoundButton.textContent = "";
    noSoundButton.style.background = "none";
    loadingScreenButton.style.cursor = "default";
    //loadingScreenButton.style.border = "5px solid #ffeac3ff";
    loadingScreenButton.style.background = "none";
    loadingScreenButton.style.fontSize = "80px";
    loadingScreenButton.style.color = "#F2EBDD";
    loadingScreenButton.style.boxShadow = "none";
    loadingScreenButton.textContent = "WELCOME";
    isDisabled = true;

    if (!withSound) {
      isMuted = true;
      updateMuteState(true);

      soundOnSvg.style.display = "none";
      soundOffSvg.style.display = "block";
    } else {
      backgroundMusic.play();
      soundOnSvg.style.display = "block";
      soundOffSvg.style.display = "none";
    }

    // Call playReveal only after the Enter button is clicked
    playReveal();
    controls.update(); // Force internal sync
    controls.enabled = true;
  }

  loadingScreenButton.addEventListener("mouseenter", () => {
    loadingScreenButton.style.transform = "scale(1.15)";
  });

  loadingScreenButton.addEventListener("touchend", (e) => {
    touchHappened = true;
    e.preventDefault();
    handleEnter();
  });

  loadingScreenButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(true);
  });

  loadingScreenButton.addEventListener("mouseleave", () => {
    loadingScreenButton.style.transform = "none";
  });

  noSoundButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(false);
  });
};

function playReveal() {
  const requiredObjects = [kirja_1, kirja_2, kirja_3, kirja_4];

  // Check objects are ready
  if (requiredObjects.some((obj) => !obj)) {
    console.warn("Objects not ready yet, retrying playReveal...");
    console.log("Current object states:", {
      kirja_1,
      kirja_2,
      kirja_3,
      kirja_4,
    });
    setTimeout(playReveal, 100);
    return;
  }

  console.log("Starting unified reveal + intro timeline");

  // Unified timeline
  const t1 = gsap.timeline({
    defaults: { duration: 0.8, ease: "back.out(1.8)" },
    onStart: () => console.log("Timeline started"),
    onComplete: () => {
      console.log("Timeline complete");

      // Ensure canvas is interactive
      const canvas = document.querySelector("#experience-canvas");
      canvas.style.pointerEvents = "auto";

      // Log final camera and controls state
      console.log("Final camera position:", camera.position);
      console.log("Final controls target:", controls.target);

      // Ensure OrbitControls internal state matches camera after animation
      controls.target.set(0, 3, 0); // Set to the intended target
      controls.update();
      controls.reset(); // Fully reset internal drag state
      controls.enabled = true; // Make sure controls are enabled

      console.log("OrbitControls synced after intro animation");
      console.log("Controls enabled:", controls.enabled);
    },
  });

  // ---------------------------
  // 1. Loading screen scale down
  // ---------------------------
  t1.to(loadingScreen, {
    scale: 0.5,
    duration: 1.2,
    delay: 0.25,
    ease: "back.in(1.8)",
  });

  // ---------------------------
  // 2. Loading screen move away
  // ---------------------------
  t1.to(
    loadingScreen,
    {
      y: "200vh",
      transform: "perspective(1000px) rotateX(45deg) rotateY(-35deg)",
      duration: 1.2,
      ease: "back.in(1.8)",
      onComplete: () => {
        loadingScreen.remove();
        console.log("Loading screen removed");
      },
    },
    "-=0.8" // overlap with previous
  );

 // ---------------------------
  // 3. Camera arc animation
  // ---------------------------
  const target = new THREE.Vector3(0, 3, 0);
  camera.position.set(1, 40, 1);
  controls.target.copy(target);
  controls.update();
  const spherical = new THREE.Spherical();
  spherical.setFromVector3(camera.position.clone().sub(target));

  t1.to(
    spherical,
    {
      duration: 3,
      phi: Math.PI / 2.5,
      ease: "power1.Out",
      onUpdate: () => {
        camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(target));
        controls.target.copy(target);
        controls.update();
      },
    },
    "-=0.8" // start camera animation overlapping loading screen
  );

  // ---------------------------
  // 4. Kirja objects intro animations
  // ---------------------------
  t1.to(
    kirja_1.position,
    {
      y: kirja_1.position.y + 1,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "circ.inOut",
    },
    "-=1.7" // overlap slightly with previous animation
  );

  t1.to(
    kirja_2.position,
    {
      y: kirja_2.position.y + 1,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "circ.inOut",
    },
    "-=1.65"
  );

  t1.to(
    kirja_3.position,
    {
      y: kirja_3.position.y + 1,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "circ.inOut",
    },
    "-=1.6"
  );

  t1.to(
    kirja_4.position,
    {
      y: kirja_4.position.y + 1.2,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      ease: "circ.inOut",
    },
    "-=1.55"
  );

  t1.to(
    ohjain.position,
    {
      y: ohjain.position.y + 2,
      duration: 0.6,
      yoyo: true,
      repeat: 1,
      ease: "circ.inOut",
    },
    "-=1.3"
  );

  t1.to(ohjain.rotation, {
  x: "+=" + Math.PI * 2,   // one full 360° turn
  z: "+=" + Math.PI * 2,   // one full 360° turn
  duration: 0.5,
  ease: "circ.Out",
}, "-=1.25");

  // ---------------------------
  // 5. Enable controls at the end
  // ---------------------------
  t1.call(() => {
  // Ensure OrbitControls internal state matches camera after animation
  controls.update();
  controls.saveState();  // save new default state
  controls.reset();      // resets internal drag state to current position
  controls.enabled = true; // Make sure controls are enabled
  console.log("OrbitControls synced after intro animation");
});

}

//Loaders & Texture Preparations

const loader = new GLTFLoader(manager);
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
  .setPath('textures/skybox/')
  .load([
    'px.webp',
    'nx.webp',
    'py.webp',
    'ny.webp',
    'pz.webp',
    'nz.webp'
  ]);

const textureMap = {
  Eka: {
    day: "textures/room/FirstText.webp"
  },
  Toka: {
    day: "textures/room/SecondText.webp"
  },
  Kolmas: {
    day: "textures/room/ThirdText.webp"
  },
  Neljas: {
    day: "textures/room/TextureSetFour.webp"
  },
};

const LoadedTextures = {
  day: {},
};

Object.entries(textureMap).forEach(([key, paths]) => {
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  LoadedTextures.day[key] = dayTexture;
});

//const projectsMaterial = new THREE.MeshPhysicalMaterial({
//  //color: 808080,         
//  metalness: 1,
//  roughness: 0,
//  clearcoat: 0.5,
//  clearcoatRoughness: 0.1,
//  reflectivity: 0.5,
//  transmission: 1,         // 0 = opaque, >0 = glassy
//  ior: 1.45,
//  //iridescence: 1,
//  //iridescenceIOR: 1,
//  envMap: environmentMap,
//  envMapIntensity: 1,
//  emissive: new THREE.Color(0x4F4F2D), 
//  emissiveIntensity: 1, // Adjust intensity as needed
//});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  opacity: 1,
  metalness: 0,
  roughness: 0,
  ior: 1.5,
  thickness: 0.01,
  specularIntensity: 1,
  envMap: environmentMap,
  envMapIntensity: 1,
  depthWrite: false,
});

window.addEventListener("mousemove", (e) => {
  touchHappened = false;
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});



var i = 0;
var txt = 'Lorem ipsum dummy text blabla.';
var speed = 50;

// Other Event Listeners
const muteToggleButton = document.querySelector(".mute-toggle-button");
const soundOffSvg = document.querySelector(".sound-off-svg");
const soundOnSvg = document.querySelector(".sound-on-svg");

const updateMuteState = (muted) => {
  if (muted) {
    backgroundMusic.volume(0);
  } else {
    backgroundMusic.volume(BACKGROUND_MUSIC_VOLUME);
  }
};

const handleMuteToggle = (e) => {
  e.preventDefault();

  isMuted = !isMuted;
  updateMuteState(isMuted);
  buttonSounds.click.play();

  if (!backgroundMusic.playing()) {
    backgroundMusic.play();
  }

  gsap.to(muteToggleButton, {
    rotate: -20,
    scale: 1.4,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (!isMuted) {
        soundOffSvg.style.display = "none";
        soundOnSvg.style.display = "block";
      } else {
        soundOnSvg.style.display = "none";
        soundOffSvg.style.display = "block";
      }

      gsap.to(muteToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(muteToggleButton, {
           clearProps: "all",
          });
        },
      });
    },
  });
};

let isMuted = false;
muteToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleMuteToggle(e);
  },
  { passive: false }
);

muteToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleMuteToggle(e);
  },
  { passive: false }
);

window.addEventListener("click", handleRaycasterInteraction);


// Array to hold video textures for updating
const videoTextures = [];

function hasIntroAnimation(objectName) {
 return objectsWithIntroAnimations.some((animatedName) => 
  objectName.includes(animatedName)
 ); 
}

const videoElement = document.createElement("video");
videoElement.src = "/textures/video/Showreel_pieni.mp4";
videoElement.loop = true;
videoElement.muted = true;
videoElement.controls = true;
videoElement.playsInline = true;
videoElement.autoplay = true;

// Handle play errors
videoElement.play().catch((error) => {
  console.warn("Video playback was interrupted:", error);
});

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.flipY = false; // Ensure the video texture is not flipped vertically
videoTexture.wrapS = THREE.RepeatWrapping; // Allow horizontal flipping
videoTexture.repeat.x = 1; // Flip the texture horizontally

// Update variable declarations to allow reassignment
let kirja_1, kirja_2, kirja_3, kirja_4;

let ohjain;

let tuoli;

loader.load("/models/PortfolioRoomCozy_V3.glb", (glb) => {
  // Enhanced logging to debug object names during traversal
  console.log("Starting object traversal...");

  glb.scene.traverse((child) => {
    if (!child.isMesh) return;

    // Log the name of every object being processed
    console.log("Found object:", child.name);

    // kirja_1 ... kirja_4 (match partial names)
    if (child.name.includes("kirja_1")) {
      kirja_1 = child;
      console.log("Initialized kirja_1");
      child.userData.initialPosition = child.position.clone();
      kirjat.push(child);
    }

    if (child.name.includes("kirja_2")) {
      kirja_2 = child;
      console.log("Initialized kirja_2");
      child.userData.initialPosition = child.position.clone();
      kirjat.push(child);
    }

    if (child.name.includes("kirja_3")) {
      kirja_3 = child;
      console.log("Initialized kirja_3");
      child.userData.initialPosition = child.position.clone();
      kirjat.push(child);
    }

    if (child.name.includes("kirja_4")) {
      kirja_4 = child;
      console.log("Initialized kirja_4");
      child.userData.initialPosition = child.position.clone();
      kirjat.push(child);
    }

    // ---------------------------
    // 1. MATERIAL OVERRIDES
    // ---------------------------
    Object.keys(textureMap).forEach((key) => {
      if (child.name.includes(key)) {
        const material = new THREE.MeshStandardMaterial({
          map: LoadedTextures.day[key],
        });
        child.material = material;
        child.material.transparent = false;
        child.material.opacity = 1;
        child.material.depthWrite = true;
      }
    });

    if (child.name.includes("Glass")) {
      child.material = glassMaterial;
    }

    if (child.name.includes("Screen")) {
      child.material = new THREE.MeshBasicMaterial({
        map: videoTexture,
        transparent: true,
        opacity: 0.9,
      });
      if (child.material.map) child.material.map.minFilter = THREE.LinearFilter;
    }

    // ---------------------------
    // 2. SPECIAL OBJECTS
    // ---------------------------

    // tuoli
    if (child.name.includes("tuoli")) {
      tuoli = child;
      child.userData.initialRotation = child.rotation.clone();
    }

    if (child.name.includes("ohjain")) {
      ohjain = child;
      child.userData.initialRotation = child.rotation.clone();
      child.userData.initialPosition = child.position.clone();
    }

    // kirja_1 ... kirja_4 are already handled above
    // fans on X-axis
    if (child.name.includes("tuuletin_1") ||
        child.name.includes("tuuletin_2") ||
        child.name.includes("tuuletin_3")) {
      xAxisFans.push(child);
    }

    // ---------------------------
    // 3. RAYCASTER INTERACTIVES
    // ---------------------------
    if (child.name.includes("Projects") ||
        child.name.includes("Showreel") ||
        child.name.includes("Aboutme")) {

      raycasterObjects.push(child);

      child.userData.initialScale = child.scale.clone();
      child.userData.initialPosition = child.position.clone();
      child.userData.initialRotation = child.rotation.clone();
      child.userData.isAnimating = false;

      // create hover target box
      const bbox = new THREE.Box3().setFromObject(child);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      const geometry = new THREE.BoxGeometry(size.x * 1.3, size.y * 1.3, size.z * 1.3);
      const material = new THREE.MeshBasicMaterial({ visible: false });

      const hoverTarget = new THREE.Mesh(geometry, material);
      hoverTarget.position.copy(bbox.getCenter(new THREE.Vector3()));
      hoverTarget.name = child.name + "_HoverTarget";
      hoverTarget.userData.linkedObject = child;

      scene.add(hoverTarget);
      raycasterObjects.push(hoverTarget);
    }

    if (child.name.includes("Raycaster")) {
      raycasterObjects.push(child);
    }

    if (child.name.includes("Hover")) {
      child.userData.initialScale = child.scale.clone();
      child.userData.initialPosition = child.position.clone();
      child.userData.initialRotation = child.rotation.clone();
      child.userData.isAnimating = false;
    }
  });

  console.log("Object traversal complete. Calling playReveal...");
  // Add final model to scene
  scene.add(glb.scene);

  // Call playReveal only after models are loaded
  console.log("All objects processed. Calling playReveal...");
});


function playHoverAnimation(object, isHovering) {
  if (!object.userData.initialScale || !object.userData.initialRotation) return; // Prevent errors

  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (isHovering) {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * 1.4,
      y: object.userData.initialScale.y * 1.4,
      z: object.userData.initialScale.z * 1.4,
      duration: 0.3,
     ease: "circ.out",
    });
    
  } else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });
    
  }
}

const clock = new THREE.Clock();

const render = (timestamp) => {
  const elapsedTime = clock.getElapsedTime();

  controls.update();

  // Animate Fans
  xAxisFans.forEach(fan => {
    fan.rotation.x -= 0.01;
  });

  // Chair rotate animation
  if (tuoli) {
    const time = timestamp * 0.001;
    const baseAmplitude = Math.PI / 8;
    const rotationOffset =
      baseAmplitude *
      Math.sin(time * 0.5) *
      (1 - Math.abs(Math.sin(time * 0.5)) * 0.3);
    tuoli.rotation.y = tuoli.userData.initialRotation.y + rotationOffset;
  }

  // Raycaster
  if (!isModalOpen) {
    raycaster.setFromCamera(pointer, camera);
    currentIntersects = raycaster.intersectObjects(raycasterObjects);

    if (currentIntersects.length > 0) {
      const currentIntersectObject = currentIntersects[0].object;
      const targetObject = currentIntersectObject.userData.linkedObject || currentIntersectObject;


      if (currentIntersectObject.name.includes("Hover")) {
        if (currentIntersectObject !== currentHoveredObject) {
          if (currentHoveredObject) {
            playHoverAnimation(currentHoveredObject, false);
          }
          currentHoveredObject = targetObject;
            playHoverAnimation(targetObject, true);
        }
      }

      if (currentIntersectObject.name.includes("Pointer")) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    } else {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }

  // Update video textures
  videoTextures.forEach(texture => {
    texture.needsUpdate = true;
  });

  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
};

window.addEventListener(
  "touchstart",
  (e) => {
    if (isModalOpen) return
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
  },
  { passive: false }
);

window.addEventListener(
  "touchend",
  (e) => {
    if (isModalOpen) return
    e.preventDefault();
    handleRaycasterInteraction()
  },
  { passive: false }
);

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    let object = currentIntersects[0].object;
    // If it's a hover target, use the linked real object
    if (object.userData.linkedObject) {
      object = object.userData.linkedObject;
    }

    if (object.name.includes("Projects")) {
      showModal(modals.projects)
    } else if (object.name.includes("Showreel")) {
      showModal(modals.showreel)
    } else if (object.name.includes("Screen")) {
      showModal(modals.showreel)
    } else if (object.name.includes("Aboutme")) {
      showModal(modals.about)
    }
  }
}

// --- Project detail modal logic (moved up here) ---
//const projectDetailModal = modals.projectDetail;
const projectDetailModal = document.querySelector('.modal.project-detail');
const projectDetailImage = projectDetailModal.querySelector('.project-detail-image');
const projectDetailDescription = projectDetailModal.querySelector('.project-detail-description');
const projectDetailExit = projectDetailModal.querySelector('.project-detail-exit');
const blurBackground = document.querySelector(".blurBackground");
const blurBackgroundDetail = document.querySelector('.blurBackgroundDetail');
const projectImages = document.querySelectorAll('.project-media img');

// =======================
// PROJECT DETAIL LOGIC
// =======================

// Open correct detail modal
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => {
    const modalId = card.dataset.modal;
    const modal = document.getElementById(modalId);
    if (modal) showModal(modal);
  });
});

// Close detail modals
document.querySelectorAll('.project-detail .modal-exit-button').forEach(button => {
  button.addEventListener('click', (e) => {
    const modal = e.target.closest('.modal');
    hideModal(modal);
    blurBackground.style.display = "none";
  });
});

// Directly toggle blurBackgroundDetail when opening detail modal
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => {
    const modalId = card.dataset.modal;
    const modal = document.getElementById(modalId);
    if (modal) {
      showModal(modal);
      blurBackgroundDetail.style.display = 'block'; // Ensure blurBackgroundDetail is visible
      console.log('Manually set blurBackgroundDetail to block');
    }
  });
});

// =======================
// SLIDESHOW LOGIC
// =======================

function initSlideshow(slideClass, index = 1) {
  let currentIndex = index;

  function showSlides(n) {
    const slides = document.querySelectorAll(`.${slideClass}`);
    if (slides.length === 0) return;

    if (n > slides.length) currentIndex = 1;
    if (n < 1) currentIndex = slides.length;

    slides.forEach(s => (s.style.display = "none"));
    slides[currentIndex - 1].style.display = "block";
  }

  // Initial display
  showSlides(currentIndex);

  // Controls
  document.querySelectorAll(`[data-slideshow="${slideClass.match(/\d+/)[0]}"]`).forEach(btn => {
    if (btn.classList.contains('next')) {
      btn.addEventListener('click', () => showSlides(++currentIndex));
    } else if (btn.classList.contains('prev')) {
      btn.addEventListener('click', () => showSlides(--currentIndex));
    }
  });
}

// Initialize slideshows
initSlideshow("mySlides1");
initSlideshow("mySlides2");
initSlideshow("mySlides3");
initSlideshow("mySlides4");
initSlideshow("mySlides5");
initSlideshow("mySlides6");
initSlideshow("mySlides7");

// Ensure render() is properly called only once
render(); 
console.log("Controls enabled?", controls.enabled);

// Add event listeners for modals
const projectDetailModals = document.querySelectorAll('.modal.project-detail');

projectDetailModals.forEach(modal => {
  modal.addEventListener('show', () => {
    blurBackground.style.display = 'block';
  });

  modal.addEventListener('hide', () => {
    // Only hide blurBackground if no other modals are open
    const anyModalOpen = [...projectModals, ...projectDetailModals].some(m => m.style.display === 'block');
    if (!anyModalOpen) {
      blurBackground.style.display = 'none';
    }
  });
});

// Debugging for blurBackgroundDetail
projectDetailModals.forEach(modal => {
  modal.addEventListener('show', () => {
    console.log('Detail modal shown:', modal);
    blurBackgroundDetail.style.display = 'block';
    console.log('blurBackgroundDetail set to block');
  });

  modal.addEventListener('hide', () => {
    console.log('Detail modal hidden:', modal);
    blurBackgroundDetail.style.display = 'none';
    console.log('blurBackgroundDetail set to none');
  });
});

// Declare kirjat as an empty array to store kirja objects
let kirjat = [];

//// Add a typewriter effect to the text inside the loading-screen-button
//const loadingButton = document.querySelector(".loading-screen-button");
//const loadingText = "Loading...";
//let charIndex = 0;
//
//// Clear the button text initially
//loadingButton.textContent = "";
//
//// Function to animate typing
//function typeWriterEffect() {
//  if (charIndex < loadingText.length) {
//    loadingButton.textContent += loadingText[charIndex];
//    charIndex++;
//    setTimeout(typeWriterEffect, 30); // Adjust typing speed (100ms per character)
//  }
//}
//
//// Start the typewriter animation
//typeWriterEffect();