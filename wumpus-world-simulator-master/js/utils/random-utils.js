class RandomUtils {

    static shuffle(array) {

        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    /**
     * @param {number} min
     * @param {number} max
     * @returns a random number between min (included) and max (excluded)
     */
    static getRandomInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    static getRandomIndex(array) {
        return RandomUtils.getRandomInteger(0, array.length);
    }

    static getRandomElement(array) {
        return array[RandomUtils.getRandomIndex(array)];
    }

    static getRandomElements(array, numberOfElements) {

        let indexes = ArrayUtils.getIndexesFromSize(array.length);

        RandomUtils.shuffle(indexes);

        let selected = indexes.filter((e,i) => i < numberOfElements);

        return selected.map(el => array[el]);
    }

    static getRandomLevel(lines, columns) {

        let positions = ArrayUtils.getIndexes(lines, columns);

        // Remove positions around player starting point (0,0) to give safe zone
        positions = ArrayUtils.removeByValues(positions, [[0, 0]]);
        positions = ArrayUtils.removeByValues(positions, [[0, 1]]);
        positions = ArrayUtils.removeByValues(positions, [[1, 0]]);
        positions = ArrayUtils.removeByValues(positions, [[1, 1]]);
        positions = ArrayUtils.removeByValues(positions, [[0, 2]]);
        positions = ArrayUtils.removeByValues(positions, [[2, 0]]);
        positions = ArrayUtils.removeByValues(positions, [[1, 1]]);
        positions = ArrayUtils.removeByValues(positions, [[2, 1]]);
        positions = ArrayUtils.removeByValues(positions, [[1, 2]]);

        // Create holes (10 holes)
        let holes = RandomUtils.getRandomElements(positions, 10);
        positions = ArrayUtils.removeByValues(positions, holes);

        // 🎯 ZOOM IN: We don't create wumpus here anymore - it will be positioned in environment.js
        // at the farthest point from player
        let wumpus = []; // Will be filled in environment.js

        // Create golds (8 positions, but environment.js will ensure exactly 5)
        let golds = RandomUtils.getRandomElements(positions, 8);
        positions = ArrayUtils.removeByValues(positions, golds);

        return { holes, wumpus, golds };
    }

    /**
     * Get positions for gold ensuring they are spread out
     */
    static getSpreadOutGoldPositions(lines, columns, count, excludePositions = []) {
        let positions = ArrayUtils.getIndexes(lines, columns);
        
        // Remove excluded positions (player start, holes, etc.)
        positions = ArrayUtils.removeByValues(positions, excludePositions);
        
        if (positions.length < count) {
            console.warn("Not enough positions for gold!");
            return RandomUtils.getRandomElements(positions, Math.min(count, positions.length));
        }
        
        // Try to spread out gold positions
        let selected = [];
        RandomUtils.shuffle(positions);
        
        for (let i = 0; i < count; i++) {
            if (positions.length === 0) break;
            
            // Take the first position
            selected.push(positions[0]);
            positions.shift();
            
            // Remove positions too close to this one (optional)
            // This helps spread out the gold
            positions = positions.filter(pos => {
                let dx = Math.abs(pos[0] - selected[selected.length-1][0]);
                let dy = Math.abs(pos[1] - selected[selected.length-1][1]);
                return dx > 2 || dy > 2; // Keep positions that are at least 3 cells away
            });
        }
        
        // If we didn't get enough positions, add more randomly
        if (selected.length < count) {
            let remainingPositions = ArrayUtils.getIndexes(lines, columns);
            remainingPositions = ArrayUtils.removeByValues(remainingPositions, excludePositions);
            remainingPositions = ArrayUtils.removeByValues(remainingPositions, selected);
            
            let additional = RandomUtils.getRandomElements(remainingPositions, count - selected.length);
            selected = selected.concat(additional);
        }
        
        return selected;
    }

    /**
     * Find farthest position from player
     */
    static getFarthestPositionFromPlayer(lines, columns, playerPos = [0, 0], excludePositions = []) {
        let positions = ArrayUtils.getIndexes(lines, columns);
        
        // Remove excluded positions
        positions = ArrayUtils.removeByValues(positions, excludePositions);
        positions = ArrayUtils.removeByValues(positions, [playerPos]);
        
        if (positions.length === 0) {
            return [lines - 1, columns - 1]; // Default to bottom-right corner
        }
        
        let farthestPos = positions[0];
        let maxDistance = 0;
        
        // Calculate farthest position using Manhattan distance
        for (let pos of positions) {
            let distance = Math.abs(pos[0] - playerPos[0]) + Math.abs(pos[1] - playerPos[1]);
            
            // Bonus for being in corner (more strategic position)
            let cornerBonus = 0;
            if ((pos[0] === 0 || pos[0] === lines - 1) && (pos[1] === 0 || pos[1] === columns - 1)) {
                cornerBonus = 3; // Corners are good defensive positions
            }
            
            let totalScore = distance + cornerBonus;
            
            if (totalScore > maxDistance) {
                maxDistance = totalScore;
                farthestPos = pos;
            }
        }
        
        return farthestPos;
    }

    /**
     * Get strategic wumpus position (farthest from player and in a corner if possible)
     */
    static getStrategicWumpusPosition(lines, columns, holes, golds) {
        let playerPos = [0, 0];
        let excludePositions = [playerPos];
        
        // Add holes and golds to exclude positions
        excludePositions = excludePositions.concat(holes);
        excludePositions = excludePositions.concat(golds);
        
        // Try to get a corner position first
        let corners = [
            [lines - 1, columns - 1], // Bottom-right
            [lines - 1, 0],           // Bottom-left
            [0, columns - 1],         // Top-right
            [lines - 1, Math.floor(columns / 2)], // Bottom-middle
            [Math.floor(lines / 2), columns - 1]  // Right-middle
        ];
        
        // Check corners first
        for (let corner of corners) {
            if (!ArrayUtils.contains(excludePositions, corner)) {
                return corner;
            }
        }
        
        // If no corner available, get farthest position
        return RandomUtils.getFarthestPositionFromPlayer(lines, columns, playerPos, excludePositions);
    }
}