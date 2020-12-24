const Router = require('koa-routers')
const msgCtrl = require('../controllers/')

const router = new Router({
    prefix: '/post'
})

router
    .get('/all', msgCtrl.listPosts)
    .get('/:id', msgCtrl.getPosts)
    .post('/create', msgCtrl.createPosts)
    .post('/remove', msgCtrl.removePosts)

module.exports = router