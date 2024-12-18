import { _decorator, Collider, Component, EPSILON, ICollisionEvent, instantiate, ITriggerEvent, lerp, Node, Prefab, Quat, randomRange, RigidBody, SkeletalAnimation, sys, tween, v3, Vec3 } from 'cc';
import { Emoji } from '../library/ui/Emoji';
import { PHY_GROUP } from '../library/Layers';
import { FenceController } from './FenceController';
import { Utils } from '../library/util/Utils';
import { ParabolaTween } from '../library/util/ParabolaTween';
const { ccclass, property } = _decorator;

enum State {
    TO_EAT,
    WAIT,
    EATING,
    BACK,
}

@ccclass('GhostController')
export class GhostController extends Component {
    @property(Node)
    placePos:Node = null;

    @property(Emoji)
    emoji:Emoji = null;

    @property(Node)
    hungryIcon:Node = null;
    
    @property(Collider)
    collider:Collider = null;

    @property(Prefab)
    dollarPrefab:Prefab = null;

    public startPos:Vec3 = Vec3.ZERO.clone();
    public endPos:Vec3 = Vec3.ZERO.clone();

    protected _speed:number = 2.5;
    protected _angleSpeed:number = 1000;

    protected _state:number = State.BACK;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();

    protected _moving:boolean = false;
    
    protected _targetPos:Vec3 = Vec3.ZERO.clone();
    protected _destPos:Vec3 = Vec3.ZERO.clone();
    protected _velocity:Vec3 = Vec3.ZERO.clone();
    protected _tempQuat:Quat = Quat.IDENTITY.clone();

    protected _anim:SkeletalAnimation = null;
    protected _curAnimName:string = null;

    protected _attackTimer:number = 0;
    protected _attackFence:FenceController = null;

    protected _waitTime:number = 0;
    protected _maxWaitTime:number = 0;

    protected _rigidBody:RigidBody = null;
    protected _idleTimer:number = 0;
    protected _idleMove:boolean = false;

    start() {
        if (this.hungryIcon) {
            tween(this.hungryIcon)
            .by(1, {position:v3(0, 0.3, 0)})
            .by(1, {position:v3(0, -0.3, 0)})
            .union()
            .repeatForever()
            .start();
        }

        if (!this.collider)
            this.collider = this.getComponent(Collider);

        if (this.collider) {
            this.collider.on('onCollisionEnter', this.onCollisionEnter, this);
            this.collider.on('onCollisionStay', this.onCollisionStay, this);
            this.collider.on('onCollisionExit', this.onCollisionExit, this);
        }

        this._anim = this.getComponentInChildren(SkeletalAnimation);

        this._targetPos.set(this.endPos);
        this._moving = true;

        this._maxWaitTime = randomRange(10, 20);

        this._rigidBody = this.getComponent(RigidBody);
    }

    onDestroy() {
        if (this.collider) {
            this.collider.off('onCollisionEnter', this.onCollisionEnter, this);
            this.collider.off('onCollisionStay', this.onCollisionStay, this);
            this.collider.off('onCollisionExit', this.onCollisionExit, this);
        }
    }

    onCollisionEnter (event: ICollisionEvent) {
        if (this._state == State.TO_EAT && this._attackFence == null) {
            this._attackFence = this.getFenceControllerFromEvent(event);
            if (this._attackFence) {
                this.enablePhysics(false);
                // this.setAnimationName('attack');
            }
        }
    }

    onCollisionStay (event: ICollisionEvent) {
        // if (this._attackFence && sys.now() > this._triggerTimer + 1600) {
        //     this._triggerTimer = sys.now();

        //     if (this._attackFence.destructFence()) {
        //         this.setAnimationName('walk');

        //         this._attackFence = null;
        //     } else
        //         this.setAnimationName('attack', true);
        // }
    }
    
    onCollisionExit (event: ICollisionEvent) {
        // if (this._isAttacking && this.getFenceControllerFromEvent(event)) {
        //     this.setAnimationName('walk');

        //     this._isAttacking = false;
        // }
    }

    protected getFenceControllerFromEvent(event:ICollisionEvent) : FenceController {
        if (event.otherCollider.getGroup() == PHY_GROUP.P_O_WALL) {
            let node = event.otherCollider.node;
            while (node) {
                const fence = node.getComponent(FenceController);
                if (fence) {
                    return fence;
                }

                node = node.parent;
            }
        }

        return null;
    }

    protected setAnimationName(newAnim:string, force:boolean = false) {
        if (this._anim && newAnim != this._curAnimName || force) {
            this._anim.play(newAnim);
            this._curAnimName = newAnim;
        }
    }

    protected enablePhysics(enable:boolean) {
        if (this._rigidBody) {
            this._rigidBody.enabled = enable;
            this.getComponent(Collider).enabled = enable;
        }
    }

