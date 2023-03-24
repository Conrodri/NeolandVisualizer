//Data complied from OpenStreetMap: https://www.openstreetmap.org/

// isjeff.com
// 2020.06.13
// By Jeff Wu

import * as geolib from 'geolib';
import * as THREE from 'three'

import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js'

import * as  BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

var MAT_BUILDING, MAT_ROAD
let center = [4.80602, 45.71375] // Oullins
var iR
var iR_Road
var iR_Line

const FLAG_ROAD_ANI = true
var Animated_Line_Speed = 0.004
var Animated_Line_Distances = []
var geos_building = []
var collider_building = []
var raycaster = null

const api = "./models/geojson/result.geojson"

// NOT WORKING WELL IN JSFIDDLE, TEST IN YOUR LOCAL MECHINE
// NOT WORKING WELL IN JSFIDDLE, TEST IN YOUR LOCAL MECHINE
// NOT WORKING WELL IN JSFIDDLE, TEST IN YOUR LOCAL MECHINE

/* document.getElementById('cont').addEventListener('click', (evt)=>{
  let mouse = {
    x: ( evt.clientX / window.innerWidth ) * 2 - 1,
    y: - ( evt.clientY / window.innerHeight ) * 2 + 1
  }

  let hitted = FireRaycaster(mouse)
  console.log(hitted)
  if(hitted['info']) {
    console.log(hitted.info)
  } else {
    console.log(hitted)
  }

}) */


export async function Awake(scene, center = [4.80066, 45.711926]) {

    let cont = document.getElementById("cont")

    // Init scene
    scene = new THREE.Scene()

    scene.background = new THREE.Color(0x222222)

    // Init group
    iR = new THREE.Group()
    iR.name = "Interactive Root"
    iR_Road = new THREE.Group()
    iR_Road.name = "Roads"
    iR_Line = new THREE.Group()
    iR_Line.name = "Animated Line on Roads"
    scene.add(iR)
    scene.add(iR_Road)
    scene.add(iR_Line)

    // Init Raycaster
    raycaster = new THREE.Raycaster()

    // Init Light
    let light0 = new THREE.AmbientLight(0xfafafa, 0.25)

    let light1 = new THREE.PointLight(0xfafafa, 0.4)
    light1.position.set(200, 90, 40)

    let light2 = new THREE.PointLight(0xfafafa, 0.4)
    light2.position.set(200, 90, -40)

    scene.add(light0)
    scene.add(light1)
    scene.add(light2)

    let gridHelper = new THREE.GridHelper(60, 160, new THREE.Color(0x555555), new THREE.Color(0x333333))
    scene.add(gridHelper)

    // let geometry = new THREE.BoxGeometry(1,1,1)
    // let material = new THREE.MeshBasicMaterial({color: 0x00ff00})
    // let mesh = new THREE.Mesh(geometry, material)
    // this.scene.add(mesh)

    MAT_BUILDING = new THREE.MeshPhongMaterial()

    Update()

    GetGeoJson()
}

function Update() {
    if (FLAG_ROAD_ANI) UpdateAniLines()
}

function GetGeoJson(scene) {

    fetch(api).then((res) => {

        res.json().then((data) => {

            LoadBuildings(data, scene)

        })
    })
}

function LoadBuildings(data, scene) {

    let features = data.features

    MAT_BUILDING = new THREE.MeshPhongMaterial()
    MAT_ROAD = new THREE.LineBasicMaterial({ color: 0x1B4686 })

    for (let i = 0; i < features.length; i++) {

        let fel = features[i]
        if (!fel['properties']) return

        let info = fel.properties

        if (info['building']) {
            addBuilding(fel.geometry.coordinates, info, info["building:levels"], scene)
        }

        else if (info["highway"]) {
            if (fel.geometry.type == "LineString" && info["highway"] != "pedestrian" && info["highway"] != "footway" && info["highway"] != "path") {

                addRoad(fel.geometry.coordinates, info, scene)
            }
        }
    }


    let mergeGeometry = BufferGeometryUtils.mergeBufferGeometries(geos_building)
    let mesh = new THREE.Mesh(mergeGeometry, MAT_BUILDING)
    iR.add(mesh)
}

