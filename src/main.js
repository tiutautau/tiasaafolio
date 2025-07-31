import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';

const canvas = document.querySelector("#experience-canvas");
const sizes ={
    width: window.innerWidth,
    height: window.innerHeight
};

const modals = {
    projects: document.querySelector(".modal.projects"),
    showreel: document.querySelector(".modal.showreel"),
    about: document.querySelector(".modal.about"),
};

document.querySelectorAll(".modal-exit-button").forEach(button=>{
    button.addEventListener("click", (e)=>{
        const modal = e.target.closest(".modal");
        hideModal(modal);
    });
});

const showModal = (modal) => {
    modal.style.display = "block"

    gsap.set(modal, { opacity: 0});

    gsap.to(modal, {
        opacity: 1,
        duration: 0.5,
    });
};

const hideModal = (modal) => {
    gsap.to(modal, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            modal.style.display = "none";
        },
    });
};

const xAxisFans = []

const raycasterObjects = [];
let currentIntersects = [];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Loaders
const textureLoader = new THREE.TextureLoader();

// Model Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( "/draco/" );

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
	.setPath( 'textures/skybox/' )
	.load( [
				'px.webp',
				'nx.webp',
				'py.webp',
				'ny.webp',
				'pz.webp',
				'nz.webp'
			] );

const textureMap = {
    Eka: {
        day:"textures/room/TextureOne.webp"
    },
    Toka: {
        day:"textures/room/TextureTwo.webp"
    },
    Kolmas: {
        day:"textures/room/TextureThree.webp"
    },
    Neljas: {
        day:"textures/room/TextureSetFour.webp"
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

const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    opacity: 1,
    metalness: 0,
    roughness: 0,
    ior: 1.5,
    thickness: 0.01,
    specularIntensity: 1,
    envMap : environmentMap,
    envMapIntensity: 1,
    depthWrite: false,
});

const videoElement = document.createElement("video");
videoElement.src = "/textures/video/Kavelija_animaatio.mp4";
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play()

const videoTexture = new THREE.VideoTexture(videoElement)
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.flipY = true;

window.addEventListener("mousemove", (e)=>{
    pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
})

window.addEventListener("click", (e) => {
    if (currentIntersects.length > 0) {
        const object = currentIntersects[0].object;

        if (object.name.includes("Projects")) {
            showModal(modals.projects)
        }else if (object.name.includes("Showreel")) {
            showModal(modals.showreel)
        }else if (object.name.includes("Aboutme")) {
            showModal(modals.about)
        }
    }
})

loader.load("/models/Portfolio_Room_V2.glb", (glb) => {
    glb.scene.traverse((child) => {
        if (child.isMesh) {
            // Turvavarmistus, että geometria on olemassa
            const hasUVs = child.geometry?.attributes?.uv !== undefined;

            if (!hasUVs) {
                console.warn(`⚠ Mesh '${child.name}' is missing UVs.`);
            }

            if (child.name.includes("Raycaster")) {
                raycasterObjects. push(child);
            }

            if (child.name.includes("Glass")) {
                child.material = glassMaterial;

            } else if (child.name.includes("Screen")) {
                // Käytetään videoTextureä vain jos UV:t löytyvät
                if (hasUVs) {
                    child.material = new THREE.MeshBasicMaterial({
                        map: videoTexture,
                    });
                } else {
                    console.warn(`Mesh '${child.name}' has no UVs, skipping videoTexture`);
                    child.material = new THREE.MeshBasicMaterial({ color: 0x000000 }); // musta näyttö ilman UV:tä
                }

            } else {
                // Etsitään sopiva tekstuuri nimen perusteella
                const key = Object.keys(textureMap).find(k => child.name.includes(k));

                if (key && hasUVs) {
                    child.material = new THREE.MeshBasicMaterial({
                        map: LoadedTextures.day[key],
                    });

                    if (child.name.includes("tuuletin")) {
                        if(child.name.includes("tuuletin_1") || child.name.includes("tuuletin_2") || child.name.includes("tuuletin_3")){
                            xAxisFans.push(child);
                        }
                    }

                    if (child.material.map) {
                        child.material.map.minFilter = THREE.LinearFilter;
                    }
                } else {
                    console.warn(`No matching texture or missing UVs for mesh: ${child.name}`);
                    child.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
                }
            }
        }
    });

    scene.add(glb.scene);
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    35,
    sizes.width / sizes.height,
    0.1,
    1000 
);

camera.position.set(
    18.308497815998255,
    8.340313483552896,
    16.733946926439422
);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(
    -0.04451427016691359,
    1.992258015338971,
    -0.2691980867402935
);

// Event Listeners
window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    //Update Camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    //Update Renderer
    renderer.setSize( sizes.width, sizes.height );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const render = () => {
    controls.update();

    //Animate Fans
xAxisFans.forEach(fan => {
        fan.rotation.x -= 0.01;
    });

  //  console.log(camera.position);
  //  console.log("000000000");
  //  console.log(controls.target);

// Raycaster
  raycaster.setFromCamera( pointer, camera );

// calculate objects intersecting the picking ray
currentIntersects = raycaster.intersectObjects(raycasterObjects);

for ( let i = 0; i < currentIntersects.length; i ++ ) {
}

    if(currentIntersects.length>0){
        const currentIntersectObject = currentIntersects[0].object

        if(currentIntersectObject.name.includes("Pointer")){
            document.body.style.cursor = "pointer"
        }else{
        document.body.style.cursor = "default"
        }
    }else{
        document.body.style.cursor = "default"
    }

    

renderer.render( scene, camera );

window.requestAnimationFrame(render);
};

render();