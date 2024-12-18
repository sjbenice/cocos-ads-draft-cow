import { _decorator, Component, Node, SkeletalAnimation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SimpleAssistantController')
export class SimpleAssistantController extends Component {
    @property(SkeletalAnimation)
    anim:SkeletalAnimation = null;

    protected _isWorking:boolean = false;
    
    public setWorking(work:boolean) {
        if (this._isWorking != work && this.node.activeInHierarchy) {
            if (this.anim)
                this.anim.play(work ? 'serve' : 'idle');

            this._isWorking = work;
        }
    }
}


