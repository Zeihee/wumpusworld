var canvas,
    ctx,
    keys,
    env,
    isAlive = true,
    isFinished = false,
    player;

var gameStats = {
    moves: 0,
    goldCollected: 0,
    arrowsUsed: 0,
    wumpusKilled: 0
};

function restart(){
    if (!env){
        env = new Environment(15, 8, 64, 64);
    }

    if (isFinished) {
        env = new Environment(15, 8, 64, 64);
    } else {
        env.restart();
    }

    player = new Player(env, 0, 0);

    $("#modal-win").modal("hide");
    $("#modal-game-over").modal("hide");
    $("#modal-timeout").modal("hide");

    gameStats = {
        moves: 0,
        goldCollected: 0,
        arrowsUsed: 0,
        wumpusKilled: 0
    };
    updateStatsDisplay();

    resources.stop("game-over");
    resources.stop("win");
    resources.stop("theme");
    
    setTimeout(function() {
        resources.play("theme", false);
    }, 500);

    isAlive = true;
    isFinished = false;

    animate();
}

function resizeCanvas(){
    canvas.width = env.width * env.i;
    canvas.height = env.height * env.j;
}

function onKeydown(e) {
    keys.onKeyDown(e);
    animate();
};

function onKeyup(e) {
    keys.onKeyUp(e);
};

function onMouseClick(e) {
    if (!isAlive || isFinished || env.getCurrentTurn() !== 'monster') return;
    
    if (!env.isWumpusAliveFunc()) {
        console.log("❌ الوحش ميت، لا يمكن التحكم به!");
        return;
    }
    
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    
    var cellI = Math.floor(x / env.width);
    var cellJ = Math.floor(y / env.height);
    
    if (cellI >= 0 && cellI < env.i && cellJ >= 0 && cellJ < env.j) {
        if (env.setWumpusTarget(cellI, cellJ)) {
            animate();
            console.log("✅ الخلية المختارة: [" + cellI + ", " + cellJ + "]");
        }
    }
}

function update(){
    if (player.update(keys)) {
        player.score -= 10;
    }

    var deadWumpus = player.kill(keys);

    var capturedGold = player.capture(keys);

    if (capturedGold) {
        env.removeGold(capturedGold);
        resources.play("gold");
        
        if (env.hasAllGoldCollected()){
            isFinished = true;
            displayCongratulations();
        }
    }

    updateUI();
    updateTimerDisplay();
}

function updateUI() {
    $("#score").html(player.score);
    $("#arrow").html(player.arrow);
    $("#gold").html(env.golds.length);
    
    updateGoldProgress();
    updateWumpusStatus();
    updateRangeDisplay();
}

function updateGoldProgress() {
    if (env && env.getGoldCollectionPercent) {
        var percent = env.getGoldCollectionPercent();
        $("#gold-progress").html(percent + "%");
        $("#gold-progress-fill").css("width", percent + "%");
    }
}

function updateWumpusStatus() {
    if (env) {
        var isAlive = env.isWumpusAliveFunc ? env.isWumpusAliveFunc() : true;
        if (isAlive) {
            $("#wumpus-status").html("حي").removeClass("wumpus-status-dead").addClass("wumpus-status-alive");
        } else {
            $("#wumpus-status").html("ميت").removeClass("wumpus-status-alive").addClass("wumpus-status-dead");
        }
    }
}

function updateRangeDisplay() {
    if (env) {
        $("#player-range-value").html(env.playerShootRange + " مربعات");
        $("#wumpus-range-value").html(env.wumpusAttackRange + " مربعات");
        $("#time-range-value").html(Math.floor(env.timeLimit / 60) + " دقائق");
    }
}

function updateTimerDisplay() {
    if (env && env.timeRemaining !== undefined) {
        var minutes = Math.floor(env.timeRemaining / 60);
        var seconds = Math.floor(env.timeRemaining % 60);
        var timeString = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
        
        $("#timer-bar-display").text(timeString);
        
        if (env.timeRemaining <= 30) {
            $("#timer-bar").removeClass("timer-bar-warning").addClass("timer-bar-danger");
        } else if (env.timeRemaining <= 60) {
            $("#timer-bar").removeClass("timer-bar-danger").addClass("timer-bar-warning");
        } else {
            $("#timer-bar").removeClass("timer-bar-warning timer-bar-danger");
        }
        
        var progressPercent = (env.timeRemaining / env.timeLimit) * 100;
        $("#timer-bar-fill").css("width", progressPercent + "%");
    }
}

function updateStatsDisplay() {
    $("#stat-moves").html(gameStats.moves);
    $("#stat-gold-collected").html(gameStats.goldCollected);
    $("#stat-arrows-used").html(gameStats.arrowsUsed);
    $("#stat-wumpus-killed").html(gameStats.wumpusKilled);
}

