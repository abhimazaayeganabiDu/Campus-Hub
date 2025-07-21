const asyncHandler = (passedFxn) => {
    return async(req, res, next) => {
        try {
            await passedFxn(req, res, next);
        } catch (error) {
            next(error)
        }
    } 
}

export {asyncHandler}