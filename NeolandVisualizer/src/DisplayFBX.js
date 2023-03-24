import { Vector3 } from "three";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { BoundingBoxes } from "./BoundingBoxes";

let groupUrban = new THREE.Group();
let groupBuildings = new THREE.Group();
let groupRandom = new THREE.Group();
let groupHUD = new THREE.Group()

export class DisplayFBX {
  position = new Vector3(0, 0, 0);
  bbox = new BoundingBoxes();
  path = "no_path";
  scale = 1;
  name = "object";
  scene;
  nbMixer = 0;
  rot = new Vector3();
  type = "Building"
  model
  camera
  optionnal_obj
  translateX
  translateY
  translateZ
  color = null

  constructor(
    path = "no_path",
    scale = 1,
    name = "no_name",
    pos = new THREE.Vector3(),
    scene = null,
    type = "Buildings",
    rotation = new THREE.Vector3(-100, -100, -100),
    camera,
    optionnal_obj,
    translateX = 0,
    translateY = 0,
    translateZ = 0

  ) {
    this.position = pos;
    this.name = name;
    this.scene = scene;
    this.path = path;
    this.scale = scale;
    this.rot = rotation;
    this.type = type
    this.camera = camera
    this.optionnal_obj = optionnal_obj
    this.translateX = translateX
    this.translateY = translateY
    this.translateZ = translateZ
    if (name != "no_name") this.CreateFBX();
    return this.model
  }

  async CreateFBX() {

    const loader = new FBXLoader();
    let model

    loader.load(this.path, (fbx) => {
      model = fbx;
      fbx.receiveShadow = true;
      fbx.castShadow = true;
      model.scale.set(this.scale, this.scale, this.scale);
      model.position.set(this.position.x, this.position.y, this.position.z);
      model.name = name;
      if (this.camera) {
        model.lookAt(new THREE.Vector3(this.camera.x, 1, this.camera.z))
      }
      if (this.rot.x == -100) {
        model.rotateX(0);
        model.rotateY(0);
        model.rotateZ(0);
      }
      else {
        model.rotateX(this.rot.x * (Math.PI / 180));
        model.rotateY(this.rot.y * (Math.PI / 180));
        model.rotateZ(this.rot.z * (Math.PI / 180));
      }
      if (name == "fountain") {
        model.rotation.x = Math.PI * 1.5;
        model.rotation.y = 0;
        model.rotation.z = 0;
      }
      model.translateX(this.translateX)
      model.translateY(this.translateY)
      model.translateZ(this.translateZ)

      model.castShadow = true
      model.receiveShadow = true
      model.traverse(function (object) {
        if (object instanceof THREE.PointLight) {
          object.intensity = 0.02;
          object.distance = 1;
          object.castShadow = true;
        }
        else {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      this.scene.add(model);
      if (this.type == "Random")
        groupRandom.add(model);
      else if (this.type == "HUD")
        groupHUD.add(model);

      this.model = model
    }
    );

    function animate() {
      requestAnimationFrame(animate);

      this.delta = clock.getDelta();

      for (let i = 0; i < mixer.length; i++) {
        mixer[i].update(this.delta);
      }
    }
    return model
  }

  GetGroupHUD() {
    return groupHUD
  }

  GetGroupUrban() {
    return groupUrban;
  }

  GetGroupRandom() {
    return groupRandom;
  }

  async GetGroupBuildings() {
    return groupBuildings;
  }
}
