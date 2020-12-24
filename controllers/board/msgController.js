const StatusDescription = require('../../core/error')
const Mongo = require('../../common/db-client')
const { v4 } = require('uuid')
const logger = require('../../common/log')

class MsgController{
    async addPost(ctx, next){
        // create new post
        try{
            const { msg } = ctx.request.body || ''
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
                    replyIdx: null
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
                    replyIdx: result.ops[0].replyIdx,
                    updatedAt: new Date(result.ops[0].updatedAt).toISOString()
                }
                ctx.status = StatusDescription.Ok.statusCode
                ctx.body = {
                    errorCode: StatusDescription.Ok.errorCode,
                    stat: StatusDescription.Ok.description,
                    postInfo: postInfo
                }
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
                    replyIdx: result.replyIdx,
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
            const { msg } = ctx.request.body || ''
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
                        replyIdx: result.value.replyIdx,
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
            // get response postIdx of post which would be removed
            if (result){
                let postIdx = result.replyIdx
                //check if account and pw correct
                let userInfo = await usersTable.findOne({email: email, pw: pw})
                if (userInfo){
                    // remove the assigned post
                    result = await postsTable.findOneAndDelete(
                        {postIdx: postIdx, email: email}
                    )
                    if (result.ok !== 1){
                        ctx.status = StatusDescription.DBOperationError.statusCode
                        ctx.body = {
                            errorCode: StatusDescription.DBOperationError.errorCode,
                            stat: StatusDescription.DBOperationError.description
                        }
                        logger.logResponse(ctx)
                        return
                    }
                    // remove dependency post until replyIdx is null(no any response post)
                    while((result.ok === 1) && result.value.replyIdx){
                        logger.logInfo(`[post/remove] to remove postIdx: ${result.value.replyIdx}`)
                        result = await postsTable.findOneAndDelete({postIdx: result.value.replyIdx})
                    }
                    if (!result) throw new Error('remove failed')

                    ctx.status = StatusDescription.Ok.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.Ok.errorCode,
                        stat: StatusDescription.Ok.description
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
            const { msg } = ctx.request.body || ''
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
                    postInfo.replyIdx = newPostIdx
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
                            replyIdx: null
                        }
                        result = await postsTable.insertOne(postInfo)
                        logger.logInfo(`[post/reply] DB operation result: ${result}`)
                        postInfo = {
                            postIdx: result.ops[0].postIdx,
                            msg: result.ops[0].msg,
                            email: result.ops[0].email,
                            replyIdx: result.ops[0].replyIdx,
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