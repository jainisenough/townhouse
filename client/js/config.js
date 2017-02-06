/**
 * Created by akhilesh on 1/28/2017.
 */

/******************General Constants*********************/
var CONSTANT = {
	baseUrl: '/',
	apiUrl: '/api',
	siteTitle: 'TownHouse'
};

/******************Path Constants*********************/
var PATH_CONSTANT = {
	basePath: '/public',
	get view() {
		return this.basePath + '/views';
	},
	get js() {
		return this.basePath + '/js';
	}
};
