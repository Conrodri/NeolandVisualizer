import { Vector3 } from "three";
import * as THREE from 'three'

export class Arena {
    position = new Vector3()
    scene
    offsetY = 0.1

    constructor(pos, scene) {
      this.position = pos;
      this.scene = scene
      this.CreateAllTorus()
    }

    CreateAllTorus(){
        this.CreateSmallTorus()
        this.CreateMediumTorus()
        this.CreateBigTorus()
        this.CreateLine()
    }

    CreateSmallTorus(){
        let geometry = new THREE.TorusGeometry( 2, 3, 3, 9 );
        let material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        let smallTorus = new THREE.Mesh( geometry, material );
        smallTorus.position.set(this.position.x, this.position.y - this.offsetY * 3, this.position.z)
        smallTorus.rotation.x = Math.PI / 2
        smallTorus.scale.set(0.01,0.01,0.01)
        this.scene.add( smallTorus );
    }

    CreateMediumTorus(){
        let geometry = new THREE.TorusGeometry( 10, 3, 8, 9 );
        let material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        let MediumTorus = new THREE.Mesh( geometry, material );
        MediumTorus.position.set(this.position.x, this.position.y - this.offsetY * 2, this.position.z)
        MediumTorus.rotation.x = Math.PI / 2
        MediumTorus.scale.set(0.01,0.01,0.01)
        this.scene.add( MediumTorus );
    }

    CreateBigTorus(){
        let geometry = new THREE.TorusGeometry( 18, 3, 16, 9 );
        let material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        let BigTorus = new THREE.Mesh( geometry, material );
        BigTorus.position.set(this.position.x, this.position.y - this.offsetY, this.position.z)
        BigTorus.rotation.x = Math.PI / 2
        BigTorus.scale.set(0.01,0.01,0.01)
        this.scene.add( BigTorus );
    }

    CreateLine(){
        const material = new THREE.LineBasicMaterial({
            color: 0x000000
        });
        
        const points = [];
        points.push( new THREE.Vector3( this.position.x, this.position.y - this.offsetY * 3, this.position.z ) );
        points.push( new THREE.Vector3( this.position.x, this.position.y - this.offsetY * 9, this.position.z ) );
        
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        
        const line = new THREE.Line( geometry, material );
        this.scene.add( line );
    }
  }