import crypto from 'crypto'

import { db } from '../libs/db.js'
import bcrypt from 'bcryptjs'
import { asyncHandler } from '../utils/api-async-handler.js'
import { apiError } from '../utils/api-error.js'
import { apiResponse } from '../utils/api-response.js'

const generateTemperoryToken = () => {
    const unHashedToken = crypto.randomBytes(10).toString('hex')
    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex")
    const tokenExpiry = Date.now() + (20 * 60 * 1000)


    return { unHashedToken, hashedToken, tokenExpiry }
}

const register = asyncHandler(async (req, res) => {
    const { name, email, password, courseId, role } = req.body

    if (!name) {
        throw new apiError(400, "Please enter your name.")
    }
    if (!email) {
        throw new apiError(400, "Please enter your email.")
    }
    if (!password) {
        throw new apiError(400, "Please enter your password.")
    }
    if (!role) {
        throw new apiError(400, "Please enter your role.")
    }

    const existingUser = await db.user.findFirst({
        where: {
            email
        }
    })

    if (existingUser) {
        throw new apiError(409, "This user also exists, Plese register with new credentials.")
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { unHashedToken, hashedToken, tokenExpiry } = generateTemperoryToken()

    const emailVerificationTokenExpiry = new Date(tokenExpiry)

    const user = await db.user.create({
        data: {
            name,
            email,
            password:hashedPassword,
            courseId: courseId || null,
            role,
            isVarified: false,
            varificationToken: hashedToken,
            varificationTokenExpiry: emailVerificationTokenExpiry,
        }
    })

    const newUser = await db.user.findUnique({
        where: {
            id: user.id
        },
        select: {
            id: true,
            name: true,
            email: true,
            courseId: true,
            role: true,
            isVarified: true,
            createdAt: true,
            updatedAt: true
        }
    })

    if(!newUser) {
        throw new apiError(404, "Some internal error, User not created")
    }

    // email send 
    // const verificationUrl = 


    res.status(200).json(new apiResponse(200, newUser, "User created sucessfully."))

})

const login = asyncHandler(async (req, res) => {
    
})
const verifyUser = asyncHandler(async (req, res) => {

})
const logout = asyncHandler(async (req, res) => {

})
const getMyDetails = asyncHandler(async (req, res) => {

})



export { register, login, verifyUser, logout, getMyDetails }