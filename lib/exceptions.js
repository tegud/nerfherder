function standardException(message) {
    this.message = message;
}

const exceptions = {
    InputError: standardException,
    InvalidGoCredentialsError: function () {
        this.message = 'Provided GOCD credentials were invalid';
    },
    GoServerError: standardException,
    RancherServerError: standardException,
    InvalidStateForActionError: standardException
};

Object.keys(exceptions).forEach(err => {
    exceptions[err].prototype = Object.create(Error.prototype);
    exceptions[err].prototype.constructor = exceptions[err];
})

module.exports = exceptions;
