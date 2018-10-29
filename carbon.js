// Carbon (Konstruktör)
function Carbon(key){
    this.itemArray = [];
		this.relationsArray = []; //lagrar projektdata
    this.storageKey =  key;
    
    //ladda från local storage
    var local_storage = window.localStorage.getItem(key);
        
    //om det finns värden i local storage 
    if (local_storage) {
        this.itemArray = JSON.parse(window.localStorage.getItem(key)).items;
        this.relationsArray = JSON.parse(window.localStorage.getItem(key)).relations;				
    }
}


// save
Carbon.prototype.save = function() {
		//console.log(this.relationsArray);
    window.localStorage.setItem(this.storageKey, JSON.stringify({items: this.itemArray, relations: this.relationsArray}));
};


// add_relation
Carbon.prototype.add_relation = function(parent_id, child_id) {
    var item = {};
		item["parent"] = parent_id;
		item["child"] = child_id;
    item["date"] = moment().format('YYYY-MM-DD HH:mm:ss');
    
   console.log("New relation: " + parent_id +"->" + child_id);
    this.relationsArray.push(item);
    this.save();
};


// get_children
Carbon.prototype.get_children = function(item_id) {
	var children = [];	
	var relations = this.relationsArray.query("parent","==",item_id);    
	
	for (i = 0; i < relations.length; i++) { 
		children.push(this.get_item(relations[i]["child"]));
	}; 

	return children;
};


// get_children
Carbon.prototype.get_parents = function(item_id) {
	var parents = [];	
	var relations = this.relationsArray.query("child","==",item_id);    
	
	for (i = 0; i < relations.length; i++) { 
		parents.push(this.get_item(relations[i]["parent"]));
	}; 
	
	return parents;
};


//remove_relation
Carbon.prototype.remove_relation = function(parent, child) {
    for(var i in this.relationsArray){
				//console.log("child: "+ this.relationsArray[i].child + "-"	+ child);			
					if(this.relationsArray[i].child==child & this.relationsArray[i].parent==parent){
							this.relationsArray.splice(i,1);
            break;
			}
	}
	 this.save();
};


//remove_all_relation
Carbon.prototype.remove_all_relations = function(id) {
    for(var i in this.relationsArray){
					//console.log("child: "+ this.relationsArray[i].child + "-"	+ child);			
					if(this.relationsArray[i].child==id || this.relationsArray[i].parent==id)
							this.relationsArray.splice(i,1);
	}
	 this.save();
};


// get_all items 
Carbon.prototype.get_all = function() {
    return this.itemArray;
    //console.log("get_all");
};



// add_item
Carbon.prototype.add_item = function(item) {
    item["id"] = this.last_id()+1;
    item["start_date"] = moment().format('YYYY-MM-DD HH:mm:ss');
    item["update_date"] = moment().format('YYYY-MM-DD HH:mm:ss');
    
    console.log(item);
    this.itemArray.push(item);
    this.save();
		return item.id;
};

//remove_item
Carbon.prototype.remove_item = function(id) {
    
		for(var i in this.itemArray){
		if(this.itemArray[i].id==id){
         this.itemArray.splice(i,1);
         break;
					}
			}

		this.save();
};


// get_item
Carbon.prototype.get_item = function(id) {
	return this.itemArray.filter(function (item){
		return item.id == id;
	})[0];
};

  
// last_id
Carbon.prototype.last_id = function() {
	last_id = Math.max.apply(Math,this.itemArray.map(function(item){return item.id;}));
    if (last_id=="-Infinity") last_id=0; //om inget objekt är skapat ännu
    return last_id;
};

// Clear all
Carbon.prototype.clear = function() {
    this.itemArray = []; //lagrar projektdata
    this.save();
};

// Copy
Carbon.prototype.copy = function(id) {
    var item = JSON.parse(JSON.stringify(this.get_item(id)));
    
    item["start_date"] = moment().format('YYYY-MM-DD HH:mm:ss');
    item["update_date"] = moment().format('YYYY-MM-DD HH:mm:ss');
	item["id"] = this.last_id()+1;
    
	this.add_item(item);
    return item;
};


// add from form
Carbon.prototype.add_from_form = function(form_id) {
	//skapa objekt av formdata
    var form_object = $( form_id ).serializeObject();
		var id = this.add_item(form_object);
    console.log("add_from_form");
		return id;
};
	
    
// edit from form
Carbon.prototype.edit_from_form = function(form_id) {
    
    //skapa object från formulär
    var form_object = $( form_id ).serializeObject();
    console.log(form_object);
    
    // om item med detta id finns
    if(this.get_item(form_object.id)){
        var item = JSON.parse(JSON.stringify(this.get_item(form_object.id)));
        
        jQuery.extend(item, form_object);
        
        item["update_date"] = moment().format('YYYY-MM-DD HH:mm:ss');
        
        //byta ut objekt i listan
    		this.remove_item(item.id);
        this.itemArray.push(item);
        this.save();
        
        return item;
    }
    else return false;
};

Carbon.prototype.get_quicklist = function() {
 	var quicklist = [];
	var open_items = this.get_all().query("finish_date","==","");
	open_items.forEach(function(item) {
		quicklist.push(item.title+" #"+item.id);
	}); 
 	return quicklist;
};





Carbon.prototype.set_item_field = function(id, field, value) {
    for(var i in this.itemArray){
		if(this.itemArray[i].id==id){
			this.itemArray[i][field] = value;
            break;
	    }
	}
	this.save();
};


Carbon.prototype.import_json = function(json) {
    
    //console.log(this.itemArray);
    //console.log(json);
    var items = JSON.parse(json);
    //console.log(items);
 	
 	for (i = 0; i < items.length; i++) { 
    	this.itemArray.push(items[i]);
    	console.log(items[i]);
    }
    this.save();
};


/* ******************************************************************/
/* Serialize Object     http://jsfiddle.net/sxGtM/3/                */
/********************************************************************/
$.prototype.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

Array.prototype.awesompleteList = function () {
	var output = [];	
	for (i = 0; i < this.length; i++) {
		output.push(this[i].title+" #"+this[i].id);
	} 
	return output;
} 



