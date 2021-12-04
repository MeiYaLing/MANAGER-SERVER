const router = require('koa-router')()
const User = require('../models/userSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')
const log4js = require('../utils/log4j')

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
    log4js.info("res=" + res);

    const data = res._doc;
    const token = jwt.sign({
      data: data
    }, 'jason', { expiresIn: '1h' });

    if (res) {
      data.token = token;
      ctx.body = util.success(data);
    } else {
      ctx.body = util.fail("用户名或者密码不正确");
    }
  } catch (error) {
    ctx.body = util.fail(error.msg);
  }
})

router.get('/list', async (ctx) => {
  const { userId, userName, state } = ctx.request.query;
  const { page, skipIndex } = util.paper(ctx.request.query);

  let params = {};
  if (userId) {
    params.userId = userId;
  }
  if (userName) {
    params.userName = userName;
  }
  if (state && state != '0') {
    params.state = state;
  }

  try {
    const query = User.find(params, { _id: 0, userPwd: 0 });
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await User.countDocuments(params);

    ctx.body = util.success({
      page:{
        ...page,
        total
      },
      list
    })

  } catch (error) {
    ctx.body = util.fail(`查询异常${error.stack}`)
  }

})
module.exports = router