function displayGameOver(){
    $("#modal-game-over").modal("show");
    resources.play("game-over", false);
    resources.stop("theme");
    
    if (player) {
        $("#final-score").html(player.score);
        $("#final-gold").html(player.goldCollected);
    }
}

function displayCongratulations(){
    $("#modal-win").modal("show");
    resources.play("win", false);
    resources.stop("theme");
    
    if (player) {
        $("#win-score").html(player.score);
        $("#win-gold").html(player.goldCollected);
    }
}

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (env) {
        env.draw(ctx);
    }

    if (player) {
        player.draw(ctx);
    }
}

function animate(){
    update();
    draw();
    
    if (env && env.updateTimer) {
        env.updateTimer();
    }
    
    if (isAlive && !isFinished) {
        requestAnimationFrame(animate);
    }
}

function getURL(){
    var url = "{";
    url += "\"holes\":" + encodeToArray(env.holes) + ",";
    url += "\"golds\":" + encodeToArray(env.golds) + ",";
    url += "\"wumpus\":" + encodeToArray(env.wumpus) + "}";
    return "#" + btoa(url);
}

function encodeToArray(array){
    return JSON.stringify(array);
}

function getLink(){
    return window.location.href+getURL();
}

function loadEnvironment(hash){
    var link = atob(hash.replace('#', ''));
    var obj = $.parseJSON(link);
    env.holes = obj.holes;
    env.golds = obj.golds;
    env.wumpus = obj.wumpus;
    animate();
}

function getCurrentVolume(){
    return localStorage.getItem("wws-volume") || 0.5;
}

function changeVolumeTo(level){
    console.log("Changing volume to", level);
    Howler.volume(level);
    localStorage.setItem("wws-volume", level);
}

function getCurrentLanguage(){
    return localStorage.getItem("wws-locale") || 'ar';
}

function changeLanguageTo(locale){
    console.log("Changing language to", locale);
    
    if (locale == "ar") {
        $("html").attr("dir", "rtl");
        $("body").addClass("rtl");
    } else {
        $("html").attr("dir", "ltr");
        $("body").removeClass("rtl");
    }

    $.i18n().locale = locale;
    $('body').i18n();
    $('#select-language').selectpicker('refresh');
    localStorage.setItem("wws-locale", locale);
    draw();
}

function updatePlayerRange() {
    var range = parseInt($("#btn-player-range").val());
    if (range >= 1 && range <= 10 && env) {
        env.setPlayerShootRange(range);
        updateRangeDisplay();
    }
}

function updateWumpusRange() {
    var range = parseInt($("#btn-wumpus-range").val());
    if (range >= 1 && range <= 5 && env) {
        env.setWumpusAttackRange(range);
        updateRangeDisplay();
    }
}

function updateTimeRange() {
    var minutes = parseInt($("#btn-time-range").val());
    if (minutes >= 1 && minutes <= 10 && env) {
        env.setTimeLimit(minutes);
        updateRangeDisplay();
    }
}

function copyLink() {
    var copyText = document.getElementById("textarea-link");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    alert("تم نسخ الرابط إلى الحافظة!");
}

$(function(){
    console.log("Welcome to Wumpus World Simulator");

    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    keys = new Keys();

    $('select').selectpicker({
        dropdownAlignRight: true
    });

    $.i18n.debug = true;
    $.i18n({
        locale: getCurrentLanguage()
    });

    $.i18n().load( {
        en_us: 'i18n/en_us.json',
        pt_br: 'i18n/pt_br.json',
        ar: 'i18n/ar.json',
        fr: 'i18n/fr.json',
        tr_TR: 'i18n/tr_TR.json',
        es_mx: 'i18n/es_mx.json'
    }).done( function() {
        changeLanguageTo($.i18n().locale);
    });

    $('#select-language').selectpicker('val', $.i18n().locale);

    $("#select-language").change(function(event){
        event.preventDefault();
        changeLanguageTo($(this).val());
    });

    $(".btn-restart").click(function(){
        restart();
    });

    $('#modal-share').on('shown.bs.modal', function () {
        $('#textarea-link').text(getLink());
    });

    changeVolumeTo(getCurrentVolume());
    $("#btn-volume").val(getCurrentVolume().toString());

    $("#btn-volume").change(function(event){
        event.preventDefault();
        changeVolumeTo($(this).val());
    });
    
    $("#btn-player-range").change(updatePlayerRange);
    $("#btn-wumpus-range").change(updateWumpusRange);
    $("#btn-time-range").change(updateTimeRange);

    resources.load().then(() => {
        resources.play("theme", false);

        var hash = window.location.hash;

        if (hash) {
            loadEnvironment(hash);
        }

        restart();

        resizeCanvas();

        window.addEventListener("keydown", onKeydown, false);
        window.addEventListener("keyup", onKeyup, false);
        canvas.addEventListener("click", onMouseClick, false);
        
        canvas.style.cursor = "pointer";

        animate();
    });
});