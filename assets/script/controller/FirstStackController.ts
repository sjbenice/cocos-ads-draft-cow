import { _decorator, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { Utils } from '../library/util/Utils';
import { Item } from '../library/controller/Item';
const { ccclass, property } = _decorator;

@ccclass('FirstStackController')
export class FirstStackController extends Component {
    @property(Prefab)
    itemPrefab:Prefab = null;

    @property
    itemCount:number = 0;

    start() {
        if (this.itemCount > 0 && this.itemPrefab) {
            const halfDimention = Utils.calcArrangeDimension(this.node);
            let itemHalfDimention :Vec3 = null;
            const pos:Vec3 = Vec3.ZERO.clone();

            for (let index = 0; index < this.itemCount; index++) {
                const element = instantiate(this.itemPrefab);

                const item = element.getComponent(Item);
                if (itemHalfDimention == null)
                    itemHalfDimention = item.getHalfDimension();

                item.startBlinkOutline(true);

                Utils.calcArrangePos(halfDimention, itemHalfDimention, this.node.children.length, pos);

                this.node.addChild(element);
                element.setPosition(pos);
            }
        }
    }
}


