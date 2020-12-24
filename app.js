const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body')
const userCtrl = require('./controllers/user/userController')
const msgCtrl = require('./controllers/board/msgController')

const app = new Koa()
app.use(koaBody({
    // to support file format
    multipart: true
}))

const userHandler = new Router({
    prefix: '/user',
})
const msgHandler = new Router({
    prefix: '/post'
})

userHandler.get('/getInfo', userCtrl.getUserData)
userHandler.post('/register', userCtrl.addUser)
userHandler.post('/update', userCtrl.updateUserData)
userHandler.post('/remove', userCtrl.removeUserData)

msgHandler.get('/get', msgCtrl.getPost)
msgHandler.post('/add', msgCtrl.addPost)
msgHandler.post('/update', msgCtrl.modifyPost)
msgHandler.post('/reply', msgCtrl.replyPost)
msgHandler.post('/remove', msgCtrl.removePost)

app.use(userHandler.routes()).use(userHandler.allowedMethods())
app.use(msgHandler.routes()).use(msgHandler.allowedMethods())

module.exports = app