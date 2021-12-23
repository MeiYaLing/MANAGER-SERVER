const router = require('koa-router')()
const Dept = require('../models/deptSchema')
const util = require('../utils/util')
const log4js = require('../utils/log4j')
const { CODE } = require('../utils/util')

router.prefix('/dept')

//部门列表
router.get('/list', async (ctx) => {
  try {
    const { deptName } = ctx.request.query;
    const { page, skipIndex } = util.paper(ctx.request.query);
    let params = {};
    if (deptName) params.deptName = deptName;
    const query = Dept.find(params);
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await Dept.countDocuments(params);
    //做数据处理（得到属性结构数据）
    const treeList = getDeptList(list, null, []);
    if (deptName) {
      //有查询条件则返回符合条件的数据并排排列
      ctx.body = util.success({
        list,
        page: {
          ...page,
          total
        }
      }, '查询成功')
    } else {
      ctx.body = util.success({
        list: treeList,
        page: {
          ...page,
          total
        }
      }, '查询成功')
    }
  } catch (error) {
    ctx.body = util.fail(`查询部门列表失败${error.stack}`)
  }
})

/**
 * 递归生成菜单树形数据[{[{},{}]},{[{}]}]
 * @param {*} rootList 数据库中查询到的数据
 * @param {*} parentId 父Id
 * @param {*} childrenList 子数组
 */
function getDeptList(rootList, parentId, childrenList) {
  for (let i = 0; i < rootList.length; i++) {
    let item = rootList[i];
    if (String(item.parentId.slice(0).pop()) == String(parentId)) {
      //如果当前遍历的parentId和待生成的{}的parentId一样，则该数据是其子数据，将其放入
      childrenList.push(item._doc);
      // console.log(item._doc)
    }
  }

  childrenList.map(item => {
    //初始其子数据为空
    item.children = [];
    //一轮寻找完，再寻找下一层的子数据放入children中
    getDeptList(rootList, item._id, item.children);

    if (item.children.length == 0) {
      //没有子数据
      delete item.children;
    } else if (item.children.length > 0 && item.children[0].menuType == 2) {
      //有按钮类型的子数据时
      //用于后面做按钮权限功能时快速区分按钮和菜单
      item.action = item.children;
    }
  })
  return childrenList;
}

//部门创建/编辑/删除
router.post('/operate', async (ctx) => {
  let { action, _id, ...params } = ctx.request.body;
  let info;
  try {
    if (action == 'create') {
      await Dept.create(params);
      info = '创建成功'
    } else if (action == 'edit') {
      if (_id) {
        params.updateTime = new Date();
        await Dept.findByIdAndUpdate(_id, params);
        info = '编辑成功'
      } else {
        ctx.body = util.fail('缺少参数params:_id');
        return;
      }
    } else {
      if (_id) {
        await Dept.findByIdAndRemove(_id);
        await Dept.deleteMany({ parentId: { $all: [_id] } });
        info = '删除成功'
      } else {
        ctx.body = util.fail('缺少参数params:_id');
        return;
      }
    }
    ctx.body = util.success({}, info);
  } catch (error) {
    ctx.body = util.fail(`操作失败${error.stack}`);
  }
})


module.exports = router
