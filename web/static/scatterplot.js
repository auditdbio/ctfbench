function createScatterPlot({
    containerId, // ID of the DOM element to place the plot in
    data, // Array of {name, x, y, [connectedTo]} objects
    xLabel = "X", // X-axis label
    yLabel = "Y", // Y-axis label
    width = 800, // Default width
    height = 600, // Default height
    margin = 50 // Margin around the plot
}) {
    const container = document.getElementById(containerId) || document.body;
    container.innerHTML = ""; // Clear existing content

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    container.appendChild(svg);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(defs);

    // **Generate Colors for Points**
    function generateColors(count) {
        const colors = [];
        const hueStep = 360 / count;
        for (let i = 0; i < count; i++) {
            colors.push(hsvToRgb(i * hueStep, 1, 0.7));
        }
        return colors;
    }

    function hsvToRgb(h, s, v) {
        let r, g, b;
        const i = Math.floor(h / 60);
        const f = h / 60 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
    }

    const basePoints = data.filter(d => !d.connectedTo);
    const colors = generateColors(basePoints.length);
    const colorMap = {};
    basePoints.forEach((bp, i) => colorMap[bp.name] = colors[i]);
    data.forEach(d => {
        if (d.connectedTo && colorMap[d.connectedTo]) {
            colorMap[d.name] = colorMap[d.connectedTo];
        } else if (!colorMap[d.name]) {
            colorMap[d.name] = colors[basePoints.length];
        }
    });

    const uniqueColors = [...new Set(Object.values(colorMap))];
    uniqueColors.forEach(color => {
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", `arrow-${color.replace("#", "")}`);
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "10");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "3");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "strokeWidth");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M0,0 L0,6 L9,3 z");
        path.setAttribute("fill", color);
        marker.appendChild(path);
        defs.appendChild(marker);
    });

    const xMin = 0;
    const xMax = Math.max(...data.map(d => d.x)) * 1.1;
    const yMin = 0;
    const yMax = 1;

    function xToPx(x) {
        return margin + (x - xMin) / (xMax - xMin) * (width - 2 * margin);
    }

    function yToPx(y) {
        return height - margin - (y - yMin) / (yMax - yMin) * (height - 2 * margin);
    }

    const pointPositions = {};
    data.forEach(d => pointPositions[d.name] = {x: xToPx(d.x), y: yToPx(d.y)});

    const arrows = data
        .filter(d => d.connectedTo)
        .map(d => ({
            startX: pointPositions[d.connectedTo].x,
            startY: pointPositions[d.connectedTo].y,
            endX: pointPositions[d.name].x,
            endY: pointPositions[d.name].y,
            color: colorMap[d.connectedTo]
        }));

    // **Axis Setup**
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", margin);
    xAxis.setAttribute("y1", height - margin);
    xAxis.setAttribute("x2", width - margin);
    xAxis.setAttribute("y2", height - margin);
    xAxis.setAttribute("stroke", "black");
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", margin);
    yAxis.setAttribute("y1", margin);
    yAxis.setAttribute("x2", margin);
    yAxis.setAttribute("y2", height - margin);
    yAxis.setAttribute("stroke", "black");
    svg.appendChild(yAxis);

    const xLabelElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xLabelElement.setAttribute("x", width / 2);
    xLabelElement.setAttribute("y", height - margin + 30);
    xLabelElement.setAttribute("text-anchor", "middle");
    xLabelElement.textContent = xLabel;
    svg.appendChild(xLabelElement);

    const yLabelElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yLabelElement.setAttribute("x", margin / 2);
    yLabelElement.setAttribute("y", height / 2);
    yLabelElement.setAttribute("text-anchor", "middle");
    yLabelElement.setAttribute("transform", `rotate(-90, ${margin / 2}, ${height / 2})`);
    yLabelElement.textContent = yLabel;
    svg.appendChild(yLabelElement);

    // **Add Grid and Tick Labels**
    function calculateStep(range) {
        const targetSteps = 10;
        const roughStep = range / targetSteps;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalizedStep = roughStep / magnitude;
        let step = normalizedStep <= 1.5 ? 1 : normalizedStep <= 3 ? 2 : 5;
        step *= magnitude;
        const stepsCount = Math.floor(range / step);
        if (stepsCount < 8) step /= 2;
        else if (stepsCount > 12) step *= 2;
        return step;
    }

    const xStep = calculateStep(xMax - xMin);
    const yStep = calculateStep(yMax - yMin);
    const xStepsCount = Math.ceil(xMax / xStep);
    const yStepsCount = Math.ceil(yMax / yStep);

    // X-axis grid and tick labels
    for (let i = 0; i <= xStepsCount; i++) {
        const value = i * xStep;
        const x = xToPx(value);
        if (x <= width - margin) {
            const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            gridLine.setAttribute("x1", x);
            gridLine.setAttribute("y1", margin);
            gridLine.setAttribute("x2", x);
            gridLine.setAttribute("y2", height - margin);
            gridLine.setAttribute("stroke", "lightgray");
            gridLine.setAttribute("stroke-dasharray", "5,5");
            svg.appendChild(gridLine);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", x);
            text.setAttribute("y", height - margin + 15);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "10px");
            text.textContent = value.toFixed(2);
            svg.appendChild(text);
        }
    }

    // Y-axis grid and tick labels
    for (let i = 0; i <= yStepsCount; i++) {
        const value = i * yStep;
        const y = yToPx(value);
        if (y >= margin) {
            const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            gridLine.setAttribute("x1", margin);
            gridLine.setAttribute("y1", y);
            gridLine.setAttribute("x2", width - margin);
            gridLine.setAttribute("y2", y);
            gridLine.setAttribute("stroke", "lightgray");
            gridLine.setAttribute("stroke-dasharray", "5,5");
            svg.appendChild(gridLine);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", margin - 10);
            text.setAttribute("y", y + 3);
            text.setAttribute("text-anchor", "end");
            text.setAttribute("font-size", "10px");
            text.textContent = value.toFixed(2);
            svg.appendChild(text);
        }
    }

    // **Create Tooltip Elements**
    const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tooltipBg.setAttribute("fill", "#333");
    tooltipBg.setAttribute("rx", "3");
    tooltipBg.setAttribute("opacity", "0.8");
    tooltipBg.setAttribute("visibility", "hidden");
    const tooltipText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tooltipText.setAttribute("fill", "white");
    tooltipText.setAttribute("font-size", "12px");
    tooltipText.setAttribute("text-anchor", "start");
    tooltipText.setAttribute("visibility", "hidden");
    tooltipGroup.appendChild(tooltipBg);
    tooltipGroup.appendChild(tooltipText);

    function showTooltip(event, name, x, y) {
        const coords = `${name}: (${x.toFixed(3)}, ${y.toFixed(3)})`;
        tooltipText.textContent = coords;
        const bbox = tooltipText.getBBox();
        const padding = 5;
        const containerRect = container.getBoundingClientRect();
        const offsetX = event.offsetX * (width / containerRect.width);
        const offsetY = event.offsetY * (height / containerRect.height);
        tooltipText.setAttribute("x", offsetX + 10);
        tooltipText.setAttribute("y", offsetY - 5);
        tooltipBg.setAttribute("x", offsetX + 5);
        tooltipBg.setAttribute("y", offsetY - bbox.height - padding / 2);
        tooltipBg.setAttribute("width", bbox.width + padding * 2);
        tooltipBg.setAttribute("height", bbox.height + padding);
        tooltipText.setAttribute("visibility", "visible");
        tooltipBg.setAttribute("visibility", "visible");
    }

    function moveTooltip(event) {
        const bbox = tooltipText.getBBox();
        const padding = 5;
        const containerRect = container.getBoundingClientRect();
        const offsetX = event.offsetX * (width / containerRect.width);
        const offsetY = event.offsetY * (height / containerRect.height);
        tooltipText.setAttribute("x", offsetX + 10);
        tooltipText.setAttribute("y", offsetY - 5);
        tooltipBg.setAttribute("x", offsetX + 5);
        tooltipBg.setAttribute("y", offsetY - bbox.height - padding / 2);
    }

    function hideTooltip() {
        tooltipText.setAttribute("visibility", "hidden");
        tooltipBg.setAttribute("visibility", "hidden");
    }

    // **Label Placement Logic (Unchanged)**
    const positions = [
        { name: 'right', calc: (px, py, w, h) => ({x: px + 15, y: py - h / 2}) },
        { name: 'left', calc: (px, py, w, h) => ({x: px - 15 - w, y: py - h / 2}) },
        { name: 'top', calc: (px, py, w, h) => ({x: px - w / 2, y: py - 15 - h}) },
        { name: 'bottom', calc: (px, py, w, h) => ({x: px - w / 2, y: py + 15}) },
        { name: 'top-right', calc: (px, py, w, h) => ({x: px + 15, y: py - 15 - h}) },
        { name: 'top-left', calc: (px, py, w, h) => ({x: px - 15 - w, y: py - 15 - h}) },
        { name: 'bottom-right', calc: (px, py, w, h) => ({x: px + 15, y: py + 15}) },
        { name: 'bottom-left', calc: (px, py, w, h) => ({x: px - 15 - w, y: py + 15}) }
    ];
    const padding = 5;
    const labelGap = 10;
    const pointRadius = 4;
    const fontFamily = "Arial";
    const fontSize = "12px";

    function getTextSize(text) {
        const tempText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tempText.setAttribute("font-family", fontFamily);
        tempText.setAttribute("font-size", fontSize);
        tempText.textContent = text;
        svg.appendChild(tempText);
        const bbox = tempText.getBBox();
        svg.removeChild(tempText);
        return {width: bbox.width, height: bbox.height};
    }

    function intersectsWithGap(rect1, rect2) {
        const gap = labelGap;
        return rect1.x < rect2.x + rect2.width + gap &&
               rect1.x + rect1.width + gap > rect2.x &&
               rect1.y < rect2.y + rect2.height + gap &&
               rect1.y + rect1.height + gap > rect2.y;
    }

    function intersectsPoint(rect, pointX, pointY) {
        const gap = labelGap + pointRadius;
        return rect.x < pointX + gap &&
               rect.x + rect.width > pointX - gap &&
               rect.y < pointY + gap &&
               rect.y + rect.height > pointY - gap;
    }

    function lineIntersectsRect(x1, y1, x2, y2, rect) {
        const {x, y, width, height} = rect;
        const left = x;
        const right = x + width;
        const top = y;
        const bottom = y + height;

        function lineIntersectLine(x1, y1, x2, y2, x3, y3, x4, y4) {
            const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (denom === 0) return false;
            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
            return t > 0 && t < 1 && u > 0 && u < 1;
        }

        return lineIntersectLine(x1, y1, x2, y2, left, top, right, top) ||
               lineIntersectLine(x1, y1, x2, y2, right, top, right, bottom) ||
               lineIntersectLine(x1, y1, x2, y2, right, bottom, left, bottom) ||
               lineIntersectLine(x1, y1, x2, y2, left, bottom, left, top);
    }

    function isWithinBounds(rect) {
        return rect.x >= margin &&
               rect.x + rect.width <= width - margin &&
               rect.y >= margin &&
               rect.y + rect.height <= height - margin;
    }

    const placedRects = [];
    const labelPositions = [];

    // Initial label placement
    data.forEach((d, i) => {
        const name = d.name;
        const pointPxX = pointPositions[name].x;
        const pointPxY = pointPositions[name].y;
        const color = colorMap[name];
        const textSize = getTextSize(name);
        const rectW = textSize.width + 2 * padding;
        const rectH = textSize.height + 2 * padding;

        let bestPosition = null;
        let minCost = Infinity;

        positions.forEach(pos => {
            const {x: rectX, y: rectY} = pos.calc(pointPxX, pointPxY, rectW, rectH);
            const candidateRect = {x: rectX, y: rectY, width: rectW, height: rectH};
            let intersectsAnyLabel = false;
            let intersectsAnyPoint = false;
            let intersectsAnyArrow = false;
            let outOfBounds = !isWithinBounds(candidateRect);

            placedRects.forEach(pr => {
                if (intersectsWithGap(candidateRect, pr)) intersectsAnyLabel = true;
            });

            data.forEach((otherD, j) => {
                if (i !== j) {
                    const otherPxX = pointPositions[otherD.name].x;
                    const otherPxY = pointPositions[otherD.name].y;
                    if (intersectsPoint(candidateRect, otherPxX, otherPxY)) {
                        intersectsAnyPoint = true;
                    }
                }
            });

            arrows.forEach(arrow => {
                if (lineIntersectsRect(arrow.startX, arrow.startY, arrow.endX, arrow.endY, candidateRect)) {
                    intersectsAnyArrow = true;
                }
            });

            const cost = (intersectsAnyLabel ? 1000 : 0) +
                         (intersectsAnyPoint ? 10000 : 0) +
                         (intersectsAnyArrow ? 10000 : 0) +
                         (outOfBounds ? 20000 : 0);
            if (cost < minCost) {
                minCost = cost;
                bestPosition = {rectX, rectY};
            }
        });

        if (minCost < 1000) {
            const {rectX, rectY} = bestPosition;
            placedRects.push({x: rectX, y: rectY, width: rectW, height: rectH});
            labelPositions.push({pointPxX, pointPxY, rectX, rectY, rectW, rectH, color, name, x: d.x, y: d.y});
        } else {
            let placed = false;
            let distance = 15;
            while (!placed && distance < 100) {
                for (let angle = 0; angle < 360; angle += 15) {
                    const rad = angle * Math.PI / 180;
                    const rectX = pointPxX + distance * Math.cos(rad) - rectW / 2;
                    const rectY = pointPxY + distance * Math.sin(rad) - rectH / 2;
                    const candidateRect = {x: rectX, y: rectY, width: rectW, height: rectH};
                    let collides = false;

                    placedRects.forEach(pr => {
                        if (intersectsWithGap(candidateRect, pr)) collides = true;
                    });
                    data.forEach(otherD => {
                        const otherPxX = pointPositions[otherD.name].x;
                        const otherPxY = pointPositions[otherD.name].y;
                        if (intersectsPoint(candidateRect, otherPxX, otherPxY)) collides = true;
                    });
                    arrows.forEach(arrow => {
                        if (lineIntersectsRect(arrow.startX, arrow.startY, arrow.endX, arrow.endY, candidateRect)) {
                            collides = true;
                        }
                    });

                    if (!collides && isWithinBounds(candidateRect)) {
                        placedRects.push(candidateRect);
                        labelPositions.push({pointPxX, pointPxY, rectX, rectY, rectW, rectH, color, name, x: d.x, y: d.y});
                        placed = true;
                        break;
                    }
                }
                distance += 5;
            }
            if (!placed) {
                const rectX = pointPxX + 15;
                const rectY = pointPxY - rectH / 2;
                placedRects.push({x: rectX, y: rectY, width: rectW, height: rectH});
                labelPositions.push({pointPxX, pointPxY, rectX, rectY, rectW, rectH, color, name, x: d.x, y: d.y});
            }
        }
    });

    // Iterative adjustment
    const maxIterations = 100;
    let iteration = 0;
    let hasOverlap = true;
    while (hasOverlap && iteration < maxIterations) {
        hasOverlap = false;
        for (let i = 0; i < labelPositions.length; i++) {
            const rect1 = labelPositions[i];
            for (let j = i + 1; j < labelPositions.length; j++) {
                const rect2 = labelPositions[j];
                if (intersectsWithGap(rect1, rect2)) {
                    hasOverlap = true;
                    const dx = (rect1.rectX + rect1.rectW / 2) - (rect2.rectX + rect2.rectW / 2);
                    const dy = (rect1.rectY + rect1.rectH / 2) - (rect2.rectY + rect2.rectH / 2);
                    const angle = Math.atan2(dy, dx);
                    const moveDist = 2;
                    let newX1 = rect1.rectX + moveDist * Math.cos(angle);
                    let newY1 = rect1.rectY + moveDist * Math.sin(angle);
                    let newX2 = rect2.rectX - moveDist * Math.cos(angle);
                    let newY2 = rect2.rectY - moveDist * Math.sin(angle);
                    if (newX1 >= margin && newX1 + rect1.rectW <= width - margin &&
                        newY1 >= margin && newY1 + rect1.rectH <= height - margin) {
                        rect1.rectX = newX1;
                        rect1.rectY = newY1;
                    }
                    if (newX2 >= margin && newX2 + rect2.rectW <= width - margin &&
                        newY2 >= margin && newY2 + rect2.rectH <= height - margin) {
                        rect2.rectX = newX2;
                        rect2.rectY = newY2;
                    }
                }
            }

            arrows.forEach(arrow => {
                if (lineIntersectsRect(arrow.startX, arrow.startY, arrow.endX, arrow.endY, rect1)) {
                    hasOverlap = true;
                    const dx = (rect1.rectX + rect1.rectW / 2) - ((arrow.startX + arrow.endX) / 2);
                    const dy = (rect1.rectY + rect1.rectH / 2) - ((arrow.startY + arrow.endY) / 2);
                    const angle = Math.atan2(dy, dx);
                    const moveDist = 2;
                    let newX = rect1.rectX + moveDist * Math.cos(angle);
                    let newY = rect1.rectY + moveDist * Math.sin(angle);
                    if (newX >= margin && newX + rect1.rectW <= width - margin &&
                        newY >= margin && newY + rect1.rectH <= height - margin) {
                        rect1.rectX = newX;
                        rect1.rectY = newY;
                    }
                }
            });
        }
        iteration++;
    }

    function getClosestPointOnRect(px, py, rect) {
        const {rectX, rectY, rectW, rectH} = rect;
        const left = rectX;
        const right = rectX + rectW;
        const top = rectY;
        const bottom = rectY + rectH;
        let closestX = px < left ? left : px > right ? right : px;
        let closestY = py < top ? top : py > bottom ? bottom : py;
        if (px >= left && px <= right) return {x: px, y: closestY};
        if (py >= top && py <= bottom) return {x: closestX, y: py};
        const corners = [
            {x: left, y: top},
            {x: right, y: top},
            {x: left, y: bottom},
            {x: right, y: bottom}
        ];
        let minDist = Infinity;
        corners.forEach(corner => {
            const dist = Math.hypot(px - corner.x, py - corner.y);
            if (dist < minDist) {
                minDist = dist;
                closestX = corner.x;
                closestY = corner.y;
            }
        });
        return {x: closestX, y: closestY};
    }

    // **Render Elements with Highlighting**
    // Render arrows first
    arrows.forEach(arrow => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", arrow.startX);
        line.setAttribute("y1", arrow.startY);
        line.setAttribute("x2", arrow.endX);
        line.setAttribute("y2", arrow.endY);
        line.setAttribute("stroke", arrow.color);
        line.setAttribute("stroke-width", "2");
        line.setAttribute("marker-end", `url(#arrow-${arrow.color.replace("#", "")})`);
        svg.appendChild(line);
    });

    // Render points and labels with grouping for interactivity
    labelPositions.forEach(lp => {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("class", `point-${lp.name.replace(/\s+/g, '-')}`);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const closestPoint = getClosestPointOnRect(lp.pointPxX, lp.pointPxY, lp);
        line.setAttribute("x1", lp.pointPxX);
        line.setAttribute("y1", lp.pointPxY);
        line.setAttribute("x2", closestPoint.x);
        line.setAttribute("y2", closestPoint.y);
        line.setAttribute("stroke", lp.color);
        line.setAttribute("stroke-width", "1");
        group.appendChild(line);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", lp.pointPxX);
        circle.setAttribute("cy", lp.pointPxY);
        circle.setAttribute("r", pointRadius);
        circle.setAttribute("fill", lp.color);
        group.appendChild(circle);

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", lp.rectX);
        rect.setAttribute("y", lp.rectY);
        rect.setAttribute("width", lp.rectW);
        rect.setAttribute("height", lp.rectH);
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", lp.color);
        rect.setAttribute("rx", 3);
        rect.setAttribute("ry", 3);
        group.appendChild(rect);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", lp.rectX + lp.rectW / 2);
        text.setAttribute("y", lp.rectY + lp.rectH / 2);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("font-family", fontFamily);
        text.setAttribute("font-size", fontSize);
        text.setAttribute("fill", lp.color);
        text.textContent = lp.name;
        group.appendChild(text);

        svg.appendChild(group);

        // Add interactivity
        group.addEventListener("mouseover", (e) => {
            showTooltip(e, lp.name, lp.x, lp.y);
            circle.setAttribute("r", pointRadius * 1.5); // Enlarge point
            rect.setAttribute("stroke-width", "2"); // Thicken label border
        });
        group.addEventListener("mousemove", moveTooltip);
        group.addEventListener("mouseout", () => {
            hideTooltip();
            circle.setAttribute("r", pointRadius); // Restore point size
            rect.setAttribute("stroke-width", "1"); // Restore border
        });
    });

    // Append tooltip group last to ensure it’s on top
    svg.appendChild(tooltipGroup);
}
