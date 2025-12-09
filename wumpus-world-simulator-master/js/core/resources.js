let resources = {

    images: {},
    musics: {},

    play: function(name, override = true){

        let sound = this.musics[name];

        if (sound){
            if(override){
                sound.play();
            } else {
                if(!sound.playing()) {
                    sound.play();
                }
            }
        }
    },

    stop: function(name){

        let sound = this.musics[name];

        if (sound && sound.playing()) {
            sound.stop();
            sound.unload();
        }
    },

    loadMusic: function(name, file){

        console.log("Loading sound", file);

        return new Promise((resolve, reject) => {

            let sound = new Howl({
                src: [file],
                html5: true,
                preload: true,
            });

            sound.once('load', function(){
                resolve([name, sound]);
            });
        });
    },

    loadImage: function(name, url){

        console.log("Loading image", url);

        return new Promise((resolve, reject) => {

            var image = new Image();

            image.onload = function() {
                console.log("✅ Successfully loaded:", name, "from", url);
                resolve([name, image]);
            };

            image.onerror = function() {
                console.error("❌ Failed to load image:", name, "from", url);
                reject(new Error("Failed to load image: " + url));
            };

            image.src = url;
        });
    },

    loadMusics: function(){

        return new Promise((resolve, reject) => {

            const files = [
                this.loadMusic("move", 'audio/bump.wav'),
                this.loadMusic("game-over", 'audio/game-over.wav'),
                this.loadMusic("win", 'audio/win.wav'),
                this.loadMusic("gold", 'audio/coin.wav'),
                this.loadMusic("arrow", 'audio/arrow.wav'),
                this.loadMusic("error", 'audio/error.mp3'),
                this.loadMusic("theme", 'audio/background.mp3')
            ];

            Promise.all(files).then((result) => {
                resolve(["musics", Object.fromEntries(result)]);
            }).catch((error) => {
                reject(error);
            });
        });
    },

    loadImages: function(){

        return new Promise((resolve, reject) => {

            const files = [
                // صورة واحدة للجهتين اليسار والتحت
                this.loadImage('facing_to_left', 'img/player_left_and_down.png'),
                this.loadImage('facing_to_down', 'img/player_left_and_down.png'),
                
                // صورة واحدة للجهتين اليمين والفوق
                this.loadImage('facing_to_right', 'img/player_right_and_up.png'),
                this.loadImage('facing_to_up', 'img/player_right_and_up.png'),
                
                // صورة الوحش PNG
                this.loadImage('wumpus', 'img/wumpus.png'),
                
                // باقي الصور
                this.loadImage('wall', 'img/wall.png'),
                this.loadImage('floor', 'img/floor.png'),
                this.loadImage('hole', 'img/hole.png'),
                this.loadImage('gold', 'img/gold.png'),
                this.loadImage('floor_gold', 'img/floor_gold.png'),
            ];

            Promise.all(files).then((result) => {
                console.log("🎉 All images loaded successfully!");
                console.log("📝 Using 2 player images:");
                console.log("   - player_left_and_down.png ← للجهتين اليسار والتحت");
                console.log("   - player_right_and_up.png ← للجهتين اليمين والفوق");
                resolve(["images", Object.fromEntries(result)]);
            }).catch((error) => {
                console.error("Error loading images:", error);
                reject(error);
            });
        });
    },

    load: function(){

        var that = this;

        return new Promise((resolve, reject) => {

            const files = [
                this.loadImages(),
                this.loadMusics(),
            ];

            Promise.all(files).then((result) => {

                result = Object.fromEntries(result);

                that.images = result.images;
                that.musics = result.musics;

                console.log("🚀 All game resources loaded!");
                console.log("👤 Player images mapping:");
                console.log("   - Up/Down: player_left_and_down.png");
                console.log("   - Left/Right: player_right_and_up.png");
                resolve(result);
            }).catch((error) => {
                console.error("Failed to load resources:", error);
                reject(error);
            });
        });
    }
}