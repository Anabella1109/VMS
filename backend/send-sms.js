const vonage = new Vonage({
	apiKey: process.env.API_KEY,
	apiSecret:process.env.API_SECRET
  })

  let sendSmsNotif= (from, to, text)=>{
	vonage.message.sendSms(from, to, text, (err, responseData) => {
	if (err) {
		console.log(err);
	} else {
		if(responseData.messages[0]['status'] === "0") {
			console.log("Message sent successfully.");
		} else {
			console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
		}
	}
});
  };

module.exports=sendSmsNotif;
