const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
//const logger = require('koa-logger')
//const log4js = require("log4js");

const log4js = require('./utils/log4j')
const users = require('./routes/users')
const router = require('koa-router')()

// error handler
onerror(app)

require('./config/db')

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
//app.use(logger())
// const logger = log4js.getLogger();
// logger.level = "debug";
// logger.trace("Some trace messages");
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

//测试log4j打印错误日志功能
// app.use(() => {
//   ctx.body("error-body");
// })

// logger
app.use(async (ctx, next) => {
  //const start = new Date()
  //服务端 希望看到前端请求过来的数据
  log4js.info(`get params:${JSON.stringify(ctx.request.query)}`);
  log4js.info(`post params:${JSON.stringify(ctx.request.body)}`);
  await next()

  //const ms = new Date() - start
  //console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})


router.prefix('/api')
router.use(users.routes(), users.allowedMethods())
// routes
app.use(router.routes(), router.allowedMethods())


log4js.info("info output")
// error-handling
app.on('error', (err, ctx) => {
  //console.error('server error', err, ctx)
  log4js.error(`${err.stack}`)
});

module.exports = app
