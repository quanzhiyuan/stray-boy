import {BEHAVIOR} from 'Enum'

// 状态模式
class BaseState {
  constructor() {

  }
  doSomething(obj) {
    return
  }
}

// 战斗状态
class Combat extends BaseState {
  constructor() {
    super()
  }
  doSomething(obj) {
    obj.combat()
  }
}

// 逃跑状态
class RunAway extends BaseState {
  constructor() {
    super()
  }
  doSomething(obj) {
    obj.runAway()
  }
}

// 状态管理
class StateMng {
  constructor() {
    this.stateArr = []
  }
  init() {
    this.stateArr[BEHAVIOR.COMBAT] = new Combat() 
    this.stateArr[BEHAVIOR.RUNAWAY] = new RunAway() 
  }
  getState(num) {
    return this.stateArr[num]
  }
}

const stateMng = new StateMng()
stateMng.init()

export default stateMng