// 本脚本为游戏的主要逻辑脚本
import player from './PlayerManager'
const et = require('Listener')
import {EVENT,GAME_SCENE,STATE} from 'Enum'
import GameSceneMng from './GameSceneMng'

cc.Class({
    extends: cc.Component,
    properties: {
      content: cc.Label,
      life: cc.Label,
      health: cc.Label,
      attackSpeed: cc.Label,
      moveSpeed: cc.Label,
      hunger: cc.Label,
      energy: cc.Label,
      time: cc.Label,
      duraction: cc.Label,
      place: cc.Label,
      sport: cc.Label,
      charm: cc.Label,
      knowledge: cc.Label,
      money: cc.Label,
    },                                                                                                                                     
    // LIFE-CYCLE CALLBACKS:
    onLoad () {
      this.node.opacity = 240
      this.node.runAction(cc.fadeIn(1.0))
      this.updateLabel()
      this.node1 = this.node.getChildByName('Node1')
      this.node2 = this.node.getChildByName('Node2')
      this.node3 = this.node.getChildByName('Node3')
      this.node4 = this.node.getChildByName('Node4')
      this.shop = this.node1.getChildByName('Btn_Shop')
      this.shop.active = false
      //注册监听事件
      et.on(EVENT.NO_HUNGER, this.hungry, this)
      //每次加载组件都重新注册)
      et.on(EVENT.WIN, () => {
        this.nodeActive(this.node1)
      })
      et.on(EVENT.BEFORE_COMBAT, this.beforeCombat, this)
      et.on(EVENT.UPGRADE, () => {
        this.nodeActive(this.node3)
      })
      et.on(EVENT.HURT, this.updateLabel, this)
      et.on(EVENT.FINDSHOP, this.showShop, this)
      et.on(EVENT.CHOOSE, this.choose, this)
      et.on(EVENT.FINISH, () => {
        this.nodeActive(this.node1)
        this.updateLabel()
      })
    },

    start () {
      this.nodeActive(this.node1)
      //当前界面主要按钮
      this.Btn_Forward = this.node1.getChildByName('Btn_Forward')
      this.Btn_Forward.state = STATE.FORWARD
      this.Btn_Search = this.node1.getChildByName('Btn_Search')
      this.Btn_Search.state = STATE.SEARCH
      this.Btn_Rest = this.node1.getChildByName('Btn_Rest')
      this.Btn_Rest.state = STATE.SLEEP
      this.Btn_Make = this.node1.getChildByName('Btn_Make')
      this.Btn_Eat = this.node1.getChildByName('Btn_Eat')
      this.arrBtn = [this.Btn_Forward,this.Btn_Search,this.Btn_Make,this.Btn_Rest,this.Btn_Eat]
      //按钮监听
      this.Btn_Forward.on('click', this.callback, this)
      this.Btn_Make.on('click', this.openMake, this)
      this.Btn_Search.on('click', this.callback, this)
      this.Btn_Rest.on('click', this.callback, this)
      this.Btn_Eat.on('click', this.opneBackpack, this)
    },

    showShop() {
      this.shop.active = true
    },

    beforeCombat() {
      this.nodeActive(this.node2)
      et.emit(EVENT.ENTER_COMBAT)
    },

    nodeActive(node) {
      this.node1.active = false
      this.node2.active = false
      this.node3.active = false
      this.node4.active = false
      node.active = true
    },

    onDestroy() {
      //注销先前的事件，确保新注册的事件this总是指向当前组件
      et.off(EVENT.COMBAT)
      et.off(EVENT.WIN)
      et.off(EVENT.FINISH)
      et.off(EVENT.UPGRADE)
      et.off(EVENT.HURT)
      et.off(EVENT.CHOOSE)
      et.off(EVENT.FINDSHOP)
    },

    hungry() {
      console.log('I am hungry!')
    },

    // 按键回调
    callback(btn) {
      // 设置玩家当前状态
      player.setState(btn.node.state)
      // 获得玩家当前事件描述
      const event = player.getCurrentEvent()
      if(event) {
        if(btn.node.state == STATE.SLEEP) {
          GameSceneMng.getInstance().setGameScene(GAME_SCENE.STORY)
          return
        }
        if(btn.node.state == STATE.SEARCH) {
          this.labelSchedule1(event.about)
        }else {
          this.labelSchedule2(event.about)
        }
      }
      this.updateLabel()
    },

    // 事件选择
    choose() {
      this.nodeActive(this.node4)
    },

    // 打开制造页
    openMake() {
      GameSceneMng.getInstance().setGameScene(GAME_SCENE.MAKE)
    }, 

    // 打开背包
    opneBackpack() {
      GameSceneMng.getInstance().setGameScene(GAME_SCENE.GOOD_LIST)
    },

    // 文字出现效果带按钮特效
    labelSchedule1(content) {
      this.unscheduleAllCallbacks()
      this.content.string = ''
      let index = 0
      let i = content.length - 1
      this.changeBtnState(this.arrBtn, i*0.08)
      this.schedule(() => {
        this.content.string = this.content.string + content[index]
        index++
        if(index>i) {
          this.changeBtnState(this.arrBtn, 1.0)
        }
      },0.04,i,0)
    },

    // 文字提示不带按钮特效
    labelSchedule2(content) {
      this.unscheduleAllCallbacks()
      this.content.string = ''
      let index = 0
      let i = content.length - 1
      this.schedule(() => {
        this.content.string = this.content.string + content[index]
        index++
      },0.02,i,0)
    },

    // 按钮状态改变
    changeBtnState(arr,dt) {
      for(let i=0; i<arr.length; i++) {
        arr[i].getComponent(cc.Button).enabled = 
        arr[i].getComponent(cc.Button).enabled ? false: true
        if(arr[i].getComponent(cc.Button).enabled == false) {
          let action1 = cc.fadeOut(dt)
          arr[i].runAction(action1)
        }else {
          let action2 = cc.fadeIn(dt)
          let action1 = cc.delayTime(0.2)
          let seq = cc.sequence(action1, action2)
          arr[i].runAction(seq)
        }
      }
    },

    // 更新人物属性面板
    updateLabel() {
      this.life.string = player.properties.currentLife + '/' + player.properties.maxLife
      this.health.string = player.properties.health
      this.attackSpeed.string = player.properties.attackSpeed
      this.moveSpeed.string = player.properties.moveSpeed
      this.hunger.string = '饥饿 ' + player.properties.currentHunger + '/' + player.properties.hunger
      this.energy.string = '精力 ' + player.properties.currentEnergy + '/' + player.properties.energy
      if(player.day == 0) {
        this.time.string = player.hour + '小时'
      }else {
        this.time.string = player.day + '天' + player.hour + '小时'
      }
      this.duraction.string = player.duraction
      this.place.string = player.properties.currentPlace.name
      this.knowledge.string = player.properties.knowledge
      this.sport.string = player.properties.sport
      this.charm.string = player.properties.charm
      this.money.string = player.properties.money
    },

    // // 计时器
    // update (dt) {
    //   player.dt += 1
    //   if(player.dt == 60) {
    //     player.dt = 0
    //     player.second += 1
    //     if(player.duraction <= 0) {
    //       GameSceneMng.getInstance().setGameScene(GAME_SCENE.GAME_OVER)
    //     }
    //   }
    //   if(player.second == 60) {
    //     player.second = 0
    //     player.minute += 1
    //   }
    //   if(player.minute == 60) {
    //     player.minute = 0
    //     player.hour += 1
    //   }
    //   this.updateTime()
    // },

    // // 显示时间
    // updateTime() {
    //   if(player.second < 10) {
    //     var second = '0' + player.second
    //   }else {
    //     var second = player.second
    //   }
    //   if(player.minute < 10) {
    //     var minute = '0' + player.minute
    //   }else {
    //     var minute = player.minute
    //   }
    //   if(player.hour < 10) {
    //     var hour = '0' + player.hour
    //   }else {
    //     var hour = player.hour
    //   }
    //   this.time.string = hour + ':' + minute + ':' + second
    //   this.duraction.string = player.duraction
    // }
});
