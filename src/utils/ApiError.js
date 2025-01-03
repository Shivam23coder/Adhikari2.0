class ApiError extends Error {
    constructor(statuscode,//
        message = "Something went wrong",  //The HTTP status code associated with the error (e.g., 400 for Bad Request, 500 for Internal Server Error)
        data = null,
        stack = "",
        error = []
    ){
        super(message)
        this.statuscode = statuscode
        this.data = null,
        this.message = this.message,
        this.success = false,
        this.errors = this.errors
    }
}

export {ApiError}
