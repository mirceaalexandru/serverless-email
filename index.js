const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const nodemailer = require('nodemailer');

const internals = {
	configurationBucket: process.env.CONFIG_BUCKET
};

function getClientConfiguration (clientId) {
	return new Promise((resolve, reject) => {
		const params = {Bucket: internals.configurationBucket, Key: clientId};
		S3.getObject(params, (err, data) => {
			if (err) {
				console.log('Error occurred: ', err, err.stack);
				return reject(err);
			}

			try{
				const clientConfiguation = JSON.parse(data.Body.toString('utf-8'));
				return resolve(clientConfiguation);
			}catch(err) {
				console.log(err);
				return reject(err);
			}
		});
	})
}

function sendEmail(clientSettings, data) {
	const transporter = nodemailer.createTransport(clientSettings.settings);

	// send mail with defined transport object
	return transporter.sendMail({
		from: clientSettings.from,
		to: clientSettings.clientEmail,
		subject: data.subject,
		html: `Hi,
    	<br/><br/>
    	You have a new mail from ${data.email},
    	<br/>
    	Here is the content:
    	<br/>
    	${data.body}
    	`
	});
}

exports.handler = async (event) => {
	console.log('Input', event);

	try{
		const clientConfiguration = await getClientConfiguration(event.clientId);
		await sendEmail(clientConfiguration, event.email);
	}catch(err) {
		console.log('Error sending email', err);
		return {
			statusCode: 500
		};
	}
	return {};
};
