export const DATA_ARRAY = 'dataArray'; //需要维护的那个变量数组

/**
 * 将变量数组注入redux，记住由于这是个对象数组，使用时请使用深拷贝后再注入
 * @param {Array} param  需要维护的变量数组
 */
export function setDataArray(param) {
    return ({
        type: DATA_ARRAY,
        payload: param
    })
}