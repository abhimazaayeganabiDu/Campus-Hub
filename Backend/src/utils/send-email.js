import Mailgen from 'mailgen';
import nodemailer from 'nodemailer'

const sendEmail = async(options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Campus-hub",
            link: "https://campus-hub.com"
        }
    })

    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHtml = mailGenerator.generate(options.mailgenContent)

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAITRAP_SMTP_PASS
        }
    })

    const mail = {
        from: "",
        to: options.email,
        subject: options.subject,
        text: emailText,
        html: emailHtml
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error("Email service failed.")
        console.error("Error", error)
    }
}


const emailVerificationMailGenContent = (username, varificationUrl) => {
    return {
        body:{
            name: username,
            intro: "Welcome to our app! We're very excited to have you on board.",
            action: {
                instructions: "To verify your email please click on the following button:",
                button: {
                    color: "#22BC66",
                    text: "Verify your email.",
                    link: varificationUrl
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        }
    }
} 

const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
    return {
        body:{
            name: username,
            intro: "We got a request to reset the password of our account",
            action: {
                instructions: "To reset your password please click on the following button or link:",
                button: {
                    color: "#22BC66",
                    text: "Verify your email.",
                    link: passwordResetUrl,
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        }
    }
} 

export {emailVerificationMailGenContent, forgotPasswordMailGenContent, sendEmail};