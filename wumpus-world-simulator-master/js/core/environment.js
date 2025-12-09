var Environment = function(i, j, width, height) {

    this.i = i;
    this.j = j;
    this.width = width;
    this.height = height;
    this.visible = [];
    this.holes = [];
    this.wumpus = [];
    this.golds = [];
    this.level = {};
    this.wumpusVision = [];
    this.wumpusAttackRange = 2;
    this.playerShootRange = 8;
    this.totalGolds = 5;
    this.isWumpusAlive = true;
    
    this.currentTurn = 'player';
    this.turnChanged = false;
    
    this.targetCell = null;
    this.hasTargetCell = false;
    
    this.gameStartTime = null;
    this.timeLimit = 180;
    this.timeRemaining = 180;
    this.timerInterval = null;
    this.isTimerRunning = false;
    this.timePaused = false;
    this.pauseStartTime = null;
    this.totalPausedTime = 0;
    this.lastUpdateTime = Date.now();
    
    this.playerMoves = 0;
    this.arrowsFired = 0;
    this.goldCollected = 0;
    this.wumpusKilled = 0;

    this.restart = function(){
        this.visible = this.getMatrix(this.i, this.j, 1);
        this.golds = ArrayUtils.copy(this.level.golds);
        this.holes = ArrayUtils.copy(this.level.holes);
        this.wumpusVision = this.getMatrix(this.i, this.j, 0);
        this.isWumpusAlive = true;
        this.totalGolds = 5;
        
        this.currentTurn = 'player';
        this.turnChanged = false;
        this.targetCell = null;
        this.hasTargetCell = false;
        
        this.timeRemaining = this.timeLimit;
        this.totalPausedTime = 0;
        this.timePaused = false;
        this.pauseStartTime = null;
        this.lastUpdateTime = Date.now();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.gameStartTime = Date.now();
        this.isTimerRunning = true;
        
        this.playerMoves = 0;
        this.arrowsFired = 0;
        this.goldCollected = 0;
        this.wumpusKilled = 0;

        this.positionWumpusFarFromPlayer();
        
        this.calculateWumpusVision();
        
        if (this.golds.length < 5) {
            while (this.golds.length < 5) {
                var randomI = Math.floor(Math.random() * this.i);
                var randomJ = Math.floor(Math.random() * this.j);
                
                if (!this.contains(this.golds, randomI, randomJ) && 
                    !this.contains(this.holes, randomI, randomJ) &&
                    (this.wumpus.length === 0 || (randomI !== this.wumpus[0][0] || randomJ !== this.wumpus[0][1])) &&
                    (randomI !== 0 || randomJ !== 0)) {
                    this.golds.push([randomI, randomJ]);
                }
            }
        } else if (this.golds.length > 5) {
            this.golds = this.golds.slice(0, 5);
        }
    };

    this.positionWumpusFarFromPlayer = function() {
        var playerX = 0;
        var playerY = 0;
        
        var farthestDistance = 0;
        var farthestPosition = [this.i - 1, this.j - 1];
        
        var potentialPositions = [
            [this.i - 1, this.j - 1],
            [0, this.j - 1],
            [this.i - 1, 0],
            [Math.floor(this.i / 2), this.j - 1],
            [this.i - 1, Math.floor(this.j / 2)]
        ];
        
        for (var i = 0; i < potentialPositions.length; i++) {
            var pos = potentialPositions[i];
            var distance = this.calculateDistance(playerX, playerY, pos[0], pos[1]);
            
            if (distance > farthestDistance) {
                if (!this.contains(this.holes, pos[0], pos[1]) && 
                    !this.contains(this.golds, pos[0], pos[1])) {
                    farthestDistance = distance;
                    farthestPosition = pos;
                }
            }
        }
        
        if (farthestDistance === 0) {
            for (var x = 0; x < this.i; x++) {
                for (var y = 0; y < this.j; y++) {
                    if (x === 0 && y === 0) continue;
                    
                    if (this.contains(this.holes, x, y) || this.contains(this.golds, x, y)) continue;
                    
                    var distance = this.calculateDistance(playerX, playerY, x, y);
                    
                    if (distance > farthestDistance) {
                        farthestDistance = distance;
                        farthestPosition = [x, y];
                    }
                }
            }
        }
        
        this.wumpus = [farthestPosition];
    };
    
    this.calculateDistance = function(x1, y1, x2, y2) {
        var dx = Math.abs(x1 - x2);
        var dy = Math.abs(y1 - y2);
        return Math.sqrt(dx * dx + dy * dy);
    };

    this.pauseTimer = function() {
        if (!this.timePaused && this.currentTurn === 'monster') {
            this.timePaused = true;
            this.pauseStartTime = Date.now();
            this.isTimerRunning = false;
        }
    };

    this.resumeTimer = function() {
        if (this.timePaused && this.currentTurn === 'player') {
            if (this.pauseStartTime) {
                var pauseDuration = Date.now() - this.pauseStartTime;
                this.totalPausedTime += pauseDuration;
            }
            
            this.timePaused = false;
            this.pauseStartTime = null;
            this.isTimerRunning = true;
        }
    };

    this.updateTimerByTurn = function() {
        if (this.currentTurn === 'player') {
            this.resumeTimer();
        } else {
            this.pauseTimer();
        }
    };

    this.updateTimer = function() {
        var currentTime = Date.now();
        var deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;
        
        if (this.currentTurn === 'player' && !this.timePaused) {
            this.timeRemaining -= deltaTime;
            
            if (this.timeRemaining < 0) {
                this.timeRemaining = 0;
            }
            
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.isTimerRunning = false;
                this.timePaused = false;
                
                setTimeout(() => {
                    if (window.isAlive && !window.isFinished) {
                        window.isAlive = false;
                        this.showTimeOutModal();
                    }
                }, 100);
            }
        }
    };

    this.stopTimer = function() {
        this.isTimerRunning = false;
        this.timePaused = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    };
    
    this.updateTimerDisplay = function() {
        var minutes = Math.floor(this.timeRemaining / 60);
        var seconds = Math.floor(this.timeRemaining % 60);
        var timeString = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
        
        var timerElement = document.getElementById('timer-bar-display');
        var timerBar = document.getElementById('timer-bar');
        var timerFill = document.getElementById('timer-bar-fill');
        var goldCounter = document.getElementById('gold-counter');
        var turnIndicator = document.getElementById('timer-turn-indicator');
        
        if (timerElement) {
            timerElement.textContent = timeString;
            
            if (turnIndicator) {
                if (this.currentTurn === 'player' && !this.timePaused) {
                    turnIndicator.textContent = "⏱️ الوقت يجري...";
                    turnIndicator.style.color = "#27ae60";
                } else {
                    turnIndicator.textContent = "⏸️ الوقت متوقف (دور الوحش)";
                    turnIndicator.style.color = "#7f8c8d";
                }
            }
            
            if (timerFill) {
                var progressPercent = (this.timeRemaining / this.timeLimit) * 100;
                timerFill.style.width = progressPercent + '%';
                
                if (this.currentTurn === 'monster' || this.timePaused) {
                    timerFill.style.background = 'linear-gradient(90deg, #7f8c8d, #95a5a6)';
                    if (timerBar) {
                        timerBar.className = 'timer-bar-container timer-bar-paused';
                    }
                    timerElement.style.color = '#7f8c8d';
                } else {
                    if (this.timeRemaining <= 30) {
                        timerFill.style.background = 'linear-gradient(90deg, var(--color-danger), #c0392b)';
                        if (timerBar) {
                            timerBar.className = 'timer-bar-container timer-bar-danger';
                        }
                        timerElement.style.color = 'var(--color-timer-danger)';
                    } else if (this.timeRemaining <= 60) {
                        timerFill.style.background = 'linear-gradient(90deg, var(--color-warning), #e67e22)';
                        if (timerBar) {
                            timerBar.className = 'timer-bar-container timer-bar-warning';
                        }
                        timerElement.style.color = 'var(--color-timer-warning)';
                    } else {
                        timerFill.style.background = 'linear-gradient(90deg, var(--color-timer-normal), #27ae60)';
                        if (timerBar) {
                            timerBar.className = 'timer-bar-container';
                        }
                        timerElement.style.color = 'var(--color-timer-normal)';
                    }
                }
            }
        }
        
        if (goldCounter) {
            var collected = this.totalGolds - this.golds.length;
            goldCounter.textContent = 'ذهب: ' + collected + '/' + this.totalGolds;
        }
    };
    
    this.showTimeOutModal = function() {
        if (window.resources) {
            window.resources.play("game-over");
            window.resources.stop("theme");
        }
        
        document.getElementById('timeout-reason').textContent = 'انتهى الوقت! لم تتمكن من جمع كل الذهب في الوقت المحدد';
        
        if (player) {
            document.getElementById('timeout-score').textContent = player.score;
            document.getElementById('timeout-gold').textContent = player.goldCollected;
        }
        
        $('#modal-timeout').modal('show');
    };

    this.setPlayerShootRange = function(newRange) {
        if (newRange >= 1 && newRange <= 12) {
            this.playerShootRange = newRange;
            return true;
        }
        return false;
    };

    this.setWumpusAttackRange = function(newRange) {
        if (newRange >= 1 && newRange <= 5) {
            this.wumpusAttackRange = newRange;
            return true;
        }
        return false;
    };

    this.setTimeLimit = function(minutes) {
        if (minutes >= 1 && minutes <= 10) {
            var seconds = minutes * 60;
            this.timeLimit = seconds;
            this.timeRemaining = seconds;
            
            this.totalPausedTime = 0;
            this.timePaused = false;
            this.pauseStartTime = null;
            this.lastUpdateTime = Date.now();
            
            this.updateTimerDisplay();
            return true;
        }
        return false;
    };

    this.drawGrid = function(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (var i = 0; i <= this.i; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.width, 0);
            ctx.lineTo(i * this.width, this.j * this.height);
            ctx.stroke();
        }
        
        for (var j = 0; j <= this.j; j++) {
            ctx.beginPath();
            ctx.moveTo(0, j * this.height);
            ctx.lineTo(this.i * this.width, j * this.height);
            ctx.stroke();
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        
        for (var i = 0; i <= this.i; i += 3) {
            ctx.beginPath();
            ctx.moveTo(i * this.width, 0);
            ctx.lineTo(i * this.width, this.j * this.height);
            ctx.stroke();
        }
        
        for (var j = 0; j <= this.j; j += 3) {
            ctx.beginPath();
            ctx.moveTo(0, j * this.height);
            ctx.lineTo(this.i * this.width, j * this.height);
            ctx.stroke();
        }
    };

    this.randomInitialization = function(){
        this.level = RandomUtils.getRandomLevel(this.i, this.j);
        
        if (!this.level.golds || this.level.golds.length < 5) {
            this.level.golds = [];
            for (var k = 0; k < 5; k++) {
                var randomI = Math.floor(Math.random() * this.i);
                var randomJ = Math.floor(Math.random() * this.j);
                
                var exists = false;
                for (var l = 0; l < this.level.golds.length; l++) {
                    if (this.level.golds[l][0] === randomI && this.level.golds[l][1] === randomJ) {
                        exists = true;
                        break;
                    }
                }
                
                if (!exists && (randomI !== 0 || randomJ !== 0)) {
                    this.level.golds.push([randomI, randomJ]);
                } else {
                    k--;
                }
            }
        }
        
        this.restart();
    };

    this.getMatrix = function(maxI, maxJ, initialValue){
        var matrix = new Array(maxI);
        for (var i = 0; i < maxI; i++) {
            matrix[i] = new Array(maxJ);
            for (var j = 0; j < maxJ; j++) {
                matrix[i][j] = initialValue;
            }
        }
        return matrix;
    };

    this.removeGold = function(gold){
        this.golds = ArrayUtils.removeByValues(this.golds, [gold]);
        this.goldCollected++;
        this.updateStatsDisplay();
    };

    this.removeWumpus = function(){
        this.wumpus = [];
        this.wumpusVision = this.getMatrix(this.i, this.j, 0);
        this.isWumpusAlive = false;
        this.wumpusKilled++;
        
        this.currentTurn = 'player';
        this.resumeTimer();
        
        this.updateStatsDisplay();
    };

    this.contains = function(array, i, j){
        return this.get(array, i, j) != false;
    };

    this.get = function(array, i, j){
        return ArrayUtils.search(array, [i, j]);
    };

    this.updateStatsDisplay = function() {
        var stats = {
            'stat-moves': this.playerMoves,
            'stat-gold-collected': this.goldCollected,
            'stat-arrows-used': this.arrowsFired,
            'stat-wumpus-killed': this.wumpusKilled
        };
        
        for (var id in stats) {
            var element = document.getElementById(id);
            if (element) {
                element.textContent = stats[id];
            }
        }
    };

    this.incrementPlayerMoves = function() {
        this.playerMoves++;
        this.updateStatsDisplay();
    };

    this.incrementArrowsFired = function() {
        this.arrowsFired++;
        this.updateStatsDisplay();
    };

    this.switchTurn = function() {
        if (!this.isWumpusAlive) {
            this.currentTurn = 'player';
            this.resumeTimer();
            return;
        }
        
        if (this.currentTurn === 'player') {
            this.currentTurn = 'monster';
            this.hasTargetCell = false;
            this.targetCell = null;
            this.pauseTimer();
        } else {
            this.currentTurn = 'player';
            this.resumeTimer();
        }
        this.turnChanged = true;
    };

    this.getCurrentTurn = function() {
        return this.currentTurn;
    };

    this.isWumpusAliveFunc = function() {
        return this.isWumpusAlive && this.wumpus.length > 0;
    };

    this.calculateWumpusVision = function() {
        if (this.wumpus.length == 0) return;
        
        let w = this.wumpus[0];
        let wx = w[0];
        let wy = w[1];
        
        this.wumpusVision = this.getMatrix(this.i, this.j, 0);
        
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
        ];
        
        for (let dir of directions) {
            let [dx, dy] = dir;
            let x = wx + dx;
            let y = wy + dy;
            
            while (x >= 0 && x < this.i && y >= 0 && y < this.j) {
                this.wumpusVision[x][y] = 1;
                x += dx;
                y += dy;
            }
        }
        
        this.wumpusVision[wx][wy] = 1;
    };

    this.setWumpusTarget = function(i, j) {
        if (!this.isWumpusAlive) return false;
        
        if (this.currentTurn !== 'monster') return false;
        
        if (this.isValidMoveForWumpus(i, j)) {
            this.targetCell = [i, j];
            this.hasTargetCell = true;
            return true;
        }
        return false;
    };

    this.executeWumpusMove = function() {
        if (!this.isWumpusAlive) return false;
        
        if (!this.hasTargetCell || !this.targetCell || this.wumpus.length == 0) return false;
        
        let w = this.wumpus[0];
        let [targetI, targetJ] = this.targetCell;
        
        if (!this.isValidMoveForWumpus(targetI, targetJ)) {
            this.targetCell = null;
            this.hasTargetCell = false;
            return false;
        }
        
        w[0] = targetI;
        w[1] = targetJ;
        
        if (window.resources && window.resources.play) {
            try {
                resources.play("move");
            } catch(e) {}
        }
        
        this.targetCell = null;
        this.hasTargetCell = false;
        this.calculateWumpusVision();
        
        this.switchTurn();
        
        return true;
    };

    this.isValidMoveForWumpus = function(targetI, targetJ) {
        if (this.wumpus.length == 0) return false;
        
        let w = this.wumpus[0];
        let wx = w[0];
        let wy = w[1];
        
        if (wx === targetI && wy === targetJ) return false;
        
        if (wy === targetJ) return true;
        
        if (wx === targetI) return true;
        
        let di = Math.abs(wx - targetI);
        let dj = Math.abs(wy - targetJ);
        
        return di === dj;
    };

    this.canWumpusAttack = function(player) {
        if (!this.isWumpusAlive || this.wumpus.length == 0) return false;
        
        let w = this.wumpus[0];
        let playerX = player.getPosI();
        let playerY = player.getPosJ();
        
        let dx = Math.abs(w[0] - playerX);
        let dy = Math.abs(w[1] - playerY);
        
        return (dx <= this.wumpusAttackRange && dy <= this.wumpusAttackRange);
    };

    this.getDistanceFromWumpus = function(player) {
        if (!this.isWumpusAlive || this.wumpus.length == 0) return Infinity;
        
        let w = this.wumpus[0];
        let playerX = player.getPosI();
        let playerY = player.getPosJ();
        
        let dx = Math.abs(w[0] - playerX);
        let dy = Math.abs(w[1] - playerY);
        
        return Math.max(dx, dy);
    };

    this.canPlayerShootWumpus = function(player) {
        if (!this.isWumpusAlive || this.wumpus.length == 0) return false;
        
        let distance = this.getDistanceFromWumpus(player);
        
        return distance <= this.playerShootRange;
    };

    this.getShootCoveragePercent = function() {
        let totalCells = this.i * this.j;
        let coveredCells = Math.PI * Math.pow(this.playerShootRange, 2);
        return Math.min(100, Math.round((coveredCells / totalCells) * 100));
    };

    this.hasAllGoldCollected = function() {
        return this.golds.length === 0;
    };

    this.getGoldCollectionPercent = function() {
        let collected = this.totalGolds - this.golds.length;
        return Math.round((collected / this.totalGolds) * 100);
    };

    this.hasAWumpus = function(player){
        if (!this.isWumpusAlive || this.wumpus.length == 0) return false;
        
        let w = this.wumpus[0];
        
        let onSameCell = (w[0] == player.getPosI() && w[1] == player.getPosJ());
        
        let canAttack = this.canWumpusAttack(player);
        
        return onSameCell || canAttack;
    };

    this.hasAHole = function(player){
        for (let i = 0; i < this.holes.length; i++) {
            const hole = this.holes[i];
            if (hole[0] == player.getPosI() && hole[1] == player.getPosJ()) {
                return true;
            }
        }
        return false;
    };

    this.draw = function(ctx) {
        let breeze = "Breeze";
        let stench = "Stench";
        
        try {
            if ($.i18n) {
                breeze = $.i18n("breeze") || breeze;
                stench = $.i18n("stench") || stench;
            }
        } catch(e) {}

        for (var i = 0; i < this.i; i++) {
            for (var j = 0; j < this.j; j++) {
                if (resources.images['floor']) {
                    ctx.drawImage(resources.images['floor'], i*this.width, j*this.height, this.width, this.height);
                    
                    if (this.isWumpusAlive && this.wumpusVision[i] && this.wumpusVision[i][j] === 1) {
                        ctx.fillStyle = 'rgba(231, 76, 60, 0.08)';
                        ctx.fillRect(i*this.width, j*this.height, this.width, this.height);
                    }
                    
                    if (this.targetCell && this.targetCell[0] === i && this.targetCell[1] === j) {
                        ctx.fillStyle = 'rgba(243, 156, 18, 0.4)';
                        ctx.fillRect(i*this.width, j*this.height, this.width, this.height);
                        
                        ctx.strokeStyle = 'rgba(243, 156, 18, 0.8)';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(
                            i*this.width + this.width/2,
                            j*this.height + this.height/2,
                            this.width/2 - 5,
                            0, Math.PI * 2
                        );
                        ctx.stroke();
                    }
                }
            }
        }
        
        this.drawGrid(ctx);

        for (let i = 0; i < this.holes.length; i++) {
            const hole = this.holes[i];
            if (resources.images['hole']) {
                ctx.drawImage(resources.images['hole'], hole[0]*this.width, hole[1]*this.height, this.width, this.height);
            }
            this.drawText(ctx, breeze, hole[0], hole[1] + 1, 3);
        }

        if (this.isWumpusAlive && this.wumpus.length > 0) {
            const w = this.wumpus[0];
            if (resources.images['wumpus']) {
                ctx.drawImage(resources.images['wumpus'], w[0]*this.width, w[1]*this.height, this.width, this.height);
                
                ctx.strokeStyle = 'rgba(231, 76, 60, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(
                    w[0]*this.width + this.width/2,
                    w[1]*this.height + this.height/2,
                    this.wumpusAttackRange * this.width,
                    0, Math.PI * 2
                );
                ctx.stroke();
                
                ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
                ctx.beginPath();
                ctx.arc(
                    w[0]*this.width + this.width/2,
                    w[1]*this.height + this.height/2,
                    this.wumpusAttackRange * this.width,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
            this.drawText(ctx, stench, w[0], w[1]+1, 14);
            
            if (this.currentTurn === 'monster') {
                ctx.font = "bold 12px Arial";
                ctx.fillStyle = "#e74c3c";
                ctx.textAlign = "center";
                ctx.fillText("👹 دور الوحش", w[0]*this.width + this.width/2, w[1]*this.height - 10);
            }
        }

        for (let i = 0; i < this.golds.length; i++) {
            const gold = this.golds[i];
            if (resources.images['floor_gold']) {
                ctx.drawImage(resources.images['floor_gold'], gold[0]*this.width, gold[1]*this.height, this.width, this.height);
            }
            if (resources.images['gold']) {
                ctx.drawImage(resources.images['gold'], gold[0]*this.width, gold[1]*this.height, this.width, this.height);
                
                ctx.font = "bold 16px Arial";
                ctx.fillStyle = "gold";
                ctx.textAlign = "center";
                ctx.fillText((i+1).toString(), gold[0]*this.width + this.width/2, gold[1]*this.height + this.height/2 + 5);
            }
        }
    };

    this.drawText = function(ctx, text, i, j, offset){
        ctx.font = "10px Verdana";
        ctx.fillStyle = "white";
        ctx.textBaseline = "hanging";
        ctx.fillText(text, i*this.width+2, j*this.height+offset);
    };

    this.randomInitialization();
};