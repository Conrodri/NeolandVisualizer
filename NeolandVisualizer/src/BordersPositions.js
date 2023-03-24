import * as geolib from "geolib";

const h3 = require("h3-js");

export class BordersPositions {

    land_ID = 'xxxxxxx'
    points = []

    constructor(land_ID) {
        this.land_ID = land_ID
        this.CreateBordersPositions()
    }

    GPSRelativePosition(objPosi, centerPosi, green = false) {
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
            x = centerPosi[0] + dis * Math.cos((bearing * Math.PI) / 180);

            // Calculate Y by centerPosi.y + distance * sin(rad)
            y = centerPosi[1] + dis * Math.sin((bearing * Math.PI) / 180);
        }

        // Reverse X (it work)
        return [x / 100, y / 100];
    }

    CreateBordersPositions() {

        let bordersPositions = h3.h3ToGeoBoundary(this.land_ID, true)

        let land_position = h3.h3ToGeo(this.land_ID);

        for (let i = 0; i < bordersPositions.length - 1; i++) {

            let el = bordersPositions[i];

            //Just in case
            if (!el[0] || !el[1]) return;

            var elp = [el[0], el[1]];

            //convert position from the land_position position
            elp = this.GPSRelativePosition([elp[0], elp[1]], land_position);

            this.points.push(elp)
        }

    }

    GetBordersPositions() {
        return this.points
    }

}