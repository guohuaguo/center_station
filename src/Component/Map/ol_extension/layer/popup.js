import ol from '../ol';
/**
     * @private
     * @method 生成guid唯一编码
     * @returns {string} 唯一编码
     */
function _guid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
}
/**
 * 创建弹框
 * @param {Object} popAttr,弹框属性
*/
export default function createPopup(popAttr){
    let overlay = new ol.Overlay({
        id:popAttr.id || _guid(),
        position: popAttr.position || undefined,
        element: popAttr.element,
        stopEvent: false,
        offset:popAttr.offset || [0, 0]
    });
    return overlay;
}
