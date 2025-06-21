const asyncHandler = (requestHandler) => {      //requestHandler is that function which is passed as argument in registerUser 
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}

export {asyncHandler}