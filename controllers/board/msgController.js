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

class MsgController{
    async addPost(ctx, next){
        // create new post
        try{
            let { msg } = ctx.request.body
            msg = msg ? (msg) : ''
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            const newPostIdx = v4()
            const createdAt = Date.now()
            let postsTable = await Mongo.getCollection('posts')
            let usersTable = await Mongo.getCollection('users')
            logger.logInfo(`[post/add] receiving request: ${JSON.stringify(ctx.request.body)}`)

            if ((msg.length===0) || !email || !pw){
                ctx.status = StatusDescription.FeildError.statusCode
                ctx.body = {
                    errorCode: StatusDescription.FeildError.errorCode,
                    stat: StatusDescription.FeildError.description
                }
                logger.logResponse(ctx)
                return
            }
            let result = await usersTable.findOne({email: email})
            logger.logInfo(`[post/add] check user account: ${JSON.stringify(result)}`)
            if (!result){
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
                }
                logger.logResponse(ctx)
                return
            }
            result = await usersTable.findOne({email: email, pw: pw})
            if (result){
                let postInfo = {
                    postIdx: newPostIdx,
                    email: email,
                    msg: msg,
                    createdAt: createdAt,
                    updatedAt: createdAt,
                    replyList: []
                }
                result = await postsTable.insertOne(postInfo)
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
                postInfo = {
                    postIdx: result.ops[0].postIdx,
                    msg: result.ops[0].msg,
                    email: result.ops[0].email,
                    replyList: result.ops[0].replyList,
                    updatedAt: new Date(result.ops[0].updatedAt).toISOString()
                }
                ctx.status = StatusDescription.Ok.statusCode
                ctx.body = {
                    errorCode: StatusDescription.Ok.errorCode,
                    stat: StatusDescription.Ok.description,
                    postInfo: postInfo
                }
                logger.logResponse(ctx)
            } else {
                ctx.status = StatusDescription.AccountPwNotMatch.statusCode
                ctx.body = {
                    errorCode: StatusDescription.AccountPwNotMatch.errorCode,
                    stat: StatusDescription.AccountPwNotMatch.description
                }
                logger.logResponse(ctx)
                return
            }
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
            let postsTable = await Mongo.getCollection('posts')
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

            let result = await postsTable.findOne({postIdx: postIdx})
            if (result){
                let postInfo = {
                    postIdx: result.postIdx,
                    msg: result.msg,
                    email: result.email,
                    replyList: result.replyList,
                    updatedAt: new Date(result.updatedAt).toISOString()
                }
                ctx.status = StatusDescription.Ok.statusCode
                ctx.body = {
                    errorCode: StatusDescription.Ok.errorCode,
                    stat: StatusDescription.Ok.description,
                    postInfo: postInfo
                }
                logger.logResponse(ctx)
            } else{
                ctx.status = StatusDescription.NotFoundPost.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NotFoundPost.errorCode,
                    stat: StatusDescription.NotFoundPost.description
                }
                logger.logResponse(ctx)
            }
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
            let { msg } = ctx.request.body
            msg = msg ? (msg) : ''
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            const { postIdx } = ctx.request.body
            logger.logInfo(`[post/update] receiving request: ${JSON.stringify(ctx.request.body)}`)
            const updatedAt = Date.now()
            let postsTable = await Mongo.getCollection('posts')
            let usersTable = await Mongo.getCollection('users')

            if ((msg.length===0) || !email || !pw){
                ctx.status = StatusDescription.FeildError.statusCode
                ctx.body = {
                    errorCode: StatusDescription.FeildError.errorCode,
                    stat: StatusDescription.FeildError.description
                }
                logger.logResponse(ctx)
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
            let result = await usersTable.findOne({email: email})
            logger.logInfo(`[post/update] check user account: ${JSON.stringify(result)}`)
            if (!result){
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
                }
                logger.logResponse(ctx)
                return
            }

