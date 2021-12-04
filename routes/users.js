const router = require('koa-router')()
const User = require('../models/userSchema')
const utils = require('../utils/util')
const jwt = require('jsonwebtoken')

router.prefix('/users')

router.post('/login', async (ctx) => {
  try {
    const { userName, userPwd } = ctx.request.body;
    /**
     * mongodb返回指定字段的3种方式：
     * 1、await User.findOne({ userName, userPwd }, 'userId userName userEmail state role deptId roleList')
     * 2、await User.findOne({ userName, userPwd }, { userId: 1, _id: 0 })//1：代表返回 0：代表不返回
     * 3、await User.findOne({ userName, userPwd }).select('userId')
     */
    const res = await User.findOne({ userName, userPwd }, 'userId userName userEmail state role deptId roleList');
    const data = res._doc;
    const token = jwt.sign({
      data: data
    }, 'jason', { expiresIn: '1h' });
    if (res) {
      data.token = token;
      ctx.body = utils.success(data);
    } else {
      ctx.body = utils.fail("用户名或者密码不正确");
    }
  } catch (error) {
    ctx.body = utils.fail(error.msg);
  }
})

module.exports = router
