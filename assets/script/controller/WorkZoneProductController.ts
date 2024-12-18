import { _decorator, Component, instantiate, Node, Prefab, Vec3, Animation } from 'cc';
import { WorkZone } from './WorkZone';
import { Utils } from '../library/util/Utils';
import { Item } from '../library/controller/Item';
import { ParabolaTween } from '../library/util/ParabolaTween';
const { ccclass, property } = _decorator;

@ccclass('WorkZoneProductController')
export class WorkZoneProductController extends Component {
    @property(WorkZone)
    inputZone:WorkZone = null;

    @property(Prefab)
    productPrefab:Prefab = null;

    @property
    productTime:number = 0.1;

    @property(Node)
    firstPos:Node = null;

    @property(Node)
    outputPos:Node = null;

    @property(Animation)
    anim:Animation = null;

    @property
    inputUnit:number = 1;
    
    protected _timer:number = 0;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _firstPos:Vec3 = null;

    protected _placeHalfDimension:Vec3 = null;

    protected _isPlaying:boolean = false;

    start() {
        if (this.outputPos)
            this._placeHalfDimension = Utils.calcArrangeDimension(this.outputPos);

        if (this.firstPos)
            this._firstPos = this.firstPos.getWorldPosition();
    }

    protected startAnimation(start:boolean) {
        if (this.anim) {
            if (this._isPlaying != start) {
                this._isPlaying = start;

                if (start)
                    this.anim.play();
                else
                    this.anim.stop();
            }
        }
    }

    protected lateUpdate(dt: number): void {
        this._timer += dt;
        if (this._timer >= this.productTime) {
            this._timer = 0;

            if (this.outputPos && this.inputZone && this.inputZone.inputCount >= this.inputUnit) {
                this.startAnimation(true);

                const product = instantiate(this.productPrefab);

                this.outputPos.addChild(product);
                product.setWorldPosition(this._firstPos);

                if (Utils.calcArrangePos(this._placeHalfDimension, product.getComponent(Item).getHalfDimension(), this.outputPos.children.length - 1, this._tempPos)) {
                    ParabolaTween.moveNodeParabola(product, this._tempPos, 2, 0.5, -1, 0, false);

                    this.inputZone.inputCount -= this.inputUnit;
                } else {
                    product.removeFromParent();
                    product.destroy();
                }
            } else
                this.startAnimation(false);
        }
    }
}


