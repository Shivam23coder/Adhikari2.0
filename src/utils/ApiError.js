class ApiError extends Error {
    constructor(statuscode,
        messsage = "Something went wrong",
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
