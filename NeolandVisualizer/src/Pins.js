import { Color, Scene, Vector3 } from "three";
import * as THREE from "three"
import { DisplayFBX } from "./DisplayFBX";

const geometry = new THREE.BoxGeometry(10, 12, 10);
let material

export class Pins {
    position = new Vector3()
    name = ''
    building_id
    building_path
    color = null
    cone = null
    Pin = {
        position : new Vector3(),
        name : 'Pin',
        building_id: '',
        building_path: '',
        color: null,
        cone : null
    }

    constructor(scene, pos, building_id, building_path, color) {
        this.color = color
        this.position = pos
        this.building_id = building_id
        this.building_path = building_path
        this.CreatePins(color, scene)
        if (this.cone != null && this.cone.material.color != null) {
            scene.add(this.cone)
            return this.Pin
        }
        return null
    }

    CreatePins(color, scene) {
        geometry.name = 'cone'
        material = new THREE.MeshBasicMaterial({ color: color });
        this.cone = new THREE.Mesh(geometry, material);

        this.cone.visible = false

        this.Pin.position.x = this.position.x
        this.Pin.position.y = 0.1
        this.Pin.position.z = this.position.z
        this.Pin.building_id = this.building_id
        this.Pin.color = this.color
        this.Pin.building_path = this.building_path
        this.Pin.cone = this.cone

        this.name = 'cone'
        this.cone.position.x = this.position.x
        this.cone.position.y = 0.1
        this.cone.position.z = this.position.z
        this.cone.rotateZ(Math.PI)
        this.cone.scale.x = 0.01
        this.cone.scale.y = 0.01
        this.cone.scale.z = 0.01
    }
}