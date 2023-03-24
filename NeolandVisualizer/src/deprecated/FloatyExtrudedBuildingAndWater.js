import * as geolib from "geolib";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import * as dat from "lil-gui";

var MAT_BUILDING,
  MAT_ROAD,
  MAT_WATER,
  MAT_WATER_NORMAL = null;
let center = [4.80602, 45.71375]; // Oullins
const center2 = [-3.188822, 55.943686];
var iR;
var iR_Road;
var iR_Line;
var iR_Water;

const FLAG_ROAD_ANI = true;
var Animated_Line_Speed = 0.004;
var Animated_Line_Distances = [];
var geos_building = [];
var collider_building = [];
var raycaster = null;

const api = "./models/geojson/result.geojson";

export async function AwakeFloaty(scene, center = [4.80066, 45.711926], gui) {
  // Init group
  iR = new THREE.Group();
  iR.name = "Interactive Root";
  iR_Road = new THREE.Group();
  iR_Road.name = "Roads";
  iR_Line = new THREE.Group();
  iR_Line.name = "Animated Line on Roads";
  iR_Water = new THREE.Group();
  iR_Water.name = "Any water mark";
  scene.add(iR);
  scene.add(iR_Road);
  scene.add(iR_Line);
  scene.add(iR_Water);

  // Init Raycaster
  raycaster = new THREE.Raycaster();

  // Init Light
  let light0 = new THREE.AmbientLight(0xffffff, 0.5);

  let light1 = new THREE.PointLight(0xffffff, 50);
  light1.position.set(100, 90, 40);

  let light2 = new THREE.PointLight(0xffffff, 50);
  light2.position.set(100, 90, -40);

  scene.add(light0);
  scene.add(light1);
  scene.add(light2);

  let gridHelper = new THREE.GridHelper(
    60,
    160,
    new THREE.Color(0x555555),
    new THREE.Color(0x333333)
  );
  gridHelper.alpha = 1;
  scene.add(gridHelper);

  // Update();

  GetGeoJson();

  let colorBuildings = {
    col: [255, 255, 255],
  };

  let RGB_folder = gui.addFolder("RGB_Buildings");

  RGB_folder.addColor(colorBuildings, "col").onChange((colr) => {
    ChangeBuildingsColor(colr);
  });
}

function ChangeBuildingsColorFloaty(newColor) {
  iR.children[0].material.color.r = newColor[0];
  iR.children[0].material.color.g = newColor[1];
  iR.children[0].material.color.b = newColor[2];
}

// function Update() {
//   if (FLAG_ROAD_ANI) {
//     AnimRoad();
//   }
// }

function GetGeoJson(scene) {
  fetch(api).then((res) => {
    res.json().then((data) => {
      LoadWaters(data, scene);

      LoadBuildings(data, scene);
    });
  });
}



function LoadBuildings(data, scene) {
  let features = data.features;

  MAT_BUILDING = new THREE.MeshPhongMaterial({ color: 0xffffff });
  MAT_ROAD = new THREE.LineBasicMaterial({ color: 0x1b4686 });

  for (let i = 0; i < features.length; i++) {
    let fel = features[i];
    if (!fel["properties"]) return;

    let info = fel.properties;

    /**
     * Create 3d buildings, with good height
     */
    if (info.tags["building"]) {
      addBuilding(
        fel.geometry.coordinates,
        info,
        info.tags["building:levels"],
        scene
      );
    } else if (info["highway"] || info.tags["highway"]) {

    /**
     * Create 3d highways with lines
     */
      if (
        fel.geometry.type == "LineString" &&
        info["highway"] != "pedestrian" &&
        info["highway"] != "footway" &&
        info["highway"] != "path"
      ) {
        addRoad(fel.geometry.coordinates, info, scene);
      }
    } else if (

    /**
     * Create 3d water
     */
      info["natural"] == "water" ||
      (info.tags["natural"] == "water" && fel.geometry.type == "Polygon")
    ) {
      addWater(fel.geometry.coordinates, info);
    }
  }

  let mergeGeometry = BufferGeometryUtils.mergeBufferGeometries(geos_building);
  let mesh = new THREE.Mesh(mergeGeometry, MAT_BUILDING);
  mesh.scale.set(2,2,2)
  iR.add(mesh);
}

/**
 * initialise material for water
 */
function LoadWaters() {
  MAT_WATER_NORMAL = new THREE.TextureLoader().load(
    "./textures/waternormals.jpg",
    (texture) => {
      texture.wrapS = texture.wrapS = THREE.RepeatWrapping;
    }
  );

  MAT_WATER = {
    textureWidth: 512,
    textureHeight: 512,
    alpha: 1.0,
    waterNormals: MAT_WATER_NORMAL,
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0xa6c8fa,
    distortionScale: 3.7,
    fog: false,
  };
}

/**
 * Add water to the scene
 */
function addWater(data, info) {
  let shape, geometry;
  let holes = [];

  for (let i = 0; i < data.length; i++) {
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, center);
    } else {
      holes.push(genShape(el, center));
    }
  }

  for (let i = 0; i < holes.length; i++) {
    shape.holes.push(holes[i]);
  }

  geometry = genGeometry(shape, {
    curveSegments: 2,
    steps: 1,
    depth: 0.1,
    bevelEnabled: false,
  });

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);

  let water = new Water(geometry, MAT_WATER);
  water.scale.set(2,2,2)

  iR_Water.add(water);
}

