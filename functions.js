/* INIT *******************************************************************/
var itemList = new Carbon("bunny2_1_items");

var current_page = "#task_list";
var previous_page = "";
var scroll_positions = [];
var current_item={};
var current_items={};
var debug = new Timer();
var tags = [];

var items = itemList.get_all();


items.forEach(function(item) {
	if(item.parent_id == "-") item.parent_id = "";
 	if(moment(item.postpone, 'YYYY-MM-DD') < moment()) item.postpone =""; 
});

// Manuell sortering 
Sortable.create(document.getElementById('open'), {handle: '.subitem-right',onSort: function (evt) {
	//alert("From " + evt.detail.startIndex + " to " + evt.detail.newIndex);    
	reorder(evt.oldIndex, evt.newIndex, "order");
}});

Sortable.create(document.getElementById('tasks'), {draggable: ".item",  handle: '.subitem-right',onSort: function (evt) {
	reorder(evt.oldIndex, evt.newIndex, "order_main");
}});


open_page("#task_list");

//awesomlete edit
var input_parent = document.getElementById("parent");
var awesomplete = new Awesomplete(input_parent, {minChars: 0});
awesomplete.list = itemList.get_all().awesompleteList();
$('#parent').on('focus', function() {
	console.log("hej");  
	awesomplete.evaluate();
});
//awesomlete new
/*var input_parent2 = document.getElementById("parent2");
var awesomplete2 = new Awesomplete(input_parent2);
awesomplete2.list =itemList.get_all().awesompleteList();
*/

/* PageHandler *******************************************************/

function open_page (page_id, show_extra) {
	scroll_positions[current_page] = $("body").scrollTop();
	previous_page = current_page;
	current_page = page_id;
	
	//console.log(scroll_positions);
	
	if(page_id == "#issues") view_issue_list();
	else if(page_id == "#single_issue") view_single_issue(current_item.id);
	else if(page_id == "#task_list") view_task_list();
	else if(page_id == "#menu") view_settings(); 
	
	console.log(page_id);
	
	$(".page").hide();
	$(page_id).show();

	if(page_id == "#task_list" || page_id == "#issues" )  $("body").scrollTop(scroll_positions[page_id]);
	else window.scrollTo(0, 0);
}


/* FUNCTIONS *******************************************************************/



function view_task_list(){ 	
	$('.new-item-div').hide();   
	
	debug.begin("Task_list");

	var query = $("#search").val().toLowerCase();
   var icon = $('input[name="icon"]:checked').val();
	var type = $("#task_list .type_filter").val();
	var status = $("#status_filter").val();

   var items=itemList.get_all();
	var items_with_meta = [];
	
	
	if(type!="*") items=items.query("type", "==", type); 	// filtrera på type om type är vald	
	if(icon) items=items.query("icon", "==", icon); 	// filtrera på ikon om ikon är vald	
		
	debug.comment("Före metadata");
	
	//UNFINISHED ITEMS
	if (status=="unfinished") {
		items = items.query("finish_date", "==", ""); 	// filtrera bort avslutade
		
		//lägga till metadata så som parent_tree, subitem_count, etc 
		items.forEach(function(item) {
			items_with_meta.push(item_with_meta(item.id));
		});
		items = items_with_meta;
		debug.comment("Efter metadata");
		//if (query=="" & type=="*") 	items = items.query("open_task_count", "==", 0);		// filtrera bort projekt som redan har subtask
		
		//console.log(items);
		//filtrera allmänt
		items =items
      .query("has_parent", "==", false) 	// filtrera på type om type är vald	
			.query("type", "!=", 13) //inte kategorier
			//	.query("finish_date", "==", "")
			.query("notes", "!=", undefined) //ful-fix för att undvika crash vid filter nedan, (items som saknar notes)
			.query("title, notes, parent_tree", "contains", query);

		//sortera items
		items.sort(firstBy("finish_date","-1").thenBy("prio").thenBy("postpone") .thenBy("order_main"));
		
		mustache_output("#tasks", items, "#filtered_task_template");
	}
		//finished items
	else { 
		items = items.query("finish_date", "!=", ""); 	// filtrera bort oavslutade
  		items.sort(firstBy("finish_date",-1));

		mustache_output("#tasks", items, "#finished_task_template", "finish_day");
	}

	//sätta current_items för sortable	
	current_items = items;
	
	//sätta current_items för sortable	
	current_item = undefined;
	

	if (items.length == 0) $("#open_items").append("<div class='empty'>No items here</div>");  	//om inga items hittas

	if(document.getElementById('debug').checked) debug.stop("Slut");
}






function view_single_issue (id) {
	$('.new-item-div').hide();   
	$("#single_issue .type-icon").html("<img src='img/type"+current_item.type+".png'>");    	
	$("#single_issue .menu-title").text(current_item.title);    

	var type = $("#single_issue .type_filter").val();
	
	var open_items_with_meta = [];
	
	var open_items =itemList.get_children(id).query("finish_date","==","");
	
 	if(type!="*") open_items=open_items.query("type", "==", type); 	// filtrera på type om type är vald	
	
	open_items.forEach(function(item) {
		open_items_with_meta.push(item_with_meta(item.id));
	});
	open_items = open_items_with_meta;
	open_items = open_items
		.sort(firstBy("order").thenBy("update_date",-1));
	
    var finished_items = itemList.get_children(id)
    	.query("finish_date","!=","")
    	.sort(firstBy("finish_date",-1));
			if(type!="*") finished_items=finished_items.query("type", "==", type); 	
	

//console.log(open_items);

	mustache_output("#open", open_items, "#open_task_template"); //! !!!!!!
	
   mustache_output("#finished", finished_items, "#finished_task_template");
   
 	//sätta current_items för sortable	
	current_items = open_items;
    // om listan är tom
   if (open_items.length==0 && finished_items.length == 0) $("#open").append("<div class='empty'>No items</div>");

	current_item = itemList.get_item(id);
}





