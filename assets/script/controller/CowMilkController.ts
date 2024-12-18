import { _decorator, Component, instantiate, Node, Prefab, random, randomRange, tween, v3, Vec3 } from 'cc';
import { ParabolaTween } from '../library/util/ParabolaTween';
import { Item } from '../library/controller/Item';
import { SoundMgr } from '../library/manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('CowMilkController')
export class CowMilkController extends Component {
    @property(Prefab)
    milkBottlePrefab:Prefab = null;

    protected _bottles:Node[] = [];
    protected static _endPos:Vec3 = v3(0, -1, 3);

    protected _timer:number = 0;
    protected _period:number = 0;
    protected _bottleIndex:number = 0;

    start() {
        for (let index = 0; index < 2; index++) {
            const bottle = instantiate(this.milkBottlePrefab);
            this._bottles.push(bottle);
            this.node.addChild(bottle);

            const item = bottle.getComponent(Item);
            if (item)
                item.enablePhysics(false);
        }

        this.throwBottle();
    }

    protected throwBottle() {
        this._period = randomRange(0.25, 0.3);

        const bottle = this._bottles[this._bottleIndex];
        bottle.setPosition(Vec3.ZERO);
        bottle.setScale(Vec3.ONE);
        ParabolaTween.moveNodeParabola(bottle, CowMilkController._endPos, 2, 0.5, -1, 360, false);

        this._bottleIndex ++;
        if (this._bottleIndex >= this._bottles.length)
            this._bottleIndex = 0;
    }

    protected lateUpdate(dt: number): void {
        this._timer += dt;
        if (this._timer >= this._period) {
            this._timer = 0;

            this.throwBottle();

            if (random() < 0.005)
                SoundMgr.playSound('cow_moo1');
        }
    }
}


