import "./style.css";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { GetHexagonOsmData } from "./GetOsmData";
import gsap from "gsap";
var seedrandom = require('seedrandom');
import Stats from "stats.js";
import {
  InitExtrudedBuildingsAndWater
} from "./ExtrudedBuildingAndWater.js";
import { RealSizeHexagon } from "./RealSizeHexagon";
import { BoxGeometry, Color, DoubleSide, Vector3 } from "three";
import { SelectiveGlow } from "./js/SelectiveGlow";
import { initPins } from "./initPins";
import { GetAllPins } from "./initPins";
import { AnimPins } from "./initPins";
import { GetBuildingToLookAtCamera, initNeolandBuilding, GetCylBuilding } from "./NeolandBuilding.js";
import { GetBuildingDescriptionArray } from "./NeolandBuilding.js";
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { Water } from "three/examples/jsm/objects/Water";

const axios = require("axios")

// var stats = new Stats();
// stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild(stats.dom);

const h3 = require("h3-js");
const testID = h3.geoToH3(44.84578303805389, -0.5741971679036908, 8)
const oullins = h3.geoToH3(45.711926, 4.80066, 8)
const oullinsCentre = h3.geoToH3(45.714163, 4.806996, 8)
const testParis = h3.geoToH3(48.855883, 2.298859, 8)
// console.log(oullinsCentre)

// const land_ID = oullinsCentre

const params = {
  exposure: 0.1,
  bloomStrength: 1.5,
  bloomThreshold: 0,
  bloomRadius: 0.6
};

/**
 * Base
 */

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Cubemap loader
 */
const cubeTextureLoader = new THREE.CubeTextureLoader();


// /**
//  * Environment map
//  */
const environmentMap = cubeTextureLoader.load([
  "./cubemap/crepuscul/px.jpg",
  "./cubemap/crepuscul/nx.jpg",
  "./cubemap/crepuscul/py.jpg",
  "./cubemap/crepuscul/ny.jpg",
  "./cubemap/crepuscul/pz.jpg",
  "./cubemap/crepuscul/nz.jpg",
]);

// scene.background = null;

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  50,
  sizes.width / sizes.height,
  0.1,
  1400
);
camera.position.x = 0;
camera.position.y = 10;
camera.position.z = 20;
// camera.near = 0.1
// camera.far = 1


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setClearColor(0x000000, 0);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.needsUpdate = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.compile(scene, camera)

/**
 * Post processing
 */

let sg = new SelectiveGlow(scene, camera, renderer);
sg.bloomPass1.strength = 1.5
sg.bloomPass1.radius = 0
sg.bloom1.antialias = true

sg.final.antialias = true

const smaaPass = new SMAAPass()
sg.final.addPass(smaaPass)

// Init Light
let desiredLight0 = 1.5
let desiredLight1 = 2
let desiredLight2 = 0.5

let light0 = new THREE.AmbientLight(0xffffff, desiredLight0);
scene.add(light0);

let light2 = new THREE.AmbientLight(0x0000ff, desiredLight2);
scene.add(light2);

let light1 = new THREE.DirectionalLight(0xffffff, desiredLight1);
light1.castShadow = true
light1.position.set(10, 10, 0);
light1.shadow.mapSize.width = 512
light1.shadow.mapSize.height = 512
light1.shadow.normalBias = 0.05
scene.add(light1);

document.body.appendChild(renderer.domElement);

let AllBboxOfExtrudedBuildings

// Debug
// const gui = new dat.GUI();
const gui = null;

// const Bloom = gui.addFolder('Bloom')
// const Lights = gui.addFolder('Lights')


// Bloom.add(params, 'bloomStrength', 0.0, 3.0).onChange(function (value) {

//   sg.bloomPass1.strength = Number(value);

// });

// Bloom.add(params, 'bloomRadius', 0.0, 1.0).step(0.01).onChange(function (value) {

//   sg.bloomPass1.radius = Number(value);

// });



// Lights.add(light0, 'intensity', 0, 4).name('AmbientLight').onChange(function (value) {

//   light0.intensity = value

// });

// Lights.add(light2, 'intensity', 0, 4).name('Blue AmbientLight').onChange(function (value) {

//   light2.intensity = value

// });


// Lights.add(light1, 'intensity', 0, 4).name('Directional light').onChange(function (value) {

//   light1.intensity = value

// });

let bloomedHexagon
let nonBloomedHexagon

// let allPins
let buildings

let publicFaction



async function fetchLandData(url) {
  const response = await fetch(url)
  const temp = await response.json();
  return temp;
}

await initScene();

