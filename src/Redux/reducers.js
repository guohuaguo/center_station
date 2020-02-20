import { DATA_ARRAY, MODEL_TYPE } from './actions';
import { combineReducers } from 'redux';


/**
 * 获取保存在redux中的变量
 * @param {Array} state 初始值
 * @param {*} param1 
 */
export function getDataArray(state = [], { type, payload }) {
    switch (type) {
        case DATA_ARRAY:
            return payload;
        default:
            return state;
    }
}

/**
 * 获取整个模型是车还是人
 * @param {*} state 初始值
 * @param {*} param1 
 */
export function getModelType(state = '', { type, payload }) {
    switch (type) {
        case DATA_ARRAY:
            return payload;
        default:
            return state;
    }
}


const rootReducer = combineReducers({ getDataArray, getModelType });

export default rootReducer;