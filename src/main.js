import gsap from 'gsap';
import { Howl } from "howler";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

//-----------------Audio setup--------------------
let isMusicFaded = false;
const MUSIC_FADE_TIME = 500;
const BACKGROUND_MUSIC_VOLUME = 1;
const FADED_VOLUME = 0;

const backgroundMusic = new Howl({
  src: ["/audio/music/lobbymusic.mp3"],
  loop: true,
  volume: 0.5,
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
    volume: 0.5,
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
//scene.background = new THREE.Color(0xebae34);

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
  isModalOpen = false;
  //controls.enabled = true; // Re-enable controls when the modal is closed
  controls.update(); // Ensure controls are updated

  gsap.to(modal, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    onComplete: () => {
      modal.style.display = "none";
      blurBackground.style.display = "none"; // Ensure blur background is hidden
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

manager.onLoad = function () {
  //loadingScreenButton.style.border = "5px solid #0f8f49ff";
  loadingScreenButton.style.background = "#71c283ff";
  loadingScreenButton.style.color = "#e6dede";
  loadingScreenButton.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
  loadingScreenButton.textContent = "ENTER";
  loadingScreenButton.style.cursor = "pointer";
  loadingScreenButton.style.transition =
    "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
  let isDisabled = false;

  noSoundButton.textContent = "Enter without Sound";

  function handleEnter(withSound = true) {
    if (isDisabled) return;

    noSoundButton.textContent = "";
    loadingScreenButton.style.cursor = "default";
    //loadingScreenButton.style.border = "5px solid #ffeac3ff";
    loadingScreenButton.style.background = "#000000ff";
    loadingScreenButton.style.color = "#ffd27dff";
    loadingScreenButton.style.boxShadow = "none";
    loadingScreenButton.textContent = "WELCOME";
    loadingScreen.style.background = "#000000ff";
    isDisabled = true;

    if (!withSound) {
      isMuted = true;
      updateMuteState(true);
      soundOnSvg.classList.remove("active");
      soundOffSvg.classList.add("active");
    } else {
      backgroundMusic.play();
      soundOffSvg.classList.remove("active");
      soundOnSvg.classList.add("active");
    }

    playReveal();
  }

  loadingScreenButton.addEventListener("mouseenter", () => {
    loadingScreenButton.style.transform = "scale(1.3)";
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
  const t1 = gsap.timeline({
    onComplete: () => {
      console.log("Loading screen and camera arc animations complete.");
      startSecondaryAnimations(); // Start t2 animations after t1 completes
    },
  });

  // Loading screen removal
  t1.to(loadingScreen, {
    scale: 0.5,
    duration: 1.2,
    delay: 0.25,
    ease: "back.in(1.8)",
  }).to(
    loadingScreen,
    {
      y: "200vh",
      transform: "perspective(1000px) rotateX(45deg) rotateY(-35deg)",
      duration: 1.2,
      ease: "back.in(1.8)",
      onComplete: () => {
        loadingScreen.remove(); // Remove the loading screen
        isModalOpen = false;
      },
    },
    "-=0.8" // Overlap with the camera arc animation
  );

  // Camera arc animation (overlaps with the above)
  animateCameraArc(t1, "-=0.8"); // pass relative position
}

function animateCameraArc(t1, overlap = 0) {
  const target = new THREE.Vector3(0, 3, 0);

  // Start above
  camera.position.set(1, 40, 1);
  controls.target.copy(target);
  controls.update();

  const spherical = new THREE.Spherical();
  spherical.setFromVector3(camera.position.clone().sub(target));

  t1.to(spherical, {
    duration: 3,
    phi: Math.PI / 2.5, // from top → angled
    ease: "power1.Out",
    onUpdate: () => {
      camera.position.copy(
        new THREE.Vector3().setFromSpherical(spherical).add(target)
      );
      controls.target.copy(target);
      controls.update();
      },
    },
    overlap // <-- controls when it starts relative to the previous animation
  );
}

function startSecondaryAnimations() {
  const t2 = gsap.timeline({
    onComplete: () => {
      console.log("Secondary animations complete. Enabling controls.");
      controls.enabled = true; // Enable controls after all animations
      controls.update(); // Ensure controls are updated
      document.querySelector("#experience-canvas").style.pointerEvents = "auto"; // Re-enable canvas interactions
      console.log("Controls updated and canvas pointer events re-enabled.");
    },
  });

  // Kirja animations
  if (kirja1) {
    t2.to(kirja1.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.8,
      ease: "back.out(1.8)",
    });
  }
  if (kirja2) {
    t2.to(
      kirja2.scale,
      { x: 1, y: 1, z: 1, duration: 0.8, ease: "back.out(1.8)" },
      "-=0.5"
    );
  }
  if (kirja3) {
    t2.to(
      kirja3.scale,
      { x: 1, y: 1, z: 1, duration: 0.8, ease: "back.out(1.8)" },
      "-=0.5"
    );
  }
  if (kirja4) {
    t2.to(
      kirja4.scale,
      { x: 1, y: 1, z: 1, duration: 0.8, ease: "back.out(1.8)" },
      "-=0.5"
    );
  }

  // Add more animations to t2 here as needed
}

// Ensure controls are enabled after the intro animation
function playIntroAnimation() {
  const t2 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)"
    }
  });

  

  // Ensure objects are defined before animating
  if (kirja1) {
    t2.to(kirja1.scale, { x: 1, y: 1, z: 1 });
  }
  if (kirja2) {
    t2.to(kirja2.scale, { x: 1, y: 1, z: 1 }, "-=0.5");
  }
  if (kirja3) {
    t2.to(kirja3.scale, { x: 1, y: 1, z: 1 }, "-=0.5");
  }
  if (kirja4) {
    t2.to(kirja4.scale, { x: 1, y: 1, z: 1 }, "-=0.5");
  }

  

  // Enable controls after the intro animation
  t2.call(() => {
    console.log("Enabling controls after intro animation");
    controls.update(); // Ensure controls are updated
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
    } else if (object.name.includes("Aboutme")) {
      showModal(modals.about)
    }
  }
}

//function handleRaycasterInteraction() {
//  if (currentIntersects.length > 0) {
//    const object = currentIntersects[0].object;
//
//    if (object.name.includes("Projects")) {
//      showModal(modals.projects)
//    } else if (object.name.includes("Showreel")) {
//      showModal(modals.showreel)
//    } else if (object.name.includes("Aboutme")) {
//      showModal(modals.about)
//    }
//  }
//}

// Other Event Listeners
const muteToggleButton = document.querySelector(".mute-toggle-button");
const soundOffSvg = document.querySelector(".sound-off-svg");
const soundOnSvg = document.querySelector(".sound-on-svg");

// Set initial icon state: sound ON by default
soundOnSvg.classList.add("active");
soundOffSvg.classList.remove("active");

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
    rotate: -45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (!isMuted) {
        soundOffSvg.classList.remove("active");
        soundOnSvg.classList.add("active");
      } else {
        soundOnSvg.classList.remove("active");
        soundOffSvg.classList.add("active");
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

let tuoli;
let kirja1,
  kirja2,
  kirja3,
  kirja4;

// Array to hold video textures for updating
const videoTextures = [];

const objectsWithIntroAnimations = [
  "kirja_1",
  "kirja_2",
  "kirja_3",
  "kirja_4",
  "tuoli",
];

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
videoTexture.repeat.x = -1; // Flip the texture horizontally

loader.load("/models/PortfolioRoomCozy_V2.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      console.log(child.name, child.material.name, child.material.transparent, child.material.opacity, child.material.depthWrite);
      Object.keys(textureMap).forEach((key) => {
      if (child.name.includes(key)) {
        const material = new THREE.MeshStandardMaterial({
          map: LoadedTextures.day[key],
        });
        child.material.transparent = false;
        child.material.opacity = 1;
        child.material.depthWrite = true;
        child.material = material;
      }

    if (child.name.includes("Projects") || child.name.includes("Showreel") || child.name.includes("Aboutme")) {
      //child.material = projectsMaterial;
      raycasterObjects.push(child);
      child.userData.initialScale = child.scale.clone();
      child.userData.initialPosition = child.position.clone();
      child.userData.initialRotation = child.rotation.clone();
      child.userData.isAnimating = false;
      // create an invisible hover target box only if you want it
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

    // --- Generic handling for fans, glass, kirja_* and tuoli ---
    else if (child.name.includes("Glass")) {
        child.material = glassMaterial;

    } else if (child.name.includes("Screen")) {
      child.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
          transparent: true,
          opacity: 0.9,
      });

    if (child.name.includes("tuuletin_1")) {
      if (
        child.name.includes("tuuletin_2") ||
        child.name.includes("tuuletin_3")
      ) {
        xAxisFans.push(child);
        }
      }

      if (child.material.map) {
        child.material.map.minFilter = THREE.LinearFilter;
        }
      }
    });

    if (child.name.includes("kirja_1")) {
      kirja1 = child;
      child.scale.set(0, 0, 0);
    } else if (child.name.includes("kirja_2")) {
      kirja2 = child;
      child.scale.set(0, 0, 0);
    } else if (child.name.includes("kirja_3")) {
      kirja3 = child;
      child.scale.set(0, 0, 0);
    } else if (child.name.includes("kirja_4")) {
      kirja4 = child;
      child.scale.set(0, 0, 0);
    }

    if (child.name.includes("tuoli")) {
      tuoli = child;
      child.userData.initialRotation = child.rotation.clone();
    }

    // If the mesh acts as a raycaster-only object:
    if (child.name.includes("Raycaster")) {
      raycasterObjects.push(child);
    }

    if (child.name.includes("Hover")) {
      child.userData.initialScale = child.scale.clone();
      child.userData.initialPosition = child.position.clone();
      child.userData.initialRotation = child.rotation.clone();
      child.userData.isAnimating = false;
    }
  }
});

  scene.add(glb.scene);

  // Call playIntroAnimation only after models are loaded
  playIntroAnimation();
});

