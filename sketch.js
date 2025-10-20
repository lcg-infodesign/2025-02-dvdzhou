let table;

let maxRadius = 50;

let starsPos = [];
let staticLayer;

function preload() {
    table = loadTable("dataset.csv", "csv", "header");
}

function setup() {
    createGrid();
}

function draw() {
    // Draw background, grid and glyphs
    image(staticLayer, 0, 0);

    // Draw stars
    for (let star of starsPos) {
        drawStar(star.x, star.y, star.originX, star.originY, star.value, star.maxMagnitude);
    }
}

function createGrid() {
    starsPos = [];  // Reset when canvas resizes

    // ** Calculate grid layout **
    
    let outerPaddingX = 50;
    let outerPaddingY = 50;
    let padding = 25;
    let glyphSize = maxRadius * 2;  // Diameter

    // Calculate total available space (without paddings) then divide by the space occupied by a cell (including paddings), then round down
    let availableWidth = windowWidth - outerPaddingX * 2;
    let cols = floor((availableWidth) / (glyphSize + padding));
    // Divide the total number of glyps (444) by the number of columns, then round up (to make sure all glyphs have a row to stay).
    let rows = ceil(table.getRowCount() / cols);

    let totalGridWidth = (cols * glyphSize) + ((cols - 1) * padding);
    outerPaddingX = (windowWidth - totalGridWidth) / 2; // Center grid

    let totalHeight = outerPaddingY * 2 + rows * glyphSize + (rows - 1) * padding;

    // ** Create canvas **
    
    createCanvas(windowWidth, totalHeight);

    // ** Create static graphics buffer **
    staticLayer = createGraphics(windowWidth, totalHeight); // Buffer
    staticLayer.background("#162556");
    staticLayer.angleMode(DEGREES);

    console.log("Rows: " + rows + ", Cols: " + cols, "Elements: " + rows * cols);

    // ** Create cells **

    let colCount = 0;
    let rowCount = 0;

    for (let rowNumber = 0; rowNumber < table.getRowCount(); rowNumber++) {
        let data = table.getRow(rowNumber).arr;

        // Cell top left coordinates
        let cellX = outerPaddingX + colCount * (glyphSize + padding);
        let cellY = outerPaddingY + rowCount * (glyphSize + padding);

        // Cell center coordinates
        let xPos = cellX + maxRadius;
        let yPos = cellY + maxRadius;

        // Cell style
        staticLayer.push();
        staticLayer.stroke("#ffffff80");
        staticLayer.strokeWeight(0.2);
        staticLayer.fill("#ffffff08");
        staticLayer.rect(cellX, cellY, glyphSize);
        staticLayer.pop();

        drawGlyph(staticLayer, xPos, yPos, data);

        colCount++;

        // Reset once reached the end of the row
        if (colCount == cols) {
            colCount = 0;
            rowCount++;
        }
    }
}

function drawGlyph(staticLayer, xPos, yPos, data) {
    const maxValue = max(data);
    const minValue = min(data);

    // Get furthest absolute value from 0
    let maxMagnitude = max(abs(maxValue), abs(minValue));

    // Calculate angle between each data point
    const angleStep = 360 / data.length;

    staticLayer.push();
    // Glyph style
    staticLayer.stroke("#fdc700");
    staticLayer.strokeWeight(0.75);
    staticLayer.fill("#ffffff00");  // Transparent
    staticLayer.translate(xPos, yPos);

    staticLayer.beginShape();
    data.forEach((value, i) => {
        let r = 0;

        if (maxMagnitude > 0) {
            // Map [-maxMagnitude, maxMagnitude] to [-maxRadius, maxRadius]
            r = map(value, -maxMagnitude, maxMagnitude, -maxRadius, maxRadius);
        }

        // Calculate the (x, y) coordinates for this data point
        const x = r * staticLayer.cos(angleStep * i);
        const y = r * staticLayer.sin(angleStep * i);

        // Create a vertex at the calculated position
        staticLayer.vertex(x, y);

        // Save star position for later
        starsPos.push({
            x: x,
            y: y,
            originX: xPos,
            originY: yPos,
            value: value,
            maxMagnitude: maxMagnitude
        });
    });
    staticLayer.endShape(CLOSE);

    /*push();

    // Center (debug)
    stroke("#000000");
    strokeWeight(5);
    point(0, 0);
    pop();*/

    staticLayer.pop();
}

function drawStar(x, y, originX, originY, value, maxMagnitude) {
    const positiveColor = color("#ffdf20");
    const neutralColor = color("#ffffff");
    const negativeColor = color("#51a2ff");

    let starColor = neutralColor;
    let starSize = 5;

    if (maxMagnitude > 0) {
        // Map [0, maxMagnitude] to [minSize, maxSize]
        starSize = map(abs(value), 0, maxMagnitude, 5, 10);
            
        if (value > 0) {
            // Map [0, maxMagnitude] to [0.0, 1.0]
            let interpAmount = map(value, 0, maxMagnitude, 0, 1);
            starColor = lerpColor(neutralColor, positiveColor, interpAmount);
        } else if (value < 0) {
            // Map [0, -maxMagnitude] to [0.0, 1.0]
            let interpAmount = map(value, 0, -maxMagnitude, 0, 1);
            starColor = lerpColor(neutralColor, negativeColor, interpAmount);
        }
        // If value == 0 use default values
    }

    // ** Star ease-in-out effect **

    let minCycle = 1000;  // Fast
    let maxCycle = 3000; // Slow
    let cycleLength = 2000; // Default milliseconds

    if (maxMagnitude > 0) {
        // Map absolute value to cycle duration (yellow and blue stars have the same speed)
        //cycleLength = map(abs(value), 0, maxMagnitude, maxCycle, minCycle);

        // Map star value:
        // -maxMagnitude (blue) -> minCycle (fast)
        // +maxMagnitude (yellow) -> maxCycle (slow)
        cycleLength = map(value, -maxMagnitude, maxMagnitude, minCycle, maxCycle);
    }

    // Offset based on star coordinates (so star with same speed don't pulse at the same time)
    let phaseOffset = map((originX * originY) % 100, 0, 100, 0, TWO_PI);

    // Calculate the current phase angle (in radians)
    let angle = ((millis() * TWO_PI) / cycleLength) + phaseOffset;

    // Calculate sin value (between -1 e 1)
    let sinValue = sin(angle);

    // Map sin value [-1, 1] to opacity [min, max]
    let minAlpha = 50; 
    let maxAlpha = 255;
    let alpha = map(sinValue, -1, 1, minAlpha, maxAlpha);

    starColor.setAlpha(alpha);

    push();
    translate(originX, originY);
    stroke(starColor);
    strokeWeight(starSize);
    point(x, y);
    pop();
}

function windowResized() {
    createGrid();
}