function view_new (parameters) {
	scroll_positions[current_page] = $("body").scrollTop();
	previous_page = current_page;
	current_page = "#new";
	
	// sätta titel
	var type = "Task";
	if(parameters.type == 7) type = "Project";
	if(parameters.parent_id)  $("#new .menu-title").html("New "+type+" for: "+itemList.get_item(parameters.parent_id).title);
	else $("#new .menu-title").html("New "+type);
	
	fill_form("#new-item-form", parameters);		

	console.log("#new");
	
	$(".page").hide();
	$("#new").show();

	$("#new [name='title'] ").focus();
	
	window.scrollTo(0, 0);
}




function view_settings(){
    
    var field1 = $("#field1").val().toLowerCase();
    var op1 = $("#op1").val();
    var value1 = $("#value1").val();
    var field2 = $("#field2").val().toLowerCase();
    var op2 = $("#op2").val();
    var value2 = $("#value2").val();
    var items=itemList.get_all();
    	
    if(field1!="") items = items.query(field1, op1, value1);
    if(field2!="") items = items.query(field2, op2, value2);
    //console.log(items.length+" items");
    
    $("#export_count").html(items.length+" items<br/>");
    $("#export_count").append(items.query("finish_date", "==", "").length+" unfinished items<br/>");
    $("#export_count").append(items.query("finish_date", "!=", "").length+" finished items");
}





function reorder(from_pos, to_pos, field){
		console.log(from_pos);
console.log(to_pos);
console.log(field);
    var offset = 0;
    //debug.begin("reorder");
	
    for (var index = 0, len = current_items.length; index < len; index++) {
        
			item = current_items[index];
 			       
        if (from_pos >= to_pos){
            if(index == (to_pos)) offset++;
        }
        else{
            if (index == (to_pos+1)) offset++;
        }
        
        if(index == from_pos) offset--;
      
			itemList.set_item_field(item.id, field,  index + offset);
			item[field] = index + offset;


			if(index == from_pos) {
					itemList.set_item_field(item.id, field , to_pos);
					item[field] = to_pos;
				//console.log(item[field] );
			}
			console.log(item)
			
    }
    //console.log(items);
  
	current_items = current_items.sort(firstBy("order"));
   itemList.save(); 
	//debug.stop();
}



function mustache_output(output_id, items, template_id, group_by){
    //console.log(items);
	var new_group = "";
    var html="";
 	var scope_sum = 0;
    $(output_id).empty();
 	
    items.forEach(function(item) {
		if(group_by){
			if (item[group_by]!= new_group)  {
				scope_sum = 0;
				item_count = items.query(group_by,"==",item[group_by]).query("postpone", "==", "").length;
				items.query(group_by,"==",item[group_by]).query("postpone", "==", "").query("type", "==", "6").forEach(function(item) {if(isNaN(item.scope) || item.scope =="" ) item.scope = 0; scope_sum += parseInt(item.scope);	});

				html += "<div class='group' style='padding:3px; background:#333;color:#AAA;'>("+item[group_by]+") Count:"+item_count+" Time:"+scope_sum+"</div>";
		   	}
				new_group=item[group_by]; 
			}
		var template = $(template_id).html();
		//console.log(item);
		html += Mustache.to_html(template, item);
	});
	
	$(output_id).append(html);
}



function item_with_meta(id){
	var item = JSON.parse(JSON.stringify(itemList.get_item(id))); //kopia av item
	/*open_tasks = itemList.get_childres.query("parent_id", "==", id).query("finish_date","==","");
   finished_tasks = itemList.get_all().query("parent_id", "==", id).query("finish_date","!=","");
    
    // sortera array med items
	open_tasks.sort(firstBy("order").thenBy("update_date", -1) );
	finished_tasks.sort(firstBy("finish_date"));
	item.subitems = open_tasks[0];
	item.open_task_count = open_tasks.length;
	item.finished_task_count = finished_tasks.length;
 	if(moment(item.postpone, 'YYYY-MM-DD ddd HH:mm') < moment()) item.postpone =""; 
	
	item.finish_day = moment(item.finish_date,'YYYY-MM-DD HH:mm').format('YYYY-MM-DD ddd');
	*/
	//parent_tree
	
	//har item ett projekt parent?
	item.subitems = itemList.get_children(item.id);	
	item.subitems = item.subitems.query("prio", "==", "1");
	item.subitems = item.subitems.query("finish_date", "==", "");
	var parents= itemList.get_parents(id).query("type","<","3");
	console.log(itemList.get_parents(id));	
	if(parents.length > 0) item.has_parent = true;
	else item.has_parent = false;

	return item;
}





function fill_form(form_id, item){
	var elements = $(form_id).find(".autovalue");
	
	$(form_id + ' input:radio').prop('checked', false); 
    $(form_id + ' input:radio[value="'+item['icon']+'"]').prop('checked', true); // prio (css trick med bilder)
	$(form_id + ' input:radio[value="'+item['prio']+'"]').prop('checked', true); // prio (css trick med bilder)

	elements.each(function(test, element ) {
  		var name = element.getAttribute("name");
  			$(element).val(item[name]);
	});
}


