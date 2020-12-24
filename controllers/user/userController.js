const validator = require('email-validator')
const Mongo = require('../../common/db-client')
const StatusDescription = require('../../core/error')
const config = require('../../config.json')
const logger = require('../../common/log')

const pwMinLength = config.para.pwMinLength
const photoMaxKbSize = config.para.photoMaxKbSize

class UserController{
    // register
    async addUser(ctx, next){
        try{
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            const userName = ctx.request.body.userName || email
            const nickname = ctx.request.body.nickname || ''
            const birthday = ctx.request.body.birthday || ''
            const gender = ctx.request.body.gender || ''
            logger.logInfo(`[user/addUser] receiving request: ${JSON.stringify(ctx.request.body)}`)
            let photo
            if (ctx.request.files && ctx.request.files.file){
                photo = ctx.request.files.file
                if ((photo.size/(1024)) > photoMaxKbSize){
                    logger.logInfo(`[user/addUser] photo size is too large`)
                    ctx.status = StatusDescription.PhotoTooLarge.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.PhotoTooLarge.errorCode,
                        stat: StatusDescription.PhotoTooLarge.description
                    }
                    return
                }
            }
            const createdAt = Date.now()

            let usersTable = await Mongo.getCollection('users')
            if (email && pw){
                if (!validator.validate(email)){
                    logger.logInfo(`[user/addUser] email: ${email} format is wrong`)
                    ctx.status = StatusDescription.EmailFormatWrong.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.EmailFormatWrong.errorCode,
                        stat: StatusDescription.EmailFormatWrong.description
                    }
                    return
                }
                if (pwMinLength <= pw.length){
                    let userInfo = await usersTable.findOne({email: email, pw: pw})
                    if (userInfo){
                        logger.logInfo(`[user/addUser] email: ${email} is registered`)
                        ctx.status = StatusDescription.AlreadyRegistered.statusCode
                        ctx.body = {
                            errorCode: StatusDescription.AlreadyRegistered.errorCode,
                            stat: StatusDescription.AlreadyRegistered.description
                        }
                        return
                    }
                    userInfo = {
                        userName: userName,
                        email: email,
                        pw: pw,
                        nickname: nickname,
                        birthday: birthday,
                        gender: gender,
                        createdAt: createdAt,
                        updatedAt: createdAt
                    }
                    if (photo) userInfo.photo = photo
                    let result = await usersTable.insertOne(userInfo)
                    logger.logInfo(`[user/addUser] DB operation result: ${JSON.stringify(result)}`)
                    if (result.result.ok !== 1){
                        ctx.status = StatusDescription.DBOperationError.statusCode
                        ctx.body = {
                            errorCode: StatusDescription.DBOperationError.errorCode,
                            stat: StatusDescription.DBOperationError.description
                        }
                        logger.logResponse(ctx)
                        return
                    }
                    userInfo = {
                        username: result.ops[0].userName,
                        nickname: result.ops[0].nickname,
                        birthday: result.ops[0].birthday,
                        gender: result.ops[0].gender,
                        email: result.ops[0].email,
                    }
                    if (photo) userInfo.photo = result.ops[0].photo.path

                    ctx.status = StatusDescription.Ok.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.Ok.errorCode,
                        stat: StatusDescription.Ok.description,
                        userInfo: userInfo
                    }
                    logger.logResponse(ctx)
                } else {
                    ctx.status = StatusDescription.PwTooShort.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.PwTooShort.errorCode,
                        stat: StatusDescription.PwTooShort.description
                    }
                    logger.logResponse(ctx)
                }
            } else {
                ctx.status = StatusDescription.FieldNull.statusCode
                ctx.body = {
                    errorCode: StatusDescription.FieldNull.errorCode,
                    stat: StatusDescription.FieldNull.description
                }
                logger.logResponse(ctx)
            }
        } catch(err) {
            logger.logError(`[user/addUser] Service error: ${err}`)
            ctx.status = StatusDescription.ServerInternalError.statusCode
            ctx.body = {
                errorCode: StatusDescription.ServerInternalError.errorCode,
                stat: StatusDescription.ServerInternalError.description
            }
            logger.logResponse(ctx)
        } 
    }

    // get user data
    async getUserData(ctx, next){
        try{
            const { email } = ctx.request.query

            logger.logInfo(`[user/getUserData] receiving request: ${JSON.stringify(ctx.request.query)}`)
            let usersTable = await Mongo.getCollection('users')
            let result = await usersTable.findOne({email: email})
            // console.log(`request body: ${type}`)
            logger.logInfo(`[user/getUserData] user Info: ${JSON.stringify(result)}`)
            if (result){
                let userInfo = {
                    username: result.userName,
                    nickname: result.nickname,
                    birthday: result.birthday,
                    gender: result.gender,
                    email: result.email,
                }
                if (result.photo) userInfo.photo = result.photo.path
                ctx.status = StatusDescription.Ok.statusCode
                ctx.body = {
                    errorCode: StatusDescription.Ok.errorCode,
                    stat: StatusDescription.Ok.description,
                    userInfo: userInfo
                }
                logger.logResponse(ctx)
            } else {
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
                }
                logger.logResponse(ctx)
            } 
        } catch(err){
            logger.logError(`[user/getUserData] Service error: ${err}`)
            ctx.status = StatusDescription.ServerInternalError.statusCode
            ctx.body = {
                errorCode: StatusDescription.ServerInternalError.errorCode,
                stat: StatusDescription.ServerInternalError.description
            }
            logger.logResponse(ctx)
        }
    }

    // update user data;
    async updateUserData(ctx, next){
        try{
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            const userName = ctx.request.body.userName || email
            const nickname = ctx.request.body.nickname
            const birthday = ctx.request.body.birthday
            const gender = ctx.request.body.gender
            const updatedAt = Date.now()
            logger.logInfo(`[user/updateUserData] receiving request: ${JSON.stringify(ctx.request.body)}`)
            let userInfo = {
                updatedAt: updatedAt
            }
            if (userName) userInfo.userName = userName
            if (nickname) userInfo.nickname = nickname
            if (birthday) userInfo.birthday = birthday
            if (gender) userInfo.gender = gender

            if (ctx.request.files && ctx.request.files.file){
                let photo = ctx.request.files.file
                logger.logInfo(`[user/updateUserData] photo size: ${photo.size} bytes`)
                if ((photo.size/(1024)) > photoMaxKbSize){
                    ctx.status = StatusDescription.PhotoTooLarge.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.PhotoTooLarge.errorCode,
                        stat: StatusDescription.PhotoTooLarge.description
                    }
                    logger.logResponse(ctx)
                    return
                } else {
                    userInfo.photo = photo
                }
            }

            let usersTable = await Mongo.getCollection('users')
            let result = await usersTable.findOne({email: email})
            logger.logInfo(`[user/updateUserData] check user info: ${JSON.stringify(result)}`)
            if (result){
                result = await usersTable.findOne({email: email, pw: pw})
                if (!result){
                    ctx.status = StatusDescription.AccountPwNotMatch.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.AccountPwNotMatch.errorCode,
                        stat: StatusDescription.AccountPwNotMatch.description
                    }
                    logger.logResponse(ctx)
                    return
                }
                logger.logInfo(`[user/updateUserData] data to be update: ${JSON.stringify(userInfo)}`)
                result = await usersTable.findOneAndUpdate(
                    {email: email, pw: pw},
                    {$set: userInfo},
                    {returnOriginal: false}
                )
                logger.logInfo(`[user/updateUserData] Updated user info: ${JSON.stringify(result)}`)
                if (!result.value){
                    ctx.status = StatusDescription.DBOperationError.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.DBOperationError.errorCode,
                        stat: StatusDescription.DBOperationError.description
                    }
                    logger.logResponse(ctx)
                    return
                }
                userInfo = {
                    username: result.value.userName,
                    nickname: result.value.nickname,
                    birthday: result.value.birthday,
                    gender: result.value.gender,
                    email: result.value.email
                }
                if (result.value.photo) userInfo.photo = result.value.photo.path
                ctx.status = StatusDescription.Ok.statusCode
                ctx.body = {
                    errorCode: StatusDescription.Ok.errorCode,
                    stat: StatusDescription.Ok.description,
                    userInfo: userInfo
                }
                logger.logResponse(ctx)
            } else {
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
                }
                logger.logResponse(ctx)
            }
        } catch(err){
            logger.logError(`[user/updateUserData] Service error: ${err}`)
            ctx.status = StatusDescription.ServerInternalError.statusCode
            ctx.body = {
                errorCode: StatusDescription.ServerInternalError.errorCode,
                stat: StatusDescription.ServerInternalError.description
            }
            logger.logResponse(ctx)
        }
    }

    // remove user data
    async removeUserData(ctx, next){
        try{
            const { email } = ctx.request.body
            const { pw } = ctx.request.body
            logger.logInfo(`[user/removeUserData] receiving request: ${JSON.stringify(ctx.request.body)}`)

            let usersTable = await Mongo.getCollection('users')
            let result = await usersTable.findOne({email: email})
            logger.logInfo(`[user/removeUserData] check user info: ${JSON.stringify(result)}`)
            if (result){
                result = await usersTable.findOneAndDelete({email: email, pw: pw})
                if (!result.value){
                    ctx.status = StatusDescription.AccountPwNotMatch.statusCode
                    ctx.body = {
                        errorCode: StatusDescription.AccountPwNotMatch.errorCode,
                        stat: StatusDescription.AccountPwNotMatch.description
                    }
                    logger.logResponse(ctx)
                    return
                }
                logger.logInfo(`[user/removeUserData] delete result: ${JSON.stringify(result)}`)
                ctx.status = StatusDescription.Ok.statusCode
                ctx.body = {
                    errorCode: StatusDescription.Ok.errorCode,
                    stat: StatusDescription.Ok.description
                }
                logger.logResponse(ctx)
            } else {
                ctx.status = StatusDescription.NoDataFound.statusCode
                ctx.body = {
                    errorCode: StatusDescription.NoDataFound.errorCode,
                    stat: StatusDescription.NoDataFound.description
                }
                logger.logResponse(ctx)
            }
        } catch(err){
            logger.logError(`[user/removeUserData] Service error: ${err}`)
            ctx.status = StatusDescription.ServerInternalError.statusCode
            ctx.body = {
                errorCode: StatusDescription.ServerInternalError.errorCode,
                stat: StatusDescription.ServerInternalError.description
            }
            logger.logResponse(ctx)
        }
    }
}

module.exports = new UserController()