cc.game.onStart = function(){
	cc.view.setDesignResolutionSize(720, 1280,2);
	cc.view.resizeWithBrowserSize(true);
    //load resources
    cc.LoaderScene.preload(g_resources, function () {
    	cc.director.runScene(new GameScene());
    }, this);
};
cc.game.run();