/**
 * Add building to the scene
 */
function addBuilding(data, info, height = 1, scene) {
  height = height ? height : 1;

  let shape, geometry;
  let holes = [];

  for (let i = 0; i < data.length; i++) {
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, center);
    } else {
      holes.push(genShape(el, center));
    }
  }

  for (let i = 0; i < holes.length; i++) {
    shape.holes.push(holes[i]);
  }

  geometry = genGeometry(shape, {
    curveSegments: 1,
    depth: 0.05 * height,
    bevelEnabled: false,
  });

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);

  geos_building.push(geometry);

  // let helper = genHelper(geometry)
  // if (helper) {
  //   helper.name = info["name"] ? info["name"] : "Building"
  //   helper.info = info
  //   //iR.add(helper)
  //   collider_building.push(helper)
  // }
}

/**
 * Add road to the scene
 */
function addRoad(d, info) {
  // Init points array
  let points = [];

  // Loop for all nodes
  for (let i = 0; i < d.length; i++) {
    if (!d[0][1]) return;

    let el = d[i];

    //Just in case
    if (!el[0] || !el[1]) return;

    let elp = [el[0], el[1]];

    //convert position from the center position
    elp = GPSRelativePosition([elp[0], elp[1]], center);

    // Draw Line
    points.push(new THREE.Vector3(elp[0], 0.5, elp[1]));
  }

  let geometry = new THREE.BufferGeometry().setFromPoints(points);

  // Adjust geometry rotation
  geometry.rotateZ(Math.PI);

  let line = new THREE.Line(geometry, MAT_ROAD);
  line.scale.set(2,2,2)
  line.info = info;
  line.computeLineDistances();

  iR_Road.add(line);
  line.position.set(line.position.x, 1, line.position.z);

  if (FLAG_ROAD_ANI) {
    // Length of the line
    let lineLength =
      geometry.attributes.lineDistance.array[
        geometry.attributes.lineDistance.count - 1
      ];

    if (lineLength > 0.8) {
      let aniLine = addAnimatedLine(geometry, lineLength);
      iR_Line.add(aniLine);
    }
  }
}

function addAnimatedLine(geometry, length) {
  let animatedLine = new THREE.Line(
    geometry,
    new THREE.LineDashedMaterial({ color: 0x00ffff })
  );
  animatedLine.scale.set(2,2,2)
  animatedLine.material.transparent = true;
  animatedLine.position.y = 1;
  animatedLine.material.dashSize = 0;
  animatedLine.material.gapSize = 1000;

  Animated_Line_Distances.push(length);

  return animatedLine;
}

/**
 * Animate water
 */
export function AnimWaterFloaty() {
  for (let i = 0; i < iR_Water.children.length; i++) {
    iR_Water.children[i].material.uniforms["time"].value += 1.0 / 700;
  }
}

/**
 * Animate road
 */
export function AnimRoadFloaty() {
  // If no animated line than do nothing
  if (iR_Line.children.length <= 0) return;

  for (let i = 0; i < iR_Line.children.length; i++) {
    let line = iR_Line.children[i];

    let dash = parseInt(line.material.dashSize);
    let length = parseInt(Animated_Line_Distances[i]);

    if (dash > length) {
      //console.log("b")
      line.material.dashSize = 0;
      line.material.opacity = 1;
    } else {
      //console.log("a")
      line.material.dashSize += Animated_Line_Speed;
      line.material.opacity =
        line.material.opacity > 0 ? line.material.opacity - 0.002 : 0;
    }
  }
}

function genShape(points, center) {
  let shape = new THREE.Shape();

  for (let i = 0; i < points.length; i++) {
    let elp = points[i];
    elp = GPSRelativePosition(elp, center);

    if (i == 0) {
      shape.moveTo(elp[0], elp[1]);
    } else {
      shape.lineTo(elp[0], elp[1]);
    }
  }

  return shape;
}

function genGeometry(shape, settings) {
  let geometry = new THREE.ExtrudeBufferGeometry(shape, settings);
  geometry.computeBoundingBox();

  return geometry;
}

function genHelper(geometry) {
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }

  let box3 = geometry.boundingBox;
  if (!isFinite(box3.max.x)) {
    return false;
  }

  let helper = new THREE.Box3Helper(box3, 0xffffff);
  helper.updateMatrixWorld();
  return helper;
}

function GPSRelativePosition(objPosi, centerPosi) {
  // Get GPS distance
  let dis = geolib.getDistance(objPosi, centerPosi);

  // Get bearing angle
  let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi);

  // Calculate X by centerPosi.x + distance * cos(rad)
  let x = centerPosi[0] + dis * Math.cos((bearing * Math.PI) / 180);

  // Calculate Y by centerPosi.y + distance * sin(rad)
  let y = centerPosi[1] + dis * Math.sin((bearing * Math.PI) / 180);

  // Reverse X (it work)
  return [-x / 100, y / 100];
}
