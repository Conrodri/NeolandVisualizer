import * as geolib from "geolib";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { DisplayFBX } from "./DisplayFBX";
import { Vector3 } from "three";
import earcut from "earcut";
import { Earcut } from "three/src/extras/Earcut.js";
import { BordersPositions } from "./BordersPositions";


var LineString = require("turf-linestring");
var Buffer = require("turf-buffer");
const h3 = require("h3-js");

let LAND_ID = []

var globalScene;

var MAT_BUILDING,
  MAT_GREEN,
  MAT_FLAT_ROAD,
  MAT_FLAT_RIVER,
  MAT_FLAT_HIGHWAY,
  MAT_WATER,
  MAT_GREY,
  MAT_YELLOW,
  MAT_SQUARE,
  MAT_WATER_NORMAL = null;
var iR;
var iR_Urban;
var iR_Road;
var iR_PlaneRoad;
var iR_Line;
var iR_Water;
var iR_Green;
var iR_Grey;
var iR_Yellow;
var iR_Highway;
var iR_River;

const FLAG_ROAD_ANI = true;
var Animated_Line_Speed = 0.004;
var Animated_Line_Distances = [];
var geos_building = [];
var geos_flatBuildings = [];
var geos_greenZones = [];
var geos_RoadZones = [];
var geos_RiverZones = [];
var geos_Footways = [];
var geos_highwayZones = [];
var geos_greyZones = [];
var geos_yellowZones = [];
var geos_squareZones = [];

let AllBoundingBoxes = [];
let land_position;
let bordersPositions = []
let AllBboxOfExtrudedBuildings = []

/// for polygons 
let posTrianglesHexagon = [];
let pointsInTriangleHexagon = []
let posInTrianglesHexagon = [];
let intersect = []
let lonLatPolygon = [];
let lonLatHexagon = [];
let pointsInTrianglePolygon = []
let bordersPositionsXY = new BordersPositions(LAND_ID).GetBordersPositions()
let segmentArray = []
let posTrianglesPolygon = []
let hexagonPointsInsidePolygon = []
let segName = []
let newLonLatPolygon = []
let hexagon = new BordersPositions(LAND_ID).GetBordersPositions();

let RANDFUN

const api = "./models/geojson/green.geojson";

let streetLamp = "./models/fbx/lowpoly/StreetLamp.fbx";
let trashCan = "./models/fbx/lowpoly/TrashCan.fbx";
let tree = "./models/fbx/lowpoly/Tree1.fbx";
let tree2 = "./models/fbx/lowpoly/Tree2.fbx";
let woodbench = "./models/fbx/lowpoly/WoodBench.fbx";
let fountain = "./models/fbx/Fountain.fbx";

export async function InitExtrudedBuildingsAndWater(scene, land_id, randomFunction, gui, datas) {
  // Init groups
  iR = new THREE.Group();
  iR.name = "Interactive Root";
  iR_Road = new THREE.Group();
  iR_Road.name = "Roads";
  iR_PlaneRoad = new THREE.Group();
  iR_PlaneRoad.name = "Plane roads";
  iR_Line = new THREE.Group();
  iR_Line.name = "Animated Line on Roads";
  iR_Water = new THREE.Group();
  iR_Water.name = "Any water mark";
  iR_Green = new THREE.Group();
  iR_Green.name = "Any Green zone";
  iR_Grey = new THREE.Group();
  iR_Grey.name = "Any Grey zone";
  iR_Yellow = new THREE.Group();
  iR_Yellow.name = "Any Yellow zone";
  iR_River = new THREE.Group();
  iR_River.name = "Any river";
  iR_Urban = new THREE.Group();
  iR_Urban.name = "Any urban decor";
  iR_Highway = new THREE.Group();
  iR_Highway.name = "Any Highway decor";
  scene.add(iR);
  scene.add(iR_Road);
  scene.add(iR_Line);
  scene.add(iR_Water);
  scene.add(iR_Green);
  scene.add(iR_Grey);
  scene.add(iR_Yellow);
  scene.add(iR_River);
  scene.add(iR_PlaneRoad);
  scene.add(iR_Urban);
  scene.add(iR_Highway);

  globalScene = scene;
  RANDFUN = randomFunction
  LAND_ID = land_id

  // console.log(LAND_ID)

  land_position = h3.h3ToGeo(LAND_ID);

  bordersPositions = h3.h3ToGeoBoundary(LAND_ID, true)


  await GetHexagonGeoJson(datas);

  let swp = land_position;
  land_position = [swp[1], swp[0]];

  return AllBboxOfExtrudedBuildings
}

async function GetHexagonGeoJson(dataTest) {

  if (!dataTest || !dataTest.features || dataTest.features.length < 10) {
    console.log('DATA PAS OK ')
    return
  }

  await LoadWaters(dataTest);

  await DisplayEnvironment(dataTest);

  let urbanDecors = new DisplayFBX().GetGroupUrban();
  let randomTrees = new DisplayFBX().GetGroupRandom();

  randomTrees.rotateX(Math.PI);
  randomTrees.rotateY(Math.PI / 2);


  randomTrees.updateMatrixWorld();

  urbanDecors.rotateY(0 * (Math.PI / 180));

  urbanDecors.updateMatrixWorld();

  globalScene.add(urbanDecors);
  globalScene.add(randomTrees)
}

function DrawRoadZone(data, type) {
  addRoadZones(data.geometry.coordinates, type);
}

function DrawRiverZone(data) {
  addRiverZones(data.geometry.coordinates);
}

