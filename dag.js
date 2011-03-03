var Node = Class.extend({
	init: function(element) {
		this.element = element;
		this.element.node = this;
		this.parents = [];
		this.children = [];
		this.childIDX = 0;
		this.id = _.uniqueId();
	},
	
	hasChildren: function() {
		if ( this.children.length < 1)
			return false;
		else
			return true;
	},
	
	// test if node has true sibling. A true sibing is a sibling from both the parent and child directions
	hasTrueSibling: function() {
		if( this.parents.length == 0 || this.children.length == 0)
			return false;
		
		var childParents;
		var parentChildren;
		var thisID = this.id

		// remove self from parents and children arrays
		_(this.children).each( function(child) { 
			childParents = _(child.parents).reject( function(parent) { return thisID == parent.id; });
			});
		_(this.parents).each( function(parent) { 
			parentChildren = _(parent.children).reject( function(child) { return thisID == child.id; } );
		});		
		
		var trueSibling = false;
		for (var i=0; i < parentChildren.length; i++) {
			trueSibling = _(childParents).any( function(parent) { 
				return (parent.id == parentChildren[i].id); 
				});
			if (trueSibling)
				break;
			}
		return trueSibling;
	},
	
	// test if node has parent sibling and not true sibling.  parent siblings are siblings from the parent direction
	hasParentSibling: function() {
		return ( this.parents.length == 1 && this.parents[0].children.length > 1 && !this.hasTrueSibling() );
	},
	
	// test if node has children siblings and not true siblings. Children siblings are siblings from the child direction
	hasChildSibling: function() {
		return ( this.children.length == 1 && this.children[0].parents.length > 1 && !this.hasTrueSibling() );
	},
	
	// test for any kind of sibling
	hasSibling: function() {
		var sibling = false;
		
		sibling = _(this.parents).any( function(parent) { return(parent.children.length > 1); });
		
		if (!sibling)
			sibling = _(this.children).any( function(child) { return(child.parents.length > 1); });	
				
		return sibling
	}
});


var DAG = Class.extend({
	init: function(element) {
		var node = new Node(element);
		element.graph = this;
		this.root = node;
		this.currNode = this.root;
	},
	
	// add child to the end of the graph
	addChild: function(element, parents) {
		var node = new Node(element);
		element.graph = this;
		_(parents).each( function(parent) { 
			parent.children.push(node); 
			node.parents.push(parent);
		});
		return node;
	},
	
	// inserts an element between parent and child,
	// if no child is specified it inserts between parent and ALL children
	insertChild: function(element, parent, child) {
		var newNode = new Node(element);
		newNode.parents = [parent];
		element.graph = this;
		
		// fix relationships so that new node is between parent and child
		if (child != undefined) {
			parent.children = _(parent.children).reject( function(node) { return node.id == child.id; } );
			parent.children.push(newNode);
			child.parents = _(child.parents).reject( function(node) { return node.id == parent.id; } );
			child.parents.push(newNode)
			newNode.children.push(child);
		} else {
			newNode.children = parent.children
			_(parent.children).each( function(node) { 
				node.parents = _(node.parents).reject( function(p) { return p.id == parent.id; });
				node.parents.push(newNode); 
			});
			parent.children = [newNode];
		}
		
		return newNode;
	},
	
	addChildWithParents: function(element, parents) {
		element.graph = this;
		// just give node 1 parent
		var node = new Node(element, parents[0]);
		for ( var i=0; i < parents.length; i++)
			parents[i].children.push(node);
		return node;
	},
	

	// visits all nodes exactly once, even children with multiple parents	
	// parameters:
	//						func : function that gets executed on the element
	//						args : array of arguments to pass to that function
	// returns: if the func returns a value the traversal will stop and return that value 
	eachBreadthChild: function(func, args) {
		var queue = [];
		var curr;
		var visited = [];
		
		// initialze queue
		this.reset();
		queue.push(this.root)
		
		// traverse graph
		while ( curr = queue.shift() ) {			
			result = func(curr.element, args);
			if (result != undefined)
				return result;
			for ( var i=0; i<curr.children.length; i++) {
				if ( !visited[ curr.children[i].id ] ) {
					queue.push( curr.children[i] );
					visited[ curr.children[i].id ] = true;
				}
			}
		} 
		
	},
	
	// commented out b\c it currently visits some nodes twice
	// // visit children with multiple parents more than once
	// eachDepthChild: function(func) {
	// 	this.reset();
	// 	func(this.root.element);
	// 	if ( !this.root.hasChildren() )
	// 		return;
	// 	
	// 	var child = this.nextChild();
	// 	
	// 	while( !this.isRoot(child) ) {
	// 		func(child.element);
	// 		child = this.nextChild()
	// 	}
	// 	
	// },
	
	// turns graph into an array in the breadth first search order
	flatten: function() {
		var elems = new Array;
		this.eachBreadthChild( function(elem, args){ args[0].push(elem) }, [elems])
		return elems;	
	},
	
	isRoot: function(node) {
		if ( this.root.id == node.id )
			return true;
		else 
			return false;
	},
	
	reset: function() {
		this.currNode = this.root;
	},
		
	
});