// Create a plane with a 16:9 aspect ratio for the video texture
//const videoPlaneGeometry = new THREE.PlaneGeometry(16, 9);

// Adjust the UV mapping to flip the texture horizontally
//const uvAttribute = videoPlaneGeometry.attributes.uv;
//for (let i = 0; i < uvAttribute.count; i++) {
//  const u = uvAttribute.getX(i);
//  uvAttribute.setX(i, 1 - u); // Flip the U coordinate
//}
//uvAttribute.needsUpdate = true;
//
//const videoPlaneMaterial = new THREE.MeshBasicMaterial({
//  map: videoTexture,
//  transparent: true,
//  opacity: 0.9,
//});
//const videoPlane = new THREE.Mesh(videoPlaneGeometry, videoPlaneMaterial);
//
//// Scale the plane to fit your scene as needed
//videoPlane.scale.set(1, 1, 1); // Adjust scale if necessary
//scene.add(videoPlane);
//
//// Position the plane in the scene
//videoPlane.position.set(5, 10, -10); // Adjust position as needed

// TEXT HOVER ANIMATION

function playHoverAnimation(object, isHovering) {
  if (!object.userData.initialScale || !object.userData.initialRotation) return; // Prevent errors

  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (isHovering) {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * 1.2,
      y: object.userData.initialScale.y * 1.2,
      z: object.userData.initialScale.z * 1.2,
      duration: 0.5,
      ease: "bounce.out(1.8)",
    });
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x + Math.PI / 8,
      duration: 0.5,
      ease: "bounce.out(1.8)",
      onComplete: () => {
        object.userData.isAnimating = false;
      },
    });
  } else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "bounce.out(1.8)",
    });
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x,
      duration: 0.3,
      ease: "bounce.out(1.8)",
      onComplete: () => {
        object.userData.isAnimating = false;
      },
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

