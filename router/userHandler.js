const Router = require('koa-routers')
const userCtrl = require('../controllers/users/userController')

const router = new Router({
    prefix: '/user'
})

router
    .get('/reg', userCtrl.regShow)
    .get('/login', userCtrl.loginShow)
    .post('/reg', userCtrl.addUser)
    .post('/login', userCtrl.login)
    .get('/:id', userCtrl.getUser)
    .put('/:id/:method', userCtrl.modifiedUser)
    .delete('/:id/:method', userCtrl.deleteUser)

module.exports = router