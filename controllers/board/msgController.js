const StatusDescription = require('../../core/error')
const Mongo = require('../../common/db-client')
const { v4 } = require('uuid')
const logger = require('../../common/log')
const { Logger } = require('mongodb')

async function DFS(postIdx, dbCollection, postList){
    postList.push(postIdx)
    result = await dbCollection.findOne({postIdx: postIdx})
    let replyList = result.replyList
    if (replyList.length===0){
        return postList
    }
    let width = replyList.length
    for (let i=0; i< width; i++){
        postList = await DFS(replyList[i], dbCollection, postList)
    }
    return postList
}

async function _isAccountValid(email, pw, ctx, funcName=null){
    const usersTable = await Mongo.getCollection('users')

    // check if email and pw is null
    if (!email || !pw){
        ctx.status = StatusDescription.FieldNull.statusCode
        ctx.body = {
            errorCode: StatusDescription.FieldNull.errorCode,
            stat: StatusDescription.FieldNull.description
        }
        return {ret: false, data: ctx}
    }

    // check if email registered
    logger.logInfo(`++++++++++++++++++receiving email: ${email}`)
    let result = await usersTable.findOne({email: email})
    if (funcName){
        logger.logInfo(funcName, `check user account: ${JSON.stringify(result)}`)
    } else {
        logger.logInfo(`check user account: ${JSON.stringify(result)}`)
    }
    if (!result){
        ctx.status = StatusDescription.EmailNotRegister.statusCode
        ctx.body = {
            errorCode: StatusDescription.EmailNotRegister.errorCode,
            stat: StatusDescription.EmailNotRegister.description
        }
        return {ret: false, data: ctx}
    }

    // check if password correct
    result = await usersTable.findOne({email: email, pw: pw})
    if (funcName){
        logger.logInfo(funcName, `check password: ${JSON.stringify(result)}`)
    } else {
        logger.logInfo(`check password: ${JSON.stringify(result)}`)
    }
    if (!result){
        ctx.status = StatusDescription.AccountPwNotMatch.statusCode
        ctx.body = {
            errorCode: StatusDescription.AccountPwNotMatch.errorCode,
            stat: StatusDescription.AccountPwNotMatch.description
        }
        return {ret: false, data: ctx}
    }
    return {ret: true, data: ctx}
}

// _isFormatCorrect(ctx){}

function _isPostContentValid(msg, ctx, funcName=null){
    if (msg.length===0){
        ctx.status = StatusDescription.ContentNull.statusCode
        ctx.body = {
            errorCode: StatusDescription.ContentNull.errorCode,
            stat: StatusDescription.ContentNull.description
        }
        return {ret: false, data: ctx}
    }
    return {ret: true, data: ctx}
}

async function _isPostExist(query, ctx, funcName=null){
    let postsTable = await Mongo.getCollection('posts')
    let result = await postsTable.findOne(query)
    if (funcName){
        logger.logInfo(funcName, `check post exist: ${JSON.stringify(result)}`)
    } else {
        logger.logInfo(`check post exist: ${JSON.stringify(result)}`)
    }
    if (!result){
        ctx.status = StatusDescription.NotFoundPost.statusCode
        ctx.body = {
            errorCode: StatusDescription.NotFoundPost.errorCode,
            stat: StatusDescription.NotFoundPost.description
        }
        return {ret: false, data: ctx}
    }
    return {ret: true, data: result}
}

function structPostResponse(postInfo){
    let response = {
        postIdx: postInfo.postIdx,
        msg: postInfo.msg,
        email: postInfo.email,
        replyList: postInfo.replyList,
        updatedAt: new Date(postInfo.updatedAt).toISOString()
    }
    return response
}

class MsgController{
    async addPost(ctx, next){
        // create new post
        try{
            const msg = ctx.request.body.msg || ''
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            const newPostIdx = v4()
            const createdAt = Date.now()
            let postsTable = await Mongo.getCollection('posts')
            logger.logInfo(`[post/add] receiving request: ${JSON.stringify(ctx.request.body)}`)

            let ret = _isPostContentValid(msg, ctx)
            if (!ret.ret){
                logger.logResponse(ret.data)
                return
            }
            ret = await _isAccountValid(email, pw, ctx, '[post/add]')
            if (!ret.ret){
                logger.logResponse(ret.data)
                return
            }

            let postInfo = {
                postIdx: newPostIdx,
                email: email,
                msg: msg,
                createdAt: createdAt,
                updatedAt: createdAt,
                replyList: []
            }
            let result = await postsTable.insertOne(postInfo)
            logger.logInfo(`[post/add] DB operation result : ${result}`)
            if (result.result.ok !== 1){
                ctx.status = StatusDescription.DBOperationError.statusCode
                ctx.body = {
                    errorCode: StatusDescription.DBOperationError.errorCode,
                    stat: StatusDescription.DBOperationError.description
                }
                logger.logResponse(ctx)
                return
            }
            postInfo = structPostResponse(result.ops[0])
            ctx.status = StatusDescription.Ok.statusCode
            ctx.body = {
                errorCode: StatusDescription.Ok.errorCode,
                stat: StatusDescription.Ok.description,
                postInfo: postInfo
            }
            logger.logResponse(ctx)
        } catch(err){
            logger.logError(`[post/add] Service error: ${err}`)
            ctx.status = StatusDescription.ServerInternalError.statusCode
            ctx.body = {
                errorCode: StatusDescription.ServerInternalError.errorCode,
                stat: StatusDescription.ServerInternalError.description
            }
            logger.logResponse(ctx)
        }
    }