async function DisplayEnvironment(data) {
  let features = data.features;

  MAT_BUILDING = new THREE.MeshPhongMaterial({ color: 'light-grey' });
  MAT_GREEN = new THREE.MeshPhongMaterial({ color: 0xb8d64e });
  MAT_GREY = new THREE.MeshPhongMaterial({ color: 0xa9a9a9 });
  MAT_YELLOW = new THREE.MeshPhongMaterial({ color: 0xeee8aa });
  MAT_FLAT_ROAD = new THREE.MeshPhongMaterial({ color: 0x5a5956 });
  MAT_FLAT_RIVER = new THREE.MeshPhongMaterial({ color: 0x0778cb });
  MAT_FLAT_HIGHWAY = new THREE.MeshPhongMaterial({ color: 0xff8000 });
  MAT_FLAT_HIGHWAY = new THREE.MeshPhongMaterial({ color: 0x5a5956 });
  MAT_SQUARE = new THREE.MeshPhongMaterial({ color: 0xdef3fd });

  for (let i = 0; i < features.length; i++) {
    let fel = features[i];
    if (!fel["properties"]) return;

    let info = fel.properties;

    if (info.tags["building"] || info["building"]) {
      /**
       * Create 3d buildings, with good height
       */
      addBuildingAsync(fel.geometry.coordinates, info, info.tags["building:levels"]);
    } else if (info["highway"] || info.tags["highway"]) {
      if (
        fel.geometry.type == "LineString" &&
        info["highway"] != "pedestrian" &&
        info["highway"] != "footway" &&
        info["highway"] != "path"
      ) {
        /**
         * Create 3d highways with lines
         */
        addLineRoad(fel.geometry.coordinates, info.tags);
      }
    } else if (
      info["natural"] == "water" ||
      (info.tags["natural"] == "water" && fel.geometry.type == "Polygon") ||
      info["natural"] == "wetland" ||
      (info.tags["natural"] == "wetland" && fel.geometry.type == "Polygon") ||
      info["water"] == "river" ||
      (info.tags["water"] == "river" && fel.geometry.type == "Polygon") ||
      info["water"] == "canal" ||
      (info.tags["water"] == "canal" && fel.geometry.type == "Polygon") ||
      info["water"] == "stream" ||
      (info.tags["water"] == "stream" && fel.geometry.type == "Polygon") ||
      info["waterway"] == "river" ||
      (info.tags["waterway"] == "river" && fel.geometry.type == "Polygon") ||
      info["waterway"] == "canal" ||
      (info.tags["waterway"] == "canal" && fel.geometry.type == "Polygon") ||
      info["waterway"] == "stream" ||
      (info.tags["waterway"] == "stream" && fel.geometry.type == "Polygon") ||
      info["natural"] == "mud" ||
      (info.tags["natural"] == "mud" && fel.geometry.type == "Polygon") ||
      info["water"] == "wetland" ||
      (info.tags["water"] == "wetland" && fel.geometry.type == "Polygon")
    )
      /*
       * Create Water
       */ {
      addWater(fel.geometry.coordinates, info);
    }
    else if (
      info["natural"] == "wetland" ||
      info.tags["natural"] == "wetland" ||
      info["water"] == "canal" ||
      info.tags["water"] == "canal" ||
      info["water"] == "stream" ||
      info.tags["water"] == "stream" ||
      info["waterway"] ||
      info.tags["waterway"] ||
      info["waterway"] == "river" ||
      info.tags["waterway"] == "river" ||
      info["waterway"] == "canal" ||
      info.tags["waterway"] == "canal" ||
      info["waterway"] == "stream" ||
      info.tags["waterway"] == "stream" ||
      info["natural"] == "mud" ||
      info.tags["natural"] == "mud"
    ) {
      /*
       * Create Rivers with lines
       */
      addLineRivers(fel.geometry.coordinates);
    } else if (
      info["landuse"] == "residential" ||
      info.tags["landuse"] == "residential" ||
      info["landuse"] == "construction" ||
      info.tags["landuse"] == "construction" ||
      info["landuse"] == "industrial" ||
      info.tags["landuse"] == "industrial" ||
      info["landuse"] == "religious" ||
      info.tags["landuse"] == "religious" ||
      info["landuse"] == "quarry" ||
      info.tags["landuse"] == "quarry" ||
      info["landuse"] == "landfill" ||
      info.tags["landuse"] == "landfill" ||
      info["landuse"] == "greenhouse_horticulture" ||
      info.tags["landuse"] == "greenhouse_horticulture" ||
      info["landuse"] == "greenfield" ||
      info.tags["landuse"] == "greenfield" ||
      info["landuse"] == "garages" ||
      info.tags["landuse"] == "garages" ||
      info["highway"] == "pedestrian" ||
      info["highway"] == "footway" ||
      info["highway"] == "path" ||
      info.tags["highway"] == "pedestrian" ||
      info.tags["highway"] == "footway" ||
      info.tags["highway"] == "path" ||
      info["landuse"] == "railway" ||
      info.tags["landuse"] == "railway" ||
      info["landuse"] == "brownfield" ||
      info.tags["landuse"] == "brownfield" ||
      info["leisure"] == "common" ||
      info.tags["leisure"] == "common"
    ) {
      /*
       * Create Grey zones
       */
      //addGreyZonesAsync(fel.geometry.coordinates, info);
    } else if (
      info["amenity"] == "college" ||
      info.tags["amenity"] == "college" ||
      info["amenity"] == "hospital" ||
      info.tags["amenity"] == "hospital" ||
      info["amenity"] == "school" ||
      info.tags["amenity"] == "school" ||
      info["amenity"] == "parking" ||
      info.tags["amenity"] == "parking" ||
      info["amenity"] == "theatre" ||
      info.tags["amenity"] == "theatre" ||
      info["amenity"] == "library" ||
      info.tags["amenity"] == "library" ||
      info["amenity"] == "place_of_worship" ||
      info.tags["amenity"] == "place_of_worship" ||
      info["amenity"] == "social_facility" ||
      info.tags["amenity"] == "social_facility" ||
      info["landuse"] == "education" ||
      info.tags["landuse"] == "education" ||
      info["natural"] == "beach" ||
      info.tags["natural"] == "beach"
    ) {
      /*
       * Create Hospital/School zones
       */
      addYellowZonesAsync(fel.geometry.coordinates, info);
    } else if (info["place"] == "square" || info.tags["place"] == "square") {
      addSquareZonesAsync(fel.geometry.coordinates, info);
    } else {
      /*
       * Create Green zones
       */
      addGreenZonesAsync(fel.geometry.coordinates, info);

    }

    if (info.tags["amenity"] == "fountain" || info["amenity"] == "fountain") {
      addUrbanDecors(fel.geometry.coordinates, "fountain");
    }
    // if (info.tags["amenity"] == "bench" || info["amenity"] == "bench") {
    //   /**
    //    * Create 3d benchs assets
    //    */
    //   addUrbanDecors(fel.geometry.coordinates, "bench");
    // }
    if (info.tags["natural"] == "tree" || info["natural"] == "tree") {
      /**
       * Create 3d trees assets
       */
      addUrbanDecors(fel.geometry.coordinates, "tree");
    }
    // if (
    //   info.tags["amenity"] == "waste_basket" ||
    //   info["amenity"] == "waste_basket"
    // ) {
    //   /**
    //    * Create 3d waste_baskets assets
    //    */
    //   addUrbanDecors(fel.geometry.coordinates, "trash");
    // }
    // if (
    //   info.tags["highway"] == "street_lamp" ||
    //   info["highway"] == "street_lamp"
    // ) {
    //   /**
    //    * Create 3d street_lamps assets
    //    */
    //   addUrbanDecors(fel.geometry.coordinates, "lamp");
    // }
  }

  if (geos_building.length > 0) {
    let mergeBuildings =
      BufferGeometryUtils.mergeBufferGeometries(geos_building);
    let meshBuildings = new THREE.Mesh(mergeBuildings, MAT_BUILDING);
    meshBuildings.name = "Extruded Buildings";
    meshBuildings.castShadow = true
    meshBuildings.receiveShadow = true
    iR.add(meshBuildings);
  }

  if (geos_flatBuildings.length > 0) {
    let mergeFlatBuildings =
      BufferGeometryUtils.mergeBufferGeometries(geos_flatBuildings);
    let meshFlatBuildings = new THREE.Mesh(mergeFlatBuildings, MAT_BUILDING);
    meshFlatBuildings.scale.y = 0.2;
    meshFlatBuildings.name = "Flat Buildings";
    meshFlatBuildings.receiveShadow = true
    iR.add(meshFlatBuildings);
  }

  if (geos_greenZones.length > 0) {
    let mergeGreen = BufferGeometryUtils.mergeBufferGeometries(geos_greenZones);
    let meshGreen = new THREE.Mesh(mergeGreen, MAT_GREEN);
    meshGreen.scale.y = 0.1;
    meshGreen.position.y = 0 - 0.003;
    meshGreen.name = "Green Zones";
    meshGreen.receiveShadow = true
    iR.add(meshGreen);
  }

  // if (geos_greyZones.length > 0) {
  //   let mergeGrey = BufferGeometryUtils.mergeBufferGeometries(geos_greyZones);
  //   let meshGrey = new THREE.Mesh(mergeGrey, MAT_GREY);
  //   meshGrey.scale.y = 0.1;
  //   meshGrey.position.y = 0 - 0.0035;
  //   meshGrey.name = "Grey Zones";
  //   iR.add(meshGrey);
  // }

  if (geos_yellowZones.length > 0) {
    let mergeYellow =
      BufferGeometryUtils.mergeBufferGeometries(geos_yellowZones);
    let meshYellow = new THREE.Mesh(mergeYellow, MAT_YELLOW);
    meshYellow.scale.y = 0.1;
    meshYellow.position.y = 0 - 0.0025;
    meshYellow.name = "Yellow Zones";
    meshYellow.receiveShadow = true
    iR.add(meshYellow);
  }

  if (geos_squareZones.length > 0) {
    let mergeSquare =
      BufferGeometryUtils.mergeBufferGeometries(geos_squareZones);
    let meshSquare = new THREE.Mesh(mergeSquare, MAT_SQUARE);
    meshSquare.scale.y = 0.1;
    meshSquare.position.y = 0 - 0.0025;
    meshSquare.name = "Square Zones";
    meshSquare.receiveShadow = true
    iR.add(meshSquare);
  }

  if (geos_RoadZones.length > 0) {
    let mergeRoad = BufferGeometryUtils.mergeBufferGeometries(geos_RoadZones);
    let meshRoad = new THREE.Mesh(mergeRoad, MAT_FLAT_ROAD);
    meshRoad.scale.y = 0.2;
    meshRoad.position.y = 0;
    meshRoad.name = "Roads";
    meshRoad.receiveShadow = true
    iR.add(meshRoad);
  }

  if (geos_RiverZones.length > 0) {
    let mergeRiver = BufferGeometryUtils.mergeBufferGeometries(geos_RiverZones);
    let meshRiver = new THREE.Mesh(mergeRiver, MAT_FLAT_RIVER);

    meshRiver.scale.y = 0.1;
    meshRiver.position.y = 0 - 0.002;
    meshRiver.name = "Rivers";
    iR.add(meshRiver);
  }

  if (geos_Footways.length > 0) {
    let mergeFootways =
      BufferGeometryUtils.mergeBufferGeometries(geos_Footways);
    let meshFootways = new THREE.Mesh(mergeFootways, MAT_FLAT_ROAD);
    meshFootways.scale.y = 0.2;
    meshFootways.position.y = 0;
    meshFootways.name = "Footways";
    meshFootways.receiveShadow = true
    iR.add(meshFootways);
  }

  if (geos_highwayZones.length > 0) {
    let mergeHighway =
      BufferGeometryUtils.mergeBufferGeometries(geos_highwayZones);
    let meshHighway = new THREE.Mesh(mergeHighway, MAT_FLAT_HIGHWAY);
    meshHighway.scale.y = 0.1;
    meshHighway.position.y = 0 - 0.001;
    meshHighway.name = "Highways";
    meshHighway.receiveShadow = true
    iR.add(meshHighway);
  }

  //GetUrbanDecors();
}

