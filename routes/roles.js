const router = require('koa-router')()
const Role = require('../models/roleSchema')
const util = require('../utils/util')
const log4js = require('../utils/log4j')
const { CODE } = require('../utils/util')

router.prefix('/roles')

//角色名称列表
router.get('/allList', async (ctx) => {
  try {
    const list = await Role.find({}, '_id roleName');
    ctx.body = util.success(list);
  } catch (error) {
    ctx.body = util.fail(`查询失败${error.stack}`);
  }
})

//角色列表
router.get('/list', async (ctx) => {
  try {
    const { roleName } = ctx.request.query;
    const { page, skipIndex } = util.paper(ctx.request.query);
    console.log(skipIndex)
    console.log(page.pageSize)
    let params = {};
    if (roleName) params.roleName = roleName;
    const query = Role.find(params);
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await Role.countDocuments(params);
    ctx.body = util.success({
      list,
      page: {
        ...page,
        total
      }
    });
  } catch (error) {
    ctx.body = util.fail(`查询失败${error.stack}`);
  }
})

//角色创建/编辑/删除
router.post('/operate', async (ctx) => {
  let { _id, roleName, remark, action } = ctx.request.body;
  let res, info;
  try {
    if (action == 'create') {
      res = await Role.create({ roleName, remark });
      info = '创建成功';
    } else if (action == 'edit') {
      if (_id) {
        let params = { roleName, remark };
        params.updateTime = new Date();
        res = await Role.findByIdAndUpdate(_id, params);
        info = '编辑成功';
      } else {
        ctx.body = util.fail('缺少参数params:_id');
        return;
      }
    } else {
      //删除
      if (_id) {
        res = await Role.findByIdAndDelete(_id);
        console.log('res:' + res)
        info = '删除成功';
      } else {
        ctx.body = util.fail('删除失败');
        return;
      }
    }
    ctx.body = util.success(res, info);
  } catch (error) {
    ctx.body = util.fail(`操作失败${error.stack}`);
  }
})

//角色设置权限
router.post('/update/permission', async (ctx) => {
  let { _id, permissionList } = ctx.request.body;
  try {
    let params = { permissionList, updateTime: new Date() };
    console.log(_id)
    let res = await Role.findByIdAndUpdate(_id, params);
    ctx.body = util.success(res, '设置权限成功')
  } catch (error) {
    ctx.body = util.fail('设置权限失败');
  }
})



module.exports = router
