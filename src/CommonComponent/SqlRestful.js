import axios from 'axios';

/**
 * SQL化请求接口
 */
export default class SqlRestful {

    /**
     * 大数据处理接口
     * @param {Object} fetchObj {method:'请求方式',url:'',params:{参数对象},data:{请求体对象}}
     */
    static fetch(fetchObj) {
        return new Promise((resolve, reject) => {
            axios({
                ...fetchObj,
                timeout: 30000,
                headers: {
                    'Authorization': 'default',
                    'Content-Type': 'application/json'
                }
            }).then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            })
        });
    }
}