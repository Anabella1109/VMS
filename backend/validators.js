const { body,param, validationResult } = require('express-validator');

var resultsNotFound = {
    "errorCode": 0,
    "errorMessage": "Server Error.",
    "rowCount": "0",
    "data": ""
  };

module.exports = {
    checkInputDataNULL: function(req, res) {
        if (!req.body) { console.log("no body checked in")}

        if (!req.body) return res.send(resultsNotFound);
    },
    checkLoginDataQuality: function(req, res) {
		body('email').isEmail().normalizeEmail(),
		body('password').isLength({
			min: 6
		})
      },
	  checkRegisterDataQuality: function(req, res) {
		body('email').isEmail().normalizeEmail(),
		body('password').isLength({
			min: 6
		})
      },
	  checkCheckinDataQuality: function(req, res) {
		body('host_name').isString(),
		body('visitor_name').isString(),
		body('visitor_email').isEmail().normalizeEmail(),
		body('visitor_no').isInt(),
		body('role').isString()
      },
	  checkHostDataQuality: function(req,res){
        body('name').isString(),
		body('email_id').isEmail().normalizeEmail(),
		body('mobile_no').isInt(),
		body('department').isString()
	  },
	  checkHostEditPasswordQaulity: function(req, res) {
		body('password').isLength({
			min: 6
		})
      },
	  checkVisitortDataQuality: function(req,res){
        body('name').isString(),
		body('email_id').isEmail().normalizeEmail(),
		body('mobile_no').isInt()
	  },
	  checkIfIdIsInt: function(){
		param('id').isInt();
		console.log(param('id').isInt());

	  },
	  checkBookingDataQuality: function(){
        body('host_name').isString(),
		body('visitor_name').isString(),
		body('visitor_email').isEmail().normalizeEmail(),
		body('visitor_no').isInt(),
		body('role').isString(),
		body('date').isString(),
		body('checked_in').isString()
	  },
	  checkValidationResult: function(req,res){
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
	  }
  };