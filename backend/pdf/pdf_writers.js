const name= new Date().toLocaleDateString();
const tableVisits = {
	title: "Visits",
	subtitle: "Visits report by date",
	headers: [
	  { label: "Host", property: 'host_name', width: 60, renderer: null },
	  { label: "Visitor name", property: 'visitor_name', width:60, renderer: null }, 
	  { label: "Visitor email", property: 'visitor_email', width: 80, renderer: null }, 
	  { label: "Visitor mobile", property: 'visitor_no', width: 80, renderer: null }, 
	  { label: "Date", property: 'date', width: 80, renderer: null },
	  { label: "Check in time", property: 'checked_in', width: 80, renderer: null }, 
	  { label: "Check out time", property: 'checked_out', width: 80, renderer: null },
	  { label: "Role", property: 'role', width: 80, renderer: null },
	 
	],

	datas: [],

  };

  const tableVisitors = {
	title: "Visitors",
	subtitle: `${name} report`,
	headers: [
	  { label: "ID", property: 'id', width: 60, renderer: null },
	  { label: "Name", property: 'name', width:150, renderer: null }, 
	  { label: "Email", property: 'email_id', width: 150, renderer: null }, 
	  { label: "Phone nnumber", property: 'mobile_no', width: 150, renderer: null }, 
	],

	datas:[],


  };

  const tableHosts = {
	title: "Hosts",
	subtitle: `${name} report`,
	headers: [
	  { label: "ID", property: 'id', width: 60, renderer: null },
	  { label: "Name", property: 'name', width:150, renderer: null }, 
	  { label: "Email", property: 'email_id', width: 150, renderer: null }, 
	  { label: "Phone nnumber", property: 'mobile_no', width: 150, renderer: null }, 
	],

	datas:[],

  };

module.exports={
	tableHosts, tableVisitors, tableVisits
};
