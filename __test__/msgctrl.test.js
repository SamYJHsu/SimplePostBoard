const request = require('supertest')
let app = require('../app')
const Init = require('../common/api-init')
const StatusDescription = require('../core/error')
const logger = require('../common/log')

const user1 = {
    email: 'test1@test.com',
    pw: '123456'
}
const user2 = {
    email: 'test2@test.com',
    pw: '123456'
}
const user3 = {
    email: 'test3@test.com',
    pw: '123456'
}

const postWithoutEmail = {
    msg: 'hello'
}
const _postRequest = {
    email: 'test1@test.com',
    pw: '123456'
}
let postRequestValid = Object.assign({}, _postRequest)
postRequestValid.msg = '1'
let postRequestUnvalidAcc = Object.assign({}, postRequestValid)
postRequestUnvalidAcc.email = 'test4@test.com'
let postIdxGlobal
let replyIdxGlobal

beforeAll(async () => {
    logger.logInfo(`Jest test start`)
    await Init.init()
    await request(app.callback()).post('/user/register').send(user1)
    await request(app.callback()).post('/user/register').send(user2)
    await request(app.callback()).post('/user/register').send(user3)
})

describe('Test MsgController', () => {
    test('Create post with valid account and pw (already registered), then delete', async () => {
        logger.logInfo('Create post with valid account and pw')
        const res = await request(app.callback()).post('/post/add').send(postRequestValid)
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        expect(res.body.postInfo.msg).toBe(postRequestValid.msg)

        logger.logInfo('Get post check it is existed')
        let res2 = await request(app.callback()).get('/post/get').query({postIdx: postIdx})
        expect(res2.status).toBe(StatusDescription.Ok.statusCode)
        expect(res2.body.postInfo.msg).toBe(postRequestValid.msg)

        let deleteReq = {
            email: 'test1@test.com',
            pw: '123456',
            postIdx: res.body.postInfo.postIdx
        }

        logger.logInfo('Remove post')
        res2 = await request(app.callback()).post('/post/remove').send(deleteReq)
        expect(res2.status).toBe(StatusDescription.Ok.statusCode)
        
        logger.logInfo('Get post again check if it is removed')
        res2 = await request(app.callback()).get('/post/get').query({postIdx: postIdx})
        expect(res2.status).toBe(StatusDescription.NotFoundPost.statusCode)
    })

    test('Create post with unvalid request', async () => {
        logger.logInfo('Create post with unregisted account')
        let res = await request(app.callback()).post('/post/add').send(postRequestUnvalidAcc)
        expect(res.status).toBe(StatusDescription.NoDataFound.statusCode)

        logger.logInfo('Request without email and pw')
        res = await request(app.callback()).post('/post/add').send(postWithoutEmail)
        expect(res.status).toBe(StatusDescription.FeildError.statusCode)

        logger.logInfo('Request without msg')
        res = await request(app.callback()).post('/post/add').send(user3)
        expect(res.status).toBe(StatusDescription.FeildError.statusCode)

        let postReqPwNotCorrect = Object.assign({}, postRequestValid)
        postReqPwNotCorrect.pw = '222222'
        logger.logInfo('Create post with not matched account and pw')
        res = await request(app.callback()).post('/post/add').send(postReqPwNotCorrect)
        expect(res.status).toBe(StatusDescription.AccountPwNotMatch.statusCode)
    })

    test('Create post and reply', async () => {
        anotherPost = {
            email: 'test1@test.com',
            pw: '123456',
            msg: 'modified'
        }
        logger.logInfo('Create post and reply')
        logger.logInfo('Create post')
        let res = await request(app.callback()).post('/post/add').send(anotherPost)
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        let postIdx = res.body.postInfo.postIdx
        postIdxGlobal = postIdx

        let replyPost = {
            email: 'test2@test.com',
            pw: '123456',
            msg: 'reply',
            replyIdx: postIdx
        }
        logger.logInfo('Reply post')
        let res2 = await request(app.callback()).post('/post/reply').send(replyPost)
        expect(res2.status).toBe(StatusDescription.Ok.statusCode)
        let post2Idx = res2.body.postInfo.postIdx
        replyIdxGlobal = post2Idx

        logger.logInfo('Get 1st Post')
        res = await request(app.callback()).get('/post/get').query({postIdx: postIdx})
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        expect(res.body.postInfo.replyIdx).toBe(post2Idx)
    })

    test('Modify post and check', async () => {
        let modify = {
            email: 'test1@test.com',
            pw: '123456',
            msg: 'Modified 2'
        }
        logger.logInfo('Modify post and check')
        logger.logInfo('Modify post without postIdx')
        let res = await request(app.callback()).post('/post/update').send(modify)
        expect(res.status).toBe(StatusDescription.GetPostError.statusCode)

        logger.logInfo('Modify post with valid request field')
        modify = {
            email: 'test1@test.com',
            pw: '123456',
            msg: 'Modified 2',
            postIdx: postIdxGlobal
        }
        res = await request(app.callback()).post('/post/update').send(modify)
        expect(res.status).toBe(StatusDescription.Ok.statusCode)
        expect(res.body.postInfo.msg).toBe(modify.msg)
        expect(res.body.postInfo.replyIdx).toBe(replyIdxGlobal)
    })
})