    update(deltaTime: number) {
        if (this._attackFence) {
            if (this._attackTimer == 0 || this._attackTimer > 1.6) {
                this._attackTimer = 0;

                if (this._attackFence.destructFence()) {
                    this.setAnimationName('walk');
    
                    this._attackFence = null;
                    this.enablePhysics(true);
                } else
                    this.setAnimationName('attack', true);
            }
            this._attackTimer += deltaTime;
        } else {
            const velocity = deltaTime * this._speed;

            if (this._moving) {
                this.node.getWorldPosition(this._tempPos);
    
                Vec3.subtract(this._velocity, this._targetPos, this._tempPos);
                Utils.faceViewCommon(this._velocity, deltaTime, this.node, this._angleSpeed);
    
                let distance = this._velocity.length();
    
                this._velocity.normalize();
                this._velocity.multiplyScalar(distance);
                Vec3.add(this._destPos, this._tempPos, this._velocity);
    
                Vec3.subtract(this._velocity, this._destPos, this._tempPos);
                distance = this._velocity.length();
    
                this._velocity.normalize();
    
                this._velocity.multiplyScalar(velocity);
                this._tempPos.add(this._velocity);
    
                if (distance < EPSILON) {
                    this._moving = false;
                    this.node.setWorldPosition(this._destPos);
                } else {
                    if (velocity >= distance) {
                        this.node.setWorldPosition(this._destPos);
                    } else {
                        this.node.setWorldPosition(this._tempPos);
                    }
                }
            }
    
            this.setAnimationName(this._moving ? (this.placePos.children.length == 0 ? 'walk' : 'walk_carry') : 'eat');
            // this.setAnimationValue('Speed', this._moving ? velocity : 0);
        }
        
        this._rigidBody.getLinearVelocity(this._tempPos);
        Vec3.lerp(this._tempPos, Vec3.ZERO, this._tempPos, deltaTime * 20);
        this._rigidBody.setLinearVelocity(this._tempPos);

        switch (this._state) {
            case State.TO_EAT:
                if (Vec3.distance(this.node.position, this._targetPos) < 2)//!this._moving)
                    this._state = State.WAIT;
                break;
            case State.WAIT:
                if (this.placePos.children.length == 0) {
                    this.updateEmojiTime(deltaTime);

                    this.hungryIcon.active = !this.emoji.isShown();

                    this._idleTimer += deltaTime;
                    if (this._idleTimer > 3) {
                        this._idleTimer = 0;

                        if (!this._idleMove) {
                            this._targetPos.set(this.endPos);
                            this._targetPos.x += randomRange(-1, 1);
                            this._targetPos.z += randomRange(-1, 1);
    
                            this._moving = true;
    
                            this._idleMove = true;
                        } else
                            this._idleMove  = false;
                    }
                }
                break;
            case State.BACK:
                if (!this._moving) {
                    Utils.removeChildrenDestroy(this.placePos);

                    this._state = State.TO_EAT;

                    this._targetPos.set(this.endPos);
                    this._moving = true;

                    this.hungryIcon.active = true;

                    this.enablePhysics(true);

                    this._waitTime = 0;
                    if (this.emoji)
                        this.emoji.setType(Emoji.TYPE.NONE);
                }

                break;
        }
    }

    protected updateEmojiTime(deltaTime:number) {
        this._waitTime += deltaTime;

        const emojiType = Math.floor(this._waitTime * (Emoji.TYPE.ANGRY - Emoji.TYPE.TIRED + 1) / this._maxWaitTime);
        if (emojiType >= Emoji.TYPE.TIRED && this.emoji)
            this.emoji.setType(emojiType);
    }

    public isWaiting() : boolean {
        return (this._state == State.WAIT || this._attackFence != null) && !this.hasFood();
    }

    public hasFood() : boolean {
        return this.placePos.children.length > 0;
    }

    public receiveFood(food:Node) : boolean {
        if (food && !this.hasFood()) {
            food.getWorldPosition(this._tempPos);

            food.setParent(this.placePos);
            food.setWorldPosition(this._tempPos);

            ParabolaTween.moveNodeParabola(food, Vec3.ZERO, 2, 0.3, -1, 0, false);

            this.hungryIcon.active = false;

            this._state = State.EATING;
            this._attackFence = null;
            this.enablePhysics(false);

            this._moving = false;
    
            this.scheduleOnce(()=>{
                this._state = State.BACK;

                this._targetPos.set(this.startPos);
                this._moving = true;

                if (this.emoji && this.emoji.getType() <= Emoji.TYPE.TIRED)
                    this.emoji.setType(Emoji.TYPE.SMILE);
            }, 0.5);

            return true;
        }

        return false;
    }
}