async function initScene() {

  const queryString = window.location.search;
  let land_ID
  if (queryString.length < 1) {
    console.error('Bad Land ID, default is called')
    land_ID = '881f9020bbfffff'
  }
  else {
    land_ID = queryString.substring(1)
  }

  const baseUrl =
    "https://api.neoland.io/api/";

  const endpoint = "/osm-hexagon-data?h3_id=" + land_ID;

  const checkLandId = h3.h3IsValid(land_ID)

  if (!checkLandId) {
    console.error('Invalid Land ID')
    return
  }

  let datas = null;

  let response = await fetchLandData(baseUrl + endpoint)
  if (response.message) {
    console.log("Creating Neoland...")
    setTimeout(() => {
      return initScene()
    }, 10000)
  } else {
    datas = JSON.parse(response.data)

    var myrng = new seedrandom(datas.land_ID);
    publicFaction = datas.faction

    AllBboxOfExtrudedBuildings = InitExtrudedBuildingsAndWater(
      scene,
      datas.land_id,
      myrng,
      gui,
      datas.geo_data
    )

    let land_neon_color

    switch (datas.faction) {
      case 'Terra':
        land_neon_color = new Color(0xea519a)
        break;

      case 'Luna':
        land_neon_color = new Color(0xea519a)
        break;

      case 'Mars':
        land_neon_color = new Color(0xea519a)
        break;

      case 'Venus':
        land_neon_color = new Color(0x6fdee0)
        break;

      case 'Mercurius':
        land_neon_color = new Color(0x6fdee0)
        break;

      case 'Sol':
        land_neon_color = new Color(0x6fdee0)
        break;

      default:
        break;
    }

    bloomedHexagon = new RealSizeHexagon(datas.land_id, 'bloomedObj', scene, new Vector3(1.005, 1.005, 0.4), land_neon_color, new THREE.Vector3(0, 0.25, 0), 0.5)
    nonBloomedHexagon = new RealSizeHexagon(datas.land_id, 'no', scene, new Vector3(1, 1, 1), new THREE.Color(0xdcceb6), new THREE.Vector3(0, 0, 0), 0)
    scene.add(bloomedHexagon, nonBloomedHexagon)

  }


  // // Pins building type
  // const response = await axios.post("https://buildings.neopolis.app/v1/getBuildings", {
  //   cell_ids: [land_ID]
  // })

  // buildings = response.data.success

  // let LAND_ID = land_ID

}

const controls = new MapControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxDistance = 25;

controls.target.set(0, 0, 0)

controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY
}

controls.touches = {
	ONE: THREE.TOUCH.ROTATE,
	TWO: THREE.TOUCH.DOLLY_ROTATE
}

controls.update();

/**
 * Text Loader
 */
const fontLoader = new FontLoader();

fontLoader.load("/fonts/helvetiker_regular.typeface.json");

/**
 * Animate
 */
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

const clock = new THREE.Clock();


// async function ShowBuilding(event) {
//   event.preventDefault();

//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);

//   var intersects = raycaster.intersectObjects(scene.children, true);

//   GetAllPins().then((allPins) => {
//     let building_uuid
//     if (intersects.length > 0) {
//       if (intersects[0].object.geometry instanceof BoxGeometry) {
//         for (let i = 0; i < allPins.length; i++) {
//           if (intersects[0].object.uuid == allPins[i].cone.uuid) {
//             building_uuid = allPins[i].building_id;
//             for (let j = 0; j < buildings.length; j++) {
//               if (building_uuid == buildings[j].id) {
//                 initNeolandBuilding(scene, buildings[j], intersects[0].object, camera, true, gui)
//                 GetBuildingToLookAtCamera(camera)
//                 break
//               }
//             }
//             break
//           }
//         }
//       }
//     }
//   })

//   if (intersects != null && intersects[0] != null && intersects[0].object.geometry != null && intersects[0].object.geometry.name == 'cone') {
//     if (camera.position.z > intersects[0].object.position.z) {
//       gsap.to(camera.position, {
//         x: intersects[0].object.position.x,
//         y: intersects[0].object.position.y + 0.65,
//         z: intersects[0].object.position.z + 0.24,
//         duration: 2,
//         ease: "power3.inOut",
//         onUpdate: function () {
//           controls.target.set(
//             intersects[0].object.position.x, intersects[0].object.position.y + 0.5, intersects[0].object.position.z
//           );
//           controls.update()
//           GetBuildingToLookAtCamera(new THREE.Vector3(camera.position.x, intersects[0].object.position.y + 0.5, camera.position.z))
//           // TESTUI(new THREE.Vector3(intersects[0].object.position.x, intersects[0].object.position.y + 0.5, intersects[0].object.position.z))

