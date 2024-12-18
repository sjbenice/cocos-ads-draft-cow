import { _decorator, Component, Node, Tween, tween, Vec3, Animation } from 'cc';
import { Number3d } from '../library/ui/Number3d';
import { ParabolaTween } from '../library/util/ParabolaTween';
import { Utils } from '../library/util/Utils';
import { SoundMgr } from '../library/manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('LevelUpController')
export class LevelUpController extends Component {
    @property(Node)
    toggleNodes:Node[] = [];

    @property(Node)
    icon:Node = null;

    @property(Number3d)
    woolCount3d:Number3d = null;

    @property(Number3d)
    woolTotal3d:Number3d = null;

    @property(Number3d)
    moneyCount3d:Number3d = null;

    @property(Number3d)
    moneyTotal3d:Number3d = null;

    @property
    woolCount:number = 12;

    @property
    moneyCount:number = 50;

    @property(Animation)
    endAnim:Animation = null;

    @property(Node)
    placePos:Node = null;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _isEnded:boolean = false;

    start() {
        if (this.woolTotal3d)
            this.woolTotal3d.setValue(this.woolCount);

        if (this.moneyTotal3d)
            this.moneyTotal3d.setValue(this.moneyCount);
    }

    public receiveGood(good:Node, isMoney:boolean) {
        if (good) {
            good.getWorldPosition(this._tempPos);
            good.setParent(this.placePos);
            good.setWorldPosition(this._tempPos);

            ParabolaTween.moveNodeParabola(good, this.icon.position, 2, Math.sqrt(good.position.length()) / 3, -1, isMoney ? 360 : 0);

            Tween.stopAllByTarget(this.icon);

            this.icon.setScale(Vec3.ONE);
            tween(this.icon)
            .to(0.1, {scale:Utils.Vec1p2})
            .to(0.1, {scale:Vec3.ONE})
            .start();

            if (!this._isEnded) {
                if (isMoney) {
                    const count = this.moneyCount3d.getValue();
                    if (count < this.moneyCount) {
                        this.moneyCount3d.setValue(count + 1);
                    }
                } else {
                    const count = this.woolCount3d.getValue();
                    if (count < this.woolCount) {
                        this.woolCount3d.setValue(count + 1);
                    }
                }

                SoundMgr.playSound(isMoney ? 'money' : 'catch');

                this._isEnded = this.moneyCount3d.getValue() == this.moneyCount && this.woolCount3d.getValue() == this.woolCount;
                if (this._isEnded) {
                    if (this.endAnim)
                        this.endAnim.play('cameraLast');

                    this.toggleNodes.forEach(node => {
                        node.active = !node.active;
                    });
                }
            }
        }
    }
}


