export const PERSON = ['证件号', '姓名', '性别']; //人的默认属性

export const CAR = ['车牌号码', '车牌颜色', '车身颜色', '车辆类型']; //车的默认筛选条件

export const PERSON_GROUP = ['证件号', '卡口']; //人的默认分组条件

export const CAR_GROUP = ['车牌号码', '车牌颜色', '卡口']; //车的默认分组条件

/**
 * 获取A到Z
 * @param {Number} i 索引 0=A
 */
export const getOrderChar = (i) => {
    return String.fromCharCode(65 + i);
}