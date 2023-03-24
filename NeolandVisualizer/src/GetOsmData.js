const axios = require("axios")


export async function GetOsmData(index) {
    const LatTopRight = index[0] + (0.0181598618 / 2)
    const LonTopRight = index[1] + (0.03373146057 / 2)

    const LatBottomLeft = index[0] - (0.0181598618 / 2)
    const LonBottomLeft = index[1] - (0.03373146057 / 2)

    const response = await axios.get("http://localhost:3000?a=" + LatBottomLeft + "&b=" + LonBottomLeft + "&c=" + LatTopRight + "&d=" + LonTopRight)
    return response
}

export async function GetHexagonOsmData(indexes, land_id) {

    let lat = 1
    let lon = 0
    const response = await axios.get("http://localhost:3000?a=" + indexes[0][lat] + "&b=" + indexes[0][lon] +
        "&c=" + indexes[1][lat] + "&d=" + indexes[1][lon] +
        "&e=" + indexes[2][lat] + "&f=" + indexes[2][lon] +
        "&g=" + indexes[3][lat] + "&h=" + indexes[3][lon] +
        "&i=" + indexes[4][lat] + "&j=" + indexes[4][lon] +
        "&k=" + indexes[5][lat] + "&l=" + indexes[5][lon] +
        "&m=" + indexes[6][lat] + "&n=" + indexes[6][lon] +
        `&landId=${land_id}`)
    return response
}