    async getPost(ctx, next){
        // get post
        try{
            const { postIdx } = ctx.request.query
            logger.logInfo(`[post/get] receiving request: ${JSON.stringify(ctx.request.body)}`)
            if (!postIdx){
                ctx.status = StatusDescription.GetPostError.statusCode
                ctx.body = {
                    errorCode: StatusDescription.GetPostError.errorCode,
                    stat: StatusDescription.GetPostError.description
                }
                logger.logResponse(ctx)
                return
            }

            let query = {postIdx: postIdx}
            let ret = await _isPostExist(query, ctx, '[post/get]')
            if (!ret.ret){
                logger.logResponse(ret.data)
                return
            }
            let postInfo = structPostResponse(ret.data)
            ctx.status = StatusDescription.Ok.statusCode
            ctx.body = {
                errorCode: StatusDescription.Ok.errorCode,
                stat: StatusDescription.Ok.description,
                postInfo: postInfo
            }
            logger.logResponse(ctx)
        } catch(err){
            logger.logError(`[post/get] Service error: ${err}`)
            ctx.status = StatusDescription.ServerInternalError.statusCode
            ctx.body = {
                errorCode: StatusDescription.ServerInternalError.errorCode,
                stat: StatusDescription.ServerInternalError.description
            }
            logger.logResponse(ctx)
        }
    }

    async modifyPost(ctx, next){
        // modify post
        try{
            const msg = ctx.request.body.msg || ''
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            const { postIdx } = ctx.request.body
            logger.logInfo(`[post/update] receiving request: ${JSON.stringify(ctx.request.body)}`)
            const updatedAt = Date.now()
            let postsTable = await Mongo.getCollection('posts')

            let ret = _isPostContentValid(msg, ctx)
            if (!ret.ret){
                logger.logResponse(ret.data)
                return
            }
            ret = await _isAccountValid(email, pw, ctx, '[post/update]')
            if (!ret){
                logger.logResponse(ret.data)
                return
            }

            if (!postIdx){
                ctx.status = StatusDescription.GetPostError.statusCode
                ctx.body = {
                    errorCode: StatusDescription.GetPostError.errorCode,
                    stat: StatusDescription.GetPostError.description
                }
                logger.logResponse(ctx)
                return
            }
            let query = {postIdx: postIdx, email: email}
            ret = await _isPostExist(query, ctx, '[post/update]')
            if (!ret.ret){
                logger.logResponse(ret.data)
                return
            }

            ret.data.msg = msg
            ret.data.updatedAt = updatedAt

            logger.logInfo(`[post/update] data to be update: ${JSON.stringify(ret.data)}`)
            let result = await postsTable.findOneAndUpdate(
                {postIdx: postIdx, email: email},
                {$set: ret.data},
                {returnOriginal: false}
            )
            logger.logInfo(`[post/update] Updated user info: ${JSON.stringify(result)}`)
            if (!result.value){
                ctx.status = StatusDescription.DBOperationError.statusCode
                ctx.body = {
                    errorCode: StatusDescription.DBOperationError.errorCode,
                    stat: StatusDescription.DBOperationError.description
                }
                logger.logResponse(ctx)
                return
            }
            let postInfo = structPostResponse(result.value)
            ctx.status = StatusDescription.Ok.statusCode
            ctx.body = {
                errorCode: StatusDescription.Ok.errorCode,
                stat: StatusDescription.Ok.description,
                postInfo: postInfo
            }
            logger.logResponse(ctx)
        } catch(err){
            logger.logError(`[post/update] Service error: ${err}`)
            ctx.status = StatusDescription.ServerInternalError.statusCode
            ctx.body = {
                errorCode: StatusDescription.ServerInternalError.errorCode,
                stat: StatusDescription.ServerInternalError.description
            }
            logger.logResponse(ctx)
        }
    }

