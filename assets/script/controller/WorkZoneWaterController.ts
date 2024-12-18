import { _decorator, Component, Node, Vec3 } from 'cc';
import { WaterWaves } from '../library/controller/WaterWaves';
import { WorkZone } from './WorkZone';
const { ccclass, property } = _decorator;

@ccclass('WorkZoneWaterController')
export class WorkZoneWaterController extends Component {
    @property(WaterWaves)
    water:WaterWaves = null;

    @property(WorkZone)
    zone:WorkZone = null;

    @property
    startY:number = 0;

    @property
    endY:number = 1;

    @property
    maxCount:number = 120;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();

    protected onLoad(): void {
        if (this.water)
            this.water.node.getPosition(this._tempPos);
    }

    protected lateUpdate(dt: number): void {
        if (this.water && this.zone) {
            const count = this.zone.inputCount;
            if (count > 0) {
                this._tempPos.y = Math.min(1, count / this.maxCount) * (this.endY - this.startY) + this.startY;
                this.water.node.setPosition(this._tempPos);
            }

            this.water.node.active = count > 0;
        }
    }
}


