//declaration.js
var {
	APIS
} = require('../../const');
var user = require('../../libs/user');

var { request } = require('../../libs/request');
Page({
	data: {
		hobbies:[
		"篮球",
      	"麻将"
	  	],
	  lables:[
	  	"球类运动",
	  	"唱歌",
	  	"看书",
	  	"跳舞",
	  	"健身"
	  ],
	  inputValue:'',
	},
	onLoad: function(options) {
		console.log(options);
		var  l = options.hobbiesLable.split(",");
		this.setData({
	  		hobbies:l
	  	});
	  	console.log(this.data.lables);
	},
	
	clickClose: function(e){
  	var cid = e.currentTarget.dataset.id;
    this.data.hobbies.splice(cid,1);
  	this.setData({
  		hobbies:this.data.hobbies
  	});
  },
  
 
  clickLable: function(e){
  	var v = e.currentTarget.dataset.value;
  	this.data.hobbies.push(v);
  	this.setData({
  		hobbies:this.data.hobbies
  	});
  	console.log(this.data.hobbies);
  },
  
  bindInput: function(e){
  	this.setData({
      inputValue: e.detail.value
    })
  },
  
  clickAdd: function(e){
  	this.data.hobbies.push(this.data.inputValue);
  	if(this.data.inputValue.length==0){
  		return;
  	}
  	this.setData({
  		hobbies:this.data.hobbies
  	});
  	console.log(this.data.hobbies);
  },
  
	formSubmit: function() {
		wx.setStorageSync('hobbies', this.data.hobbies);
		wx.navigateBack({
		  delta: 1
		});
		/*wx.redirectTo({
		  url: '../myCard/myCard?hobbies='+this.data.hobbies+'&type=1'
		});*/
	}
	
})