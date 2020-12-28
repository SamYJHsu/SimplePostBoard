const StatusDescription = {
    Ok: {
        statusCode: 200,
        errorCode: '00000',
        description: 'Request accept'
    },
    NotFound: {
        statusCode: 404,
        errorCode: '10001',
        description: 'Ip or route is not found'
    },
    MethodNotAllowed: {
        statusCode: 405,
        errorCode: '10002',
        description: 'Method not allowed'
    },
    NotAcceptable: {
        statusCode: 406,
        errorCode: '10003',
        description: 'Not acceptable'
    },
    NoDataFound: {
        statusCode: 406,
        errorCode: '10004',
        description: 'Data is not found'
    },
    AccountPwNotMatch: {
        statusCode: 406,
        errorCode: '10005',
        description: 'Password is not correct'
    },
    NoAuthModify: {
        statusCode: 406,
        errorCode: '10006',
        description: 'No authorization to modify data, data is not created by request account'
    },
    EmailFormatWrong: {
        statusCode: 406,
        errorCode: '10007',
        description: 'Email format is not correct'
    },
    PhotoTooLarge: {
        statusCode: 406,
        errorCode: '10008',
        description: 'Uploaded photo is too large, can not be accept'
    },
    AlreadyRegistered: {
        statusCode: 406,
        errorCode: '10009',
        description: 'This email is already registed'
    },
    PwTooShort:{
        statusCode: 406,
        errorCode: '10010',
        description: 'Password is too short, must be at least 6 digits'
    },
    FieldNull: {
        statusCode: 406,
        errorCode: '10011',
        description: 'Email and account must not be null'
    },
    DBOperationError: {
        statusCode: 406,
        errorCode: '10012',
        description: 'DB operation error'
    },
    ContentNull: {
        statusCode: 406,
        errorCode: '10013',
        description: 'Message must not be null'
    },
    GetPostError: {
        statusCode: 406,
        errorCode: '10014',
        description: 'Must contain postIdx'
    },
    NotFoundPost: {
        statusCode: 406,
        errorCode: '10015',
        description: 'Post not found'
    },
    EmailNotRegister: {
        statusCode: 406,
        errorCode: '10016',
        description: 'Can not found account, please registered email first'
    },
    ServerInternalError: {
        statusCode: 500,
        errorCode: '500',
        description: 'Server internal error'
    }
}

// module.exports = StatusCode
module.exports = StatusDescription