const fs = require('fs');
const {stringify} = require('csv-stringify');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriterVisits = createCsvWriter({
	path:__dirname+`/public/visits.csv`,
	header: [
		{id: 'host_name', title: 'HOST'},
		{id: 'visitor_name', title: ' VISITOR NAME'},
		{id: 'visitor_email', title: 'VISITOR EMAIL'},
		{id: 'visitor_no', title: 'VISITOR MOBILE'},
		{id: 'date', title: 'DATE'},
		{id: 'checked_in', title: 'CHECK IN'},
		{id: 'checked_out', title: 'CHECK OUT'},
		{id: 'role', title: 'PURPOSE'},

	]
});

const csvWriterHost = createCsvWriter({
	path:__dirname+'/public/hosts.csv',
	header: [
		{id: 'id', title: 'ID'},
		{id: 'name', title: 'NAME'},
		{id: 'email_id', title: 'EMAIL'},
		{id: 'mobile_no', title: 'PHONE NUMBER'}
	]
});

const csvWriterVisitor = createCsvWriter({
	path:__dirname+'/public/visitors.csv',
	header: [
		{id: 'id', title: 'ID'},
		{id: 'name', title: 'NAME'},
		{id: 'email_id', title: 'EMAIL'},
		{id: 'mobile_no', title: 'PHONE NUMBER'}
	]
});
module.exports= {
csvWriterHost,csvWriterVisits,csvWriterVisitor

}