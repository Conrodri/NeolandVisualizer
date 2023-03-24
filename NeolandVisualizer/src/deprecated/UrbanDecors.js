import * as geolib from "geolib";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as dat from "lil-gui";
import { DisplayFBX } from "../DisplayFBX";

const api = "./models/geojson/green.geojson";
let center = [4.80602, 45.71375]; // Oullins
let yoyoyo;

export async function InitUrbanDecors(
  scene
) {
  yoyoyo = scene;
  GetGeoJson();
}

function GetGeoJson() {
  fetch(api).then((res) => {
    res.json().then((data) => {
      DisplayUrbanDecors(data);
    });
  });
}

let streetLamp = "./models/lowpoly/StreetLamp.fbx";
let trashCan = "./models/lowpoly/TrashCan.fbx";
let tree = "./models/lowpoly/Tree1.fbx";
let woodbench = "./models/lowpoly/WoodBench.fbx";
let fountain = "./models/Fountain.fbx";

function DisplayUrbanDecors(data) {
  let features = data.features;

  for (let i = 0; i < features.length; i++) {
    let fel = features[i]
    if (!fel["properties"]) return

    let info = fel.properties
    let d = fel.geometry.coordinates
    for (let i = 0; i < d.length; i++) {
      if (!d[0][1]) return;


      let el = d[i];
      //Just in case
      if (!el[0] || !el[1]) return

      let elp = [el[0], el[1]];
 

      //convert position from the center position
      elp = GPSRelativePosition([elp[0], elp[1]], center);
      if (info.tags["amenity"] == "fountain" || info["amenity"] == "fountain") {
        /**
         * Create 3d buildings, with good height
         */
        new DisplayFBX(
          fountain,
          1,
          "fountain",
          new Vector3(elp[0], 0.5, elp[1]),
          yoyoyo
        );
      } else if (
        info.tags["amenity"] == "bench" ||
        info["amenity"] == "bench"
      ) {
        /**
         * Create 3d benchs assets
         */
        new DisplayFBX(
          woodbench,
          1,
          "bench",
          new Vector3(elp[0], 0.5, elp[1]),
          yoyoyo
        );
      } else if (info.tags["natural"] == "tree" || info["natural"] == "bench") {
        /**
         * Create 3d trees assets
         */
        new DisplayFBX(
          tree,
          1,
          "tree",
          new Vector3(elp[0], 0.5, elp[1]),
          yoyoyo
        );
      } else if (
        info.tags["amenity"] == "waste_basket" ||
        info["amenity"] == "waste_basket"
      ) {
        /**
         * Create 3d waste_baskets assets
         */
        new DisplayFBX(
          trashCan,
          1,
          "trash can",
          new Vector3(elp[0], 0.5, elp[1]),
          yoyoyo
        );
      } else if (
        info.tags["highway"] == "street_lamp" ||
        info["highway"] == "street_lamp"
      ) {
        /**
         * Create 3d street_lamps assets
         */
        new DisplayFBX(
          streetLamp,
          1,
          "street lamp",
          new Vector3(elp[0], 0.5, elp[1]),
          yoyoyo
        );
      }
    }
  }
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
