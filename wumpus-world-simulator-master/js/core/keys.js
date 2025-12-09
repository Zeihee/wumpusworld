
var Keys = function(up, left, right, down, upleft, upright, downleft, downright, space, enter) {
    var up = up || false,
        left = left || false,
        right = right || false,
        down = down || false,
        upleft = upleft || false,      // جديد: أعلى يسار
        upright = upright || false,    // جديد: أعلى يمين
        downleft = downleft || false,  // جديد: أسفل يسار
        downright = downright || false, // جديد: أسفل يمين
        space = space || false,
        enter = enter || false;

    var onKeyDown = function(e) {
        if(!isAlive || isFinished){
            return;
        }

        var that = this,
            c = e.keyCode;

        switch (c) {
            // Player 1 Controls (Arrow Keys) - دور اللاعب فقط
            case 37: // Left Arrow
                if (env.getCurrentTurn() === 'player') {
                    that.left = true;
                }
                break;
            case 38: // Up Arrow
                if (env.getCurrentTurn() === 'player') {
                    that.up = true;
                }
                break;
            case 39: // Right Arrow
                if (env.getCurrentTurn() === 'player') {
                    that.right = true;
                }
                break;
            case 40: // Down Arrow
                if (env.getCurrentTurn() === 'player') {
                    that.down = true;
                }
                break;
                
            // الحركات القطرية باستخدام مفاتيح WASD + Shift أو Ctrl
            case 81: // Q - أعلى يسار (Q = Up-Left)
                if (env.getCurrentTurn() === 'player') {
                    that.upleft = true;
                }
                break;
            case 69: // E - أعلى يمين (E = Up-Right)
                if (env.getCurrentTurn() === 'player') {
                    that.upright = true;
                }
                break;
            case 90: // Z - أسفل يسار (Z = Down-Left)
                if (env.getCurrentTurn() === 'player') {
                    that.downleft = true;
                }
                break;
            case 67: // C - أسفل يمين (C = Down-Right)
                if (env.getCurrentTurn() === 'player') {
                    that.downright = true;
                }
                break;
                
            case 32: // Space - إطلاق السهم (دور اللاعب) أو تأكيد حركة الوحش
                if (env.getCurrentTurn() === 'player') {
                    that.space = true;
                } else if (env.getCurrentTurn() === 'monster' && env.hasTargetCell) {
                    // تأكيد حركة الوحش (فقط إذا كان حياً)
                    if (env.isWumpusAliveFunc()) {
                        env.executeWumpusMove();
                    }
                }
                break;
            case 13: // Enter - التقاط الذهب (دور اللاعب) أو تأكيد حركة الوحش
                if (env.getCurrentTurn() === 'player') {
                    that.enter = true;
                } else if (env.getCurrentTurn() === 'monster' && env.hasTargetCell) {
                    // تأكيد حركة الوحش (فقط إذا كان حياً)
                    if (env.isWumpusAliveFunc()) {
                        env.executeWumpusMove();
                    }
                }
                break;
            
            // مفتاح Tab للتبديل بين الأدوار
            case 9: // Tab
                e.preventDefault();
                if (isAlive && !isFinished) {
                    // إذا كان الوحش ميتاً، لا يمكن التبديل
                    if (env.isWumpusAliveFunc()) {
                        env.switchTurn();
                        animate(); // تحديث الرسم
                    }
                }
                break;
                
            // مفتاح Escape لإلغاء اختيار الخلية
            case 27: // Escape
                if (env.getCurrentTurn() === 'monster' && env.hasTargetCell) {
                    env.targetCell = null;
                    env.hasTargetCell = false;
                    animate(); // تحديث الرسم
                }
                break;
        }
    };

    var onKeyUp = function(e) {
        var that = this,
            c = e.keyCode;
            
        switch (c) {
            // Player 1 Controls (Arrow Keys)
            case 37: // Left
                that.left = false;
                break;
            case 38: // Up
                that.up = false;
                break;
            case 39: // Right
                that.right = false;
                break;
            case 40: // Down
                that.down = false;
                break;
            case 81: // Q - أعلى يسار
                that.upleft = false;
                break;
            case 69: // E - أعلى يمين
                that.upright = false;
                break;
            case 90: // Z - أسفل يسار
                that.downleft = false;
                break;
            case 67: // C - أسفل يمين
                that.downright = false;
                break;
            case 32: // Space
                that.space = false;
                break;
            case 13: // Enter
                that.enter = false;
                break;
        }
    };

    return {
        up: up,
        left: left,
        right: right,
        down: down,
        upleft: upleft,
        upright: upright,
        downleft: downleft,
        downright: downright,
        space: space,
        enter: enter,
        onKeyDown: onKeyDown,
        onKeyUp: onKeyUp
    };
};