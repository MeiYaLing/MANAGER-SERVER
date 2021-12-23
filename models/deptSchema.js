const mongoose = require('mongoose')

const deptSchema = mongoose.Schema({
    parentId: [mongoose.Types.ObjectId],//mongoose的id类型
    deptName: String,
    userId: String,
    userName: String,
    userEmail: String,
    createTime: {
        type: Date,
        default: Date.now()
    },//创建时间
    updateTime: {
        type: Date,
        default: Date.now()
    },//更新时间
})

module.exports = mongoose.model('depts', deptSchema, 'depts')