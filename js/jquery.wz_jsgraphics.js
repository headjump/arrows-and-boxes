/* this notice must be untouched at all times.

wz_jsgraphics.js    v. 3.02
The latest version is available at
http://www.walterzorn.com
or http://www.devira.com
or http://www.walterzorn.de

***************************
Adaption for jQuery by :
Arnault Pachot - OpenStudio
http://www.openstudio.fr
***************************

Copyright (c) 2002-2004 Walter Zorn. All rights reserved.
Created 3. 11. 2002 by Walter Zorn (Web: http://www.walterzorn.com )
Last modified: 26. 10. 2007

Performance optimizations for Internet Explorer
by Thomas Frank and John Holdsworth.
fillPolygon method implemented by Matthieu Haller.

High Performance JavaScript Graphics Library.
Provides methods
- to draw lines, rectangles, ellipses, polygons
	with specifiable line thickness,
- to fill rectangles, polygons, ellipses and arcs
- to draw text.
NOTE: Operations, functions and branching have rather been optimized
to efficiency and speed than to shortness of source code.

LICENSE: LGPL

$(this) library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License (LGPL) as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

$(this) library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with $(this) library; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA,
or see http://www.gnu.org/copyleft/lesser.html
*/

(function($) {
$.fn._mkDiv = function(x, y, w, h, color) {
	$(this).append('<div style="position:absolute;'+
		'left:' + x + 'px;'+
		'top:' + y + 'px;'+
		'width:' + w + 'px;'+
		'height:' + h + 'px;'+
		'clip:rect(0,'+w+'px,'+h+'px,0);'+
		'background-color : ' + color +
		';"><\/div>');
}

$.fn._mkLin = function(x1, y1, x2, y2, color) {
	if(x1 > x2)
	{
		var _x2 = x2;
		var _y2 = y2;
		x2 = x1;
		y2 = y1;
		x1 = _x2;
		y1 = _y2;
	}
	var dx = x2-x1, dy = Math.abs(y2-y1),
	x = x1, y = y1,
	yIncr = (y1 > y2)? -1 : 1;

	if(dx >= dy)
	{
		var pr = dy<<1,
		pru = pr - (dx<<1),
		p = pr-dx,
		ox = x;
		while(dx > 0)
		{--dx;
			++x;
			if(p > 0)
			{
				$(this)._mkDiv(ox, y, x-ox, 1, color);
				y += yIncr;
				p += pru;
				ox = x;
			}
			else p += pr;
		}
		$(this)._mkDiv(ox, y, x2-ox+1, 1, color);
	}

	else
	{
		var pr = dx<<1,
		pru = pr - (dy<<1),
		p = pr-dy,
		oy = y;
		if(y2 <= y1)
		{
			while(dy > 0)
			{--dy;
				if(p > 0)
				{
					$(this)._mkDiv(x++, y, 1, oy-y+1, color);
					y += yIncr;
					p += pru;
					oy = y;
				}
				else
				{
					y += yIncr;
					p += pr;
				}
			}
			$(this)._mkDiv(x2, y2, 1, oy-y2+1, color);
		}
		else
		{
			while(dy > 0)
			{--dy;
				y += yIncr;
				if(p > 0)
				{
					$(this)._mkDiv(x++, oy, 1, y-oy, color);
					p += pru;
					oy = y;
				}
				else p += pr;
			}
			$(this)._mkDiv(x2, oy, 1, y2-oy+1, color);
		}
	}
	return $(this);
}

$.fn._mkLin2D = function(x1, y1, x2, y2, settings) {
	if(x1 > x2)
	{
		var _x2 = x2;
		var _y2 = y2;
		x2 = x1;
		y2 = y1;
		x1 = _x2;
		y1 = _y2;
	}
	var dx = x2-x1, dy = Math.abs(y2-y1),
	x = x1, y = y1,
	yIncr = (y1 > y2)? -1 : 1;

	var s = settings.stroke;
	if(dx >= dy)
	{
		if(dx > 0 && s-3 > 0)
		{
			var _s = (s*dx*Math.sqrt(1+dy*dy/(dx*dx))-dx-(s>>1)*dy) / dx;
			_s = (!(s-4)? Math.ceil(_s) : Math.round(_s)) + 1;
		}
		else var _s = s;
		var ad = Math.ceil(s/2);

		var pr = dy<<1,
		pru = pr - (dx<<1),
		p = pr-dx,
		ox = x;
		while(dx > 0)
		{--dx;
			++x;
			if(p > 0)
			{
				$(this)._mkDiv(ox, y, x-ox+ad, _s, settings.color);
				y += yIncr;
				p += pru;
				ox = x;
			}
			else p += pr;
		}
		$(this)._mkDiv(ox, y, x2-ox+ad+1, _s, settings.color);
	}

	else
	{
		if(s-3 > 0)
		{
			var _s = (s*dy*Math.sqrt(1+dx*dx/(dy*dy))-(s>>1)*dx-dy) / dy;
			_s = (!(s-4)? Math.ceil(_s) : Math.round(_s)) + 1;
		}
		else var _s = s;
		var ad = Math.round(s/2);

		var pr = dx<<1,
		pru = pr - (dy<<1),
		p = pr-dy,
		oy = y;
		if(y2 <= y1)
		{
			++ad;
			while(dy > 0)
			{--dy;
				if(p > 0)
				{
					$(this)._mkDiv(x++, y, _s, oy-y+ad, settings.color);
					y += yIncr;
					p += pru;
					oy = y;
				}
				else
				{
					y += yIncr;
					p += pr;
				}
			}
			$(this)._mkDiv(x2, y2, _s, oy-y2+ad, settings.color);
		}
		else
		{
			while(dy > 0)
			{--dy;
				y += yIncr;
				if(p > 0)
				{
					$(this)._mkDiv(x++, oy, _s, y-oy+ad, settings.color);
					p += pru;
					oy = y;
				}
				else p += pr;
			}
			$(this)._mkDiv(x2, oy, _s, y2-oy+ad+1, settings.color);
		}
	}
	return $(this);
}

$.fn._mkLinDott = function(x1, y1, x2, y2, color) {
	if(x1 > x2)
	{
		var _x2 = x2;
		var _y2 = y2;
		x2 = x1;
		y2 = y1;
		x1 = _x2;
		y1 = _y2;
	}
	var dx = x2-x1, dy = Math.abs(y2-y1),
	x = x1, y = y1,
	yIncr = (y1 > y2)? -1 : 1,
	drw = true;
	if(dx >= dy)
	{
		var pr = dy<<1,
		pru = pr - (dx<<1),
		p = pr-dx;
		while(dx > 0)
		{--dx;
			if(drw) $(this)._mkDiv(x, y, 1, 1, color);
			drw = !drw;
			if(p > 0)
			{
				y += yIncr;
				p += pru;
			}
			else p += pr;
			++x;
		}
	}
	else
	{
		var pr = dx<<1,
		pru = pr - (dy<<1),
		p = pr-dy;
		while(dy > 0)
		{--dy;
			if(drw) $(this)._mkDiv(x, y, 1, 1, color);
			drw = !drw;
			y += yIncr;
			if(p > 0)
			{
				++x;
				p += pru;
			}
			else p += pr;
		}
	}
	if(drw) $(this)._mkDiv(x, y, 1, 1, color);
	return $(this);
}

$.fn._mkOv = function(left, top, width, height, color) {
	var a = (++width)>>1, b = (++height)>>1,
	wod = width&1, hod = height&1,
	cx = left+a, cy = top+b,
	x = 0, y = b,
	ox = 0, oy = b,
	aa2 = (a*a)<<1, aa4 = aa2<<1, bb2 = (b*b)<<1, bb4 = bb2<<1,
	st = (aa2>>1)*(1-(b<<1)) + bb2,
	tt = (bb2>>1) - aa2*((b<<1)-1),
	w, h;
	while(y > 0)
	{
		if(st < 0)
		{
			st += bb2*((x<<1)+3);
			tt += bb4*(++x);
		}
		else if(tt < 0)
		{
			st += bb2*((x<<1)+3) - aa4*(y-1);
			tt += bb4*(++x) - aa2*(((y--)<<1)-3);
			w = x-ox;
			h = oy-y;
			if((w&2) && (h&2))
			{
				$(this)._mkOvQds(cx, cy, x-2, y+2, 1, 1, wod, hod, color);
				$(this)._mkOvQds(cx, cy, x-1, y+1, 1, 1, wod, hod, color);
			}
			else $(this)._mkOvQds(cx, cy, x-1, oy, w, h, wod, hod, color);
			ox = x;
			oy = y;
		}
		else
		{
			tt -= aa2*((y<<1)-3);
			st -= aa4*(--y);
		}
	}
	w = a-ox+1;
	h = (oy<<1)+hod;
	y = cy-oy;
	$(this)._mkDiv(cx-a, y, w, h, color);
	$(this)._mkDiv(cx+ox+wod-1, y, w, h, color);
	return $(this);
}

$.fn._mkOv2D = function(left, top, width, height, settings) {
	var s = settings.stroke;
	width += s+1;
	height += s+1;
	var a = width>>1, b = height>>1,
	wod = width&1, hod = height&1,
	cx = left+a, cy = top+b,
	x = 0, y = b,
	aa2 = (a*a)<<1, aa4 = aa2<<1, bb2 = (b*b)<<1, bb4 = bb2<<1,
	st = (aa2>>1)*(1-(b<<1)) + bb2,
	tt = (bb2>>1) - aa2*((b<<1)-1);

	if(s-4 < 0 && (!(s-2) || width-51 > 0 && height-51 > 0))
	{
		var ox = 0, oy = b,
		w, h,
		pxw;
		while(y > 0)
		{
			if(st < 0)
			{
				st += bb2*((x<<1)+3);
				tt += bb4*(++x);
			}
			else if(tt < 0)
			{
				st += bb2*((x<<1)+3) - aa4*(y-1);
				tt += bb4*(++x) - aa2*(((y--)<<1)-3);
				w = x-ox;
				h = oy-y;

				if(w-1)
				{
					pxw = w+1+(s&1);
					h = s;
				}
				else if(h-1)
				{
					pxw = s;
					h += 1+(s&1);
				}
				else pxw = h = s;
				$(this)._mkOvQds(cx, cy, x-1, oy, pxw, h, wod, hod, settings.color);
				ox = x;
				oy = y;
			}
			else
			{
				tt -= aa2*((y<<1)-3);
				st -= aa4*(--y);
			}
		}
		$(this)._mkDiv(cx-a, cy-oy, s, (oy<<1)+hod, settings.color);
		$(this)._mkDiv(cx+a+wod-s, cy-oy, s, (oy<<1)+hod, settings.color);
	}

	else
	{
		var _a = (width-(s<<1))>>1,
		_b = (height-(s<<1))>>1,
		_x = 0, _y = _b,
		_aa2 = (_a*_a)<<1, _aa4 = _aa2<<1, _bb2 = (_b*_b)<<1, _bb4 = _bb2<<1,
		_st = (_aa2>>1)*(1-(_b<<1)) + _bb2,
		_tt = (_bb2>>1) - _aa2*((_b<<1)-1),

		pxl = new Array(),
		pxt = new Array(),
		_pxb = new Array();
		pxl[0] = 0;
		pxt[0] = b;
		_pxb[0] = _b-1;
		while(y > 0)
		{
			if(st < 0)
			{
				pxl[pxl.length] = x;
				pxt[pxt.length] = y;
				st += bb2*((x<<1)+3);
				tt += bb4*(++x);
			}
			else if(tt < 0)
			{
				pxl[pxl.length] = x;
				st += bb2*((x<<1)+3) - aa4*(y-1);
				tt += bb4*(++x) - aa2*(((y--)<<1)-3);
				pxt[pxt.length] = y;
			}
			else
			{
				tt -= aa2*((y<<1)-3);
				st -= aa4*(--y);
			}

			if(_y > 0)
			{
				if(_st < 0)
				{
					_st += _bb2*((_x<<1)+3);
					_tt += _bb4*(++_x);
					_pxb[_pxb.length] = _y-1;
				}
				else if(_tt < 0)
				{
					_st += _bb2*((_x<<1)+3) - _aa4*(_y-1);
					_tt += _bb4*(++_x) - _aa2*(((_y--)<<1)-3);
					_pxb[_pxb.length] = _y-1;
				}
				else
				{
					_tt -= _aa2*((_y<<1)-3);
					_st -= _aa4*(--_y);
					_pxb[_pxb.length-1]--;
				}
			}
		}

		var ox = -wod, oy = b,
		_oy = _pxb[0],
		l = pxl.length,
		w, h;
		for(var i = 0; i < l; i++)
		{
			if(typeof _pxb[i] != "undefined")
			{
				if(_pxb[i] < _oy || pxt[i] < oy)
				{
					x = pxl[i];
					$(this)._mkOvQds(cx, cy, x, oy, x-ox, oy-_oy, wod, hod, settings.color);
					ox = x;
					oy = pxt[i];
					_oy = _pxb[i];
				}
			}
			else
			{
				x = pxl[i];
				$(this)._mkDiv(cx-x, cy-oy, 1, (oy<<1)+hod, settings.color);
				$(this)._mkDiv(cx+ox+wod, cy-oy, 1, (oy<<1)+hod, settings.color);
				ox = x;
				oy = pxt[i];
			}
		}
		$(this)._mkDiv(cx-a, cy-oy, 1, (oy<<1)+hod, settings.color);
		$(this)._mkDiv(cx+ox+wod, cy-oy, 1, (oy<<1)+hod, settings.color);
	}
	return $(this);
}

$.fn._mkOvDott = function(left, top, width, height, color) {
	var a = (++width)>>1, b = (++height)>>1,
	wod = width&1, hod = height&1, hodu = hod^1,
	cx = left+a, cy = top+b,
	x = 0, y = b,
	aa2 = (a*a)<<1, aa4 = aa2<<1, bb2 = (b*b)<<1, bb4 = bb2<<1,
	st = (aa2>>1)*(1-(b<<1)) + bb2,
	tt = (bb2>>1) - aa2*((b<<1)-1),
	drw = true;
	while(y > 0)
	{
		if(st < 0)
		{
			st += bb2*((x<<1)+3);
			tt += bb4*(++x);
		}
		else if(tt < 0)
		{
			st += bb2*((x<<1)+3) - aa4*(y-1);
			tt += bb4*(++x) - aa2*(((y--)<<1)-3);
		}
		else
		{
			tt -= aa2*((y<<1)-3);
			st -= aa4*(--y);
		}
		if(drw && y >= hodu) $(this)._mkOvQds(cx, cy, x, y, 1, 1, wod, hod, color);
		drw = !drw;
	}
	return $(this);
}

$.fn._mkRect = function(x, y, w, h, settings) {
	var s = settings.stroke;
	$(this)._mkDiv(x, y, w, s, settings.color);
	$(this)._mkDiv(x+w, y, s, h, settings.color);
	$(this)._mkDiv(x, y+h, w+s, s, settings.color);
	$(this)._mkDiv(x, y+s, s, h-s, settings.color);
	return $(this);
}

$.fn._mkRectDott = function(x, y, w, h, color) {
	$(this).drawLine(x, y, x+w, y, color);
	$(this).drawLine(x+w, y, x+w, y+h, color);
	$(this).drawLine(x, y+h, x+w, y+h, color);
	$(this).drawLine(x, y, x, y+h, color);
	return $(this);
}

	

	$.fn.drawLine = function(x1, y1, x2, y2, settings) {
		
		settings = jQuery.extend({stroke: 1,color: 'black'}, settings);
		if(settings.stroke=='dotted')
		{
			$(this)._mkLinDott(x1, y1, x2, y2, settings.color);
		}
		else if(settings.stroke-1 > 0)
		{
			$(this)._mkLin2D(x1, y1, x2, y2, settings);
		}
		else
		{
			$(this)._mkLin(x1, y1, x2, y2, settings.color);
		}
		return $(this);
	};
	$.fn.drawRect = function(x1, y1, x2, y2, settings) {
		
		settings = jQuery.extend({stroke: 1,color: 'black'}, settings);
		if(settings.stroke=='dotted')
		{
			$(this)._mkRectDott(x1, y1, x2, y2, settings);
		}
		else if(settings.stroke-1 > 0)
		{
			$(this)._mkRect(x1, y1, x2, y2, settings);
		}
		else
		{
			$(this)._mkRect(x1, y1, x2, y2, settings);
		}
		return $(this);
	};
	
	

	

	$.fn.drawPolyline = function(x, y, settings) {
		settings = jQuery.extend({stroke: 1,color: 'black'}, settings);
		for (var i=x.length - 1; i;)
		{--i;
			$(this).drawLine(x[i], y[i], x[i+1], y[i+1], settings);
		}
		return $(this);
	};

	$.fn.fillRect = function(x, y, w, h, settings) {
		settings = jQuery.extend({stroke: 1,color: 'black'}, settings);
		$(this)._mkDiv(x, y, w, h, settings.color);
		return $(this);
	};

	$.fn.drawPolygon = function(x, y, settings) {
		settings = jQuery.extend({stroke: 1,color: 'black'}, settings);
		$(this).drawPolyline(x, y, settings);
		$(this).drawLine(x[x.length-1], y[x.length-1], x[0], y[0], settings);
		return $(this);
	};

	$.fn.drawEllipse = function(x, y, w, h, settings) {
		settings = jQuery.extend({stroke: 1,color: 'black'}, settings);
		if(settings.stroke=='dotted')
		{
			$(this)._mkOvDott(x, y, w, h, settings.color);
			
			
		}
		else if(settings.stroke-1 > 0)
		{
			$(this)._mkOv2D(x, y, w, h, settings);
		}
		else
		{
			$(this)._mkOv(x, y, w, h, settings.color);
		}
		return $(this);
	};

	
	$.fn.fillEllipse = function(left, top, w, h, settings) {
		settings = jQuery.extend({stroke: 1,color: 'black'}, settings);
		var a = w>>1, b = h>>1,
		wod = w&1, hod = h&1,
		cx = left+a, cy = top+b,
		x = 0, y = b, oy = b,
		aa2 = (a*a)<<1, aa4 = aa2<<1, bb2 = (b*b)<<1, bb4 = bb2<<1,
		st = (aa2>>1)*(1-(b<<1)) + bb2,
		tt = (bb2>>1) - aa2*((b<<1)-1),
		xl, dw, dh;
		if(w) while(y > 0)
		{
			if(st < 0)
			{
				st += bb2*((x<<1)+3);
				tt += bb4*(++x);
			}
			else if(tt < 0)
			{
				st += bb2*((x<<1)+3) - aa4*(y-1);
				xl = cx-x;
				dw = (x<<1)+wod;
				tt += bb4*(++x) - aa2*(((y--)<<1)-3);
				dh = oy-y;
				$(this)._mkDiv(xl, cy-oy, dw, dh, settings.color);
				$(this)._mkDiv(xl, cy+y+hod, dw, dh, settings.color);
				oy = y;
			}
			else
			{
				tt -= aa2*((y<<1)-3);
				st -= aa4*(--y);
			}
		}
		$(this)._mkDiv(cx-a, cy-oy, w, (oy<<1)+hod, settings.color);
		return $(this);
	};

	$.fn.fillArc = function(iL, iT, iW, iH, fAngA, fAngZ, settings) {
		settings = jQuery.extend({stroke: 1,color: 'black'}, settings);
		var a = iW>>1, b = iH>>1,
		iOdds = (iW&1) | ((iH&1) << 16),
		cx = iL+a, cy = iT+b,
		x = 0, y = b, ox = x, oy = y,
		aa2 = (a*a)<<1, aa4 = aa2<<1, bb2 = (b*b)<<1, bb4 = bb2<<1,
		st = (aa2>>1)*(1-(b<<1)) + bb2,
		tt = (bb2>>1) - aa2*((b<<1)-1),
		// Vars for radial boundary lines
		xEndA, yEndA, xEndZ, yEndZ,
		iSects = (1 << (Math.floor((fAngA %= 360.0)/180.0) << 3))
				| (2 << (Math.floor((fAngZ %= 360.0)/180.0) << 3))
				| ((fAngA >= fAngZ) << 16),
		aBndA = new Array(b+1), aBndZ = new Array(b+1);
		
		// Set up radial boundary lines
		fAngA *= Math.PI/180.0;
		fAngZ *= Math.PI/180.0;
		xEndA = cx+Math.round(a*Math.cos(fAngA));
		yEndA = cy+Math.round(-b*Math.sin(fAngA));
		$(this)._mkLinVirt(aBndA, cx, cy, xEndA, yEndA, settings.color);
		xEndZ = cx+Math.round(a*Math.cos(fAngZ));
		yEndZ = cy+Math.round(-b*Math.sin(fAngZ));
		$(this)._mkLinVirt(aBndZ, cx, cy, xEndZ, yEndZ, settings.color);

		while(y > 0)
		{
			if(st < 0) // Advance x
			{
				st += bb2*((x<<1)+3);
				tt += bb4*(++x);
			}
			else if(tt < 0) // Advance x and y
			{
				st += bb2*((x<<1)+3) - aa4*(y-1);
				ox = x;
				tt += bb4*(++x) - aa2*(((y--)<<1)-3);
				$(this)._mkArcDiv(ox, y, oy, cx, cy, iOdds, aBndA, aBndZ, iSects, settings.color);
				oy = y;
			}
			else // Advance y
			{
				tt -= aa2*((y<<1)-3);
				st -= aa4*(--y);
				if(y && (aBndA[y] != aBndA[y-1] || aBndZ[y] != aBndZ[y-1]))
				{
					$(this)._mkArcDiv(x, y, oy, cx, cy, iOdds, aBndA, aBndZ, iSects, settings.color);
					ox = x;
					oy = y;
				}
			}
		}
		$(this)._mkArcDiv(x, 0, oy, cx, cy, iOdds, aBndA, aBndZ, iSects, settings.color);
		if(iOdds >> 16) // Odd height
		{
			if(iSects >> 16) // Start-angle > end-angle
			{
				var xl = (yEndA <= cy || yEndZ > cy)? (cx - x) : cx;
				$(this)._mkDiv(xl, cy, x + cx - xl + (iOdds & 0xffff), 1, settings.color);
			}
			else if((iSects & 0x01) && yEndZ > cy)
				$(this)._mkDiv(cx - x, cy, x, 1, settings.color);
		}
		return $(this);
	};

/* fillPolygon method, implemented by Matthieu Haller.
this javascript function is an adaptation of the gdImageFilledPolygon for Walter Zorn lib.
C source of GD 1.8.4 found at http://www.boutell.com/gd/

THANKS to Kirsten Schulz for the polygon fixes!

The intersection finding technique of $(this) code could be improved
by remembering the previous intertersection, and by using the slope.
That could help to adjust intersections to produce a nice
interior_extrema. */
	

$.fn.fillPolygon = function(array_x, array_y, settings) {
	
		settings = jQuery.extend({stroke: 1,color: 'black'}, settings);
		var i;
		var y;
		var miny, maxy;
		var x1, y1;
		var x2, y2;
		var ind1, ind2;
		var ints;

		var n = array_x.length;
		if(!n) return;

		miny = array_y[0];
		maxy = array_y[0];
		for(i = 1; i < n; i++)
		{
			if(array_y[i] < miny)
				miny = array_y[i];

			if(array_y[i] > maxy)
				maxy = array_y[i];
		}
		for(y = miny; y <= maxy; y++)
		{
			var polyInts = new Array();
			ints = 0;
			for(i = 0; i < n; i++)
			{
				if(!i)
				{
					ind1 = n-1;
					ind2 = 0;
				}
				else
				{
					ind1 = i-1;
					ind2 = i;
				}
				y1 = array_y[ind1];
				y2 = array_y[ind2];
				if(y1 < y2)
				{
					x1 = array_x[ind1];
					x2 = array_x[ind2];
				}
				else if(y1 > y2)
				{
					y2 = array_y[ind1];
					y1 = array_y[ind2];
					x2 = array_x[ind1];
					x1 = array_x[ind2];
				}
				else continue;

				 //  Modified 11. 2. 2004 Walter Zorn
				if((y >= y1) && (y < y2))
					polyInts[ints++] = Math.round((y-y1) * (x2-x1) / (y2-y1) + x1);

				else if((y == maxy) && (y > y1) && (y <= y2))
					polyInts[ints++] = Math.round((y-y1) * (x2-x1) / (y2-y1) + x1);
			}
			polyInts.sort(function CompInt(x, y) {
	return(x - y);
	
});
			for(i = 0; i < ints; i+=2)
				$(this)._mkDiv(polyInts[i], y, polyInts[i+1]-polyInts[i]+1, 1, settings.color);
		}
		return $(this);
	};

	
	

	$.fn._mkOvQds = function(cx, cy, x, y, w, h, wod, hod, color) {
		var xl = cx - x, xr = cx + x + wod - w, yt = cy - y, yb = cy + y + hod - h;
		if(xr > xl+w)
		{
			$(this)._mkDiv(xr, yt, w, h, color);
			$(this)._mkDiv(xr, yb, w, h, color);
		}
		else
			w = xr - xl + w;
		$(this)._mkDiv(xl, yt, w, h, color);
		$(this)._mkDiv(xl, yb, w, h, color);
		return $(this);
	};
	
	$.fn._mkArcDiv = function(x, y, oy, cx, cy, iOdds, aBndA, aBndZ, iSects, color) {
		var xrDef = cx + x + (iOdds & 0xffff), y2, h = oy - y, xl, xr, w;

		if(!h) h = 1;
		x = cx - x;

		if(iSects & 0xff0000) // Start-angle > end-angle
		{
			y2 = cy - y - h;
			if(iSects & 0x00ff)
			{
				if(iSects & 0x02)
				{
					xl = Math.max(x, aBndZ[y]);
					w = xrDef - xl;
					if(w > 0) $(this)._mkDiv(xl, y2, w, h, color);
				}
				if(iSects & 0x01)
				{
					xr = Math.min(xrDef, aBndA[y]);
					w = xr - x;
					if(w > 0) $(this)._mkDiv(x, y2, w, h, color);
				}
			}
			else
				$(this)._mkDiv(x, y2, xrDef - x, h, color);
			y2 = cy + y + (iOdds >> 16);
			if(iSects & 0xff00)
			{
				if(iSects & 0x0100)
				{
					xl = Math.max(x, aBndA[y]);
					w = xrDef - xl;
					if(w > 0) $(this)._mkDiv(xl, y2, w, h, color);
				}
				if(iSects & 0x0200)
				{
					xr = Math.min(xrDef, aBndZ[y]);
					w = xr - x;
					if(w > 0) $(this)._mkDiv(x, y2, w, h, color);
				}
			}
			else
				$(this)._mkDiv(x, y2, xrDef - x, h, color);
		}
		else
		{
			if(iSects & 0x00ff)
			{
				if(iSects & 0x02)
					xl = Math.max(x, aBndZ[y]);
				else
					xl = x;
				if(iSects & 0x01)
					xr = Math.min(xrDef, aBndA[y]);
				else
					xr = xrDef;
				y2 = cy - y - h;
				w = xr - xl;
				if(w > 0) $(this)._mkDiv(xl, y2, w, h, color);
			}
			if(iSects & 0xff00)
			{
				if(iSects & 0x0100)
					xl = Math.max(x, aBndA[y]);
				else
					xl = x;
				if(iSects & 0x0200)
					xr = Math.min(xrDef, aBndZ[y]);
				else
					xr = xrDef;
				y2 = cy + y + (iOdds >> 16);
				w = xr - xl;
				if(w > 0) $(this)._mkDiv(xl, y2, w, h, color);
			}
		}
		return $(this);
	};

	
	


$.fn._mkLinVirt = function(aLin, x1, y1, x2, y2, color) {
	var dx = Math.abs(x2-x1), dy = Math.abs(y2-y1),
	x = x1, y = y1,
	xIncr = (x1 > x2)? -1 : 1,
	yIncr = (y1 > y2)? -1 : 1,
	p,
	i = 0;
	if(dx >= dy)
	{
		var pr = dy<<1,
		pru = pr - (dx<<1);
		p = pr-dx;
		while(dx > 0)
		{--dx;
			if(p > 0)    //  Increment y
			{
				aLin[i++] = x;
				y += yIncr;
				p += pru;
			}
			else p += pr;
			x += xIncr;
		}
	}
	else
	{
		var pr = dx<<1,
		pru = pr - (dy<<1);
		p = pr-dy;
		while(dy > 0)
		{--dy;
			y += yIncr;
			aLin[i++] = x;
			if(p > 0)    //  Increment x
			{
				x += xIncr;
				p += pru;
			}
			else p += pr;
		}
	}
	for(var len = aLin.length, i = len-i; i;)
		aLin[len-(i--)] = x;
	
};


})(jQuery);