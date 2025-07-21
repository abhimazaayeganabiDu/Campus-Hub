class apiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
        super(message)
        this.statusCode = statusCode
        this.message = message
        this.sucess = false
        this.errors = errors

        if(stack) {
            this.stakck = stack
        }else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {apiError}