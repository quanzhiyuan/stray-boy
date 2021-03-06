// 本脚本定义了角色的所有属性以及行为
const et = require('Listener')
import {EVENT,GAME_SCENE,STATUS} from 'Enum'
import GameSceneMng from './GameSceneMng'
import stateMng from './State'
import {Backpack} from './GoodsManager'
import map from '../Conf/map'
import talent from '../Conf/talent'

class PlayerManager {
  // 成员变量
  constructor() {
    // 人物属性
    this.properties = {
      exp: 10,
      level: 1,
      maxLife: 200,
      currentLife: 200,
      attack: 20,
      defence: 10,
      knowledge: 10,
      sport: 10,
      charm: 10,
      health: 100,
      attackSpeed: 2,
      moveSpeed: 5,
      hunger: 100,
      currentHunger: 100,
      energy: 100,
      currentEnergy: 100,
      currentPlace: {name:'孙庄'},
      moveDuration: 0,
      talent: null,
      money: 0
    },

    // 地图
    this.map = map
    // this.dt = 0
    // this.second = 0
    // this.minute = 0
    this.hour = 0
    this.day = 0
    this.duraction = 300
    this.mstMoveSpeed = 1
    this.mstattackSpeed = 2
    this._state = {}
    this.currentEvent = {}
    this.attackDescribe = '你挥舞拳头，重重一击'
    this.weapon = {id: -1}
    this.armor = {id: -1}
  }

  init(id) {
    let index = id-1
    this.properties.maxLife = talent[index].life
    this.properties.currentLife = talent[index].life
    this.properties.maxlife = talent[index].life
    this.properties.attack = talent[index].attack
    this.properties.defence = talent[index].defence
    this.properties.knowledge = talent[index].knowladge
    this.properties.sport = talent[index].sport
    this.properties.charm = talent[index].charm
  }

  getCurrentEvent() {
    return this.currentEvent
  }

  setCurrentEvent(event) {
    this.currentEvent = event
  }

  Save() {
    cc.sys.localStorage.setItem('userData', JSON.stringify(this))
  }

  Get() {
    const userData = JSON.parse(cc.sys.localStorage.getItem('userData'))
    return userData
  }

  // 角色穿戴装备
  equip(good) {
    if(good.type == '武器') {
      if(this.weapon.id != -1) {
        this.properties.attack -= this.weapon.attack
        this.properties.defence -= this.weapon.defence
        this.properties.life -= this.weapon.life
      }
      this.weapon = good
      this.attackDescribe = good.des
      this.properties.attack += this.weapon.attack
      this.properties.defence += this.weapon.defence
      this.properties.life += this.weapon.life
    }
    if(good.type == '盔甲') {
      if(this.armor.id != -1) {
        this.properties.attack -= this.weapon.attack
        this.properties.defence -= this.weapon.defence
        this.properties.life -= this.weapon.life
      }
      this.armor = good
      this.properties.attack += this.armor.attack
      this.properties.defence += this.armor.defence
      this.properties.life += this.armor.life
    }
  }

  // 角色制造装备 
  make(good) {
    let pro = Math.floor(Math.random()*100) 
    if(pro <= 3*this.properties.knowledge) {
      Backpack.getInstance().makeSuccess(good)
      const str = '获得【' + good.name + '】*1' 
      var event = {about: str}
    }else {
      Backpack.getInstance().makeFail(good)
      var event = {about: '打造失败！'}
    }
    this.setCurrentEvent(event)
  }

  // 设置角色状态
  setState(num) {
    this._state = stateMng.getState(num)
    if(this._state) {
      this._state.doSomething(this)
    }
  }

  // 执行战斗
  combat(mst) {
    // 角色攻击
    if(this.properties.attack>mst.defence) {
      var damage1 = this.properties.attack-mst.defence
    }else {
      var damage1 = 1
    }
    mst.life -= damage1
    // 怪物死亡
    if(mst.life <= 0) {
      et.emit(EVENT.WIN)
      return [damage1, 0]
    }

    // 怪物反击
    if(mst.attack>this.properties.attack) {
      var damage2 = mst.attack-this.properties.defence
    }else {
      var damage2 = 1
    }
    this.properties.currentLife -= damage2
    // 人物死亡
    if(this.properties.currentLife <= 0) {
      this.properties.currentLife = 0
      GameSceneMng.getInstance().setGameScene(GAME_SCENE.GAME_OVER)
    }

    et.emit(EVENT.HURT)
    // 返回伤害值
    return [damage1, damage2]
  }

  // 角色休息
  rest() {
    if(this.properties.currentEnergy < this.properties.energy) {
      let diff = this.properties.energy - this.properties.currentEnergy
      let hour = (diff*8)/100
      this.computingTime(hour)
      this.properties.currentEnergy = 100
    }
  }

