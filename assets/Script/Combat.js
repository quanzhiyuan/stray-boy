// 本脚本负责游戏的战斗场景
import player from './PlayerManager'
import {EVENT,GAME_SCENE} from './Enum'
import GameSceneMng from './GameSceneMng'
import Monster from './MonsterFactory'
const et = require('Listener')

cc.Class({
    extends: cc.Component,

    properties: {
      Btn_Combat: cc.Button,
      Btn_RunAway: cc.Button,
      level: {
        default: null,
        type: cc.Label
      },
      Node: {
        default: null,
        type: cc.Node
      },

      Monster: {
        default: null,
        type: cc.Label
      },

      Content: {
        default: null,
        type: cc.Label
      },
    },

    onLoad() {
      this.node.parentComponent = this.node.parent.getComponent('MainScene')
      this.updateLabel()
      this.Btn_Combat.node.on('click',this.combat, this)
      this.Btn_RunAway.node.on('click',this.runAway, this)
      et.on(EVENT.ENTER_COMBAT, this.enterCombat, this)
      et.on(EVENT.HURT, this.updateMonster, this)      
      et.on(EVENT.WIN, this.win, this)
    },
    
    onDestroy() {
      et.off(EVENT.ENTER_COMBAT)
      et.off(EVENT.HURT)
      et.off(EVENT.WIN)
    },  

    // 进入战斗
    enterCombat() {
      var id = 1
      const len = Object.getOwnPropertyNames(player.properties.currentPlace.enemy).length
      const pro = Math.floor(Math.random()*100) 
      if(pro <= 100/len) {
        id = player.properties.currentPlace.enemy[0]
      }else {
        id = player.properties.currentPlace.enemy[1]
      }
      let monster = new Monster(id)
      this.monster =  monster
      this.updateMonster()
      this.node.parentComponent.labelSchedule2(this.monster.about)
    },

    // 获胜
    win() {
      player.win(this.monster)
      const event = player.getCurrentEvent()
      this.node.parentComponent.labelSchedule2(event.about)
      this.updateLabel()
    },

    // 战斗
    combat() {
      this.damage = player.combat(this.monster)
      let content = player.attackDescribe + '【' + this.monster.name + '生命-' + this.damage[0] + '】' 
      + '\n' +this.monster.attackType +'【你的生命-' + this.damage[1] + '】'
      if(this.monster.life>0) {
        this.node.parentComponent.labelSchedule2(content)
      }
    },

    // 逃跑
    runAway() {
      GameSceneMng.getInstance().setGameScene(GAME_SCENE.GAME)
    },

    // 触发升级
    updateLabel() {
      let lv = parseInt(player.properties.exp/10)
      if(lv != player.properties.level) {
        player.properties.level = lv
        et.emit(EVENT.UPGRADE)
      }
      this.level.string = 'lv:' + player.properties.level
    },

    // 跟新怪物状态
    updateMonster() {
      this.Monster.string = this.monster.name + ' lv ' + this.monster.lv + ' hp ' + this.monster.life
    },

});