// --- Project detail modal logic (moved up here) ---
const projectDetailModal = modals.projectDetail;
const projectDetailImage = projectDetailModal.querySelector('.project-detail-image');
const projectDetailDescription = projectDetailModal.querySelector('.project-detail-description');
const projectDetailExit = projectDetailModal.querySelector('.project-detail-exit');
const blurBackground = document.querySelector(".blurBackground");

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => {
    // Get image and title/description from the card
    
    const img = card.querySelector('img');
    const title = card.querySelector('h3') ? card.querySelector('h3').textContent : '';
    // Set content in detail modal
    projectDetailImage.src = img.src;
    projectDetailImage.alt = img.alt;
    projectDetailDescription.textContent = title;
    // Show the detail modal
    showModal(projectDetailModal);
    blurBackground.style.display = "block";
  });
});

// Close detail modal
projectDetailExit.addEventListener('click', (e) => {
  e.preventDefault();
  hideModal(projectDetailModal);
  blurBackground.style.display = "none"; // Ensure blur background is hidden
});

projectDetailExit.addEventListener('touchend', (e) => {
  e.preventDefault();
  hideModal(projectDetailModal);
  blurBackground.style.display = "none"; // Ensure blur background is hidden
});

// Ensure render() is properly called only once
render(); 
console.log("Controls enabled?", controls.enabled);