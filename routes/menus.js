const router = require('koa-router')()
const Menu = require('../models/menuSchema')
const util = require('../utils/util')
const log4js = require('../utils/log4j')
const { CODE } = require('../utils/util')

router.prefix('/menu')

//菜单列表查询
router.get('/list', async (ctx) => {
  const { menuState, menuName } = ctx.request.query;
  const params = {};
  if (menuState) params.menuState = menuState
  if (menuName) params.menuName = menuName
  let rootList = await Menu.find(params) || [];
  //处理数据库中的菜单数据，让其成为树形结构
  // console.log(rootList);
  const permissionList = getMenuList(rootList, null, []);
  ctx.body = util.success(permissionList)
})

/**
 * 递归生成菜单树形数据[{[{},{}]},{[{}]}]
 * @param {*} rootList 数据库中查询到的数据
 * @param {*} parentId 父Id
 * @param {*} childrenList 子数组
 */
function getMenuList(rootList, parentId, childrenList) {
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
    getMenuList(rootList, item._id, item.children);

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

//菜单创建、编辑、删除接口
router.post('/operate', async (ctx) => {
  const { _id, action, ...params } = ctx.request.body;
  let res, info;
  try {
    if (action == 'add') {
      res = await Menu.create(params);
      info = '创建成功';
    } else if (action == 'edit') {
      params.updateTime = new Date();
      await Menu.findByIdAndUpdate(_id, params);
      info = '编辑成功';
    } else {
      //删除
      await Menu.findByIdAndRemove(_id);
      //删除_id下的所有子菜单或按钮
      await Menu.deleteMany({ parentId: { $all: [_id] } });
      info = '删除成功';
    }
    ctx.body = util.success({}, info);
  } catch (error) {
    ctx.body = util.fail(`操作失败${error.stack}`);
  }

})

module.exports = router