/**
 * initialise material for water
 */
async function LoadWaters() {
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
 * Add building to the scene
 */
async function addBuildingAsync(data, info, height = 1) {
  if (height == 1) {
    let rand = RANDFUN(1);
    if (rand < 0.5)
      height += rand
    if (rand > 1)
      height -= rand
    if (height > 10)
      height -= 9
  }

  let shape, geometry;
  let holes = [];
  let flat = false;
  let newPoly = []

  for (let i = 0; i < data.length; i++) {
    let polygon = []
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, land_position);
    } else {
      holes.push(genShape(el, land_position));
    }
    if (data[i].length > 2) {

      polygon.push(data[i]);
      newPoly.push(CutCleanPolygonsAndLines(polygon))

    }
  }

  if (newPoly[0] && newPoly[0].length > 0) {

    for (let i = 0; i < newPoly.length; i++) {

      if (i == 0) {
        shape = genShapeNoGPS(newPoly[i]);
      } else {
        holes.push(genShapeNoGPS(newPoly[i]));
      }
    }
  }

  geometry = genGeometry(shape, {
    curveSegments: 1,
    depth: 0.05 * height,
    bevelEnabled: false,
  });

  if (!geometry) return

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.rotateY(Math.PI / 2);

  for (let i = 0; i < AllBoundingBoxes.length; i++) {
    if (geometry.boundingBox.intersectsBox(AllBoundingBoxes[i])) {
      geometry = null;
      geometry = genGeometry(shape, {
        curveSegments: 1,
        depth: 0.01,
        bevelEnabled: false,
      });

      if (!geometry) return

      geometry.rotateX(Math.PI / 2);
      geometry.rotateZ(Math.PI);
      geometry.rotateY(Math.PI / 2);
      geos_flatBuildings.push(geometry);
      flat = true;
      break;
    }
  }

  let meshBuildings = new THREE.Mesh(geometry, MAT_BUILDING);
  var bbox = new THREE.Box3().setFromObject(meshBuildings);

  AllBboxOfExtrudedBuildings.push(bbox)

  if (!flat) geos_building.push(geometry);
}

