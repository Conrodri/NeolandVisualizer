import { Vector3 } from "three";
import * as THREE from 'three'
import { BordersPositions } from "./BordersPositions";

const h3 = require("h3-js");

export class RealSizeHexagon {
    scene
    offsetY = 0.1
    land_ID
    group
    size
    color
    offsetPosition
    emissiveIntensity
    name

    constructor(land_ID, name, scene, size = new Vector3(1, 1, 1), color = new THREE.Color(0xababab), offsetPosition = new THREE.Vector3(0, 0, 0), emissiveIntensity = 1) {
        this.scene = scene
        this.land_ID = land_ID
        this.size = size
        this.color = color
        this.offsetPosition = offsetPosition
        this.group = new THREE.Group()
        this.emissiveIntensity = emissiveIntensity
        this.name = name

        //this.CreateBorders()
        this.CreateFloor()
        this.group.rotateY(Math.PI / 2);
        this.group.rotateZ(Math.PI);
        this.group.updateMatrixWorld();
        return this.group
    }

    async CreateFloor() {

        let points = new BordersPositions(this.land_ID).GetBordersPositions();

        let shapeHexagon = new THREE.Shape()
        shapeHexagon.moveTo(points[0][0], points[0][1])
        shapeHexagon.lineTo(points[1][0], points[1][1])
        shapeHexagon.lineTo(points[2][0], points[2][1])
        shapeHexagon.lineTo(points[3][0], points[3][1])
        shapeHexagon.lineTo(points[4][0], points[4][1])
        shapeHexagon.lineTo(points[5][0], points[5][1])

        const extrudeSettings = { depth: 0.75, bevelEnabled: false, steps: 2 };

        const geometryHexagon = new THREE.ExtrudeGeometry(shapeHexagon, extrudeSettings);
        const meshHexagon = new THREE.Mesh(geometryHexagon, new THREE.MeshPhongMaterial({ color: this.color }));

        meshHexagon.rotateX(Math.PI * 0.5);
        meshHexagon.rotateY(Math.PI)
        meshHexagon.rotateZ(Math.PI / 2);

        meshHexagon.position.y = 0

        // console.log(this.color)
        meshHexagon.scale.x = this.size.x
        meshHexagon.scale.y = this.size.y
        meshHexagon.scale.z = this.size.z

        meshHexagon.position.x = this.offsetPosition.x
        meshHexagon.position.y = this.offsetPosition.y
        meshHexagon.position.z = this.offsetPosition.z


        if (this.emissiveIntensity != 1) {
            meshHexagon.material.emissiveIntensity = this.emissiveIntensity
            meshHexagon.material.emissive = this.color
            meshHexagon.material.reflectivity = 50
            meshHexagon.material.roughness = 0.4
        }
        if (this.name == 'no') {
            meshHexagon.castShadow = true
            meshHexagon.receiveShadow = true
            meshHexagon.material.roughness = 1
            meshHexagon.material.emissiveIntensity = 0
        }

        this.group.add(meshHexagon)
    }

    async CreateBorders() {

        const bordersPositions = h3.h3ToGeoBoundary(this.land_ID, true)

        const land_position = h3.h3ToGeo(this.land_ID);


        const material = new THREE.MeshPhongMaterial({
            color: 0xa9a9a9
        });


        let points = [];

        for (let i = 0; i < bordersPositions.length - 1; i++) {

            let el = bordersPositions[i];

            //Just in case
            if (!el[0] || !el[1]) return;

            var elp = [el[0], el[1]];

            //convert position from the land_position position
            elp = this.GPSRelativePosition([elp[1], elp[0]], land_position);

            points.push(elp)
        }

        let vectors3 = []

        for (let i = 0; i < points.length; i++) {
            vectors3.push([points[i][0], 0, points[i][1]])
        }

        for (let i = 0; i < vectors3.length; i++) {

            const lines = [];

            lines.push(new THREE.Vector3(vectors3[i][0], vectors3[i][1], vectors3[i][2]));
            lines.push(new THREE.Vector3(vectors3[i][0], vectors3[i][1] - 10, vectors3[i][2]));
            lines.push(new THREE.Vector3(vectors3[i][0], vectors3[i][1] - 20, vectors3[i][2]));


            const geometry = new THREE.BufferGeometry().setFromPoints(lines);

            const line = new THREE.Line(geometry, material);

            this.group.add(line);

        }

        this.CreateFloor(points)
    }

}