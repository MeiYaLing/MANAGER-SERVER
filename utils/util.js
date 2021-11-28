const log4js = require('./log4j')
const CODE = {
    SUCCESS: 200,
    PARAM_ERROR: 10001,// 参数错误
    USER_ACCOUNT_ERROR: 20001,// 账号或者密码错误
    USER_LOGIN_ERROR: 30001,// 用户未登录
    BUSINESS_ERROR: 40001,// 业务请求失败
    AUTH_ERROR: 50001,// 认证失败或者token过期
};

module.exports = {

    /**
     * 分页函数封装
     * @param {number} ageNum 
     * @param {number} ageSize 
     */
    paper(ageNum = 1, ageSize = 10) {
        ageNum *= 1;
        ageSize *= 1;
        const skipIndex = (ageNum - 1) * ageSize;
        return {
            page: {
                ageNum,
                ageSize
            },
            skipIndex
        }
    },

    success(data = '', msg = '', code = CODE.SUCCESS) {
        log4js.debug(data);
        return {
            code, data, msg
        }
    },

    fail(msg = '', code = CODE.BUSINESS_ERROR, data = '') {
        log4js.debug(msg);
        return {
            code, data, msg
        }
    }




}