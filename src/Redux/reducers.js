import { DATA_ARRAY } from './actions';
import { combineReducers } from 'redux';


/**
 * 获取保存在redux中的变量
 * @param {Ayyay} state 初始值
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

const rootReducer = combineReducers({ getDataArray });

export default rootReducer;