import { _decorator, Component, instantiate, Node, Prefab, randomRangeInt, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MilkFieldMgr')
export class MilkFieldMgr extends Component {
    @property(Prefab)
    milkGroupPrefab:Prefab = null;

    @property(Node)
    placePos:Node = null;

    protected _rows:number = 8;
    protected _cols:number = 8;
    protected _size:number = 1.45;

    protected _count:number = 0;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();

    protected lateUpdate(dt: number): void {
        if (this._count < this._rows * this._cols && this.milkGroupPrefab) {
            let count:number = randomRangeInt(this._cols * 0.8, this._cols);
            if (this._count + count > this._rows * this._cols)
                count = this._rows * this._cols - this._count;

            for (let index = 0; index < count; index++) {
                const row = Math.floor(this._count / this._cols);
                const col = this._count % this._cols;
    
                this._tempPos.x = (this._cols / 2 - col - 1 / 2) * this._size;
                this._tempPos.z = (this._rows / 2 - row - 1 / 2) * this._size;
                this._tempPos.y = 0;
    
                const group = instantiate(this.milkGroupPrefab);
                this.placePos.addChild(group);
                group.setPosition(this._tempPos);
    
                this._tempPos.set(Vec3.ZERO);
                this._tempPos.y = randomRangeInt(0, 4) * 90;
                group.setRotationFromEuler(this._tempPos);
    
                this._count ++;
            }
        } else
            this.destroy();
    }
}


