var FACING_TO_UP = 1,
    FACING_TO_DOWN = 2,
    FACING_TO_LEFT = 3,
    FACING_TO_RIGHT = 4,
    FACING_TO_UP_LEFT = 5,
    FACING_TO_UP_RIGHT = 6,
    FACING_TO_DOWN_LEFT = 7,
    FACING_TO_DOWN_RIGHT = 8;

var Player = function(env, x, y) {
    this.x = x;
    this.y = y;
    this.env = env;
    this.speed = this.env.height;
    this.direction = FACING_TO_DOWN;
    this.score = 0;
    this.arrow = 3;
    this.goldCollected = 0;

    this.markAsVisible = function(){
        this.env.visible[this.getPosI()][this.getPosJ()] = 1;
    };

    this.kill = function(keys) {
        if (keys.space) {
            if (!this.env.isWumpusAliveFunc()) {
                console.log("❌ الوحش ميت بالفعل!");
                if (resources && resources.play) resources.play("error");
                return false;
            }
            
            if (this.arrow == 0) {
                console.log("❌ ليس لديك سهام!");
                if (resources && resources.play) resources.play("error");
                return false;
            }
            if (this.env.getCurrentTurn() !== 'player') {
                console.log("❌ ليس دورك!");
                if (resources && resources.play) resources.play("error");
                return false;
            }
            
            if (!this.env.canPlayerShootWumpus(this)) {
                console.log("❌ الوحش خارج نطاق السهم!");
                if (resources && resources.play) resources.play("error");
                return false;
            }
            
            this.arrow--;
            this.env.incrementArrowsFired();
            keys.space = false;
            
            let w = this.env.wumpus[0];
            let playerX = this.getPosI();
            let playerY = this.getPosJ();
            
            let dx = Math.abs(w[0] - playerX);
            let dy = Math.abs(w[1] - playerY);
            let distance = Math.max(dx, dy);
            
            let successRate = this.calculateSuccessRate(distance);
            let isSuccess = Math.random() < successRate;
            
            if (isSuccess) {
                console.log("🎯 أصبت الوحش!");
                this.env.removeWumpus();
                if (resources && resources.play) resources.play("arrow");
                
                let scoreBonus = this.calculateScoreBonus(distance);
                this.score += scoreBonus;
                
                return true;
            } else {
                console.log("❌ أخطأت السهم!");
                if (resources && resources.play) resources.play("error");
                this.score -= 30;
                return false;
            }
        }
        return false;
    };

    this.capture = function(keys) {
        var capturedGold = null;
        if (keys.enter) {
            if (this.env.getCurrentTurn() !== 'player') {
                console.log("❌ ليس دورك!");
                return null;
            }
            
            keys.enter = false;
            capturedGold = this.env.get(this.env.golds, this.getPosI(), this.getPosJ());
            
            if (capturedGold) {
                console.log("💰 جمعت ذهب!");
                this.goldCollected++;
                this.score += 1000;
                
                if (this.env.hasAllGoldCollected()) {
                    console.log("🎉 جمعت كل الذهب!");
                    if (this.env.stopTimer) {
                        this.env.stopTimer();
                    }
                    setTimeout(function() {
                        isFinished = true;
                        $("#modal-win").modal("show");
                        if (resources && resources.play) resources.play("win");
                        if (resources && resources.stop) resources.stop("theme");
                    }, 500);
                }
            } else {
                console.log("❌ لا يوجد ذهب هنا!");
            }
        }
        return capturedGold;
    };

    this.update = function(keys) {
        if (this.env.getCurrentTurn() !== 'player') {
            return false;
        }
        
        var prevX = this.x,
            prevY = this.y;

        if (keys.up) {
            if(this.direction == FACING_TO_UP && this.y > 0){
                this.y -= this.speed;
                if (resources && resources.play) resources.play("move");
                this.env.incrementPlayerMoves();
                
                if (this.env.updateTimerByTurn) {
                    this.env.updateTimerByTurn();
                }
                
                if (this.env.isWumpusAliveFunc()) {
                    this.env.switchTurn();
                }
            } else {
                this.direction = FACING_TO_UP;
            }
        } else if (keys.down) {
            if(this.direction == FACING_TO_DOWN && this.y + this.speed < this.env.j*this.env.height){
                this.y += this.speed;
                if (resources && resources.play) resources.play("move");
                this.env.incrementPlayerMoves();
                
                if (this.env.updateTimerByTurn) {
                    this.env.updateTimerByTurn();
                }
                
                if (this.env.isWumpusAliveFunc()) {
                    this.env.switchTurn();
                }
            } else {
                this.direction = FACING_TO_DOWN;
            }
        } else if (keys.left) {
            if(this.direction == FACING_TO_LEFT && this.x > 0){
                this.x -= this.speed;
                if (resources && resources.play) resources.play("move");
                this.env.incrementPlayerMoves();
                
                if (this.env.updateTimerByTurn) {
                    this.env.updateTimerByTurn();
                }
                
                if (this.env.isWumpusAliveFunc()) {
                    this.env.switchTurn();
                }
            } else {
                this.direction = FACING_TO_LEFT;
            }
        } else if (keys.right) {
            if(this.direction == FACING_TO_RIGHT && this.x + this.speed < this.env.i*this.env.width){
                this.x += this.speed;
                if (resources && resources.play) resources.play("move");
                this.env.incrementPlayerMoves();
                
                if (this.env.updateTimerByTurn) {
                    this.env.updateTimerByTurn();
                }
                
                if (this.env.isWumpusAliveFunc()) {
                    this.env.switchTurn();
                }
            } else {
                this.direction = FACING_TO_RIGHT;
            }
        } else if (keys.upleft) {
            if(this.direction == FACING_TO_UP_LEFT && this.x > 0 && this.y > 0){
                this.x -= this.speed;
                this.y -= this.speed;
                if (resources && resources.play) resources.play("move");
                this.env.incrementPlayerMoves();
                
                if (this.env.updateTimerByTurn) {
                    this.env.updateTimerByTurn();
                }
                
                if (this.env.isWumpusAliveFunc()) {
                    this.env.switchTurn();
                }
            } else {
                this.direction = FACING_TO_UP_LEFT;
            }
        } else if (keys.upright) {
            if(this.direction == FACING_TO_UP_RIGHT && 
               this.x + this.speed < this.env.i*this.env.width && 
               this.y > 0){
                this.x += this.speed;
                this.y -= this.speed;
                if (resources && resources.play) resources.play("move");
                this.env.incrementPlayerMoves();
                
                if (this.env.updateTimerByTurn) {
                    this.env.updateTimerByTurn();
                }
                
                if (this.env.isWumpusAliveFunc()) {
                    this.env.switchTurn();
                }
            } else {
                this.direction = FACING_TO_UP_RIGHT;
            }
        } else if (keys.downleft) {
            if(this.direction == FACING_TO_DOWN_LEFT && 
               this.x > 0 && 
               this.y + this.speed < this.env.j*this.env.height){
                this.x -= this.speed;
                this.y += this.speed;
                if (resources && resources.play) resources.play("move");
                this.env.incrementPlayerMoves();
                
                if (this.env.updateTimerByTurn) {
                    this.env.updateTimerByTurn();
                }
                
                if (this.env.isWumpusAliveFunc()) {
                    this.env.switchTurn();
                }
            } else {
                this.direction = FACING_TO_DOWN_LEFT;
            }
        } else if (keys.downright) {
            if(this.direction == FACING_TO_DOWN_RIGHT && 
               this.x + this.speed < this.env.i*this.env.width && 
               this.y + this.speed < this.env.j*this.env.height){
                this.x += this.speed;
                this.y += this.speed;
                if (resources && resources.play) resources.play("move");
                this.env.incrementPlayerMoves();
                
                if (this.env.updateTimerByTurn) {
                    this.env.updateTimerByTurn();
                }
                
                if (this.env.isWumpusAliveFunc()) {
                    this.env.switchTurn();
                }
            } else {
                this.direction = FACING_TO_DOWN_RIGHT;
            }
        }

        this.markAsVisible();

        keys.up = keys.down = keys.left = keys.right = 
        keys.upleft = keys.upright = keys.downleft = keys.downright = false;

        if (this.env.hasAHole(this) || this.env.hasAWumpus(this)) {
            if (isAlive) {
                isAlive = false;
                
                if (this.env.hasAHole(this)) {
                    console.log("🕳️ سقطت في حفرة!");
                } else {
                    console.log("💀 الوحش هاجمك!");
                }
                
                if (this.env.stopTimer) {
                    this.env.stopTimer();
                }
                
                setTimeout(function() {
                    if (resources && resources.stop) {
                        resources.stop("theme");
                    }
                    if (resources && resources.play) {
                        resources.play("game-over");
                    }
                    $("#modal-game-over").modal("show");
                }, 300);
            }
            return (prevX != this.x || prevY != this.y);
        }

        return (prevX != this.x || prevY != this.y);
    };

    this.getPosI = function(){
        return Math.floor(this.x / this.env.width);
    };

    this.getPosJ = function(){
        return Math.floor(this.y / this.env.height);
    };

    this.draw = function(ctx) {
        if(this.direction == FACING_TO_DOWN){
            ctx.drawImage(resources.images['facing_to_down'], this.x, this.y, this.env.width, this.env.height);
        } else if(this.direction == FACING_TO_UP){
            ctx.drawImage(resources.images['facing_to_up'], this.x, this.y, this.env.width, this.env.height);
        } else if(this.direction == FACING_TO_LEFT){
            ctx.drawImage(resources.images['facing_to_left'], this.x, this.y, this.env.width, this.env.height);
        } else if(this.direction == FACING_TO_RIGHT){
            ctx.drawImage(resources.images['facing_to_right'], this.x, this.y, this.env.width, this.env.height);
        } else if(this.direction == FACING_TO_UP_LEFT){
            ctx.drawImage(resources.images['facing_to_left'], this.x, this.y, this.env.width, this.env.height);
        } else if(this.direction == FACING_TO_UP_RIGHT){
            ctx.drawImage(resources.images['facing_to_right'], this.x, this.y, this.env.width, this.env.height);
        } else if(this.direction == FACING_TO_DOWN_LEFT){
            ctx.drawImage(resources.images['facing_to_left'], this.x, this.y, this.env.width, this.env.height);
        } else if(this.direction == FACING_TO_DOWN_RIGHT){
            ctx.drawImage(resources.images['facing_to_right'], this.x, this.y, this.env.width, this.env.height);
        }
        
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("🗡️ " + this.arrow, this.x + this.env.width/2, this.y - 10);
        
        if (this.env.getCurrentTurn() === 'player' && this.env.isWumpusAliveFunc()) {
            let distance = this.env.getDistanceFromWumpus(this);
            let shootRange = this.env.playerShootRange;
            
            if (distance <= shootRange) {
                ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(
                    this.x + this.env.width/2,
                    this.y + this.env.height/2,
                    this.env.width * shootRange,
                    0, Math.PI * 2
                );
                ctx.stroke();
                
                ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
                ctx.beginPath();
                ctx.arc(
                    this.x + this.env.width/2,
                    this.y + this.env.height/2,
                    this.env.width * shootRange,
                    0, Math.PI * 2
                );
                ctx.fill();
                
                let successRate = this.calculateSuccessRate(distance);
                ctx.fillStyle = distance <= this.env.wumpusAttackRange ? "#e74c3c" : "#3498db";
                ctx.font = "bold 11px Arial";
                ctx.fillText("نطاق: " + distance + "/" + shootRange, this.x + this.env.width/2, this.y - 25);
                ctx.fillText("نجاح: " + Math.round(successRate * 100) + "%", this.x + this.env.width/2, this.y - 40);
            }
        }
        
        if (this.env.getCurrentTurn() === 'player') {
            ctx.font = "bold 10px Arial";
            ctx.fillStyle = "#2ecc71";
            ctx.textAlign = "center";
            ctx.fillText("👤 دورك", this.x + this.env.width/2, this.y + this.env.height + 15);
        }
    };
    
    this.calculateSuccessRate = function(distance) {
        if (distance >= 8) return 0.3;
        else if (distance === 7) return 0.4;
        else if (distance === 6) return 0.5;
        else if (distance === 5) return 0.6;
        else if (distance === 4) return 0.7;
        else if (distance === 3) return 0.8;
        else if (distance === 2) return 0.9;
        else if (distance === 1) return 0.95;
        return 1.0;
    };
    
    this.calculateScoreBonus = function(distance) {
        if (distance >= 8) return 2500;
        else if (distance === 7) return 2300;
        else if (distance === 6) return 2100;
        else if (distance === 5) return 1900;
        else if (distance === 4) return 1700;
        else if (distance === 3) return 1500;
        else if (distance === 2) return 1300;
        else if (distance === 1) return 1100;
        return 1000;
    };
};