const exceptions = {
    InputError: function (message) {
        this.message = message;
    },
    InvalidGoCredentialsError: function () {
        this.message = 'Provided GOCD credentials were invalid';
    },
    GoServerError: function (message) {
        this.message = message;
    },
    RancherServerError: function (message) {
        this.message = message;
    }
};

Object.keys(exceptions).forEach(err => {
    exceptions[err].prototype = Object.create(Error.prototype);
    exceptions[err].prototype.constructor = exceptions[err];
})

module.exports = exceptions;