            let postInfo = await postsTable.findOne({postIdx: postIdx, email: email})
            if (postInfo){
                result = await usersTable.findOne({email: email, pw: pw})
                if (result){
                    postInfo.msg = msg
                    postInfo.updatedAt = updatedAt

                    logger.logInfo(`[post/update] data to be update: ${JSON.stringify(postInfo)}`)
                    result = await postsTable.findOneAndUpdate(
                        {postIdx: postIdx, email: email},
                        {$set: postInfo},
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
                    postInfo = {
                        msg: result.value.msg,
                        email: result.value.email,
                        postIdx: result.value.postIdx,
                        replyList: result.value.replyList,
                        updatedAt: new Date(result.value.updatedAt).toISOString()
                    }
                    ctx.status = StatusDescription.Ok.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.Ok.errorCode,
                        stat: StatusDescription.Ok.description,
                        postInfo: postInfo
                    }
                    logger.logResponse(ctx)
                } else{
                    ctx.status = StatusDescription.AccountPwNotMatch.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.AccountPwNotMatch.errorCode,
                        stat: StatusDescription.AccountPwNotMatch.description
                    }
                    logger.logResponse(ctx)
                    return
                }
            } else{
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
                }
                logger.logResponse(ctx)
            }
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
            let usersTable = await Mongo.getCollection('users')
            if (!email || !pw){
                ctx.status = StatusDescription.FieldNull.statusCode
                ctx.body = {
                    errorCode: StatusDescription.FieldNull.errorCode,
                    stat: StatusDescription.FieldNull.description
                }
                logger.logResponse(ctx)
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
            let result = await usersTable.findOne({email: email})
            logger.logInfo(`[post/remove] check user account: ${JSON.stringify(result)}`)
            if (!result){
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
                }
                logger.logResponse(ctx)
                return
            }

            // check if account of remove request and account who created post is same
            result = await postsTable.findOne({postIdx: postIdx, email: email})
            logger.logInfo(`[post/remove] check post: ${JSON.stringify(result)}`)
            if (result){
                //check if account and pw correct
                let userInfo = await usersTable.findOne({email: email, pw: pw})
                if (userInfo){
                    // dfs find all postidx then delete it
                    let postIdxList = []
                    postIdxList = await DFS(postIdx, postsTable, postIdxList)
                    logger.logInfo(`[post/remove] remove list: ${postIdxList}`)
                    let _bugFlag = false
                    for (let i=0; i<postIdxList.length; i++){
                        // result = await postsTable.findOne({postIdx: postIdxList[i]})
                        result = await postsTable.findOneAndDelete({postIdx: postIdxList[i]})
                        if (result.ok !== 1){
                            _bugFlag = True
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
                } else{
                    ctx.status = StatusDescription.AccountPwNotMatch.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.AccountPwNotMatch.errorCode,
                        stat: StatusDescription.AccountPwNotMatch.description
                    }
                    logger.logResponse(ctx)
                }
            } else{
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
                }
                logger.logResponse(ctx)
            }
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

    async replyPost(ctx, next){
        // return specific post
        try{
            let { msg } = ctx.request.body
            msg = msg ? (msg) : ''
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            const { replyIdx } = ctx.request.body
            logger.logInfo(`[post/reply] receiving request: ${JSON.stringify(ctx.request.body)}`)
            const newPostIdx = v4()
            const createdAt = Date.now()
            let postsTable = await Mongo.getCollection('posts')
            let usersTable = await Mongo.getCollection('users')

            if ((msg.length===0) || !email || !pw){
                ctx.status = StatusDescription.FeildError.statusCode
                ctx.body = {
                    errorCode: StatusDescription.FeildError.errorCode,
                    stat: StatusDescription.FeildError.description
                }
                logger.logResponse(ctx)
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
            let result = await usersTable.findOne({email: email})
            logger.logInfo(`[post/reply] check user account: ${JSON.stringify(result)}`)
            if (!result){
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
                }
                logger.logResponse(ctx)
                return
            }

            result = await usersTable.findOne({email: email, pw: pw})
            if (result){
                let postInfo = await postsTable.findOne({postIdx: replyIdx})
                if (postInfo){
                    postInfo.replyList.push(newPostIdx)
                    postInfo = await postsTable.updateOne(
                        {postIdx: replyIdx},
                        {$set: postInfo}
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
                        result = await postsTable.insertOne(postInfo)
                        logger.logInfo(`[post/reply] DB operation result: ${result}`)
                        postInfo = {
                            postIdx: result.ops[0].postIdx,
                            msg: result.ops[0].msg,
                            email: result.ops[0].email,
                            replyList: result.ops[0].replyList,
                            updatedAt: new Date(result.ops[0].updatedAt).toISOString()
                        }

                        ctx.status = StatusDescription.Ok.statusCode
                        ctx.body = {
                            errorCode: StatusDescription.Ok.errorCode,
                            stat: StatusDescription.Ok.description,
                            postInfo: postInfo
                        }
                        logger.logResponse(ctx)
                    }
                } else {
                    ctx.status = StatusDescription.NotFoundPost.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.NotFoundPost.errorCode,
                        stat: StatusDescription.NotFoundPost.description
                    }
                    logger.logResponse(ctx)
                }
            } else {
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
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