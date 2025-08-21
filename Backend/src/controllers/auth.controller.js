import crypto from 'crypto'
import jwt from "jsonwebtoken"
import { db } from '../libs/db.js'
import bcrypt from 'bcryptjs'
import { asyncHandler } from '../utils/api-async-handler.js'
import { apiError } from '../utils/api-error.js'
import { apiResponse } from '../utils/api-response.js'
import {emailVerificationMailGenContent, sendEmail} from '../utils/send-email.js'

const generateTemperoryToken = () => {
    const unHashedToken = crypto.randomBytes(10).toString('hex')
    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex")
    const tokenExpiry = Date.now() + (20 * 60 * 1000)

    return { unHashedToken, hashedToken, tokenExpiry }
}

const generateLoginTokens = (email, id) => {
    const accessToken = jwt.sign({ id, email },
        process.env.ACCESS_TOKEN,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )

    const refreshToken = jwt.sign({ id },
        process.env.REFREST_TOKEN,
        {
            expiresIn: process.env.REFREST_TOKEN_EXPIRY
        }
    )

    return { accessToken, refreshToken };
}

const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body

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
            password: hashedPassword,
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
            role: true,
            isVarified: true,
            createdAt: true,
            updatedAt: true
        }
    })

    if (!newUser) {
        throw new apiError(404, "Some internal error, User not created")
    }

    // email send 
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${unHashedToken}`
    const mailgenContent = emailVerificationMailGenContent(name, verificationUrl)
    
    sendEmail({
        mailgenContent,
        email,
        subject: "For user verification"
    })

    res.status(200).json(new apiResponse(200, newUser, "User created sucessfully."))

})


const login = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        throw new apiError(400, "Please enter all credentials.")
    }

    const existingUser = await db.user.findUnique({
        where: {
            email
        },
    })

    if (!existingUser) {
        throw new apiError(404, "User not found in DB.")
    }

    const isCorrect = await bcrypt.compare(password, existingUser.password);

    if (!isCorrect) {
        throw new apiError(401, "Email or password is encorrect.")
    }

    const { accessToken, refreshToken } = generateLoginTokens(existingUser.id, existingUser.email);
    const refreshTokenExpiry = (Date.now() + 2 * 24 * 60 * 60 * 1000).toString()
    const accessTokenExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000).toString()


    res.cookie("ACCESS_TOKEN", accessToken, {
        httpOnly: true,
        samesite: "strict",
        secure: process.env.NODE_ENV != "developement",
        maxAge: 12 * 60 * 60 * 1000 // 12h
    })

    res.cookie("REFRESH_TOKEN", accessToken, {
        httpOnly: true,
        samesite: "strict",
        secure: process.env.NODE_ENV != "developement",
        maxAge: 12 * 60 * 60 * 1000 // 12h
    })

    const logedInUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
            refreshToken,
            refreshTokenExpiry,
            accessToken,
            accessTokenExpiry
        },
        select: {
            id: true,
            name: true,
            email: true,
            courseId: true,
            role: true,
            isVarified: true,
            createdAt: true,
            updatedAt: true,
        }
    })


    return res.status(200).json(new apiResponse(200, {
        logedInUser,
    }, "User logged in sucessfully."))

})


const verifyUser = asyncHandler(async (req, res) => {
    const varificationToken = req.params.id;

    if (!varificationToken) {
        throw new apiError(401, "varification is missing or expired.")
    }

    const hashedToken = crypto.createHash("sha256").update(varificationToken).digest("hex")

    const user = await db.user.findFirst({
        where: {
            varificationToken: hashedToken,
            varificationTokenExpiry: {
                gt: (new Date())
            }
        }
    })

    if (!user) {
        throw new apiError(401, "varification is missing or expired.")
    }

    const varifiedUser = await db.user.update({
        where: {
            id: user.id
        },
        data: {
            isVarified: true
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isVarified: true,
            createdAt: true,
            updatedAt: true
        }
    })

    return res.status(200).json(new apiResponse(200, varifiedUser, "User varified sucessfully."))

})


const logout = asyncHandler(async (req, res) => {
    await res.clearCookie("ACCESS_TOKEN", {
        httpOnly: true,
        source: true,
        samesite: true
    })

    await res.clearCookie("REFRESH_TOKEN", {
        httpOnly: true,
        source: true,
        samesite: true
    })

    const updatedUser = await db.user.update({
        where: { id: req.user.id },
        data: {
            refreshToken: "",
            refreshTokenExpiry: null,
            accessToken: "",
            accessTokenExpiry: null
        }
    })

    return res.status(200).json(new apiResponse(200, {}, "User Logged Out Sucessfully."))
})

const forgotPasswordRequest = asyncHandler(async (req, res) => {

})

const resetPassword = asyncHandler(async (req, res) => {

})

const verifyEmail = asyncHandler(async (req, res) => {
    
})

const changeEmailRequest = asyncHandler(async (req, res) => {
    const { prevEmail, newEmail, password } = req.body

    if (!(prevEmail && newEmail && password)) {
        throw new apiError(401, "Please enter all credentials.");
    }

    const user = await db.user.findFirst({
        where: { email: prevEmail }, select: {
            id: true,
            email: true,
            password: true
        }
    })

    if (!user) {
        throw new apiError(401, "User not found with this email.")
    }

    const isMatchedPassword = bcrypt.compare(password, user.password);

    if (!isMatchedPassword) {
        throw new apiError(401, "Please enter correct password.")
    }

    const otp1 = crypto.randomInt(100000, 1000000) 
    const otp2 = crypto.randomInt(100000, 1000000) 

    const updatedUser = await db.user.update({where: {id: user.id}, data: {
        newTempEmail: newEmail,
        otp1,
        otp2

    },
    select: {
        id:true,
        name: true,
        
    }
})
    

    return res.status(200).json(new apiResponse(200, updatedUser, "Email change request send sucessfully."))
})

const getMyDetails = asyncHandler(async (req, res) => {


    const user = await db.user.findFirst({
        where: { id: req.user.id },
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
    });

    if (!user) {
        throw new apiError(401, "unothorized")
    }

    return res.status(200).json(new apiResponse(200, user, "User fetched sucessfully."))
})

// Only Admin can access this endpoints 
const changeRole = asyncHandler(async (req, res) => {

})

const changeName = asyncHandler(async (req, res) => {

})

const changeCourse = asyncHandler(async (req, res) => {

})





export { register, login, verifyUser, logout, getMyDetails }