  //计算时间 
  computingTime(hour) {
    this.hour = (hour*10 + this.hour*10)/10
    Backpack.getInstance().reduceTime(hour)
    if(this.hour >= 24) {
      this.hour = (this.hour*10-24*10)/10
      this.day += 1
    }
  }
  
  // 战斗获胜结算
  win(mst) {
    this.properties.exp += mst.exp
    var event = {about:'战斗胜利！获得【经验+' + mst.exp + '】'}
    for(let i=0; i<mst.goods.length; i++) {
      let pro = Math.floor(Math.random()*100) 
      if(pro<mst.goods[i].pro) {
        event.about = event.about + '【' + mst.goods[i].good + '*' + mst.goods[i].num + '】'
      }
    }
    this.setCurrentEvent(event)
  }

  // 特殊事件奖惩
  plotResult(result) {
    switch(result[0]) {
      case 10: 
        this.properties.knowledge += result[1]
        break
      case 11: 
        this.properties.charm += result[1]
        break
      case 12: 
        this.properties.sport += result[1]
        this.properties.maxLife -= 20
        this.properties.currentLife -= 20
        this.properties.attack -= 2
        this.properties.defence -= 1
        break
    }
    if(result[0] > 100) {
      Backpack.getInstance().setProperty(result)
    }
  }

  // 执行逃跑
  runAway() {
    GameSceneMng.getInstance().setGameScene(GAME_SCENE.GAME)
  }

  // 角色消耗精力，饥饿,时间
  consume(energy,hunger,hour) {
    this.computingTime(hour)
    // 僵尸前进
    this.duraction -= this.mstMoveSpeed
    if(this.duraction <= 0) {
      et.emit(EVENT.GAMEOVER)
    } 
    if(this.properties.currentEnergy>=energy && this.properties.currentHunger>=hunger) {
      this.properties.currentEnergy -= energy
      this.properties.currentHunger -= hunger
      return STATUS.STATUS_OK
    }
    if(this.properties.currentEnergy<energy) {
      return STATUS.NO_ENERGY
    }
    if(this.properties.currentHunger<hunger) {
      return STATUS.NO_HUNGER
    }
  }

  // 角色进食
  eat(food) {
    console.log(food.effect[0])
    let result = ''
    if(food.effect[0] == '饥饿' && this.properties.currentHunger < this.properties.hunger) {
      this.properties.currentHunger += parseInt(food.effect[1])
      if(this.properties.currentHunger > this.properties.hunger) {
        this.properties.currentHunger = this.properties.hunger
      }
      Backpack.getInstance().consume(food.id)
    } 
    if(food.effect[0] == '生命' && this.properties.currentLife < this.properties.maxLife) {
      this.properties.currentLife += parseInt(food.effect[1])
      if(this.properties.currentLife >= this.properties.maxLife) {
        this.properties.currentLife = this.properties.maxLife
      }
      Backpack.getInstance().consume(food.id)
    }

    if(food.effect[0] == '饥饿' && this.properties.currentHunger >= this.properties.hunger) {
      result = EVENT.FULL
    }
    if(food.effect[0] == '生命' && this.properties.currentLife >= this.properties.maxLife) {
      result = EVENT.LIFEFULL
    }
    return result
  }

  // 缺少物品
  lackGood(goodName) {
    let result = Backpack.getInstance().isHaveGood(goodName)
    if(!result) {
      this.properties.health -= 1
    }
  }

  // 角色前进
  forward() {
    this.duraction += this.properties.moveSpeed
    this.properties.moveDuration += this.properties.moveSpeed
    this.where(this.properties.moveDuration)
    if(this.properties.currentPlace.shop == true) {
      et.emit(EVENT.FINDSHOP)
    }
  }

  // 加点
  jiadian(type) {
    switch(type) {
      case '智商':
        this.properties.knowledge++
      break
      case '情商':
        this.properties.charm++
      break
      case '体质':
        this.properties.sport++
        this.properties.attack += 2
        this.properties.defence += 1
        this.properties.maxLife += 20
        this.properties.currentLife += 20
      break
    }
  }
  
  // 我在哪
  where(duraction) {
    for(let i=0; i<this.map.length; i++) {
      if(this.map[i].duraction>duraction) {
        let index = i - 1
        if(this.properties.currentPlace == this.map[index].name) {
          return
        }else {
          this.properties.currentPlace = this.map[index]
          console.log(this.properties.currentPlace.name + '欢迎你的到来！')
          return
        }
      }
    }
  }
}

export default new PlayerManager()
