
var GameScene = cc.Scene.extend({
	gameLayer:null,
	winsize:null,
	map:null,
	isPlay:false,
	scoreLabel:null,
	selectedBackground:null,
	score:0,
	lastScore:0,
	selectPointX:-1,
	selectPointY:-1,
	pointX:0,
	pointY:0,
	startX:36,
	startY:338, 
	endX:684,
	endY:986,
	spaceX:72, 
	spaceY:72,
	yOffset:30,
	MAXLEN:9,
	gameVersion:2,//1 is wexin,2 is android ,3 is website ,4 is mobile,
	onEnter:function () {
		this._super();
		this.winsize = cc.director.getWinSize();
		this.initData();
	},
  
	initData:function(){

		this.map=this.createMap();
		
		this.gameLayer = cc.Layer.create();
		this.addChild(this.gameLayer);
		var centerpos = cc.p(this.winsize.width / 2, this.winsize.height / 2);

		var bg0=cc.Sprite.create(res.s_bg0);
		bg0.setPosition(centerpos);
		bg0.setScale(2);
		this.gameLayer.addChild(bg0,0);
		
		for (var X=0; X<this.MAXLEN; X++){
			for (var Y=0; Y<this.MAXLEN; Y++){
				var ball = cc.Sprite.create(res.s_0);
				this.gameLayer.addChild(ball,2);
				ball.setPosition(this.startX+X*this.spaceX+36,this.startY+Y*this.spaceY+36);
			}
		}
		
		//score
		this.scoreLabel = new cc.LabelTTF("Score: 0", "Arial", 40); 
		this.scoreLabel.color = cc.color(0, 0, 0);
		this.scoreLabel.setPosition(this.winsize.width / 2,this.winsize.height-200);
		this.gameLayer.addChild(this.scoreLabel,3);

		      
		
		
		var menuItem1 = cc.MenuItemImage.create(res.s_replay,res.s_replay,this.replay,this);
		this.infoMenu = cc.Menu.create(menuItem1); 
		//this.infoMenu.alignItemsVerticallyWithPadding(40);
		this.gameLayer.addChild(this.infoMenu,6);
		this.infoMenu.setPosition(menuItem1.width/2+36,this.winsize.height-200);
		
		
		//touch event
		cc.eventManager.addListener(cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			onTouchBegan:function (touch, event) {
				if(event.getCurrentTarget().isPlay==false) return false;
				
				var getPoint =touch.getLocation();
				cc.log("touch X:"+getPoint.x+ " Y:"+getPoint.y);

				cc.log("this.startX"+event.getCurrentTarget().startX);
				cc.log("this.endX"+event.getCurrentTarget().endX);
				cc.log("this.startY"+event.getCurrentTarget().startY);
				cc.log("this.endY"+event.getCurrentTarget().endY);
				

				
				
				//touch point check
				if(getPoint.x>=event.getCurrentTarget().startX && getPoint.x<=event.getCurrentTarget().endX &&getPoint.y>=event.getCurrentTarget().startY && getPoint.y<=event.getCurrentTarget().endY)
				{
					event.getCurrentTarget().pointX=parseInt((getPoint.x-event.getCurrentTarget().startX)/event.getCurrentTarget().spaceX);
					event.getCurrentTarget().pointY=parseInt((getPoint.y-event.getCurrentTarget().startY)/event.getCurrentTarget().spaceY);
					
					cc.log("point X"+event.getCurrentTarget().pointX +" Point Y"+event.getCurrentTarget().pointY);
					//selected a ball
					if(event.getCurrentTarget().map[event.getCurrentTarget().pointX][event.getCurrentTarget().pointY]>0)
					{
						cc.audioEngine.playEffect(res.selected1, false);
						event.getCurrentTarget().selectPointX=event.getCurrentTarget().pointX;
						event.getCurrentTarget().selectPointY=event.getCurrentTarget().pointY;
						//event.getCurrentTarget().AIPlay();
						cc.log("ball status:"+event.getCurrentTarget().map[event.getCurrentTarget().pointX][event.getCurrentTarget().pointY]);
						
						
						if(event.getCurrentTarget().selectedBackground!=null)
						{
							event.getCurrentTarget().gameLayer.removeChild(event.getCurrentTarget().selectedBackground,true);
						}
						
						//add selected white background
						event.getCurrentTarget().selectedBackground=cc.Sprite.create(res.s_00);
						event.getCurrentTarget().gameLayer.addChild(event.getCurrentTarget().selectedBackground,3);
						event.getCurrentTarget().selectedBackground.setPosition(event.getCurrentTarget().pointX*event.getCurrentTarget().spaceX+event.getCurrentTarget().startX+(event.getCurrentTarget().spaceX/2),event.getCurrentTarget().pointY*event.getCurrentTarget().spaceY+event.getCurrentTarget().startY+(event.getCurrentTarget().spaceY/2)-000);
					
					}
					else {
						//move a ball
						if(event.getCurrentTarget().selectPointX>=0 &&event.getCurrentTarget().selectPointY>=0)
						{
							//remove selected white background
							event.getCurrentTarget().gameLayer.removeChild(event.getCurrentTarget().selectedBackground);
							event.getCurrentTarget().selectedBackground=null;
							
							var newmap=new Array();
							for(var i=0;i<event.getCurrentTarget().MAXLEN;i++)
							{
								newmap[i]=new Array();
								for(var j=0;j<event.getCurrentTarget().MAXLEN;j++)
								{
									if(event.getCurrentTarget().map[i][j]==0)
										newmap[i][j]=1;
									else
										newmap[i][j]=0;
								}
							}
							//a Star search path
							var graph = new Graph(newmap);
							var start = graph.grid[event.getCurrentTarget().selectPointX][event.getCurrentTarget().selectPointY];
							var end = graph.grid[event.getCurrentTarget().pointX][event.getCurrentTarget().pointY];
							// result is an array containing the shortest path
							var result = astar.search(graph, start, end);
							
							if(result.length==0)
							{
								//can not find route
								cc.audioEngine.playEffect(res.cantmove, false);
							}
							else {
								cc.audioEngine.playEffect(res.selected2, false);
								var selectBall = event.getCurrentTarget().gameLayer.getChildByTag(event.getCurrentTarget().selectPointX*1000+event.getCurrentTarget().selectPointY*100);
								//先连接移动球动画
								var moveArray=[];
								for(var i=0;i<result.length;i++)
								{
									cc.log("step"+i+" X:"+result[i].x+" Y:"+result[i].y);

									moveArray[i] = cc.MoveTo.create(0.07, 
											cc.p(result[i].x*event.getCurrentTarget().spaceX+event.getCurrentTarget().startX+(event.getCurrentTarget().spaceX/2),result[i].y*event.getCurrentTarget().spaceY+event.getCurrentTarget().startY+(event.getCurrentTarget().spaceY/2)-000)
									);

								}
								//动画完成后判断球是否需要消失
								var finish1 = cc.CallFunc.create(event.getCurrentTarget().checkBall, event.getCurrentTarget());
								moveArray[moveArray.length]=finish1;
								//然后增加新球.
								var finish2 = cc.CallFunc.create(event.getCurrentTarget().AIPlay, event.getCurrentTarget());
								moveArray[moveArray.length]=finish2;
								
								selectBall.runAction(cc.Sequence.create(moveArray));
								
								//move to new postion
								//change that tag id
								selectBall.setTag(event.getCurrentTarget().pointX*1000+event.getCurrentTarget().pointY*100);
								//change the map 
								event.getCurrentTarget().map[event.getCurrentTarget().pointX][event.getCurrentTarget().pointY]=event.getCurrentTarget().map[event.getCurrentTarget().selectPointX][event.getCurrentTarget().selectPointY];
								event.getCurrentTarget().map[event.getCurrentTarget().selectPointX][event.getCurrentTarget().selectPointY]=0;
								event.getCurrentTarget().selectPointX=-1;
								event.getCurrentTarget().selectPointY=-1; 
								
							}
							
						}
					}
				} 
				else
				{
					cc.log("unselected");
				}
				return true;
			}
		}), this);

		this.startGame();
	},
	

	showShareWX:function()
	{ 
		var menuItem33 = cc.MenuItemImage.create(res.s_sharewx,res.s_sharewx,this.closeShareWX,this);
		this.shareToWX = cc.Menu.create(menuItem33);
		this.shareToWX.setPosition(cc.p(this.winsize.width / 2, this.winsize.height / 2));
		this.gameLayer.addChild(this.shareToWX,14);
	},
	closeShareWX:function()
	{ 
		this.gameLayer.removeChild(this.shareToWX);
	},
	replay : function(){
		cc.director.runScene(new GameScene());
		//this.gameLayer.removeAllChildren();
		//this.initData();
	},
	startGame : function(){
		cc.log("start game");
		
		
		//remove start UI 
		this.selectPointX=-1;
		this.selectPointY=-1;
		this.lastScore=0;
		this.score=0;
		this.isPlay = true;
		this.AIPlay();
	},
	
	createMap:function(){
		var arr=[];
		for (var i=0; i<this.MAXLEN; i++){
			arr[i]=[];
			for (var n=0; n<this.MAXLEN; n++){
				arr[i][n]=0;
			}
		}
		return arr;
	},
	
	//generate three balls
	AIPlay:function(){
		if(this.lastScore!=this.score)
		{
			this.lastScore=this.score;
			return;
		}
		
		if(this.checkBlank()<3)
		{
			this.gameOver();
			return;
		}
		for( var times=0;times<3;)
		{
			var randomX=Math.floor((Math.random() * this.MAXLEN));
			var randomY=Math.floor((Math.random() * this.MAXLEN));
			//no ball at this grid
			if(this.map[randomX][randomY]==0)
			{
				var color=Math.floor((Math.random() * 7)+1);
				this.map[randomX][randomY]=color;   
				this.addBall(randomX,randomY,color);
				this.pointX=randomX;
				this.pointY=randomY;
				this.checkBall();
				times++;
			}
			else
			{
				
			}
		}
		if(this.checkBlank()==0)
		{
			this.gameOver();
			return;
		}
		
	},
	gameOver:function()
	{

		//Game Over!
		/*
		this.gameover = new cc.LabelTTF("Game Over!\r\nTry it again!", "Arial", 80); 
		this.gameover.color = cc.color(0, 0, 0);
		this.gameover.setPosition(this.winsize.width / 2,this.winsize.height);
		this.gameLayer.addChild(this.gameover,10); 
		

		var moveArray=[];
		moveArray[0] = cc.MoveTo.create(1.2,  
				cc.p(this.winsize.width / 2,this.winsize.height/2));

		this.gameover.runAction(cc.Sequence.create(moveArray));
*/

		var centerpos = cc.p(this.winsize.width / 2, this.winsize.height / 2);
	
		var openbg1=cc.Sprite.create(res.s_openbg1);
		openbg1.setPosition(centerpos);
		this.gameLayer.addChild(openbg1,11);


		var menuItem11 = cc.MenuItemImage.create(res.s_tzhy,res.s_tzhy,this.showShareWX,this);
		this.infoMenu2 = cc.Menu.create(menuItem11);
		this.infoMenu2.setPosition(184,428);


		if(cc.sys.language==cc.sys.LANGUAGE_CHINESE)
			var menuItem22 = cc.MenuItemImage.create(res.s_again,res.s_again,this.replay,this);
		else
			var menuItem22 = cc.MenuItemImage.create(res.s_again_en,res.s_again_en,this.replay,this);

		this.infoMenu3 = cc.Menu.create(menuItem22);
		this.infoMenu3.setPosition(522,428); 
		if(this.gameVersion==1)
		{
			wxshare(1,this.score,this.sumPercent());
			this.gameLayer.addChild(this.infoMenu2,12);

		}
		this.gameLayer.addChild(this.infoMenu3,13);
		
		if(cc.sys.language==cc.sys.LANGUAGE_CHINESE)
			this.tipsText = new cc.LabelTTF("恭喜您得了"+this.score+"分，\r\n打败"+this.sumPercent()+"%朋友圈的人！\r\n你可以更强的!", "Arial", 46); 
		else
			this.tipsText = new cc.LabelTTF("Your score is "+this.score+",\r\nYou beat "+this.sumPercent()+"% people.", "Arial", 46); 

		this.tipsText.color = cc.color(0, 0, 0);
		this.tipsText.setPosition(this.winsize.width / 2,790);
		this.gameLayer.addChild(this.tipsText,14);

			 
		this.isPlay=false;
		cc.log("loser");
		return;
	},
	sumPercent:function()
	{
		var precent=10;
		
		if(this.score<=0)
		{
			precent=0;
		}else if(this.score<1000)
		{
			precent=1;
		}
		else if(this.score<5000)
		{
			precent=10;
		}
		else if(this.score>20000)
		{
			precent=99;
		}
		else//5000-20000
		{
			precent=Math.floor(10+(this.score-5000)*0.005933);
		}
		return precent;
	},
	checkBlank:function()
	{
		var blank=0;
		for (var X=0; X<this.MAXLEN; X++){
			for (var Y=0; Y<this.MAXLEN; Y++){
				if(this.map[X][Y]==0)
					blank++;
			}
		}
		return blank;
	},

	checkBall:function()
	{
		var LeftTimes=0;
		var RightTimes=0;
		var BottomTimes=0;
		var UpTimes=0;
		var X=this.pointX;
		var Y=this.pointY;
		var Color=this.map[X][Y];
		var balllist=[];
		balllist.push({X:X,Y:Y});
		
		//横线
		if((X>0 && this.map[X-1][Y]==Color)|| X+1<this.MAXLEN &&this.map[X+1][Y]==Color)
		{
			for(var left=X-1;left>=0;left--)
			{
				if( this.map[left][Y]==Color)
				{
					LeftTimes++;
					balllist.push({X:left,Y:Y});
				}
				else
				{
					break;
				}
			}
			for(var right=X+1;right<this.MAXLEN;right++)
			{
				if( this.map[right][Y]==Color)
				{
					RightTimes++;
					balllist.push({X:right,Y:Y});
				}
				else
				{
					break;
				}
			}
			
			if(LeftTimes+RightTimes+1>=5)
			{
				cc.log("横线是"+(LeftTimes+RightTimes+1)+"个颜色");
				this.updateScore(balllist);
				return true;
			}
			
		}
		balllist=[];balllist.push({X:X,Y:Y});
		LeftTimes=0;
		RightTimes=0;
		//竖线
		if((Y>0 && this.map[X][Y-1]==Color)|| Y+1<this.MAXLEN &&this.map[X][Y+1]==Color)
		{
			for(var bottom=Y-1;bottom>=0;bottom--)
			{
				if( this.map[X][bottom]==Color)
				{
					BottomTimes++;
					balllist.push({X:X,Y:bottom});
				}
				else
				{
					break;
				}
			}
			for(var up=Y+1;up<this.MAXLEN;up++)
			{
				if( this.map[X][up]==Color)
				{
					UpTimes++;
					balllist.push({X:X,Y:up});
				}
				else
				{
					break;
				}
			}

			if(BottomTimes+UpTimes+1>=5)
			{
				cc.log("竖线是"+(BottomTimes+UpTimes+1)+"个颜色");
				this.updateScore(balllist);
				return true;
			}

		}
		balllist=[];balllist.push({X:X,Y:Y});
		LeftTimes=0;
		RightTimes=0;
		//左上到右下线
		//if((X>0 && this.map[X-1][Y]==Color)|| X+1<this.MAXLEN &&this.map[X+1][Y]==Color)
		{
			for(var left=X-1,right=Y+1;left>=0 && right<this.MAXLEN;left--,right++)//左上
			{
				if( this.map[left][right]==Color)
				{
					LeftTimes++;
					balllist.push({X:left,Y:right});
				}
				else
				{
					break;
				}
			}
			for(var left=X+1,right=Y-1;right>=0 && left<this.MAXLEN;right--,left++)//左上
			{
				if( this.map[left][right]==Color)
				{
					RightTimes++;
					balllist.push({X:left,Y:right});
				}
				else
				{
					break;
				}
			}

			if(LeftTimes+RightTimes+1>=5)
			{
				cc.log("左上到右下线是"+(LeftTimes+RightTimes+1)+"个颜色");
				this.updateScore(balllist);
				return true;

			}

		}
		balllist=[];balllist.push({X:X,Y:Y});
		LeftTimes=0;
		RightTimes=0;
		//右上到左下线
		//if((X>0 && this.map[X-1][Y]==Color)|| X+1<this.MAXLEN &&this.map[X+1][Y]==Color)
		{
			for(var left=X+1,right=Y+1;left<this.MAXLEN && right<this.MAXLEN;left++,right++)//左上
			{
				if( this.map[left][right]==Color)
				{
					LeftTimes++;
					balllist.push({X:left,Y:right});
				}
				else
				{
					break;
				}
			}
			for(var left=X-1,right=Y-1;left>=0 && right>=0;left--,right--)//左上
			{
				if( this.map[left][right]==Color)
				{
					RightTimes++;
					balllist.push({X:left,Y:right});
				}
				else
				{
					break;
				}
			}

			if(LeftTimes+RightTimes+1>=5)
			{
				cc.log("右上到左下线是"+(LeftTimes+RightTimes+1)+"个颜色");
				this.updateScore(balllist);
				return true;
			}

		}
		
		if(balllist.length>=3)
		{
		}
		
		
		return false;
		
	},
	updateScore:function(balllist)
	{
		var length=balllist.length;

		cc.audioEngine.playEffect(res.killball, false);
		
		this.score=this.score+length*100;
		this.scoreLabel.setString("Score: "+this.score);

		
		for(var i=0;i<length;i++)
		{
			this.map[balllist[i].X][balllist[i].Y]=0;
			this.gameLayer.removeChildByTag(balllist[i].X*1000+balllist[i].Y*100);
		}
	},
	addBall:function(X,Y,Color)
	{
		var ballSprite =cc.Sprite.create(res.ball[Color]);
		cc.log("X"+(X*this.spaceX+this.startX+(this.spaceX/2))+" Y"+(Y*this.spaceY+this.startY+(this.spaceY/2))+" Color"+Color);
		ballSprite.setTag(X*1000+Y*100);
		ballSprite.setPosition(X*this.spaceX+this.startX+(this.spaceX/2),Y*this.spaceY+this.startY+(this.spaceY/2)-000);
		this.gameLayer.addChild(ballSprite,6);
	}
});