async function addGreenZonesAsync(data, info, height = 1) {
  height = height ? height : 1;
  let shape, geometry;
  let holes = [];
  let newPoly = []

  for (let i = 0; i < data.length; i++) {
    let polygon = []
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, land_position);
    } else {
      holes.push(genShape(el, land_position));
    }
    if (data[i].length > 2) {

      polygon.push(data[i]);
      newPoly.push(CutCleanPolygonsAndLines(polygon, false, true))

    }
  }

  if (newPoly[0] && newPoly[0].length > 0) {

    for (let i = 0; i < newPoly.length; i++) {

      if (i == 0) {
        shape = genShapeNoGPS(newPoly[i]);
      } else {
        holes.push(genShapeNoGPS(newPoly[i]));
      }
    }
    // CreateTreesInThisZoneCutted(newPoly)
  }
  else {
    for (let i = 0; i < data.length; i++) {
      // CreateTreesInThisZone(data[i])
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

  if (!geometry) return

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.rotateY(Math.PI / 2);

  geos_greenZones.push(geometry);
}

function CreateTreesInThisZone(coordinates) {

  if (!coordinates || coordinates.length < 3 || !coordinates.length)
    return;

  let lonLat = [];

  for (let i = 0; i < coordinates.length; i++) {
    let coords = coordinates[i];
    coords = GPSRelativePosition([coords[0], coords[1]], land_position);
    lonLat.push(coords);
  }

  let tab = [];
  tab.push(lonLat);

  const dataTest = earcut.flatten(tab);

  var triangles = Earcut.triangulate(
    dataTest.vertices,
    null,
    dataTest.dimensions
  );

  let posTriangles = [];

  //Create a triangle of real 2d positions (x & z) 
  if (triangles.length > 2) {
    for (let i = 0; i < triangles.length; i += 3) {
      posTriangles.push([tab[0][triangles[0 + i]], tab[0][triangles[1 + i]], tab[0][triangles[2 + i]]]);
    }
  }

  // Procedural generation of trees in triangles
  for (let i = 0; i < posTriangles.length; i++) {

    const a = posTriangles[i][0];
    const b = posTriangles[i][1];
    const c = posTriangles[i][2];

    const area = TriangleArea(a, b, c)

    let testRand = RANDFUN()
    let PlusOne = false
    let coef = 15
    let nbTrees = (area * coef)

    if (testRand < nbTrees - Math.floor(nbTrees))
      PlusOne = true

    nbTrees = Math.floor(area * coef)

    if (PlusOne)
      nbTrees++


    for (let index = 0; index < nbTrees; index++) {

      let r1 = RANDFUN()
      let r2 = RANDFUN()

      const Px = (1 - Math.sqrt(r1)) * a[0] + (Math.sqrt(r1) * (1 - r2)) * b[0] + (Math.sqrt(r1) * r2) * c[0]
      const Py = (1 - Math.sqrt(r1)) * a[1] + (Math.sqrt(r1) * (1 - r2)) * b[1] + (Math.sqrt(r1) * r2) * c[1]

      const newPoint = new THREE.Vector2(Px, Py)

      new DisplayFBX(
        tree2,
        0.0001,
        "tree",
        new THREE.Vector3(newPoint.y, 0, newPoint.x),
        globalScene,
        "Random",
        new Vector3(180, 0, 1)
      );

    }

  }

  // Heron's Formula
  function TriangleArea(a, b, c) {
    let ab = Math.sqrt((Math.pow((a[0] - b[0]), 2) + Math.pow((a[1] - b[1]), 2)))
    let bc = Math.sqrt((Math.pow((b[0] - c[0]), 2) + Math.pow((b[1] - c[1]), 2)))
    let ac = Math.sqrt((Math.pow((a[0] - c[0]), 2) + Math.pow((a[1] - c[1]), 2)))

    var s = ((ab) + (bc) + (ac)) / 2;

    return (Math.sqrt(s * (s - ab) * (s - bc) * (s - ac)))
  }

}

function CreateTreesInThisZoneCutted(coordinates) {

  if (!coordinates && coordinates.length < 3)
    return;
  let lonLat = [];

  for (let i = 0; i < coordinates.length; i++) {
    for (let j = 0; j < coordinates[i].length; j++) {
      let coords = coordinates[i][j];
      lonLat.push(coords);
    }
  }

  let tab = [];
  tab.push(lonLat);

  const dataTest = earcut.flatten(tab);

  var triangles = Earcut.triangulate(
    dataTest.vertices,
    null,
    dataTest.dimensions
  );

  let posTriangles = [];

  //Create a triangle of real 2d positions (x & z) 
  if (triangles.length > 2) {
    for (let i = 0; i < triangles.length; i += 3) {
      posTriangles.push([tab[0][triangles[0 + i]], tab[0][triangles[1 + i]], tab[0][triangles[2 + i]]]);
    }
  }

  // Procedural generation of trees in triangles
  for (let i = 0; i < posTriangles.length; i++) {

    const a = posTriangles[i][0];
    const b = posTriangles[i][1];
    const c = posTriangles[i][2];

    const area = TriangleArea(a, b, c)

    let testRand = RANDFUN()
    let PlusOne = false
    let coef = 15
    let nbTrees = (area * coef)

    if (testRand < nbTrees - Math.floor(nbTrees))
      PlusOne = true

    nbTrees = Math.floor(area * coef)

    if (PlusOne)
      nbTrees++


    for (let index = 0; index < nbTrees; index++) {

      let r1 = RANDFUN()
      let r2 = RANDFUN()

      const Px = (1 - Math.sqrt(r1)) * a[0] + (Math.sqrt(r1) * (1 - r2)) * b[0] + (Math.sqrt(r1) * r2) * c[0]
      const Py = (1 - Math.sqrt(r1)) * a[1] + (Math.sqrt(r1) * (1 - r2)) * b[1] + (Math.sqrt(r1) * r2) * c[1]

      const newPoint = new THREE.Vector2(Px, Py)

      new DisplayFBX(
        tree2,
        0.0001,
        "tree",
        new THREE.Vector3(newPoint.y, 0, newPoint.x),
        globalScene,
        "Random",
        new Vector3(180, 0, 1)
      );

    }

  }

  // Heron's Formula
  function TriangleArea(a, b, c) {
    let ab = Math.sqrt((Math.pow((a[0] - b[0]), 2) + Math.pow((a[1] - b[1]), 2)))
    let bc = Math.sqrt((Math.pow((b[0] - c[0]), 2) + Math.pow((b[1] - c[1]), 2)))
    let ac = Math.sqrt((Math.pow((a[0] - c[0]), 2) + Math.pow((a[1] - c[1]), 2)))

    var s = ((ab) + (bc) + (ac)) / 2;

    return (Math.sqrt(s * (s - ab) * (s - bc) * (s - ac)))
  }

}

function addSquareZonesAsync(data, info, height = 1) {
  height = height ? height : 1;
  let shape, geometry;
  let holes = [];
  let newPoly = []


  for (let i = 0; i < data.length; i++) {
    let polygon = []
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, land_position);
    } else {
      holes.push(genShape(el, land_position));
    }
    if (data[i].length > 2) {

      polygon.push(data[i]);
      newPoly.push(CutCleanPolygonsAndLines(polygon))

    }
  }

  if (newPoly[0] && newPoly[0].length > 0) {

    for (let i = 0; i < newPoly.length; i++) {

      if (i == 0) {
        shape = genShapeNoGPS(newPoly[i]);
      } else {
        holes.push(genShapeNoGPS(newPoly[i]));
      }
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

  if (!geometry) return

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.rotateY(Math.PI / 2);

  geos_squareZones.push(geometry);
}

function addUrbanDecors(d, path) {
  let el = d;
  //Just in case
  if (!el[0] || !el[1]) return;

  let elp = [el[0], el[1]];

  //convert position from the land_position position
  elp = GPSRelativePosition([elp[0], elp[1]], land_position);

  for (let i = 0; i < posTrianglesHexagon.length; i++) {

    let p1 = { x: elp[0], y: elp[1] }
    let a = { x: posTrianglesHexagon[i][0][0], y: posTrianglesHexagon[i][0][1] }
    let b = { x: posTrianglesHexagon[i][1][0], y: posTrianglesHexagon[i][1][1] }
    let c = { x: posTrianglesHexagon[i][2][0], y: posTrianglesHexagon[i][2][1] }
    if (intpoint_inside_trigon(p1, a, b, c)) {
      if (path == "fountain") {
        new DisplayFBX(
          fountain,
          0.05,
          "fountain",
          new THREE.Vector3(elp[0], 0, elp[1]),
          globalScene,
          "Urban",
          new Vector3(0, 1, 0)
        );
      }
      if (path == "bench") {
        new DisplayFBX(
          woodbench,
          0.0001,
          "bench",
          new THREE.Vector3(elp[0], 0, elp[1]),
          globalScene,
          "Urban"
        );
      }
      if (path == "trash") {
        new DisplayFBX(
          trashCan,
          0.0001,
          "trash can",
          new THREE.Vector3(elp[0], 0, elp[1]),
          globalScene,
          "Urban"
        );
      }
      if (path == "tree") {
        new DisplayFBX(
          tree,
          0.0001,
          "tree",
          new THREE.Vector3(elp[0], 0, elp[1]),
          globalScene,
          "Urban"
        );
      }
      if (path == "lamp") {
        new DisplayFBX(
          streetLamp,
          0.0001,
          "street lamp",
          new THREE.Vector3(elp[0], 0, elp[1]),
          globalScene,
          "Urban"
        );
      }
    }
  }


}

/**
 * Add RoadsZones to the scene
 */
function addRoadZones(data, type, height = 1) {
  height = height ? height : 1;

  // console.log(data, "grey data")

  let shape, geometry;
  let holes = [];
  let newPoly = []


  for (let i = 0; i < data.length; i++) {
    let polygon = []
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, land_position);
    } else {
      holes.push(genShape(el, land_position));
    }
    if (data[i].length > 2) {
      polygon.push(data[i]);
      newPoly.push(CutCleanPolygonsAndLines(polygon, true))
    }
  }

  if (newPoly[0] && newPoly[0].length > 0) {

    for (let i = 0; i < newPoly.length; i++) {

      if (i == 0) {
        shape = genShapeNoGPS(newPoly[i]);
      } else {
        holes.push(genShapeNoGPS(newPoly[i]));
      }
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

  if (!geometry) return

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.rotateY(Math.PI / 2);

  if (type == "primary") {
    geos_highwayZones.push(geometry);
  } else if (type == "footway") {
    geos_Footways.push(geometry);
  } else geos_RoadZones.push(geometry);
}

/**
 * Add RoadsZones to the scene
 */
function addRiverZones(data, height = 1) {
  height = height ? height : 1;

  let shape, geometry;
  let holes = [];
  let newPoly = []

  for (let i = 0; i < data.length; i++) {
    let polygon = []
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, land_position);
    } else {
      holes.push(genShape(el, land_position));
    }
    if (data[i].length > 2) {
      polygon.push(data[i]);
      newPoly.push(CutCleanPolygonsAndLines(polygon, true))

    }
  }

  if (newPoly[0] && newPoly[0].length > 0) {

    for (let i = 0; i < newPoly.length; i++) {

      if (i == 0) {
        shape = genShapeNoGPS(newPoly[i]);
      } else {
        holes.push(genShapeNoGPS(newPoly[i]));
      }
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

  if (!geometry) return

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.rotateY(Math.PI / 2);

  geos_RiverZones.push(geometry);
}


/**
 * Add YellowZones to the scene
 */
async function addGreyZonesAsync(data, info, height = 1) {
  height = height ? height : 1;

  let shape, geometry;
  let holes = [];
  let newPoly = []


  for (let i = 0; i < data.length; i++) {
    let polygon = []
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, land_position);
    } else {
      holes.push(genShape(el, land_position));
    }
    if (data[i].length > 2) {

      polygon.push(data[i]);
      newPoly.push(CutCleanPolygonsAndLines(polygon))

    }
  }

  if (newPoly[0] && newPoly[0].length > 0) {

    for (let i = 0; i < newPoly.length; i++) {

      if (i == 0) {
        shape = genShapeNoGPS(newPoly[i]);
      } else {
        holes.push(genShapeNoGPS(newPoly[i]));
      }
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

  if (!geometry) return



  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.rotateY(Math.PI / 2);

  geos_greyZones.push(geometry);
}

/**
 * Add YellowZones to the scene
 */
async function addYellowZonesAsync(data, info, height = 1) {
  height = height ? height : 1;

  let shape, geometry;
  let holes = [];
  let newPoly = []


  for (let i = 0; i < data.length; i++) {
    let polygon = []
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, land_position);
    } else {
      holes.push(genShape(el, land_position));
    }
    if (data[i].length > 2) {

      polygon.push(data[i]);
      newPoly.push(CutCleanPolygonsAndLines(polygon))

    }
  }

  if (newPoly[0] && newPoly[0].length > 0) {

    for (let i = 0; i < newPoly.length; i++) {

      if (i == 0) {
        shape = genShapeNoGPS(newPoly[i]);
      } else {
        holes.push(genShapeNoGPS(newPoly[i]));
      }
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

  if (!geometry) return



  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.rotateY(Math.PI / 2);

  geos_yellowZones.push(geometry);
}

/**
 * Add water to the scene
 */
function addWater(data) {
  let shape, geometry;
  let holes = [];
  let newPoly = []


  for (let i = 0; i < data.length; i++) {
    let polygon = []
    let el = data[i];

    if (i == 0) {
      shape = genShape(el, land_position);
    } else {
      holes.push(genShape(el, land_position));
    }
    if (data[i].length > 2) {
      polygon.push(data[i]);
      newPoly.push(CutCleanPolygonsAndLines(polygon, false))

    }
  }

  if (newPoly[0] && newPoly[0].length > 0) {

    for (let i = 0; i < newPoly.length; i++) {

      if (i == 0) {
        shape = genShapeNoGPS(newPoly[i]);
      } else {
        holes.push(genShapeNoGPS(newPoly[i]));
      }
    }
  }

  if (newPoly == null) return

  geometry = genGeometry(shape, {
    curveSegments: 2,
    steps: 1,
    depth: 0.01,
    bevelEnabled: false,
  });

  if (!geometry) return

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.rotateY(Math.PI / 2);

  let water = new Water(geometry, MAT_FLAT_RIVER);

  water.position.y -= 0.0065;
  water.material = MAT_FLAT_RIVER
  water.material.opacity = 0.5

  iR_Water.add(water);
}

/**
 * Add rivers to the scene
 */
function addLineRivers(d, info) {
  // Init points array
  let points = [];
  let lineRiver = [];

  // Loop for all nodes
  for (let i = 0; i < d.length; i++) {
    if (!d[0][1]) return;

    let el = d[i];

    //Just in case
    if (!el[0] || !el[1]) return;

    let elp = [el[0], el[1]];

    lineRiver.push(elp);

    //convert position from the land_position position
    elp = GPSRelativePosition([elp[1], elp[0]], land_position);
    // Draw Line
    points.push(new THREE.Vector3(elp[0], 0.5, elp[1]));
  }

  const lineRiverGeo = LineString(lineRiver);

  try {
    let buffered = Buffer(lineRiverGeo, 0.004);
    DrawRiverZone(buffered, "primary");
  } catch (error) {
    return
  }

}

/**
 * Add road to the scene
 */
function addLineRoad(d, info) {
  // Init points array
  let points = [];
  let lineRoad = [];

  // console.log(info)

  // Loop for all nodes
  for (let i = 0; i < d.length; i++) {
    if (!d[0][1]) return;

    let el = d[i];

    //Just in case
    if (!el[0] || !el[1]) return;

    let elp = [el[0], el[1]];

    lineRoad.push(elp);
    //convert position from the center position
    elp = GPSRelativePosition([elp[1], elp[0]], land_position);

    // Draw Line
    points.push(new THREE.Vector3(elp[0], 0.5, elp[1]));
  }

  const lineRoadGeo = LineString(lineRoad);
  let buffered;

  if (info.highway == "primary") {
    buffered = Buffer(lineRoadGeo, 0.004);
    DrawRoadZone(buffered, "primary");
  } else if (info.highway == "trunk") {
    buffered = Buffer(lineRoadGeo, 0.006);
    DrawRoadZone(buffered, "primary");
  } else if (
    info.highway == "footway" ||
    info.highway == "steps" ||
    info.highway == "path" ||
    info.highway == "track" ||
    info.highway == "construction" ||
    info.highway == "service"
  ) {
    buffered = Buffer(lineRoadGeo, 0.001);
    DrawRoadZone(buffered, "footway");
  } else {
    buffered = Buffer(lineRoadGeo, 0.002);
    DrawRoadZone(buffered, "road");
  }

  // HERE FOR LINE DISPLAY
  // let geometry = new THREE.BufferGeometry().setFromPoints(points);

  // // Adjust geometry rotation
  // geometry.rotateZ(Math.PI);
  // geometry.rotateY(Math.PI / 2);

  // let line;
  // if (info["highway"] == "trunk")
  //   line = new THREE.Line(geometry, MAT_HIGHWAY);
  // else line = new THREE.Line(geometry, MAT_ROAD);
  // //line.scale.set(2, 2, 2)
  // line.info = info;
  // line.computeLineDistances();

  // iR_Road.add(line);
  // line.position.set(line.position.x, 0.5055, line.position.z);

  // if (FLAG_ROAD_ANI) {
  //   // Length of the line
  //   let lineLength =
  //     geometry.attributes.lineDistance.array[
  //     geometry.attributes.lineDistance.count - 1
  //     ];

  //   if (lineLength > 0.8) {
  //     let aniLine = addAnimatedLine(geometry, lineLength);
  //     iR_Line.add(aniLine);
  //   }
  // }
}

/**
 * Animate water
 */
export function AnimWater() {
  for (let i = 0; i < iR_Water.children.length; i++) {
    iR_Water.children[i].material.uniforms["time"].value += 1.0 / 700;
  }
}

function genShape(points, land_position) {
  let shape = new THREE.Shape();

  for (let i = 0; i < points.length; i++) {
    let elp = points[i];
    elp = GPSRelativePosition(elp, land_position);

    if (i == 0) {
      shape.moveTo(elp[1], elp[0]);
    } else {
      shape.lineTo(elp[1], elp[0]);
    }
  }
  return shape;
}

function genShapeNoGPS(points) {
  let shape = new THREE.Shape();
  if (points == null) return shape
  for (let i = 0; i < points.length; i++) {
    let elp = points[i];

    if (elp && elp[0] && elp[1]) {
      if (i == 0) {
        shape.moveTo(elp[1], elp[0]);
      } else {
        shape.lineTo(elp[1], elp[0]);
      }
    }
  }

  return shape;
}

function genGeometry(shape, settings) {
  // console.log(shape)
  let geometry
  try {
    geometry = new THREE.ExtrudeBufferGeometry(shape, settings)
    geometry.computeBoundingBox();
    return geometry;
  } catch (error) {
    return null
  }
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

//   function GPSMercatorXY(objPosi, centerPosi) {
//   let latitude = objPosi[1]; // (φ)
//   let longitude = objPosi[0];   // (λ)

//   let mapWidth = 200;
//   let mapHeight = 100;

//   // get x value
//   let x = (longitude + 180) * (mapWidth / 360) + centerPosi[0]

//   // convert from degrees to radians
//   let latRad = latitude * Math.PI / 180;

//   // get y value
//   let mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
//    let y = (mapHeight / 2) - (mapWidth * mercN / (2 * Math.PI)) + centerPosi[1];
//   return [x, y]
// }

function GPSRelativePosition(objPosi, centerPosi, green = false) {
  // Get GPS distance
  let dis = 0
  let bearing
  let doWeSwp = false
  if (objPosi[0] < objPosi[1]) {
    dis = geolib.getDistance([objPosi[1], [objPosi[0]]], [centerPosi[0], centerPosi[1]]);
    bearing = geolib.getGreatCircleBearing([objPosi[1], [objPosi[0]]], [centerPosi[0], centerPosi[1]]);
    doWeSwp = true
  }
  else {
    dis = geolib.getDistance(objPosi, centerPosi);
    bearing = geolib.getGreatCircleBearing(objPosi, centerPosi);
  }

  // Get bearing angle
  let x, y

  if (doWeSwp) {
    let swp = [objPosi[0], objPosi[1]]
    dis = geolib.getDistance(swp, [centerPosi[1], centerPosi[0]]);
    bearing = geolib.getGreatCircleBearing(swp, [centerPosi[1], centerPosi[0]]);
    // Calculate X by centerPosi.x + distance * cos(rad)
    x = centerPosi[0] + dis * Math.cos((bearing * Math.PI) / 180);

    // Calculate Y by centerPosi.y + distance * sin(rad)
    y = centerPosi[1] + dis * Math.sin((bearing * Math.PI) / 180);
  }
  else {
    // let swp = [objPosi[0], objPosi[1]]
    // dis = geolib.getDistance(swp, centerPosi);
    // bearing = geolib.getGreatCircleBearing(swp, centerPosi);
    // Calculate X by centerPosi.x + distance * cos(rad)
    x = centerPosi[0] + dis * Math.cos((bearing * Math.PI) / 180);

    // Calculate Y by centerPosi.y + distance * sin(rad)
    y = centerPosi[1] + dis * Math.sin((bearing * Math.PI) / 180);
  }

  // Reverse X (it work)
  return [x / 100, y / 100];
}


async function StepOne() {
  const dataTestHexagon = earcut.flatten([hexagon]);

  var trianglesHexagon = Earcut.triangulate(
    dataTestHexagon.vertices,
    null,
    dataTestHexagon.dimensions
  );

  //Create a triangle of real 2d positions (x & z) 
  if (trianglesHexagon.length > 2) {
    for (let i = 0; i < trianglesHexagon.length; i += 3) {
      posTrianglesHexagon.push([hexagon[trianglesHexagon[0 + i]], hexagon[trianglesHexagon[1 + i]], hexagon[trianglesHexagon[2 + i]]]);
    }
  }
}

function GetLLP(poly) {
  let newTab = []
  for (let i = 0; i < poly.length; i++) {
    let coords = poly[i];

    coords = GPSRelativePosition([coords[0], coords[1]], land_position, true);
    newTab.push(coords);
  }
  return newTab
}

function intpoint_inside_trigon(s, a, b, c) {
  let as_x = s.x - a.x;
  let as_y = s.y - a.y;

  let s_ab = (b.x - a.x) * as_y - (b.y - a.y) * as_x > 0;

  if ((c.x - a.x) * as_y - (c.y - a.y) * as_x > 0 == s_ab) return false;

  if ((c.x - b.x) * (s.y - b.y) - (c.y - b.y) * (s.x - b.x) > 0 != s_ab) return false;

  return true;
}

function StepTwo(poly) {
  lonLatPolygon = GetLLP(poly[0])

  let newPOITH = []

  let count = 0
  for (let i = 0; i < lonLatPolygon.length; i++) {
    count = 0
    for (let j = 0; j < posTrianglesHexagon.length; j++) {

      let p1 = { x: lonLatPolygon[i][0], y: lonLatPolygon[i][1] }
      let a = { x: posTrianglesHexagon[j][0][0], y: posTrianglesHexagon[j][0][1] }
      let b = { x: posTrianglesHexagon[j][1][0], y: posTrianglesHexagon[j][1][1] }
      let c = { x: posTrianglesHexagon[j][2][0], y: posTrianglesHexagon[j][2][1] }
      if (intpoint_inside_trigon(p1, a, b, c)) {
        newPOITH.push(true)
        count = 1
        break
      }
    }
    if (count == 0) {
      newPOITH.push(false)
    }
  }

  return newPOITH
}

function StepThree(PITH) {

  for (let i = 0; i < PITH.length; i++) {
    if (PITH[i] == true) {
      if (i > 0 && PITH[i - 1] == false) {
        segmentArray.push([i, i - 1])
      }
      else if (i < PITH.length && PITH[i + 1] == false) {
        segmentArray.push([i, i + 1])
      }
    }
  }

  if (PITH[0] && PITH[PITH.length - 1] == false) {
    segmentArray.push([0, PITH.length - 1])
  }
}

function StepFour(green = false) {
  let test = []

  for (let i = 0; i < segmentArray.length; i++) {

    for (let j = 0; j < bordersPositionsXY.length; j++) {
      let index0 = segmentArray[i][0]
      let index1 = segmentArray[i][1]

      // line 1
      var p1 = { x: lonLatPolygon[index0][0], y: lonLatPolygon[index0][1] }; // P1: (x1, y1) // Line P1
      var p2 = { x: lonLatPolygon[index1][0], y: lonLatPolygon[index1][1] }; // P2: (x2, y2) // Line P2

      if (j == 5)
      // line 2
      {
        var p3 = { x: bordersPositionsXY[j][0], y: bordersPositionsXY[j][1] }; // P3: (x4, y4) // Border P1
        var p4 = { x: bordersPositionsXY[0][0], y: bordersPositionsXY[0][1] }; // P4: (x4, y4) // Border P2
      }
      else {
        var p3 = { x: bordersPositionsXY[j][0], y: bordersPositionsXY[j][1] }; // P3: (x4, y4) // Border P1
        var p4 = { x: bordersPositionsXY[j + 1][0], y: bordersPositionsXY[j + 1][1] }; // P4: (x4, y4) // Border P2
      }

      if (isIntersected([p1, p2], [p3, p4])) {

        var p = getIntersection(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);  // intersection point
        if (p) {
          intersect.push(p)

          switch (j) {
            case 0: segName.push(['A', 'B']); break;
            case 1: segName.push(['B', 'C']); break;
            case 2: segName.push(['C', 'D']); break;
            case 3: segName.push(['D', 'E']); break;
            case 4: segName.push(['E', 'F']); break;
            case 5: segName.push(['F', 'A']); break;
          }
        }
      }
    }
    test = test.sort(function (a, b) { return a - b; });

  }

}


function StepFive() {


  const dataTestPolygon = earcut.flatten([lonLatPolygon]);


  var trianglesPolygon = Earcut.triangulate(
    dataTestPolygon.vertices,
    null,
    dataTestPolygon.dimensions
  );

  //Create a triangle of real 2d positions (x & z) 
  if (trianglesPolygon.length > 2) {
    for (let i = 0; i < trianglesPolygon.length; i += 3) {
      posTrianglesPolygon.push([lonLatPolygon[trianglesPolygon[0 + i]], lonLatPolygon[trianglesPolygon[1 + i]], lonLatPolygon[trianglesPolygon[2 + i]]]);
    }
  }
}

function StepSix(hexagon) {

  //  Checking if borders points is inside 1 of all poly triangles | Step 2
  let count = 0
  for (let i = 0; i < hexagon.length; i++) {
    count = 0
    for (let j = 0; j < posTrianglesPolygon.length; j++) {

      let p1 = { x: hexagon[i][0], y: hexagon[i][1] }
      let a = { x: posTrianglesPolygon[j][0][0], y: posTrianglesPolygon[j][0][1] }
      let b = { x: posTrianglesPolygon[j][1][0], y: posTrianglesPolygon[j][1][1] }
      let c = { x: posTrianglesPolygon[j][2][0], y: posTrianglesPolygon[j][2][1] }
      if (intpoint_inside_trigon(p1, a, b, c)) {
        pointsInTrianglePolygon.push(true)
        count = 1
        break
      }
    }
    if (count == 0) {
      pointsInTrianglePolygon.push(false)
    }
  }

  for (let i = 0; i < pointsInTrianglePolygon.length; i++) {
    if (pointsInTrianglePolygon[i] == true)
      hexagonPointsInsidePolygon.push(hexagon[i])
  }

}



function LastStep(line = false, green = false) {
  newLonLatPolygon = []
  let k = 0
  let count = 0
  for (let i = 0; i < pointsInTriangleHexagon.length; i++) {
    if (pointsInTriangleHexagon[i] == true) {
      count++
    }
  }
  if (count == 0) return null

  function checkNextFalse(i) {
    if (pointsInTriangleHexagon[i] == true) {
      newLonLatPolygon.push(lonLatPolygon[i])
      let next = (i + 1)
      if (next >= pointsInTriangleHexagon.length) {
        next = 0
      }
      if (pointsInTriangleHexagon[next] == false) {
        newLonLatPolygon.push(intersect[k])
        if (line == false)
          checkBetween()
        k++
      }
    }
  }

  function checkBetween() {
    let next = k + 1
    let hexagonPoints = ["A", "B", "C", "D", "E", "F"]


    if (next >= segName.length) {
      next = 0
      if (segName.length % 2 == 1) {
        // TO BE CHANGED FOR THE BETTER
        next = k
      }
    }
    if (segName[k] && segName[k] != segName[next]) {
      let i = hexagonPoints.indexOf(segName[k][1]);
      let end = hexagonPoints.indexOf(segName[next][1]);
      while (i != end) {
        if (hexagon[i]) {
          newLonLatPolygon.push(hexagon[i])
        }
        i++
        if (i > hexagonPoints.length) {
          i = 0
        }
      }
    }
  }


  function checkNextTrue(i) {
    if (pointsInTriangleHexagon[i] == false) {
      let next = (i + 1)
      if (next >= pointsInTriangleHexagon.length) {
        next = 0
      }
      if (pointsInTriangleHexagon[next] == true) {
        newLonLatPolygon.push(intersect[k])
        k++
      }
    }
  }

  for (let i = 0; i < lonLatPolygon.length; i++) {
    checkNextTrue(i)
    checkNextFalse(i)
  }


  return newLonLatPolygon
}

function CutCleanPolygonsAndLines(polygon, line = false, green = false) {

  let poly = polygon
  posTrianglesHexagon = [];
  posInTrianglesHexagon = [];
  intersect = []
  lonLatPolygon = [];
  lonLatHexagon = [];
  newLonLatPolygon = []
  pointsInTriangleHexagon = []
  pointsInTrianglePolygon = []
  bordersPositionsXY = new BordersPositions(LAND_ID).GetBordersPositions()
  segmentArray = []
  posTrianglesPolygon = []
  hexagonPointsInsidePolygon = []
  segName = []
  hexagon = new BordersPositions(LAND_ID).GetBordersPositions();

  
  
  StepOne()
  lonLatPolygon = GetLLP(poly[0])
  pointsInTriangleHexagon = StepTwo(poly)
  
  // for (let i = 0; i < lonLatPolygon.length; i++) {
  //     const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
  //     const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  //     const cube = new THREE.Mesh(geometry, material);
  //     globalScene.add(cube);
  //     cube.position.set(lonLatPolygon[i][0], 0.05, lonLatPolygon[i][1])
  // }}

  if (!pointsInTriangleHexagon) {
    return []
  }


  StepThree(pointsInTriangleHexagon)

  StepFour(green)


  StepFive()

  StepSix(hexagon)

  const finalPolygon = LastStep(line, green)
  if (finalPolygon == null) {
    return [null]
  }

  return finalPolygon
}


function isIntersected(s0, s1) {
  const dx0 = s0[1].x - s0[0].x
  const dx1 = s1[1].x - s1[0].x
  const dy0 = s0[1].y - s0[0].y
  const dy1 = s1[1].y - s1[0].y
  const p0 = dy1 * (s1[1].x - s0[0].x) - dx1 * (s1[1].y - s0[0].y)
  const p1 = dy1 * (s1[1].x - s0[1].x) - dx1 * (s1[1].y - s0[1].y)
  const p2 = dy0 * (s0[1].x - s1[0].x) - dx0 * (s0[1].y - s1[0].y)
  const p3 = dy0 * (s0[1].x - s1[1].x) - dx0 * (s0[1].y - s1[1].y)
  return (p0 * p1 <= 0) & (p2 * p3 <= 0)
}

function getIntersection(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {

  const [x1, y1] = [p1x, p1y];
  const [x2, y2] = [p2x, p2y];
  const [x3, y3] = [p3x, p3y];
  const [x4, y4] = [p4x, p4y];

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (denominator === 0) {
    return null;
  }

  const xNumerator =
    (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
  const yNumerator =
    (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
  const x = xNumerator / denominator;
  const y = yNumerator / denominator;

  return [x, y];
}



