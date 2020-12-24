const request = require('supertest')
let app = require('../app')
const Init = require('../common/api-init')
const StatusDescription = require('../core/error')
const logger = require('../common/log')

const userInfo = {
    email: 'hsuTest@test.com',
    pw: '123456'
}
let userInfoNotEnoughPW = Object.assign({}, userInfo)
userInfoNotEnoughPW.pw = '1234'
let userInfoWrongEmail = Object.assign({}, userInfo)
userInfoWrongEmail.email = 'hsu@@test.com'
let modifiedInfo = Object.assign({}, userInfo)
modifiedInfo.gender = 'M'
modifiedInfo.birthday = '20201218'
modifiedInfo.username = 'holala'

beforeAll(async () => {
    logger.logInfo(`Jest test start`)
    await Init.init()
    // server = http.createServer(server.callback());
    // server.listen(3200)
})

describe('Test userController', () => {
    test('Get un-registered userInfo', async () => {
        logger.logInfo('Get un-registered userInfo')
        const res = await request(app.callback()).get('/user/getInfo').query(userInfo)
        expect(res.status).toBe(StatusDescription.NoDataFound.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.NoDataFound.errorCode)
    })

    test('Register new user with pw not enough length', async () => {
        logger.logInfo('Register new user with pw not enough length')
        const res = await request(app.callback()).post('/user/register').send(userInfoNotEnoughPW)
        expect(res.status).toBe(StatusDescription.PwTooShort.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.PwTooShort.errorCode)
    })

    test('Register new user with not valid email format', async () => {
        logger.logInfo('Register new user with not valid email format')
        const res = await request(app.callback()).post('/user/register').send(userInfoWrongEmail)
        expect(res.status).toBe(StatusDescription.EmailFormatWrong.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.EmailFormatWrong.errorCode)
    })

    test('Register new user with too large(>100kb) photo', async () => {
        logger.logInfo('Register new user with too large(>100kb) photo')
        const res = await request(app.callback()).post('/user/register')
        .field('email', 'hsuTest@test.com').field('pw', '123456').attach('file', '__test__/large.png')
        expect(res.status).toBe(StatusDescription.PhotoTooLarge.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.PhotoTooLarge.errorCode)
    })

    test('Register new user', async () => {
        logger.logInfo('Register new user')
        const res = await request(app.callback()).post('/user/register').send(userInfo)
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.Ok.errorCode)
    })

    test('Test register user with already registed email', async () => {
        logger.logInfo('Test register user with already registed email')
        const res = await request(app.callback()).post('/user/register').send(userInfo)
        expect(res.status).toBe(StatusDescription.AlreadyRegistered.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.AlreadyRegistered.errorCode)
    })

    test('Test get userInfo', async () => {
        logger.logInfo('Test get userInfo')
        const res = await request(app.callback()).get('/user/getInfo').query(userInfo)
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.Ok.errorCode)
        expect(res.body.userInfo.email).toBe(userInfo.email)
    })

    test('Modify gender, birthday and username of userInfo', async () => {
        logger.logInfo('Modify gender, birthday and username of userInfo')
        const res = await request(app.callback()).post('/user/update').send(modifiedInfo)
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.Ok.errorCode)
        expect(res.body.userInfo.gender).toBe(modifiedInfo.gender)
        expect(res.body.userInfo.birthday).toBe(modifiedInfo.birthday)
    })

    test('Modify nickname of userInfo, but other field should keep intact', async () => {
        logger.logInfo('Modify nickname of userInfo, but other field should keep intact')
        let modifiedInfo2 = Object.assign({}, userInfo)
        modifiedInfo2.nickname = 'IAmchange'
        const res = await request(app.callback()).post('/user/update').send(modifiedInfo2)
        expect(modifiedInfo2).not.toBe(modifiedInfo)
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.Ok.errorCode)
        expect(res.body.userInfo.gender).toBe(modifiedInfo.gender)
        expect(res.body.userInfo.nickname).not.toBe(modifiedInfo.nickname)
        expect(res.body.userInfo.nickname).toBe(modifiedInfo2.nickname)
    })

    test('Change photo with too large photo', async () => {
        logger.logInfo('Change photo with too large photo')
        const res = await request(app.callback()).post('/user/update')
        .field('email', 'hsuTest@test.com').field('pw', '123456').attach('file', '__test__/large.png')
        expect(res.status).toBe(StatusDescription.PhotoTooLarge.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.PhotoTooLarge.errorCode)
    })

    test('Change photo', async () => {
        logger.logInfo('Change photo')
        const res = await request(app.callback()).post('/user/update')
        .field('email', 'hsuTest@test.com').field('pw', '123456').attach('file', '__test__/photo2.png')
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.Ok.errorCode)
    })

    test('Modify userInfo with not matched email and pw', async () => {
        logger.logInfo('Modify userInfo with not matched email and pw')
        const notCorrect = Object.assign({}, modifiedInfo)
        notCorrect.pw = '22222'
        notCorrect.username = 'IamWrong'
        const res = await request(app.callback()).post('/user/update').send(notCorrect)
        expect(res.status).toBe(StatusDescription.AccountPwNotMatch.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.AccountPwNotMatch.errorCode)
    })

    test('Delete userInfo', async () => {
        logger.logInfo('Delete userInfo')
        const res = await request(app.callback()).post('/user/remove').send(modifiedInfo)
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.Ok.errorCode)
    })

    test('Update userInfo after account is deleted', async () =>{
        logger.logInfo('Update userInfo after account is deleted')
        modifiedInfo.username = 'Damn ItshouldBeDeleted'
        const res = await request(app.callback()).post('/user/update').send(modifiedInfo)
        expect(res.status).toBe(StatusDescription.NoDataFound.statusCode)
        expect(res.body.errorCode).toBe(StatusDescription.NoDataFound.errorCode)
    })

    test('Wrong routes', async () => {
        logger.logInfo('Wrong routes')
        const res = await request(app.callback()).post('/user/post').send()
        expect(res.status).toBe(StatusDescription.NotFound.statusCode)
        // expect(res.body.errorCode).toBe(StatusDescription.NotFound.errorCode)
    })

    test('Not allowed method', async () => {
        logger.logInfo('Not allowed method')
        const res = await request(app.callback()).get('/user/update').send(modifiedInfo)
        expect(res.status).toBe(StatusDescription.MethodNotAllowed.statusCode)
        // expect(res.body.errorCode).toBe(StatusDescription.MethodNotAllowed.errorCode)
    })
})