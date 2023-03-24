
let allBbox = []

export class BoundingBoxes{

    FillAllBbox(newBbox){
        allBbox.push(newBbox)
    }

    GetAllBbox(){
        return allBbox
    }
}