/* (c) 2010 Dennis Treder, www.headjump.de, info@dennistreder.de
 * 
 * "Arrows and Boxes"
 * Makes simple boxes and connects them with arrows from a text description that's easy to write and also doesn't look stupid without javascript
 *
 * Example:
 * 	(Dennis) >likes (Food)
 *
 * More complex example:
 * 	(Dennis >likes [f,d]) >>likes most (Saussages) ||
 * 	(f:Food) (d:Drinks)
 *
 *
 *
 * LICENSE: LGPL
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License (LGPL) as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA,
 * or see http://www.gnu.org/copyleft/lesser.html
 */
 (function($){
	var CONFIG = {
		"arrow": {
			"color_normal": "#cacaca",
			"color_highlighted": "#4a4a4a"
		},
		"node": {
			"width": 146,
			"height": 32,
			"height_with_subtitle": 56,
			"center_y": 15,
			"margin_right": 64,
			"margin_bottom": 56,
			"border_size": 2
		}
	
	}
	var prefix = "arrowsandboxes";
	var unique_id_prefix = "" + new Date().getTime(); // 'unique ids' will be used for id-less nodes
	var unique_id_index = 0;
	
	var arrow_starter = ["<", ">", "-"];	// starting an element
	var node_starter = ["("];
	
	var ends_with = {		// end characters for element
		"(": [")"],
		"<": [" <", " >", " -", " ("],
		"-": [" <", " >", " -", " ("],
		">": [" <", " >", " -", " ("]
	};
	
	var getUniqueId = function() {
		var res = unique_id_prefix + "_" + prefix + unique_id_index;
		unique_id_index++;
		return res; // why so long? -> I really really don't want to conflict with your own code
	};
 
	/**
	* characters with syntactical relevance. escape them if you need them!
	*/
	var esc_list = [
		["<", "LT"],
		[">", "GT"],
		["-", "LN"],
		["|", "PP"],
		["{", "BE"],
		["}", "B3"],
		["[", "BCC"],		
		["]", "BJJ"],
		["(", "BC"],
		[")", "BJ"],
		[":", "DP"],
		["/", "SL"]
	];
	
	/**
	* builds escape string. used for escaping ">" and other syntax relevant chars
	*/
	var escaped = function(val) {
		return "%ESC_" + val + "_%";
	};
	
	var esc_replaces = (function(){
		var res = [];
		for(var i = 0; i < esc_list.length; i++) {
			res.push(esc_list[i][0]);
			res.push(escaped(esc_list[i][1]));
		}
		return res;
	})();
	
	var de_esc_replaces = (function(){
		var res = [];
		for(var i = 0; i < esc_list.length; i++) {
			res.push(escaped(esc_list[i][1]));
			res.push(esc_list[i][0]);
		}
		return res;
	})();
 
	/**
	* parses input and creates graph structure info
	* @param	lines	array of input lines
	*/
	var buildStructureFromLines = function (lines) {
		var nodes = [];		// will have subarray for each line ( [nodes in this line] )
		var arrows = [];
		
		for(var i = 0; i < lines.length; i++) {
			var line_struct = parseLine(trim(lines[i]));
			if(line_struct["nodes"].length != 0) nodes = nodes.concat([line_struct["nodes"]]);
			arrows = arrows.concat(line_struct["arrows"]);
		}
		
		return { "nodes" : nodes, "arrows" : arrows };
	}
	
	/**
	* creates nodes and arrows for a single line and push to arrays
	*/
	var parseLine = function (line) {
		var original_line = line;
		
		line = handleEscapes(line);
		
		// remove comments
		var comments_start = line.indexOf("//")		
		if(comments_start != -1) line = line.substring(0, comments_start);
		
		var line_nodes = []; // error if creating arrow before node
		var line_arrows = []; // if node is created and there were arrows before, they will be connected to the node
		var previous_node_id = "";
		try {
			while(true) {
				// find next starting element
				var start_pos = -1;
				var start_elem = "";
				var next_start_pos = startPosOfNext(arrow_starter.concat(node_starter), line);
				if(!next_start_pos) break;
				start_elem = next_start_pos[0];
				start_pos = next_start_pos[1];
				
				// handle element
				line = line.substring(start_pos + 1);
				var end_pos = endposForElement(start_elem, line);
				var element_source = trim(line.substring(0, end_pos));
				switch(start_elem) {
					case "(":
						var new_node = parseNode(element_source);
						// set target for previous arrows between nodes
						if(line_arrows.length != 0) {
							for(var line_arrows_from_behind_i = 0; line_arrows_from_behind_i < line_arrows.length; line_arrows_from_behind_i++) {
								var current_arrow = line_arrows[line_arrows.length - line_arrows_from_behind_i - 1];
								if(current_arrow["target_nodes"].length === 0) {
									current_arrow["target_nodes"] = [ new_node["id"] ];
								} else {
									break;
								}
							}
						}						
						previous_node_id = new_node["id"];						
						line_nodes.push(new_node);
						line_arrows = line_arrows.concat(parseArrowsInsideNode(new_node["id"], element_source));
						break;
					case "<":
					case "-":
					case ">":
						if(line_nodes.length === 0) throw "arrow in line before node: ".concat(start_elem).concat(element_source);
						line_arrows.push(parseSingleArrow(start_elem, previous_node_id, element_source, false));
						break;
				}
				line = line.substring(end_pos + 1);
			}
			if(line_arrows.length !== 0 && line_arrows[line_arrows.length - 1]["target_nodes"].length === 0) throw "last arrow in line has no target";
			return { "nodes": line_nodes, "arrows": line_arrows };
		} catch(e) {
			throw "Error in line: " + deEscape("" + original_line) + "<br/>&nbsp;&nbsp;" + e;
		}
	}
	
	/**
	* finds out wich of the elements in type_array occures first
	* @param type_array types to search for (e.g ["<", ">"])
	* @param source source string
	* @return [type, pos] || null
	*/
	var startPosOfNext = function (type_array, source) {
		var start_pos = -1;
		var start_type = "";
		for(var i = 0; i < type_array.length; i++) {
			var pos = source.indexOf(type_array[i]);
			if(pos != -1 && (start_pos === -1 || pos < start_pos)) {
				start_pos = pos;
				start_type = type_array[i];
			}
		}
		if(start_pos === -1) return null;
		return [start_type, start_pos];
	}
	
	/**
	* @param node_id id-string of node
	* @param source complete source string for node
	* @return array containing all arrows set inside the node definition
	*/
	var parseArrowsInsideNode = function(node_id, source) {
		var res = [];
		
		// TODO similar also in parseNode
		var colon_pos = source.indexOf(":");
		if(colon_pos != -1) {
			source = source.substring(colon_pos);
		}
		
		while(true) {
			var next_start_pos = startPosOfNext(arrow_starter, source);
			if(!next_start_pos) break;
			
			var elem = next_start_pos[0];
			var pos = next_start_pos[1];
			source = source.substring(pos + 1);
			var end_pos = endposForElement(elem, source);
			var current_elem_source = source.substring(0, end_pos);
			res.push(parseSingleArrow(elem, node_id, current_elem_source, true));
			source = source.substring(end_pos);
		}
		return res;
	}
		
	/**
	* takes source string and escapes \<, \>, \-, ...
	* @param source source string
	* @return escaped string
	*/
	var handleEscapes = function(source) {
		while(true) {
			var esc_start = source.indexOf("{{");
			var esc_end = source.indexOf("}}");
			if(esc_start === -1) break;			
			if(esc_end < esc_start) throw("escaped text without proper end. '}}' must occure in same line. '" + source.substring(esc_start) + "'");
			var p1 = source.substring(0, esc_start);
			var p2 = bulkReplace(source.substring(esc_start + 2, esc_end), esc_replaces);
			var p3 = source.substring(esc_end + 2);
			source = p1.concat(p2).concat(p3);
		}
		return source;
	}
	
	/**
	* deescaptes string (e.g.: "%ESC_GT_%" to ">");
	*/
	var deEscape = function(source) {
		return bulkReplace(source, de_esc_replaces);
	}
	
	/**
	* parses single node from source-string. (e.g.: ">> arrow_label [first_node_id, second_node_id]")
	* @param arrow_type "<" | ">" | "-"
	* @param source_node_id id-string from first node
	* @param source source-string WITHOUT first char (== arrow_type)!
	* @param require_targets if required -> throws error if no targets!
	* @return hash structure for a single arrow (that can point to multiple targets)
	*/
	var parseSingleArrow = function(arrow_type, source_node_id, source, require_targets) {
		source = trim(source);
		var original_source = source;
		
		// highlighted?
		var highlighted = false;
		if(source.charAt(0) === arrow_type) {
			highlighted = true;
			source = trim(source.substring(1));
		}
		
		// also back?
		var also_back = false;
		if((arrow_type === "<" && source.charAt(0) === ">") || (arrow_type === ">" && source.charAt(0) === "<")) {
			also_back = true;
		}
		while(source.charAt(0) === ">" || source.charAt(0) === "<") {
			source = source.substring(1);
		}
		source = trim(source);
		
		// targets & label
		var arrow_label = "";
		var arrow_targets = [];
		if(require_targets) {
			var target_node_start = source.lastIndexOf("[");
			var target_node_end = source.lastIndexOf("]");
			if(target_node_start === -1) throw "no targets for arrow '" + arrow_type + original_source + "'";
			if(target_node_end < target_node_start) throw "arrow definition not closed properly: " + original_source;
			if(target_node_end != source.length - 1) throw "don't know what to do with '" + source.substring(target_node_end + 1) + "' at end of an arrow definition '" + original_source + "'";
			source = source.substring(0, target_node_end);
			if(target_node_start != -1) {
				arrow_label = source.substring(0, target_node_start);
				source = trim(source.substring(target_node_start + 1));
			}
			if(source.length === 0) {
				throw "no targets for arrow: " + arrow_type + original_source;
			}
			arrow_targets = trim(source).split(",");
			for(var a_i = 0; a_i < arrow_targets.length; a_i++) {
				arrow_targets[a_i] = trim(arrow_targets[a_i]);
			}
		} else {
			arrow_label = source;
		}
		
		return {
			"type": arrow_type,
			"highlighted": highlighted,
			"also_back": also_back,
			"source_node": source_node_id,
			"target_nodes": arrow_targets,
			"label": arrow_label
		};
	}
	
	/**
	* parses a node from given source-string. DOESN'T build inside arrows! use 'parseArrowsInsideNode' for this!
	* @param source node source-string WITHOUT first char (== "(")
	* @return node hash build from source string
	*/
	var parseNode = function(source) {
		// remove all inside arrows
		
		// TODO similar also in parseArrowsInNode
		var search_for_arrows_offset = source.indexOf(":");
		if(search_for_arrows_offset == -1) {
			search_for_arrows_offset = 0;
		}
		
		var inside_arrows_start = startPosOfNext(arrow_starter, source.substring(search_for_arrows_offset));
		if(inside_arrows_start) {
			source = source.substring(0, inside_arrows_start[1] + search_for_arrows_offset);
		}
	
		// highlighted?
		var highlighted = source.charAt(0) === "(";
		if(highlighted) {  source = trim(source.substring(1)); }
		
		// id + custom_class
		var node_id = "";
		var id_end_pos = source.indexOf(":");
		var custom_class = "";
		if(id_end_pos != -1) {
			node_id = trim(source.substring(0, id_end_pos));
			var class_start = node_id.indexOf("{");
			var class_end = node_id.indexOf("}");
			if(class_start != -1 && class_end === (node_id.length - 1)) {
				custom_class = trim(node_id.substring(class_start + 1, class_end));
				node_id = trim(node_id.substring(0, class_start));
			}
			source = trim(source.substring(id_end_pos + 1));
		}
		
		if(node_id === "") node_id = getUniqueId();
		
		
		// title || dummy?
		var node_title = "";
		var node_subtitle = "";
		var is_dummy = false;
		if(source.length === 0) {
			is_dummy = true;
		} else {
			var slash_index = source.indexOf("|");
			if(slash_index != -1) {
				node_title = trim(source.substring(0, slash_index));
				node_subtitle = trim(source.substring(slash_index + 1));
			} else {
				node_title = source;
			}
		}
		
		return {
			"id": node_id,
			"highlighted": highlighted,
			"is_dummy": is_dummy,
			"custom_class": custom_class,
			"title": node_title,
			"subtitle" : node_subtitle
		}
	}
	
	/**
	* @return endpos for the given element in text source
	*/
	var endposForElement = function(elem, source) {
		if(ends_with[elem] === undefined || ends_with[elem].length === 0) throw "no end characters for element starting with '" + elem + "'";
		var endpos = -1;
		for(var i = 0; i < ends_with[elem].length; i++) {
			var pos = source.indexOf(ends_with[elem][i]);
			if(pos != -1 && (endpos === -1 || pos < endpos)) {
				endpos = pos;
			}
		}
		return endpos != -1 ? endpos : source.length;
	}
	
	/**
	* @return (dist between P1 and P2)^2
	*/
	var dist_sq = function(p1x,p1y,p2x,p2y) {
		var s1 = p1x - p2x;
		var s2 = p1y - p2y;
		return s1 * s1 + s2 * s2;
	}
	
	/**
	* calc sectionpoint [x,y] between lines a,b and e,f
	* @return intersection [x,y] || null
	*/
	var line_intersection = function (ax, ay, bx, by, ex, ey, fx, fy, as_seg) {
		var ipx = 0;
		var ipy = 0;
		var a1 = 0;
		var a2 = 0;
		var b1 = 0;
		var b2 = 0;
		var c1 = 0;
		var c2 = 0;
		
		a1= by-ay;
		b1= ax-bx;
		c1= bx*ay - ax*by;
		a2= fy-ey;
		b2= ex-fx;
		c2= fx*ey - ex*fy;
	 
		var denom = a1*b2 - a2*b1;
		if(denom == 0){
			return null;
		}
		ipx=(b1*c2 - b2*c1)/denom;
		ipy=(a2*c1 - a1*c2)/denom;
	 
		if(as_seg){
			if(dist_sq(ipx, ipy, bx, by) > dist_sq(ax, ay, bx, by)){
				return null;
			}
			if(dist_sq(ipx, ipy, ax, ay) > dist_sq(ax, ay, bx, by)){
				return null;
			}	
	 
			if(dist_sq(ipx, ipy, fx, fy) > dist_sq(ex, ey, fx, fy)){
				return null;
			}
			if(dist_sq(ipx, ipy, ex, ey) > dist_sq(ex, ey, fx, fy)){
				return null;
			}
		}
		return [ipx, ipy];
	}
	
	/**
	* center all nodes vertically (currently not used -> jQuery webkit bug :(
	*/
	var centerNodes = function (wrapper) {
		var max_height = 0;

		var get_highest_children = function(ind, ch) {
			var current_height = $(ch).innerHeight();
			if(current_height > max_height) max_height = current_height;
		}
		var place_centered = function(ind, ch) {
			var c = $(ch);
			var current_height = c.height();
			var current_margin = parseInt(c.css('marginTop'));
			c.css('marginTop', current_margin + Math.floor((max_height - current_height) / 2));
		}
		wrapper.children().each(get_highest_children).each(place_centered);
		
	}
	
	/**
	* builds html structure for graph + draws arrows between nodes
	* @param 	struct			hash containing nodes + arrows arrays
	* @param 	outer_wrapper 	outer HTML element surrounding current graph. necessary to identify nodes by "id"!
	*/
	var drawStructure = function (outer_wrapper, struct) {
		try {
			var nodes = struct["nodes"];
			var arrows = struct["arrows"];
			
			var node_positions = {};
			
			// NODELINES
			var current_line_number = 0;
			for (var nodeline_i = 0; nodeline_i < nodes.length; nodeline_i++) {
				var current_top = nodeline_i * (CONFIG["node"]["height"] + CONFIG["node"]["margin_bottom"]);
				var nodeline = nodes[nodeline_i];
				for(var node_i = 0; node_i < nodeline.length; node_i++) {
					var node = nodeline[node_i];
					var current_left = node_i * (CONFIG["node"]["width"] + CONFIG["node"]["margin_right"]);
					
					node_positions[node["id"]] = {
						"dummy": node["is_dummy"],
						"x": current_left,
						"y": current_top,
						"right": current_left + CONFIG["node"]["width"],
						"bottom": current_top + CONFIG["node"][node["subtitle"] != "" ? "height_with_subtitle" : "height"],
						"center_x": current_left + Math.floor(CONFIG["node"]["width"] / 2),
						"center_y": current_top + CONFIG["node"]["center_y"]
					}
					
					if(!node["is_dummy"]) {
						var node_s = structureForNode(node, node_i);
						node_s.css("width", CONFIG["node"]["width"] + "px");
						node_s.css("height", CONFIG["node"]["height"] + "px");
						node_s.css("marginTop", current_top + "px");
						node_s.css("marginLeft", current_left + "px");
						outer_wrapper.append(node_s);
					}
				}
			}
			var normal_max_node_diff = CONFIG["node"]["height_with_subtitle"] - CONFIG["node"]["height"];
			outer_wrapper.height(nodes.length * (CONFIG["node"]["height"] + CONFIG["node"]["margin_bottom"]) - CONFIG["node"]["margin_bottom"] + normal_max_node_diff);
			
		} catch(e) {
			throw "Error processing nodelines while drawing: " + deEscape("" + e);
		}
		
		try {
			var arrow_target = $('<div class="' + cssclass("arrow-wrapper") + '"/>');
			arrow_target.css("position", "absolute");
			arrow_target.css("z-index", 0);
			outer_wrapper.prepend(arrow_target);
			
			for(var arrows_i = 0; arrows_i < arrows.length; arrows_i++) {
				drawArrow(arrows[arrows_i], arrow_target, outer_wrapper, node_positions);
			}
		} catch(e) {
			throw "Error drawing arrows: " + deEscape("" + e);
		}
	}
	
	/**
	* builds a div with a link to the project page. Hidden by default css, it would be great if you help spread the the project if you like it ;)
	*/
	var poweredBy = function (pre_code) {
		// TODO set link to project page, please ;)
		var editor_url = "http://www.headjump.de/article/arrows-and-boxes-editor"; //"preview-editor.html"
		return $('<div class="' + cssclass("powered-by") + '"><a href="' + editor_url + '?g=' + pre_code + '">Edit<span> in preview editor</span></a><span> | <a href="http://www.headjump.de/article/arrows-and-boxes" '+
					'title="Javascript graph construction, node visualization, arrow drawing by headjump.de">'+
					'Made with Arrows-and-boxes</a></span></div>').hover(
						function(){ $(this).addClass(cssclass("powered-by-hovered")); },
						function(){ $(this).removeClass(cssclass("powered-by-hovered")); }
					);
	}
	
	/**
	* builds html structure for a single node
	* @param node node
	* @param index_in_line adds some info as class (number + odd/even)
	*/
	var structureForNode = function (node) {
		var wrapper = $('<div/>');
		wrapper.css("position", "absolute");
		wrapper.css("padding", 0);
		wrapper.css("margin", 0);
		var res = $('<div/>');
		var height = CONFIG["node"][node["subtitle"] != "" ? "height_with_subtitle" : "height"];
		res.css("height", (height - 2 * CONFIG["node"]["border_size"]) + "px");
		wrapper.append(res);
		var is_dummy = node["is_dummy"];
		var class_prefix = is_dummy ? "dummy-" : "";	// "dummy-" prefix if dummy
		if(node["custom_class"] != "") {
			res.addClass(node["custom_class"]);
		}
		
		res.addClass(cssclass(class_prefix + "node"));
		if(node["highlighted"]) {
			res.addClass(cssclass("node-highlighted"));
		}
		
		if(!is_dummy) {
			if(node["title"] != "") {
				res.append($('<div class="' + cssclass("node-title") + '">' + deEscape(node["title"]) + '</div>'));
			}
			if(node["subtitle"] != "") {
				res.append($('<div class="' + cssclass("node-subtitle") + '">' + deEscape(node["subtitle"]) + '</div>'));
			}
		}
		res.hover(	function() { $(this).addClass(cssclass("node-hovered")); }, 
					function() { $(this).removeClass(cssclass("node-hovered")); });
		return wrapper;
	}
	
	/**
	* computes classname that can be used to identify node after "drawing"
	*/
	var nodeIdClass = function(node_id) {
		return cssclass("node_id_" + node_id)
	}
	
	/**
	* draws the given arrow
	* @param arrow				hash describing arrow
	* @param target				where to draw arrow to (== attach to)
	* @param outer_wrapper		HTML parent of all graph nodes - labels will be appended here (to appear above nodes)
	* @param pos				hash with info on node positions: ["nodename"] => {"dummy", "x", "y", "center_x", "center_y"}
	*/
	var drawArrow = function (arrow, target, outer_wrapper, pos) {
		// TODO actually draw ;)		
		var color = CONFIG["arrow"][arrow["highlighted"] ? "color_highlighted" : "color_normal"] ;
		
		sp = pos[arrow["source_node"]];
		if(sp == undefined) throw "unknown source_node: " + arrow["source_node"];
		for(var i = 0; i < arrow["target_nodes"].length; i++) {
			var t = arrow["target_nodes"][i];
			var tp = pos[t];
			if(tp == undefined) throw "unknown target_node: " + arrow["source_node"];
			var sub = []; // difference vector for arrow
			var p1x = sp["center_x"];
			var p1y = sp["center_y"];
			if(!sp["dummy"]) {
				var cp = null;
				if(cp == null) { // right border
					cp = line_intersection(p1x,p1y,tp["center_x"],tp["center_y"],
											sp["right"],sp["y"],sp["right"],sp["bottom"],
											true);
				}
				if(cp == null) { // bottom border
					cp = line_intersection(p1x,p1y,tp["center_x"],tp["center_y"],
											sp["x"],sp["bottom"],sp["right"],sp["bottom"],
											true);
				}
				if(cp == null) { // top border
					cp = line_intersection(p1x,p1y,tp["center_x"],tp["center_y"],
											sp["x"],sp["y"],sp["right"],sp["y"],
											true);
				}
				if(cp == null) { // left border
					cp = line_intersection(p1x,p1y,tp["center_x"],tp["center_y"],
											sp["x"],sp["y"],sp["x"],sp["bottom"],
											true);
				}
				
				if(cp != null) {
					var new_start = shorten_line(cp[0], cp[1], tp["center_x"], tp["center_y"]);
					p1x = new_start[0];
					p1y = new_start[1];
					sub = [new_start[2], new_start[3]];
				}
				
			}
			
			var p2x = tp["center_x"];
			var p2y = tp["center_y"];
			if(!tp["dummy"]) {
				var cp = null;
				if(cp == null) { // right border
					cp = line_intersection(p1x,p1y,tp["center_x"],tp["center_y"],
											tp["right"],tp["y"],tp["right"],tp["bottom"],
											true);
				}
				if(cp == null) { // bottom border
					cp = line_intersection(p1x,p1y,tp["center_x"],tp["center_y"],
											tp["x"],tp["bottom"],tp["right"],tp["bottom"],
											true);
				}
				if(cp == null) { // top border
					cp = line_intersection(p1x,p1y,tp["center_x"],tp["center_y"],
											tp["x"],tp["y"],tp["right"],tp["y"],
											true);
				}
				if(cp == null) { // left border
					cp = line_intersection(p1x,p1y,tp["center_x"],tp["center_y"],
											tp["x"],tp["y"],tp["x"],tp["bottom"],
											true);
				}
				
				if(cp != null) {
					var new_start = shorten_line(cp[0], cp[1], sp["center_x"], sp["center_y"]);
					p2x = new_start[0];
					p2y = new_start[1];
					sub = [-new_start[2], -new_start[3]];
				}
				
			}
			
			if(sub.length === 0) {
				var tmp = shorten_line(p1x, p1y, p2x, p2y);
				sub = [tmp[2], tmp[3]];
			}
			
			line(target,p1x,p1y,p2x,p2y,arrow["type"],arrow["also_back"],color, sub);
			
			// draw label
			if(arrow["label"] != "") {
				var label_left = p1x + (Math.floor((p2x - p1x) / 2)) - 14;
				var label_top = p1y + (Math.floor((p2y - p1y) / 2)) - 2;
				var lab = $('<div class="' + cssclass("label") + '" style="position: absolute; margin-top: ' + label_top + 'px; margin-left: ' + label_left + 'px;">' + deEscape(arrow["label"].split("|").join("<br/>")) + '</div>');
				lab.hover(	function() { $(this).addClass(cssclass("label-hovered")); }, 
							function() { $(this).removeClass(cssclass("label-hovered")); });
				outer_wrapper.append(lab);
			}
		}
	}
	
	var point_len = function(p1x,p1y,p2x,p2y) {
		return Math.sqrt(dist_sq(p1x,p1y,p2x,p2y));
	}
	
	/**
	* shortens line by returning new startpoint [x,y,subx,suby] for FIRST point, where sub* are the difference vectors with fixed length (*2) - used for drawing arrows!!!
	*/
	var shorten_line = function(p1x, p1y, p2x, p2y) {
		var l = point_len(p1x, p1y, p2x, p2y);
		if(l == 0) return [p1x, p1y];
		var xd = p2x - p1x;
		var yd = p2y - p1y;
		var subx = (xd / l * 5);	// half of sub will be added later (hiding sharp edge of arrow above line with strokesize 2)
		var suby = (yd / l * 5);
		return [p1x + subx, p1y + suby, subx, suby];
	}
	
	/**
	* draws line
	* @param sub	[xdiff, ydiff] vector of fixed length (direction: towards p2, I guess...)
	*/
	var line = function(t,p1x, p1y, p2x, p2y, a_type, a_back, color, sub) {
		var opt = { "stroke": 2, "color": color};
		
		var ox = sub[0]; 	// offset in direction of line
		var oy = sub[1];
		var rx = oy;		// right angled to ox,oy
		var ry = - ox;
		
		if(a_type === "<" || a_back) {
			// <-----
			t.fillPolygon(	[p1x, p1x + ox + rx, p1x + ox - rx],
							[p1y, p1y + oy + ry, p1y + oy - ry],
							opt);
			p1x += ox / 2;
			p1y += oy / 2;
		}
		
		if(a_type === ">" || a_back) {
			// ----->
			t.fillPolygon(	[p2x, p2x - ox + rx, p2x - ox - rx],
							[p2y, p2y - oy + ry, p2y - oy - ry],
							opt);
			p2x -= ox / 2;
			p2y -= oy / 2;
		}
		
		t.drawLine(p1x,p1y,p2x,p2y, opt);
		
	}
	
	/**
	* replaces something in a string
	* @param source		source string
	* @param replaces 	array with pairs [ 'replace this', 'with that', ... ]
	*/
	var bulkReplace = function(source, replaces) {
		if (replaces.length % 2 !== 0) throw "bulkReplace error: invalid replace pairs";
		for(var i = 0; i < (replaces.length / 2); i++) {
			var replace_this = replaces[i * 2];
			var with_that = replaces[(i * 2) + 1];
			var pos = source.indexOf(replace_this);
			
			while(pos != -1) {
				source = source.substring(0, pos) + with_that + source.substring(pos + replace_this.length);
				pos = source.indexOf(replace_this);
			}
		}
		return source;
	}
	
	/**
	* @return string without blank spaces at beginning and end
	*/
	var trim = function(source){
		return source.replace (/^\s+/, '').replace (/\s+$/, '');
	}
	
	/**
	* @return 'arrowsandboxes-' + param
	*/
	var cssclass = function(suffix) {
		return prefix + "-" + suffix;
	}
	
	/**
	* registering jQuery method $().arrows_and_boxes();
	*/
	$.fn.arrows_and_boxes = function() {
		$(this).each(function(i,s) {createArrowsAndBoxes(i,s)});
		return this;
	}
	
	/**
	* wraps and hides source, builds structure and finally "draws" the graph
	*/
	var createArrowsAndBoxes = function (ind,source) {
		var el = $(source);
		var outer = $('<div class="' + cssclass("wrapper") + '" style="position: relative;"/>');
		el.wrap(outer);
		
		try {
			var source = el.html();
			source = bulkReplace(source, ["\n", " ", "\r", " ", "\t", " ", "  ", " ", "&gt;", ">", "&lt;", "<"]);
			var graph_wrapper = $('<div class="' + cssclass("graph-wrapper") + '"/>');
			el.before(graph_wrapper);

			el.addClass(cssclass("source"));
			drawStructure(graph_wrapper, buildStructureFromLines(source.split('||')));
			el.before(poweredBy(escape(el.html())));
			$(el.parent()).hover(
				function(){ $(this).addClass(cssclass("wrapper-hovered")); },
				function(){ $(this).removeClass(cssclass("wrapper-hovered")); }
			);
		} catch (e) {
			var error_d = $('<div class="' + cssclass("error") + '"><p>Something went wrong: <code>' + deEscape("" + e) + '</code></p></div>');
			error_d.append('<p>Hint:</p><ul>'+
							'<li>To use HTML (e.g. for links, images) or any arrows-and-boxes specific character ("&gt;", "&lt";, "-", ":", "(", ")", "{", "}", "[", "]", "|") in your nodes or labels, put "{{" and "}}" around them.</li>'+
							'<li>See <a href="http://www.headjump.de/article/arrows-and-boxes" title="arrows-and-boxes documentation">Arrows-and-boxes documentation</a></li>'+
							'<li>Immediately see what your graph will look like and if it works: <a href="http://www.headjump.de/article/arrows-and-boxes-editor" title="arrows-and-boxes preview editor">Preview editor</a></li></ul>');
			el.after(error_d);
			el.removeClass(cssclass("source"));
			el.addClass(cssclass("source-with-errors"));
		}
		
	};	
 
	/** 
	* calls building funcitons for each pre with class 'arrowsandboxes'
	*/
	$(function(){
		$('pre.' + prefix).add($('pre.arrows-and-boxes')).arrows_and_boxes();
	});
 })(jQuery);