//         }
//       })
//     }
//     if (camera.position.z < intersects[0].object.position.z) {
//       gsap.to(camera.position, {
//         x: intersects[0].object.position.x,
//         y: intersects[0].object.position.y + 0.65,
//         z: intersects[0].object.position.z - 0.24,
//         duration: 2,
//         ease: "power3.inOut",
//         onUpdate: function () {
//           controls.target.set(
//             intersects[0].object.position.x, intersects[0].object.position.y + 0.5, intersects[0].object.position.z
//           );
//           controls.update()
//           GetBuildingToLookAtCamera(new THREE.Vector3(camera.position.x, intersects[0].object.position.y + 0.5, camera.position.z))
//           // TESTUI(new THREE.Vector3(intersects[0].object.position.x, intersects[0].object.position.y + 0.5, intersects[0].object.position.z))
//         }
//       })
//     }
//   }
// }

// function TESTUI(pos) {
//   // console.log('ui')
//   const container = new ThreeMeshUI.Block({
//     width: 0.5,
//     height: 0.5,
//     padding: 0.2,
//     fontFamily: 'three-mesh-ui/examples/assets/Roboto-msdf.json',
//     fontTexture: 'three-mesh-ui/examples/assets/Roboto-msdf.png'
//   });

//   //

//   const text = new ThreeMeshUI.Text({
//     content: "Some text to be displayed"
//   });

//   container.add(text);

//   container.position.set(pos.x, pos.y, pos.z)

//   // scene is a THREE.Scene (see three.js)
//   scene.add(container);
//   //  console.log('container', container)

//   // This is typically done in the render loop :
//   ThreeMeshUI.update();
// }

window.addEventListener('resize', onWindowResize);

function onWindowResize() {

  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  sg.bloom1.setSize(sizes.width, sizes.height);
  sg.bloom2.setSize(sizes.width, sizes.height);
  sg.final.setSize(sizes.width, sizes.height);


  tick();
};

// window.addEventListener('click', await ShowBuilding)

const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const materials = {};

async function darkenNonBloomed(obj, pass = false) {

  if (obj.isMesh && obj.name.length > 1 || obj instanceof Water) {
    obj.material.roughness = 1
    obj.material.emissiveIntensity = 0
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
  if (pass) {
    if (obj.material) {
      obj.material.roughness = 1
      obj.material.emissiveIntensity = 0
      materials[obj.uuid] = obj.material;
      obj.material = darkMaterial;
    }
  }

}

async function restoreMaterial(obj) {

  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }

}


const tick = () => {
  // stats.begin();

  const time = clock.getElapsedTime();

  // Update controls
  controls.update(clock.getDelta());

  if (camera.position.y < 0.1) camera.position.y = 0.1;

  // renderer.render()

  light0 = new THREE.AmbientLight(0x000000, desiredLight0);

  light1 = new THREE.DirectionalLight(0x000000, desiredLight1);
  light1.shadow.camera.top = 3
  light1.shadow.camera.right = 6
  light1.shadow.camera.left = - 6
  light1.shadow.camera.bottom = - 3
  light1.shadow.camera.far = 10
  light1.shadow.mapSize.set(512, 512)
  
  // let descriptionModel = GetBuildingDescriptionArray()
  // if (descriptionModel) {
    //   darkenNonBloomed(descriptionModel, true)
    // }
    // if (descriptionModel) {
    //   restoreMaterial(descriptionModel)
    // }

  // let cyl = GetCylBuilding()
  // if (cyl) {
  //   darkenNonBloomed(cyl, true)
  // }
  // if (cyl) {
  //   restoreMaterial(cyl)
  // }

  scene.traverse((child) => {
    darkenNonBloomed(child)
  })
  if (nonBloomedHexagon)
    nonBloomedHexagon.traverse((child) => {
      darkenNonBloomed(child, true)
    })

  scene.background = new THREE.Color(0x000000)

  sg.bloom1.render(clock.getDelta());

  scene.traverse((child) => {
    restoreMaterial(child)
  })

  if (nonBloomedHexagon)
    restoreMaterial(nonBloomedHexagon)


  scene.background = environmentMap;

  light0 = new THREE.AmbientLight(0xffffff, desiredLight0);

  light1 = new THREE.DirectionalLight(0xffffff, desiredLight1);

  sg.final.render(clock.getDelta());



  // AnimPins()

  window.requestAnimationFrame(tick);
  // stats.end();
};

tick();