function addBuilding(data, info, height = 1, scene) {

    height = height ? height : 1

    let shape, geometry
    let holes = []

    for (let i = 0; i < data.length; i++) {
        let el = data[i]

        if (i == 0) {
            shape = genShape(el, center)
        } else {
            holes.push(genShape(el, center))
        }
    }

    for (let i = 0; i < holes.length; i++) {
        shape.holes.push(holes[i])
    }

    geometry = genGeometry(shape, { curveSegments: 1, depth: 0.05 * height, bevelEnabled: false })

    geometry.rotateX(Math.PI / 2)
    geometry.rotateZ(Math.PI)

    geos_building.push(geometry)

    let helper = genHelper(geometry)
    if (helper) {
        helper.name = info["name"] ? info["name"] : "Building"
        helper.info = info
        //this.iR.add(helper)
        collider_building.push(helper)
    }
}

function addRoad(d, info) {

    // Init points array
    let points = []

    // Loop for all nodes
    for (let i = 0; i < d.length; i++) {

        if (!d[0][1]) return

        let el = d[i]

        //Just in case
        if (!el[0] || !el[1]) return

        let elp = [el[0], el[1]]

        //convert position from the center position
        elp = GPSRelativePosition([elp[0], elp[1]], center)

        // Draw Line
        points.push(new THREE.Vector3(elp[0], 0.5, elp[1]))
    }

    let geometry = new THREE.BufferGeometry().setFromPoints(points)

    // Adjust geometry rotation
    geometry.rotateZ(Math.PI)

    let line = new THREE.Line(geometry, MAT_ROAD)
    line.info = info
    line.computeLineDistances()

    iR_Road.add(line)
    line.position.set(line.position.x, 0.5, line.position.z)

    if (FLAG_ROAD_ANI) {

        // Length of the line
        let lineLength = geometry.attributes.lineDistance.array[geometry.attributes.lineDistance.count - 1]

        if (lineLength > 0.8) {
            let aniLine = addAnimatedLine(geometry, lineLength)
            iR_Line.add(aniLine)
        }
    }
}

function addAnimatedLine(geometry, length) {
    let animatedLine = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: 0x00FFFF }))
    animatedLine.material.transparent = true
    animatedLine.position.y = 0.5
    animatedLine.material.dashSize = 0
    animatedLine.material.gapSize = 1000

    Animated_Line_Distances.push(length)

    return animatedLine
}

function UpdateAniLines() {
    // If no animated line than do nothing
    if (iR_Line.children.length <= 0) return


    for (let i = 0; i < iR_Line.children.length; i++) {
        let line = iR_Line.children[i]

        let dash = parseInt(line.material.dashSize)
        let length = parseInt(Animated_Line_Distances[i])


        if (dash > length) {
            //console.log("b")
            line.material.dashSize = 0
            line.material.opacity = 1
        } else {
            //console.log("a")
            line.material.dashSize += Animated_Line_Speed
            line.material.opacity = line.material.opacity > 0 ? line.material.opacity - 0.002 : 0
        }
    }
}

function genShape(points, center) {
    let shape = new THREE.Shape()

    for (let i = 0; i < points.length; i++) {
        let elp = points[i]
        elp = GPSRelativePosition(elp, center)

        if (i == 0) {
            shape.moveTo(elp[0], elp[1])
        } else {
            shape.lineTo(elp[0], elp[1])
        }
    }

    return shape
}

function genGeometry(shape, settings) {
    let geometry = new THREE.ExtrudeBufferGeometry(shape, settings)
    geometry.computeBoundingBox()

    return geometry
}

function genHelper(geometry) {

    if (!geometry.boundingBox) {
        geometry.computeBoundingBox()
    }

    let box3 = geometry.boundingBox
    if (!isFinite(box3.max.x)) {
        return false
    }

    let helper = new THREE.Box3Helper(box3, 0xffff00)
    helper.updateMatrixWorld()
    return helper
}


function GPSRelativePosition(objPosi, centerPosi) {

    // Get GPS distance
    let dis = geolib.getDistance(objPosi, centerPosi)

    // Get bearing angle
    let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi)

    // Calculate X by centerPosi.x + distance * cos(rad)
    let x = centerPosi[0] + (dis * Math.cos(bearing * Math.PI / 180))

    // Calculate Y by centerPosi.y + distance * sin(rad)
    let y = centerPosi[1] + (dis * Math.sin(bearing * Math.PI / 180))

    // Reverse X (it work) 
    return [-x / 100, y / 100]
}
