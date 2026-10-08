import {body , validationResult} from 'express-validator';   


export const RegisterValidation = [
    body("email").isEmail().withMessage("Invalid email address"),
    body("username").notEmpty().withMessage("Username is required"),
    body("password").isLength({min:6}).withMessage("Password must be at least 6 characters long"),
    (req,res,next)=>{
        const error = validationResult(req);
        if(!error.isEmpty()){
            return res.status(400).json({success : false ,  error: error.array().map((err) => err.msg)});
        }
        next();
    }
]