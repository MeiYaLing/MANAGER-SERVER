const router = require('koa-router')()
const User = require('../models/userSchema')
const Counter = require('../models/counterSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')
const md5 = require('md5')
const log4js = require('../utils/log4j')
const { CODE } = require('../utils/util')

router.prefix('/users')

//登录接口
router.post('/login', async (ctx) => {
  try {
    const { userName, userPwd } = ctx.request.body;
    /**
     * mongodb返回指定字段的3种方式：
     * 1、await User.findOne({ userName, userPwd }, 'userId userName userEmail state role deptId roleList')
     * 2、await User.findOne({ userName, userPwd }, { userId: 1, _id: 0 })//1：代表返回 0：代表不返回
     * 3、await User.findOne({ userName, userPwd }).select('userId')
     */
    // userPwd = md5(userPwd);
    const res = await User.findOne({ userName, userPwd: md5(userPwd) }, 'userId userName userEmail state role deptId roleList');
    // log4js.info("res=" + res);

    if (res) {
      const data = res._doc;
      const token = jwt.sign({
        data: data
      }, 'jason', { expiresIn: '1h' });
      data.token = token;
      ctx.body = util.success(data);
    } else {
      ctx.body = util.fail("用户名或者密码不正确");
    }
    return;
  } catch (error) {
    ctx.body = util.fail(error.msg);
    return;
  }
})

//用户列表接口
router.get('/list', async (ctx) => {
  //get请求是获取request中的query对象
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
      page: {
        ...page,
        total
      },
      list
    });
    return;
  } catch (error) {
    ctx.body = util.fail(`查询异常${error.stack}`);
    return;
  }

})

//删除用户接口
router.post('/delete', async (ctx) => {
  const { userIds } = ctx.request.body;
  if (!userIds[0]) {
    ctx.body = util.fail('参数错误', util, CODE.PARAM_ERROR);
    return;
  }
  //更新数据库中该用户的状态
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
  if (res.modifiedCount) {
    ctx.body = util.success(res, `共删除成功${res.modifiedCount}条`);
    return;
  } else {
    ctx.body = util.fail('删除失败');
    return;
  }
})

//用户编辑接口
router.post('/operate', async (ctx) => {
  let { userId, userName, userEmail, mobile, job, state, roleList, deptId,
    action } = ctx.request.body;

  //校验参数是否正确
  if (action === 'add') {
    //用户新增
    //参数判空
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util, CODE.PARAM_ERROR);
      return;
    }
    //检查用户名和邮箱是否重复
    const res = await User.findOne({ $or: [{ userName }, { userEmail }] }, '_id userName userEmail')
    if (res) {
      ctx.body = util.fail(`监测到有重复用户，信息日下：${userName} - ${userEmail}`);
    } else {
      try {
        //从counters表中获取用户id，并+1
        const doc = await Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } });
        const user = new User({
          userId: doc.sequence_value,
          userName,
          userPwd: md5('123456'),
          userEmail,
          mobile,
          job,
          state,
          role: 1,
          roleList,
          deptId
        });
        user.save();//保存用户信息至users表中
        ctx.body = util.success({}, '用户创建成功');
        return;
      } catch (error) {
        // ctx.body = util.fail(`用户创建失败${error.stack}`);
        ctx.fail(error, stack, '用户创建失败');
        return;
      }
    }
  } else if (action === 'edit') {
    //用户编辑
    //参数判空
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util, CODE.PARAM_ERROR);
      return;
    }
    try {
      //更新用户信息
      const res = await User.findOneAndUpdate({ userId }, { mobile, job, state, roleList, deptId })
      ctx.body = util.success(res, '更新成功');
      return;
    } catch (error) {
      ctx.body = util.fail('更新失败');
      return;
    }
  }

})

//所有用户列表
router.get('/all/list', async (ctx) => {
  try {
    const list = await User.find({},'userId userName userEmail')
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(`获取所有用户列表失败${error.stack}`)
  }
})

module.exports = router
