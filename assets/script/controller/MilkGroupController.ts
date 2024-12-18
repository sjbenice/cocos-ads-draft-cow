import { _decorator, Collider, Component, instantiate, ITriggerEvent, Node, Prefab, Quat, randomRange, randomRangeInt, RigidBody, tween, v3, Vec3 } from 'cc';
import { PHY_GROUP } from '../library/Layers';
import { PlayerController } from './PlayerController';
import { Item } from '../library/controller/Item';
import { add } from '../../../extensions/i18n/@types/editor/utils/source/math';
import { ParabolaTween } from '../library/util/ParabolaTween';
const { ccclass, property } = _decorator;

@ccclass('MilkGroupController')
export class MilkGroupController extends Component {
    @property(RigidBody)
    rigidBody:RigidBody = null;

    @property(Collider)
    collider:Collider = null;

    @property(Prefab)
    milkBottlePrefab:Prefab = null;

    @property
    milkCount:number = 0;

    @property(Node)
    group:Node = null;

    @property(Node)
    place:Node = null;

    @property(Node)
    catchPos:Node = null;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _tempPos2:Vec3 = Vec3.ZERO.clone();
    protected _tempQuat:Quat = Quat.IDENTITY.clone();
    protected _velocity:Vec3 = Vec3.ZERO.clone();

    protected _childOrgScale:Vec3 = null;
    protected _childTargetScale:Vec3 = null;

    protected _player:PlayerController = null;

    protected static _EXPLODE_TIME:number = 0.2;
    protected static _FOLLOW_SPEED:number = 16;

    protected _timer:number = 0;

    start() {
        if (!this.collider)
            this.collider = this.getComponent(Collider);

        if (this.collider) {
            this.collider.on('onTriggerEnter', this.onTriggerEnter, this);
        }

        if (!this.rigidBody)
            this.rigidBody = this.getComponent(RigidBody);

        if (this.milkCount <= 0 || this.milkCount > this.group.children.length)
            this.milkCount = this.group.children.length;

        this._childOrgScale = this.group.children[0].getScale();
        this._childTargetScale = this._childOrgScale.clone();
        this._childTargetScale.multiplyScalar(1.2);
    }

    onDestroy() {
        if (this.collider) {
            this.collider.off('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    onTriggerEnter (event: ITriggerEvent) {
        if (event.otherCollider.getGroup() == PHY_GROUP.PLAYER) {
            const player = event.otherCollider.getComponent(PlayerController);
            if (player && this.milkBottlePrefab) {
                this._player = player;

                let added:boolean = false;

                for (let index = 0; index < this.group.children.length; index++) {
                    const element = instantiate(this.milkBottlePrefab);
                    
                    this.group.children[index].getWorldPosition(this._tempPos);
                    this.group.children[index].getWorldRotation(this._tempQuat);

                    this.place.addChild(element);
                    element.setWorldPosition(this._tempPos);
                    element.setWorldRotation(this._tempQuat);

                    element.getPosition(this._tempPos);
                    this._tempPos.x += randomRange(-0.5, 0.5);
                    this._tempPos.z += randomRange(-0.5, 0.5);

                    const parabolla = ParabolaTween.moveNodeParabola(element, this._tempPos, 
                        randomRange(1, 1.5), MilkGroupController._EXPLODE_TIME, -1, 0, index >= this.milkCount, 
                        MilkGroupController.onEndFall, this);

                    // element.getPosition(this._tempPos);
                    this._tempPos.x += randomRange(-1, 1);
                    this._tempPos.z += randomRange(-1, 1);
                    parabolla.addPath(this._tempPos, randomRange(0.7, 1), randomRange(MilkGroupController._EXPLODE_TIME * 2, MilkGroupController._EXPLODE_TIME), -1, randomRange(0, 360));

                    // element.getPosition(this._tempPos);
                    this._tempPos.x += randomRange(-0.5, 0.5);
                    this._tempPos.z += randomRange(-0.5, 0.5);
                    parabolla.addPath(this._tempPos, randomRange(0.3, 0.5), randomRange(MilkGroupController._EXPLODE_TIME * 3, MilkGroupController._EXPLODE_TIME), -1, randomRange(0, 180));

                    // if (!player.catchItem(element.getComponent(Item), randomRangeInt(3, 6), 2)) {
                    //     element.removeFromParent();
                    //     element.destroy();
                    //     break;
                    // } else
                        added = true;
                }

                if (added) {
                    this._timer = 0;

                    this.enablePhysics(false);

                    this.group.active = false;

                    this.scheduleOnce(()=>{
                        this.group.active = true;
    
                        tween(this.group)
                        .by(0.2, {position:v3(0, randomRange(0.3, 0.5), 0)})
                        .to(0.2, {position:Vec3.ZERO})
                        .call(()=>{
                            this.enablePhysics(true);
                        })
                        .start();

                        this.group.children.forEach(node => {
                            tween(node)
                            .to(randomRange(0.15, 0.2), {scale:this._childTargetScale})
                            .to(randomRange(0.15, 0.2), {scale:this._childOrgScale})
                            .start();
                        });
                    }, 5);
                }
            }
        }
    }

    protected enablePhysics(enable:boolean) {
        if (this.rigidBody) {
            this.rigidBody.enabled = enable;
            this.collider.enabled = enable;
        }
    }

    public static onEndFall(node:Node, controller:MilkGroupController) {
        if (node && controller) {
            node.setParent(controller.catchPos);
        }
    }

    protected lateUpdate(dt: number): void {
        if (this._player && this.catchPos.children.length > 0) {
            this._player.node.getWorldPosition(this._tempPos);
            this._tempPos.y = 1.5;

            const speedLen = MilkGroupController._FOLLOW_SPEED * dt;

            for (let index = 0, count = 0; index < this.catchPos.children.length && count < this.milkCount / 2; index++, count ++) {
                const element = this.catchPos.children[index];
                
                element.getWorldPosition(this._tempPos2);

                Vec3.subtract(this._velocity, this._tempPos, this._tempPos2);
                const distance = this._velocity.length();
                if (distance <= speedLen) {
                    element.setWorldRotation(Quat.IDENTITY);
                    if (!this._player.catchItem(element.getComponent(Item))) {
                        element.removeFromParent();
                        element.destroy();
                    }
                } else {
                    this._velocity.y *= 2;
                    this._velocity.normalize();
                    this._velocity.multiplyScalar(speedLen);
    
                    this._tempPos2.add(this._velocity);
    
                    // Vec3.lerp(this._tempPos2, this._tempPos2, this._tempPos, dt * 5);
                    element.setWorldPosition(this._tempPos2);
                }
            }
        }
    }
}