    async removePost(ctx, next){
        // remove post
        try{
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            let { postIdx } = ctx.request.body
            logger.logInfo(`[post/remove] receiving request: ${JSON.stringify(ctx.request.body)}`)
            let postsTable = await Mongo.getCollection('posts')

            let ret = await _isAccountValid(email, pw, ctx, '[post/remove]')
            if (!ret.ret){
                logger.logResponse(ret.data)
                return
            }

            if (!postIdx){
                ctx.status = StatusDescription.GetPostError.statusCode
                ctx.body = {
                    errorCode: StatusDescription.GetPostError.errorCode,
                    stat: StatusDescription.GetPostError.description
                }
                logger.logResponse(ctx)
                return
            }

            // check if account of remove request and account who created post is same
            let query = {postIdx: postIdx, email: email}
            ret = await _isPostExist(query, ctx, '[post/remove]')
            if (!ret.ret){
                logger.logResponse(ret.data)
                return
            }

            // dfs find all postidx then delete it
            let postIdxList = []
            postIdxList = await DFS(postIdx, postsTable, postIdxList)
            logger.logInfo(`[post/remove] remove list: ${postIdxList}`)
            let result
            for (let i=0; i<postIdxList.length; i++){
                result = await postsTable.findOneAndDelete({postIdx: postIdxList[i]})
                if (result.ok !== 1){
                    ctx.status = StatusDescription.DBOperationError.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.DBOperationError.errorCode,
                        stat: StatusDescription.DBOperationError.description
                    }
                    logger.logResponse(ctx)
                    return
                }
            }
            ctx.status = StatusDescription.Ok.statusCode
            ctx.body = {
                errorCode: StatusDescription.Ok.errorCode,
                stat: StatusDescription.Ok.description + `, delete ${postIdxList.length} documents`
            }
            logger.logResponse(ctx)
        } catch(err){
            logger.logError(`[post/remove] Service error: ${err}`)
            ctx.status = StatusDescription.ServerInternalError.statusCode
            ctx.body = {
                errorCode: StatusDescription.ServerInternalError.errorCode,
                stat: StatusDescription.ServerInternalError.description
            }
            logger.logResponse(ctx)
        }
    }

    async replyPost(ctx, next){
        // return specific post
        try{
            const msg = ctx.request.body.msg || ''
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            const { replyIdx } = ctx.request.body
            logger.logInfo(`[post/reply] receiving request: ${JSON.stringify(ctx.request.body)}`)
            const newPostIdx = v4()
            const createdAt = Date.now()
            let postsTable = await Mongo.getCollection('posts')

            let ret = _isPostContentValid(msg, ctx)
            if (!ret.ret){
                logger.logResponse(ret.data)
                return
            }
            ret = await _isAccountValid(email, pw, ctx, '[post/reply]')
            if (!ret){
                logger.logResponse(ret.data)
                return
            }

            if (!replyIdx){
                ctx.status = StatusDescription.GetPostError.statusCode
                ctx.body = {
                    errorCode: StatusDescription.GetPostError.errorCode,
                    stat: StatusDescription.GetPostError.description
                }
                logger.logResponse(ctx)
                return
            }

            let query = {postIdx: replyIdx}
            ret = await _isPostExist(query, ctx, '[post/reply]')
            if (!ret){
                logger.logResponse(ret.data)
                return
            }

            ret.data.replyList.push(newPostIdx)
            let postInfo = await postsTable.updateOne(
                {postIdx: replyIdx},
                {$set: ret.data}
            )
            if (postInfo){
                postInfo = {
                    postIdx: newPostIdx,
                    email: email,
                    msg: msg,
                    createdAt: createdAt,
                    updatedAt: createdAt,
                    replyList: []
                }
                let result = await postsTable.insertOne(postInfo)
                logger.logInfo(`[post/reply] DB operation result: ${result}`)
                if (result.result.ok !== 1){
                    ctx.status = StatusDescription.DBOperationError.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.DBOperationError.errorCode,
                        stat: StatusDescription.DBOperationError.description
                    }
                    logger.logResponse(ctx)
                    return
                }
                postInfo = structPostResponse(result.ops[0])
                ctx.status = StatusDescription.Ok.statusCode
                ctx.body = {
                    errorCode: StatusDescription.Ok.errorCode,
                    stat: StatusDescription.Ok.description,
                    postInfo: postInfo
                }
                logger.logResponse(ctx)
            }
        } catch(err){
            logger.logError(`[post/reply] Service error: ${err}`)
            ctx.status = StatusDescription.ServerInternalError.statusCode
            ctx.body = {
                errorCode: StatusDescription.ServerInternalError.errorCode,
                stat: StatusDescription.ServerInternalError.description
            }
            logger.logResponse(ctx)
        }
    }
}

module.exports = new MsgController()