import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/api-async-handler.js";
import { apiError } from "../utils/api-error.js";

const checkLogin = asyncHandler(async (req, res, next) => {
    const tokens = req.cookies.ACCESS_TOKEN;

    if (!tokens) {
        throw new apiError(401, "Unauthorized !")
    }

    const user = await db.user.findFirst({
        where: {
            accessToken: tokens,
            accessTokenExpiry: {
                gt: Date.now().toLocaleString()
            }
        }
    })

    if (!user) {
        throw new apiError(404, "Token expired, Please login again")
    }

    req.user = user
    
    next()
})

export {checkLogin};